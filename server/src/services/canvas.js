const userDb = require("../db/user_db.js");
const eventDb = require("../db/event_db.js");

const DEFAULT_SYNC_PAST_DAYS = -30;
const DEFAULT_SYNC_FUTURE_DAYS = 180;

function requireFetch() {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available. Use Node.js 18 or newer.");
  }
}

function normalizeCanvasBaseUrl(input) {
  if (!input || typeof input !== "string") {
    throw new Error("Canvas domain is required.");
  }

  const trimmed = input.trim();
  const candidate = trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;

  let url;

  try {
    url = new URL(candidate);
  } catch (error) {
    throw new Error("Canvas domain is invalid.");
  }

  if (!url.hostname) {
    throw new Error("Canvas domain is invalid.");
  }

  url.protocol = "https:";
  url.pathname = "";
  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}

function formatMysqlDateTime(value) {
  return value.toISOString().slice(0, 19).replace("T", " ");
}

function normalizeDateTime(value) {
  if (!value) return null;
  return String(value).slice(0, 19).replace("T", " ");
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function stripHtml(value) {
  if (!value) return null;

  const text = String(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return text || null;
}

function parseLinkHeader(headerValue) {
  if (!headerValue) return {};

  return headerValue.split(",").reduce((links, chunk) => {
    const match = chunk.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) {
      links[match[2]] = match[1];
    }
    return links;
  }, {});
}

function buildTokenForm(params) {
  return new URLSearchParams(params).toString();
}

async function fetchJson(url, options = {}) {
  requireFetch();
  const response = await fetch(url, options);

  let data = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text ? { raw: text } : null;
  }

  if (!response.ok) {
    const error = new Error(`Canvas request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return { response, data };
}

async function exchangeCodeForToken(canvasBaseUrl, code) {
  const redirectUri = process.env.CANVAS_REDIRECT_URI;

  if (!process.env.CANVAS_CLIENT_ID || !process.env.CANVAS_CLIENT_SECRET || !redirectUri) {
    throw new Error("Canvas OAuth environment variables are missing.");
  }

  const { data } = await fetchJson(`${canvasBaseUrl}/login/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: buildTokenForm({
      grant_type: "authorization_code",
      client_id: process.env.CANVAS_CLIENT_ID,
      client_secret: process.env.CANVAS_CLIENT_SECRET,
      redirect_uri: redirectUri,
      code
    })
  });

  return data;
}

async function refreshAccessToken(connection) {
  if (!connection?.refresh_token) {
    throw new Error("Canvas refresh token is missing.");
  }

  const { data } = await fetchJson(`${connection.canvas_base_url}/login/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: buildTokenForm({
      grant_type: "refresh_token",
      client_id: process.env.CANVAS_CLIENT_ID,
      client_secret: process.env.CANVAS_CLIENT_SECRET,
      refresh_token: connection.refresh_token
    })
  });

  const expiresAt = new Date(Date.now() + Number(data.expires_in || 3600) * 1000);

  await userDb.query(
    `UPDATE canvas_connections
     SET access_token = ?, refresh_token = ?, token_expires_at = ?
     WHERE user_id = ?`,
    [
      data.access_token,
      data.refresh_token || connection.refresh_token,
      formatMysqlDateTime(expiresAt),
      connection.user_id
    ]
  );

  return {
    ...connection,
    access_token: data.access_token,
    refresh_token: data.refresh_token || connection.refresh_token,
    token_expires_at: formatMysqlDateTime(expiresAt)
  };
}

async function getCanvasConnection(userId) {
  const [rows] = await userDb.query(
    `SELECT
        connection_id,
        user_id,
        canvas_base_url,
        canvas_domain,
        canvas_user_id,
        canvas_user_name,
        access_token,
        refresh_token,
        token_expires_at,
        last_synced_at
     FROM canvas_connections
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

async function getValidCanvasConnection(userId) {
  const connection = await getCanvasConnection(userId);

  if (!connection) {
    return null;
  }

  const expiresAt = connection.token_expires_at
    ? new Date(String(connection.token_expires_at).replace(" ", "T"))
    : null;

  if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
    return connection;
  }

  if (expiresAt.getTime() - Date.now() <= 5 * 60 * 1000) {
    return refreshAccessToken(connection);
  }

  return connection;
}

async function saveCanvasConnection({ userId, canvasBaseUrl, tokenData }) {
  const expiresAt = new Date(Date.now() + Number(tokenData.expires_in || 3600) * 1000);

  await userDb.query(
    `INSERT INTO canvas_connections
        (user_id, canvas_base_url, canvas_domain, access_token, refresh_token, token_expires_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
        canvas_base_url = VALUES(canvas_base_url),
        canvas_domain = VALUES(canvas_domain),
        access_token = VALUES(access_token),
        refresh_token = VALUES(refresh_token),
        token_expires_at = VALUES(token_expires_at)`,
    [
      userId,
      canvasBaseUrl,
      new URL(canvasBaseUrl).hostname,
      tokenData.access_token,
      tokenData.refresh_token || null,
      formatMysqlDateTime(expiresAt)
    ]
  );
}

async function getOrCreateCanvasCalendar(userId) {
  const [existing] = await eventDb.query(
    `SELECT calendar_id
     FROM calendars
     WHERE user_id = ? AND source = 'canvas'
     ORDER BY calendar_id ASC
     LIMIT 1`,
    [userId]
  );

  if (existing.length > 0) {
    return existing[0].calendar_id;
  }

  const [result] = await eventDb.query(
    `INSERT INTO calendars (user_id, name, source, timezone, is_default)
     VALUES (?, 'Canvas Calendar', 'canvas', 'America/New_York', 0)`,
    [userId]
  );

  return result.insertId;
}

async function canvasApiFetch(connection, url, retried = false) {
  requireFetch();

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${connection.access_token}`
    }
  });

  if (response.status === 401 && !retried && connection.refresh_token) {
    const refreshed = await refreshAccessToken(connection);
    return canvasApiFetch(refreshed, url, true);
  }

  if (!response.ok) {
    const payload = await response.text();
    const error = new Error(`Canvas API request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  const data = await response.json();
  return { response, data };
}

async function fetchCanvasPages(connection, initialUrl) {
  const items = [];
  let nextUrl = initialUrl;

  while (nextUrl) {
    const { response, data } = await canvasApiFetch(connection, nextUrl);
    if (Array.isArray(data)) {
      items.push(...data);
    } else if (data) {
      items.push(data);
    }

    const links = parseLinkHeader(response.headers.get("link"));
    nextUrl = links.next || null;
  }

  return items;
}

function buildCanvasUrl(baseUrl, path, searchParams = {}) {
  const url = new URL(path, `${baseUrl}/`);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((entry) => url.searchParams.append(key, entry));
      return;
    }

    url.searchParams.set(key, value);
  });

  return url.toString();
}

function mapAssignmentEvent(assignment, courseMap) {
  if (!assignment?.due_at) {
    return null;
  }

  const course = courseMap.get(String(assignment.course_id));

  return {
    externalId: `assignment:${assignment.id}`,
    title: assignment.name || "Canvas Assignment",
    course: course?.name || assignment.course_name || null,
    description: stripHtml(assignment.description),
    location: null,
    startTime: normalizeDateTime(assignment.due_at),
    endTime: normalizeDateTime(assignment.due_at),
    allDay: 0,
    eventType: "assignment",
    externalUrl: assignment.html_url || null
  };
}

function mapCalendarEvent(event, courseMap) {
  const inferredCourse = event.context_name
    || courseMap.get(String(event.course_id || "") )?.name
    || null;

  const startValue = event.start_at || event.created_at;
  const endValue = event.end_at || startValue;

  if (!startValue) {
    return null;
  }

  return {
    externalId: `calendar_event:${event.id}`,
    title: event.title || "Canvas Event",
    course: inferredCourse,
    description: stripHtml(event.description),
    location: event.location_name || event.location_address || null,
    startTime: normalizeDateTime(startValue),
    endTime: normalizeDateTime(endValue),
    allDay: event.all_day ? 1 : 0,
    eventType: inferredCourse ? "class" : "personal",
    externalUrl: event.html_url || null
  };
}

async function syncCanvasForUser(userId) {
  const connection = await getValidCanvasConnection(userId);

  if (!connection) {
    throw new Error("Canvas is not connected for this user.");
  }

  const calendarId = await getOrCreateCanvasCalendar(userId);

  const coursesUrl = buildCanvasUrl(connection.canvas_base_url, "/api/v1/courses", {
    enrollment_type: "student",
    "state[]": ["available", "completed"],
    per_page: 100
  });

  const courseRows = await fetchCanvasPages(connection, coursesUrl);
  const courseMap = new Map(courseRows.map((course) => [String(course.id), course]));

  const assignmentResults = await Promise.all(
    courseRows.map(async (course) => {
      const url = buildCanvasUrl(
        connection.canvas_base_url,
        `/api/v1/courses/${course.id}/assignments`,
        { order_by: "due_at", per_page: 100 }
      );

      const assignments = await fetchCanvasPages(connection, url);
      return assignments
        .map((assignment) => mapAssignmentEvent(assignment, courseMap))
        .filter(Boolean);
    })
  );

  const now = new Date();
  const startDate = addDays(now, Number(process.env.CANVAS_SYNC_PAST_DAYS || DEFAULT_SYNC_PAST_DAYS));
  const endDate = addDays(now, Number(process.env.CANVAS_SYNC_FUTURE_DAYS || DEFAULT_SYNC_FUTURE_DAYS));

  const calendarEventsUrl = buildCanvasUrl(connection.canvas_base_url, "/api/v1/calendar_events", {
    type: "event",
    all_events: true,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    per_page: 100
  });

  const calendarRows = await fetchCanvasPages(connection, calendarEventsUrl);

  const mappedAssignments = assignmentResults.flat();
  const mappedCalendarEvents = calendarRows
    .map((event) => mapCalendarEvent(event, courseMap))
    .filter(Boolean);

  const combined = [...mappedAssignments, ...mappedCalendarEvents]
    .filter((event) => event.startTime && event.endTime);

  for (const item of combined) {
    await eventDb.query(
      `INSERT INTO events
          (calendar_id, title, course, description, location, start_time, end_time, all_day, event_type, external_source, external_id, external_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'canvas', ?, ?)
       ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          course = VALUES(course),
          description = VALUES(description),
          location = VALUES(location),
          start_time = VALUES(start_time),
          end_time = VALUES(end_time),
          all_day = VALUES(all_day),
          event_type = VALUES(event_type),
          external_url = VALUES(external_url)`,
      [
        calendarId,
        item.title,
        item.course,
        item.description,
        item.location,
        item.startTime,
        item.endTime,
        item.allDay,
        item.eventType,
        item.externalId,
        item.externalUrl
      ]
    );
  }

  const externalIds = combined.map((item) => item.externalId);

  if (externalIds.length > 0) {
    const placeholders = externalIds.map(() => "?").join(", ");
    await eventDb.query(
      `DELETE FROM events
       WHERE calendar_id = ?
         AND external_source = 'canvas'
         AND external_id NOT IN (${placeholders})`,
      [calendarId, ...externalIds]
    );
  } else {
    await eventDb.query(
      `DELETE FROM events
       WHERE calendar_id = ? AND external_source = 'canvas'`,
      [calendarId]
    );
  }

  await userDb.query(
    `UPDATE canvas_connections
     SET last_synced_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [userId]
  );

  return {
    courses: courseRows.length,
    assignments: mappedAssignments.length,
    calendarEvents: mappedCalendarEvents.length,
    importedEvents: combined.length
  };
}

async function disconnectCanvas(userId) {
  await userDb.query(`DELETE FROM canvas_connections WHERE user_id = ?`, [userId]);
  await eventDb.query(`DELETE FROM calendars WHERE user_id = ? AND source = 'canvas'`, [userId]);
}

module.exports = {
  buildCanvasUrl,
  disconnectCanvas,
  exchangeCodeForToken,
  getCanvasConnection,
  getValidCanvasConnection,
  normalizeCanvasBaseUrl,
  saveCanvasConnection,
  syncCanvasForUser
};
