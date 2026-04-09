import React, { useState } from "react";
import AppShell from "../components/layout/AppShell";

function Section({ title, children }) {
  return (
    <div className="rounded-xxl border border-xyon-line bg-[#fbfaf7] p-5">
      <h3 className="text-sm font-bold text-xyon-ink mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, description, children }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-xyon-line/50 last:border-0">
      <div>
        <p className="text-sm font-medium text-xyon-ink">{label}</p>
        {description && <p className="text-xs text-xyon-muted mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function AccountPage({ onLogout, user, onNavigate }) {
  const displayName  = user ? `${user.first_name} ${user.last_name}` : "—";
  const displayEmail = user?.email || "—";

  const [editingName,  setEditingName]  = useState(false);
  const [firstName,    setFirstName]    = useState(user?.first_name || "");
  const [lastName,     setLastName]     = useState(user?.last_name  || "");

  return (
    <AppShell onLogout={onLogout} user={user} activePage="account" onNavigate={onNavigate}>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">Account</h2>
          <p className="text-sm text-xyon-muted mt-1">Manage your personal information</p>
        </div>
      </div>

      <div className="mt-5 h-[calc(100%-72px)] overflow-auto space-y-4 pr-1">

        {/* Profile */}
        <Section title="Profile">
          <Row label="Full Name" description="Your display name across Xyon">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  className="text-sm rounded-xl border border-xyon-line bg-white px-3 py-1.5 outline-none w-28"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First"
                />
                <input
                  className="text-sm rounded-xl border border-xyon-line bg-white px-3 py-1.5 outline-none w-28"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last"
                />
                <button
                  onClick={() => setEditingName(false)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-xyon-ink text-white hover:opacity-90"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-xyon-muted">{displayName}</span>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-xyon-line bg-white/60 hover:bg-white"
                >
                  Edit
                </button>
              </div>
            )}
          </Row>
          <Row label="Email" description="Your login email address">
            <span className="text-sm text-xyon-muted">{displayEmail}</span>
          </Row>
        </Section>

        {/* Security */}
        <Section title="Security">
          <Row label="Password" description="Change your account password">
            <button className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-xyon-line bg-white/60 hover:bg-white">
              Change Password
            </button>
          </Row>
        </Section>

        {/* Danger zone */}
        <Section title="Danger Zone">
          <Row label="Sign Out" description="Log out of your Xyon account">
            <button
              onClick={onLogout}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            >
              Sign Out
            </button>
          </Row>
          <Row label="Delete Account" description="Permanently remove your account and all data">
            <span className="text-xs text-xyon-muted font-semibold px-2 py-1 rounded-lg bg-xyon-pill border border-xyon-line">
              Coming Soon
            </span>
          </Row>
        </Section>

      </div>
    </AppShell>
  );
}
