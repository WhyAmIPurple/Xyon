import React, { useState } from "react";
import AppShell from "../components/layout/AppShell";

function Section({ title, children }) {
  return (
    <div className="rounded-xxl border border-xyon-line bg-xyon-panel p-5">
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

  const [changingPw,  setChangingPw]  = useState(false);
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [pwMessage,   setPwMessage]   = useState({ text: "", ok: false });
  const [pwLoading,   setPwLoading]   = useState(false);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwMessage({ text: "", ok: false });
    if (newPw !== confirmPw) { setPwMessage({ text: "New passwords do not match.", ok: false }); return; }
    if (newPw.length < 6)    { setPwMessage({ text: "New password must be at least 6 characters.", ok: false }); return; }
    setPwLoading(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const res  = await fetch("http://localhost:3001/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: storedUser.user_id, currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setPwMessage({ text: data.error || "Failed to change password.", ok: false }); return; }
      setPwMessage({ text: "Password changed successfully.", ok: true });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => { setChangingPw(false); setPwMessage({ text: "", ok: false }); }, 1500);
    } catch {
      setPwMessage({ text: "Could not reach the server.", ok: false });
    } finally {
      setPwLoading(false);
    }
  }

  function cancelChangePw() {
    setChangingPw(false);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setPwMessage({ text: "", ok: false });
  }

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput,   setDeleteInput]   = useState("");
  const [deleteError,   setDeleteError]   = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDeleteAccount() {
    if (deleteInput !== "DELETE") { setDeleteError('Type DELETE in all caps to confirm.'); return; }
    setDeleteLoading(true);
    setDeleteError("");
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const res  = await fetch(`http://localhost:3001/api/auth/account/${storedUser.user_id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) { setDeleteError(data.error || "Failed to delete account."); return; }
      onLogout();
    } catch {
      setDeleteError("Could not reach the server.");
    } finally {
      setDeleteLoading(false);
    }
  }

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
                  className="text-sm rounded-xl border border-xyon-line bg-xyon-panel px-3 py-1.5 outline-none w-28"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First"
                />
                <input
                  className="text-sm rounded-xl border border-xyon-line bg-xyon-panel px-3 py-1.5 outline-none w-28"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last"
                />
                <button
                  onClick={() => setEditingName(false)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-xyon-ink text-xyon-bg hover:opacity-90"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-xyon-muted">{displayName}</span>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-xyon-line bg-xyon-pill hover:bg-white"
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
            {!changingPw && (
              <button
                onClick={() => setChangingPw(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-xyon-line bg-xyon-pill hover:bg-xyon-card"
              >
                Change Password
              </button>
            )}
          </Row>
          {changingPw && (
            <form onSubmit={handleChangePassword} className="mt-3 space-y-2">
              <input
                type="password"
                placeholder="Current password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full text-sm rounded-xl border border-xyon-line bg-xyon-panel text-xyon-ink px-3 py-2 outline-none focus:border-xyon-accent"
                required
              />
              <input
                type="password"
                placeholder="New password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full text-sm rounded-xl border border-xyon-line bg-xyon-panel text-xyon-ink px-3 py-2 outline-none focus:border-xyon-accent"
                required
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full text-sm rounded-xl border border-xyon-line bg-xyon-panel text-xyon-ink px-3 py-2 outline-none focus:border-xyon-accent"
                required
              />
              {pwMessage.text && (
                <p className={`text-xs font-medium ${pwMessage.ok ? "text-green-600" : "text-red-500"}`}>
                  {pwMessage.text}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="text-xs font-semibold px-4 py-1.5 rounded-xl bg-xyon-ink text-xyon-bg hover:opacity-90 disabled:opacity-50"
                >
                  {pwLoading ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelChangePw}
                  className="text-xs font-semibold px-4 py-1.5 rounded-xl border border-xyon-line bg-xyon-pill hover:bg-xyon-card"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
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
            {!confirmDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
              >
                Delete Account
              </button>
            )}
          </Row>
          {confirmDelete && (
            <div className="mt-3 rounded-xl border border-red-300 bg-red-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-red-700">This cannot be undone.</p>
              <p className="text-xs text-red-600">
                All your events, to-dos, and account data will be permanently deleted.
                Type <strong>DELETE</strong> to confirm.
              </p>
              <input
                type="text"
                placeholder="Type DELETE to confirm"
                value={deleteInput}
                onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(""); }}
                className="w-full text-sm rounded-xl border border-red-300 bg-white text-red-800 px-3 py-2 outline-none placeholder:text-red-300"
              />
              {deleteError && <p className="text-xs font-medium text-red-600">{deleteError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="text-xs font-semibold px-4 py-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting…" : "Delete My Account"}
                </button>
                <button
                  onClick={() => { setConfirmDelete(false); setDeleteInput(""); setDeleteError(""); }}
                  className="text-xs font-semibold px-4 py-1.5 rounded-xl border border-xyon-line bg-xyon-pill hover:bg-xyon-card"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>

      </div>
    </AppShell>
  );
}
