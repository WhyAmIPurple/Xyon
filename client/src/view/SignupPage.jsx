import React, { useState } from "react";
import "./Page.css";
import logo from "../assets/logo.png";

export default function SignupPage({ onSignupSuccess, onShowLogin, onShowSplash }) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage("");

        try {
            const response = await fetch("http://localhost:3001/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    password
                })
            });

            const data = await response.json();
            if (!response.ok || !data.ok) {
                setMessage(data.error || data.message || "Signup unsuccessful");
                return;
            }

            setMessage("Signup successful. Please log in.");

            if (onSignupSuccess) onSignupSuccess();
        } catch (error) {
            console.error(error);
            setMessage("An error occurred during signup. Please try again later.");
        }
    }

    return (
        <div>
            <header className="navbar">
                <img src={logo} alt="Xyon Logo" className="logo" onClick={onShowSplash} style={{ cursor: onShowSplash ? "pointer" : "default" }} />
            </header>
            <div className="login-page">
                <div className="login-card">
                    <h2 className="login-title">Sign Up</h2>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <input
                            className="login-input"
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />

                        <input
                            className="login-input"
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />

                        <input
                            className="login-input"
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <input
                            className="login-input"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <button className="login-button" type="submit">
                            Sign Up
                        </button>
                    </form>

                    <div className="forgot-password" onClick={onShowLogin}>
                        Already have an account? Log in
                    </div>

                    {message && <p className="login-message">{message}</p>}
                </div>
            </div>
        </div>
    );
}
