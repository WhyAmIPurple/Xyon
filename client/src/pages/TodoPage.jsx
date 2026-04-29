import React, { useEffect, useRef, useState } from "react";
import AppShell from "../components/layout/AppShell";

// ── color palette ─────────────────────────────────────────────────────────────
const COLORS = {
  default: { bg: "#f7f5f1", border: "#e5e1d9", label: "Default" },
  pink:    { bg: "#fde8ef", border: "#f7b4c6", label: "Pink"    },
  blue:    { bg: "#e6eef8", border: "#a9c0e8", label: "Blue"    },
  green:   { bg: "#e8f3e8", border: "#b9d3b4", label: "Green"   },
  purple:  { bg: "#f0ebfa", border: "#bca9d8", label: "Purple"  },
  yellow:  { bg: "#fdf8e1", border: "#f5e3a3", label: "Yellow"  },
};

// ── color picker row ──────────────────────────────────────────────────────────
function ColorPicker({ current, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      {Object.entries(COLORS).map(([key, { bg, border }]) => (
        <button
          key={key}
          title={COLORS[key].label}
          onClick={() => onChange(key)}
          className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: bg,
            borderColor: current === key ? border : "transparent",
            outline: current === key ? `2px solid ${border}` : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── single todo card ──────────────────────────────────────────────────────────
function TodoCard({ todo, onEdit, onDelete, onTogglePin, onToggleComplete }) {
  const [hovered, setHovered] = useState(false);
  const { bg, border } = COLORS[todo.color] || COLORS.default;

  return (
    <div
      className="rounded-xxl border p-4 flex flex-col gap-2 break-inside-avoid mb-3 group transition-shadow hover:shadow-md cursor-pointer"
      style={{ backgroundColor: bg, borderColor: border }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onEdit(todo)}
    >
      {/* Pin indicator (always visible if pinned) */}
      {todo.pinned === 1 && (
        <div className="flex justify-end -mt-1 -mr-1">
          <span className="text-[10px] font-bold text-xyon-muted tracking-wider">PINNED</span>
        </div>
      )}

      {/* Title */}
      {todo.title?.trim() && (
        <p className={["text-sm font-bold text-xyon-ink leading-snug", todo.completed ? "line-through opacity-50" : ""].join(" ")}>
          {todo.title}
        </p>
      )}

      {/* Body */}
      {todo.body?.trim() && (
        <p className={["text-sm text-xyon-muted leading-relaxed whitespace-pre-wrap break-words", todo.completed ? "line-through opacity-50" : ""].join(" ")}>
          {todo.body}
        </p>
      )}

      {/* Action row — shown on hover */}
      <div
        className="flex items-center justify-between mt-1 transition-opacity"
        style={{ opacity: hovered ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {/* Complete toggle */}
          <button
            title={todo.completed ? "Mark incomplete" : "Mark complete"}
            onClick={() => onToggleComplete(todo)}
            className="h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors hover:bg-white/60"
            style={{ borderColor: border }}
          >
            {todo.completed === 1 && (
              <span className="text-[10px]">✓</span>
            )}
          </button>

          {/* Pin toggle */}
          <button
            title={todo.pinned ? "Unpin" : "Pin"}
            onClick={() => onTogglePin(todo)}
            className="text-xs text-xyon-muted hover:text-xyon-ink px-1.5 py-0.5 rounded-lg hover:bg-white/60"
          >
            {todo.pinned === 1 ? "📌" : "📍"}
          </button>
        </div>

        {/* Delete */}
        <button
          title="Delete"
          onClick={() => onDelete(todo.todo_id)}
          className="text-xs text-xyon-muted hover:text-red-500 px-1.5 py-0.5 rounded-lg hover:bg-white/60"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

// ── edit modal ────────────────────────────────────────────────────────────────
function EditModal({ todo, onClose, onSave }) {
  const [title, setTitle] = useState(todo.title || "");
  const [body,  setBody]  = useState(todo.body  || "");
  const [color, setColor] = useState(todo.color || "default");

  const { bg, border } = COLORS[color] || COLORS.default;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="absolute left-1/2 top-1/2 w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-xxl border shadow-soft p-5 flex flex-col gap-3"
        style={{ backgroundColor: bg, borderColor: border }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          className="w-full bg-transparent text-base font-bold text-xyon-ink outline-none placeholder:text-xyon-muted/60"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full bg-transparent text-sm text-xyon-ink outline-none resize-none placeholder:text-xyon-muted/60 min-h-[100px]"
          placeholder="Take a note…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <ColorPicker current={color} onChange={setColor} />
          <button
            className="px-4 py-1.5 rounded-xl bg-xyon-ink text-white text-sm font-semibold hover:opacity-90"
            onClick={() => onSave({ title, body, color })}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── section header ────────────────────────────────────────────────────────────
function SectionLabel({ text }) {
  return (
    <p className="text-[11px] uppercase tracking-widest font-semibold text-xyon-muted mb-3 mt-5 first:mt-0">
      {text}
    </p>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function TodoPage({ onLogout, user, onNavigate }) {
  const [todos,         setTodos]         = useState([]);
  const [editTodo,      setEditTodo]      = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // New-note form state
  const [noteOpen,  setNoteOpen]  = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody,  setNoteBody]  = useState("");
  const [noteColor, setNoteColor] = useState("default");

  const newNoteRef = useRef(null);

  // ── fetch ────────────────────────────────────────────────────────────────
  async function loadTodos() {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const u = JSON.parse(stored);
    try {
      const res  = await fetch(`http://localhost:3001/api/todos?user_id=${u.user_id}`);
      const data = await res.json();
      if (data.ok) setTodos(data.todos);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { loadTodos(); }, []);

  // Close new-note form when clicking outside it
  useEffect(() => {
    function handleClick(e) {
      if (noteOpen && newNoteRef.current && !newNoteRef.current.contains(e.target)) {
        handleCreateNote();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [noteOpen, noteTitle, noteBody, noteColor]);

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleCreateNote = async () => {
    if (!noteTitle.trim() && !noteBody.trim()) {
      setNoteOpen(false);
      return;
    }
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const u = JSON.parse(stored);
    try {
      const res  = await fetch("http://localhost:3001/api/todos", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_id: u.user_id, title: noteTitle, body: noteBody, color: noteColor }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { alert(data.error || "Failed to save."); return; }
      setNoteTitle(""); setNoteBody(""); setNoteColor("default"); setNoteOpen(false);
      loadTodos();
    } catch { alert("Failed to save."); }
  };

  const handleSaveEdit = async ({ title, body, color }) => {
    if (!editTodo) return;
    try {
      const res  = await fetch(`http://localhost:3001/api/todos/${editTodo.todo_id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title, body, color }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { alert(data.error || "Failed to save."); return; }
      setEditTodo(null);
      loadTodos();
    } catch { alert("Failed to save."); }
  };

  const handleDelete = async (id) => {
    try {
      const res  = await fetch(`http://localhost:3001/api/todos/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) { alert(data.error || "Failed to delete."); return; }
      loadTodos();
    } catch { alert("Failed to delete."); }
  };

  const handleTogglePin = async (todo) => {
    try {
      await fetch(`http://localhost:3001/api/todos/${todo.todo_id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pinned: todo.pinned ? 0 : 1 }),
      });
      loadTodos();
    } catch { alert("Failed to update."); }
  };

  const handleToggleComplete = async (todo) => {
    try {
      await fetch(`http://localhost:3001/api/todos/${todo.todo_id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ completed: todo.completed ? 0 : 1 }),
      });
      loadTodos();
    } catch { alert("Failed to update."); }
  };

  // ── derived lists ─────────────────────────────────────────────────────────
  const pinned    = todos.filter((t) => t.pinned === 1  && t.completed === 0);
  const active    = todos.filter((t) => t.pinned === 0  && t.completed === 0);
  const completed = todos.filter((t) => t.completed === 1);

  const { bg: newBg, border: newBorder } = COLORS[noteColor] || COLORS.default;

  return (
    <AppShell onLogout={onLogout} user={user} activePage="todo" onNavigate={onNavigate}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">To Do</h2>
          <p className="text-sm text-xyon-muted mt-1">
            {todos.filter(t => t.completed === 0).length} item{todos.filter(t => t.completed === 0).length !== 1 ? "s" : ""} remaining
          </p>
        </div>
        {completed.length > 0 && (
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="px-3 py-1.5 rounded-xl border border-xyon-line bg-white/60 hover:bg-white text-xs font-semibold text-xyon-muted"
          >
            {showCompleted ? "Hide" : "Show"} completed ({completed.length})
          </button>
        )}
      </div>

      <div className="mt-4 h-[calc(100%-72px)] overflow-auto pr-1">

        {/* ── New note creator ── */}
        <div ref={newNoteRef} className="mb-6">
          {!noteOpen ? (
            <div
              onClick={() => setNoteOpen(true)}
              className="w-full max-w-xl mx-auto rounded-xxl border border-xyon-line bg-white/70 hover:bg-white px-5 py-3 text-sm text-xyon-muted cursor-text shadow-soft"
            >
              Take a note…
            </div>
          ) : (
            <div
              className="w-full max-w-xl mx-auto rounded-xxl border shadow-soft p-4 flex flex-col gap-3"
              style={{ backgroundColor: newBg, borderColor: newBorder }}
            >
              <input
                autoFocus
                className="w-full bg-transparent text-sm font-bold text-xyon-ink outline-none placeholder:text-xyon-muted/60"
                placeholder="Title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
              <textarea
                className="w-full bg-transparent text-sm text-xyon-ink outline-none resize-none placeholder:text-xyon-muted/60 min-h-[80px]"
                placeholder="Take a note…"
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <ColorPicker current={noteColor} onChange={setNoteColor} />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setNoteTitle(""); setNoteBody(""); setNoteColor("default"); setNoteOpen(false); }}
                    className="px-3 py-1.5 rounded-xl text-sm font-semibold text-xyon-muted hover:bg-white/60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNote}
                    className="px-3 py-1.5 rounded-xl bg-xyon-ink text-white text-sm font-semibold hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Pinned */}
        {pinned.length > 0 && (
          <>
            <SectionLabel text="Pinned" />
            <div style={{ columns: "3", columnGap: "12px" }}>
              {pinned.map((t) => (
                <TodoCard
                  key={t.todo_id}
                  todo={t}
                  onEdit={setEditTodo}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </div>
          </>
        )}

        {/* Active */}
        {active.length > 0 && (
          <>
            {pinned.length > 0 && <SectionLabel text="Other" />}
            <div style={{ columns: "3", columnGap: "12px" }}>
              {active.map((t) => (
                <TodoCard
                  key={t.todo_id}
                  todo={t}
                  onEdit={setEditTodo}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </div>
          </>
        )}

        {/* Completed */}
        {completed.length > 0 && showCompleted && (
          <>
            <SectionLabel text={`Completed (${completed.length})`} />
            <div style={{ columns: "3", columnGap: "12px" }}>
              {completed.map((t) => (
                <TodoCard
                  key={t.todo_id}
                  todo={t}
                  onEdit={setEditTodo}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      {editTodo && (
        <EditModal
          todo={editTodo}
          onClose={() => setEditTodo(null)}
          onSave={handleSaveEdit}
        />
      )}
    </AppShell>
  );
}
