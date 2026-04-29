import React, { useEffect, useState } from "react";
import SplashPage from "./view/SplashPage";
import LoginPage from "./view/LoginPage";
import SignupPage from "./view/SignupPage";
import CalendarPage from "./pages/CalendarPage";

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [view, setView] = useState("splash"); // "splash" | "login" | "signup"
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        setIsAuthenticated(!!token);
        setUser(savedUser ? JSON.parse(savedUser) : null);
    }, []);

    function loginSuccessful() {
        const savedUser = localStorage.getItem("user");
        setUser(savedUser ? JSON.parse(savedUser) : null);
        setIsAuthenticated(true);
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
        setView("splash"); // Drop back to splash, not login
    }

    // Logged-in users always see the calendar
    if (isAuthenticated) {
        return <CalendarPage onLogout={logout} user={user} />;
    }

    // Not logged in: splash → login or signup based on user choice
    if (view === "login") {
        return (
            <LoginPage
                onLoginSuccess={loginSuccessful}
                onShowSignup={() => setView("signup")}
            />
        );
    }

    if (view === "signup") {
        return (
            <SignupPage
                onSignupSuccess={() => setView("login")}
                onShowLogin={() => setView("login")}
            />
        );
    }

    return (
        <SplashPage
            onGetStarted={() => setView("signup")}
            onLogin={() => setView("login")}
        />
    );
}