import React, { useEffect, useRef, useState } from "react";
import SplashPage from "./view/SplashPage";
import LoginPage from "./view/LoginPage";
import SignupPage from "./view/SignupPage";
import CalendarPage from "./pages/CalendarPage";
import DashboardPage from "./pages/DashboardPage";
import ListPage from "./pages/ListPage";
import ClassesPage from "./pages/ClassesPage";
import TodoPage from "./pages/TodoPage";
import SettingsPage from "./pages/SettingsPage";
import AccountPage from "./pages/AccountPage";

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [showLogin,  setShowLogin]  = useState(false);
    const notifiedRef = useRef(new Set());
    const [user, setUser] = useState(null);
    const [page, setPage] = useState("dashboard");
    const [targetDate, setTargetDate] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        const savedPage = localStorage.getItem("page");
        const savedAccent = localStorage.getItem("xyon-accent");

        setIsAuthenticated(!!token);
        setUser(savedUser ? JSON.parse(savedUser) : null);
        if (savedPage) setPage(savedPage);
        if (savedAccent) {
            document.documentElement.style.setProperty("--xyon-accent", savedAccent);
        }
        const darkMode = localStorage.getItem("xyon-dark-mode") === "true";
        document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        async function checkReminders() {
            if (localStorage.getItem("xyon-reminders-enabled") !== "true") return;
            if (Notification.permission !== "granted") return;
            const stored = localStorage.getItem("user");
            if (!stored) return;
            const u = JSON.parse(stored);
            const mins = parseInt(localStorage.getItem("xyon-reminder-minutes") || "15", 10);
            try {
                const res  = await fetch(`http://localhost:3001/api/events?user_id=${u.user_id}`);
                const data = await res.json();
                if (!data.ok) return;
                const now = Date.now();
                data.events.forEach((ev) => {
                    const start     = new Date(ev.start_time.replace(" ", "T")).getTime();
                    const minsUntil = (start - now) / 60000;
                    const key       = `${ev.event_id}-${ev.start_time}`;
                    if (minsUntil > 0 && minsUntil <= mins && !notifiedRef.current.has(key)) {
                        notifiedRef.current.add(key);
                        new Notification(`Upcoming: ${ev.course || ev.title}`, {
                            body: `Starts in ${Math.round(minsUntil)} minute${Math.round(minsUntil) !== 1 ? "s" : ""}`,
                        });
                    }
                });
            } catch (e) { console.error("Reminder check failed:", e); }
        }

        checkReminders();
        const interval = setInterval(checkReminders, 60000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    function navigate(newPage, opts = {}) {
        setPage(newPage);
        localStorage.setItem("page", newPage);
        setTargetDate(opts.date || null);
    }

    function loginSuccessful(){
      const savedUser = localStorage.getItem("user");
      // Refresh the in-memory user right after login succeeds.
      setUser(savedUser ? JSON.parse(savedUser) : null);
      setIsAuthenticated(true);
    }
    
    function logout(){
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("page");
      setUser(null);
      setIsAuthenticated(false);
      setShowLogin(false);
      setShowSignup(false);
      setPage("dashboard");
    }

    return isAuthenticated ? (
      page === "dashboard" ? (
        <DashboardPage onLogout={logout} user={user} onNavigate={navigate} />
      ) : page === "list" ? (
        <ListPage onLogout={logout} user={user} onNavigate={navigate} />
      ) : page === "classes" ? (
        <ClassesPage onLogout={logout} user={user} onNavigate={navigate} />
      ) : page === "todo" ? (
        <TodoPage onLogout={logout} user={user} onNavigate={navigate} />
      ) : page === "settings" ? (
        <SettingsPage onLogout={logout} user={user} onNavigate={navigate} />
      ) : page === "account" ? (
        <AccountPage onLogout={logout} user={user} onNavigate={navigate} />
      ) : (
        <CalendarPage onLogout={logout} user={user} onNavigate={navigate} targetDate={targetDate} />
      )
    ) : showSignup ? (
      <SignupPage
        onSignupSuccess={() => { setShowSignup(false); setShowLogin(false); }}
        onShowLogin={() => { setShowSignup(false); setShowLogin(true); }}
        onShowSplash={() => { setShowSignup(false); setShowLogin(false); }}
      />
    ) : showLogin ? (
      <LoginPage
        onLoginSuccess={loginSuccessful}
        onShowSignup={() => { setShowLogin(false); setShowSignup(true); }}
        onShowSplash={() => setShowLogin(false)}
      />
    ) : (
      <SplashPage
        onShowLogin={() => setShowLogin(true)}
        onShowSignup={() => setShowSignup(true)}
      />
    )
}
