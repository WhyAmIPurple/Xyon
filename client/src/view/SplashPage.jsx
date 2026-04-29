import React, { useState } from "react";
import "./Page.css";
import logo from "../assets/logo.png";

const FEATURES = [
  {
    title: "Smart Calendar",
    desc:  "Visualize your week at a glance. Drag, drop, and manage every class, exam, and event in one place.",
  },
  {
    title: "Course Catalog",
    desc:  "Browse and import your Montclair State schedule directly from Banner, no copy-pasting required.",
  },
  {
    title: "Due Date Tracker",
    desc:  "See every assignment and exam in a clean list sorted by date so nothing slips through the cracks.",
  },
  {
    title: "To Do Notes",
    desc:  "Capture quick notes and tasks in a Google Keep-style board, color-coded and always within reach.",
  },
];

export default function SplashPage({ onShowLogin, onShowSignup }) {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("xyon-dark-mode") === "true"
  );

  function toggleDarkMode() {
    const next = !darkMode;
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("xyon-dark-mode", String(next));
    setDarkMode(next);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-sans)", color: "var(--text)" }}>

      {/* Navbar */}
      <header className="navbar">
        <img src={logo} alt="Xyon Logo" className="logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ cursor: "pointer" }} />
        <div className="nav-links">
          <button
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-sans)",
            }}
          >
            {darkMode ? "☀" : "☽"}
          </button>
          <button
            onClick={onShowLogin}
            style={{
              padding: "8px 20px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text)",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Log In
          </button>
          <button
            onClick={onShowSignup}
            style={{
              padding: "8px 20px",
              borderRadius: "var(--r-md)",
              border: "none",
              background: "var(--pink)",
              color: "var(--text)",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "100px 24px 60px",
        gap: "24px",
      }}>
        <div style={{
          display: "inline-block",
          padding: "6px 16px",
          borderRadius: "999px",
          background: "var(--pink)",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}>
          Built for Montclair State Students
        </div>

        <h1 style={{
          fontSize: "clamp(2.4rem, 6vw, 4rem)",
          fontWeight: 800,
          lineHeight: 1.15,
          maxWidth: "720px",
          margin: 0,
        }}>
          Your academic life,<br />organized in one place.
        </h1>

        <p style={{
          fontSize: "1.05rem",
          color: "var(--muted)",
          maxWidth: "520px",
          lineHeight: 1.7,
          margin: 0,
        }}>
          Xyon brings your classes, assignments, deadlines, and personal events
          together into a single, beautiful workspace — so you can focus on what matters.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginTop: "8px" }}>
          <button
            onClick={onShowSignup}
            style={{
              padding: "14px 32px",
              borderRadius: "var(--r-md)",
              border: "none",
              background: "var(--pink)",
              color: "var(--text)",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              boxShadow: "var(--shadow)",
            }}
          >
            Get Started — it&apos;s free
          </button>
          <button
            onClick={onShowLogin}
            style={{
              padding: "14px 32px",
              borderRadius: "var(--r-md)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Log In
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{
        padding: "60px 24px 80px",
        maxWidth: "960px",
        margin: "0 auto",
      }}>
        <h2 style={{
          textAlign: "center",
          fontSize: "1.6rem",
          fontWeight: 800,
          marginBottom: "40px",
        }}>
          Everything you need to stay on top
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
        }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--r-lg)",
                padding: "24px 20px",
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "var(--pink-strong)",
                marginBottom: "12px",
              }} />
              <h3 style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: 700 }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{
        textAlign: "center",
        padding: "40px 24px 60px",
        borderTop: "1px solid var(--border)",
      }}>
        <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "16px" }}>
          Ready to get organized?
        </p>
        <button
          onClick={onShowSignup}
          style={{
            padding: "12px 28px",
            borderRadius: "var(--r-md)",
            border: "none",
            background: "var(--pink)",
            color: "var(--text)",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          Create your account
        </button>
      </section>

    </div>
  );
}
