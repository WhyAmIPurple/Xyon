import React, { useEffect, useState } from "react";
import LoginPage from "./view/LoginPage";
import SignupPage from "./view/SignupPage";
import CalendarPage from "./pages/CalendarPage";

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showSignup, setShowSignup] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);
    }, []);

    function loginSuccessful(){
      setIsAuthenticated(true);
    }
    
    function logout(){
      // Clear the saved session and drop back to the login screen.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
    }

    return isAuthenticated ? (
      <CalendarPage onLogout={logout} />
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
