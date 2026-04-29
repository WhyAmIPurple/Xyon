import React, { useState } from "react";
import AppShell from "../components/layout/AppShell";
import MsuImportModal from "../components/common/MsuImportModal";

export default function ClassesPage({ onLogout, user, onNavigate }) {
  const [showImport, setShowImport] = useState(false);

  async function handleImportEvent(payload) {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const u = JSON.parse(stored);

    await fetch("http://localhost:3001/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id:    u.user_id,
        title:      payload.title,
        course:     payload.course,
        start_time: payload.start,
        end_time:   payload.end || payload.start,
        all_day:    payload.allDay ? 1 : 0,
        event_type: "class",
      }),
    });
  }

  return (
    <AppShell onLogout={onLogout} user={user} activePage="classes" onNavigate={onNavigate}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">Classes</h2>
          <p className="text-sm text-xyon-muted mt-1">
            Search and import your Montclair State courses
          </p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="h-10 px-4 rounded-xl bg-xyon-ink text-white text-sm font-semibold hover:opacity-90 flex items-center gap-1.5"
        >
          <span className="text-base leading-none">+</span> Browse Courses
        </button>
      </div>

      {/* Body */}
      <div className="mt-5 rounded-xxl bg-[#fbfaf7] border border-xyon-line shadow-soft h-[calc(100%-80px)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-xyon-muted text-sm max-w-sm">
            Use <strong>Browse Courses</strong> to search MSU's course catalog and import your schedule directly to your calendar.
          </p>
          <button
            onClick={() => setShowImport(true)}
            className="px-5 py-2.5 rounded-xl bg-xyon-ink text-white text-sm font-semibold hover:opacity-90"
          >
            Browse Courses
          </button>
        </div>
      </div>

      <MsuImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onCreate={handleImportEvent}
      />
    </AppShell>
  );
}
