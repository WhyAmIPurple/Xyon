const express = require("express");
const jwt = require("jsonwebtoken");
const {
  buildCanvasUrl,
  disconnectCanvas,
  exchangeCodeForToken,
  getCanvasConnection,
  normalizeCanvasBaseUrl,
  saveCanvasConnection,
  syncCanvasForUser
} = require("../services/canvas.js");

const router = express.Router();

function getClientAppUrl() {
  return (process.env.CLIENT_APP_URL || "http://localhost:5173").replace(/\/$/, "");
}

function redirectToClient(res, params) {
  const url = new URL(getClientAppUrl());
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return res.redirect(url.toString());
}

router.get("/status", async (req, res) => {
  try {
    const userId = Number(req.query.user_id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ ok: false, error: "Valid user_id is required." });
    }

    const connection = await getCanvasConnection(userId);

    if (!connection) {
      return res.json({ ok: true, connected: false });
    }

    return res.json({
      ok: true,
      connected: true,
      canvas_domain: connection.canvas_domain,
      canvas_base_url: connection.canvas_base_url,
      canvas_user_name: connection.canvas_user_name,
      last_synced_at: connection.last_synced_at
    });
  } catch (error) {
    console.error("CANVAS STATUS ERROR:", error);
    return res.status(500).json({ ok: false, error: "Failed to load Canvas status." });
  }
});

router.get("/connect", async (req, res) => {
  try {
    const userId = Number(req.query.user_id);
    const canvasDomain = req.query.canvas_domain;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).send("Valid user_id is required.");
    }

    if (!process.env.CANVAS_CLIENT_ID || !process.env.CANVAS_REDIRECT_URI || !process.env.JWT_SECRET) {
      return res.status(500).send("Canvas OAuth environment variables are missing.");
    }

    const canvasBaseUrl = normalizeCanvasBaseUrl(canvasDomain);
    const statePayload = jwt.sign(
      {
        user_id: userId,
        canvas_base_url: canvasBaseUrl,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    const authorizationUrl = buildCanvasUrl(canvasBaseUrl, "/login/oauth2/auth", {
      client_id: process.env.CANVAS_CLIENT_ID,
      response_type: "code",
      redirect_uri: process.env.CANVAS_REDIRECT_URI,
      state: statePayload
    });

    return res.redirect(authorizationUrl);
  } catch (error) {
    console.error("CANVAS CONNECT ERROR:", error);
    return res.status(400).send(error.message || "Failed to start Canvas connection.");
  }
});

router.get("/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return redirectToClient(res, {
        canvas: "error",
        canvas_message: String(error)
      });
    }

    if (!code || !state) {
      return redirectToClient(res, {
        canvas: "error",
        canvas_message: "missing_code"
      });
    }

    const parsedState = jwt.verify(String(state), process.env.JWT_SECRET);
    const userId = Number(parsedState.user_id);
    const canvasBaseUrl = normalizeCanvasBaseUrl(parsedState.canvas_base_url);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error("Canvas callback state is invalid.");
    }

    const tokenData = await exchangeCodeForToken(canvasBaseUrl, String(code));
    await saveCanvasConnection({ userId, canvasBaseUrl, tokenData });
    await syncCanvasForUser(userId);

    return redirectToClient(res, {
      canvas: "connected"
    });
  } catch (error) {
    console.error("CANVAS CALLBACK ERROR:", error);
    return redirectToClient(res, {
      canvas: "error",
      canvas_message: "oauth_failed"
    });
  }
});

router.post("/sync", async (req, res) => {
  try {
    const userId = Number(req.body.user_id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ ok: false, error: "Valid user_id is required." });
    }

    const summary = await syncCanvasForUser(userId);
    return res.json({ ok: true, summary });
  } catch (error) {
    console.error("CANVAS SYNC ERROR:", error);
    return res.status(500).json({ ok: false, error: error.message || "Canvas sync failed." });
  }
});

router.post("/disconnect", async (req, res) => {
  try {
    const userId = Number(req.body.user_id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ ok: false, error: "Valid user_id is required." });
    }

    await disconnectCanvas(userId);
    return res.json({ ok: true });
  } catch (error) {
    console.error("CANVAS DISCONNECT ERROR:", error);
    return res.status(500).json({ ok: false, error: "Failed to disconnect Canvas." });
  }
});

module.exports = router;
