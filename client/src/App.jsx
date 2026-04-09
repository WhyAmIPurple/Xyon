import React, { useEffect, useState } from "react";
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
    const [user, setUser] = useState(null);
    const [page, setPage] = useState("dashboard");

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
    }, []);

    function navigate(newPage) {
        setPage(newPage);
        localStorage.setItem("page", newPage);
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
        <CalendarPage onLogout={logout} user={user} onNavigate={navigate} />
      )
    ) : showSignup ? (
      <SignupPage
        onSignupSuccess={() => setShowSignup(false)}
        onShowLogin={() => setShowSignup(false)}
      />
    ) : (
      <LoginPage
        onLoginSuccess={loginSuccessful}
        onShowSignup={() => setShowSignup(true)}
      />
    )
}
