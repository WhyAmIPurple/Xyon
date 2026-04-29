import React from "react";
import AppShell from "../components/layout/AppShell";

export default function ClassesPage({ onLogout, user, onNavigate }) {
  return (
    <AppShell onLogout={onLogout} user={user} activePage="classes" onNavigate={onNavigate}>
      <div className="flex items-center justify-center h-full">
        <p className="text-2xl font-extrabold text-xyon-muted">Coming Soon</p>
      </div>
    </AppShell>
  );
}
