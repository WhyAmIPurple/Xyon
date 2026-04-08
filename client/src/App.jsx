import React, { useEffect, useState } from "react";
import LoginPage from "./view/LoginPage";
import SignupPage from "./view/SignupPage";
import CalendarPage from "./pages/CalendarPage";

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        // Restore the saved user so the dashboard can show the real account name.
        setIsAuthenticated(!!token);
        setUser(savedUser ? JSON.parse(savedUser) : null);
    }, []);

    function loginSuccessful(){
      const savedUser = localStorage.getItem("user");
      // Refresh the in-memory user right after login succeeds.
      setUser(savedUser ? JSON.parse(savedUser) : null);
      setIsAuthenticated(true);
    }
    
    function logout(){
      // Clear the saved session and drop back to the login screen.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
    }

    return isAuthenticated ? (
      <CalendarPage onLogout={logout} user={user} />
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
