import React, { useState } from "react";
import "./Page.css";
import logo from "../assets/logo.png";

export default function LoginPage({ onLoginSuccess, onShowSignup, onShowSplash }) {
    const [email,    setEmail]    = useState("");
    const [password, setPassword] = useState("");
    const [message,  setMessage]  = useState("");

    // Forgot-password flow: "login" | "forgot" | "verify"
    const [step,        setStep]        = useState("login");
    const [resetEmail,  setResetEmail]  = useState("");
    const [resetOtp,    setResetOtp]    = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPw,   setConfirmPw]   = useState("");
    const [loading,     setLoading]     = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage("");
        try {
            const response = await fetch("http://localhost:3001/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok || !data.ok) {
                setMessage(data.error || data.message || "Login unsuccessful");
                return;
            }
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            setMessage("Login successful");
            if (onLoginSuccess) onLoginSuccess();
        } catch (error) {
            console.error(error);
            setMessage("An error occurred during login. Please try again later.");
        }
    }

    async function handleSendOtp(e) {
        e.preventDefault();
        setMessage("");
        setLoading(true);
        try {
            const res  = await fetch("http://localhost:3001/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resetEmail })
            });
            const data = await res.json();
            if (!data.ok) { setMessage(data.error || "Failed to send code."); return; }
            setStep("verify");
            setMessage("");
        } catch {
            setMessage("Could not reach the server. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        setMessage("");
        if (newPassword !== confirmPw) { setMessage("Passwords do not match."); return; }
        if (newPassword.length < 6)    { setMessage("Password must be at least 6 characters."); return; }
        setLoading(true);
        try {
            const res  = await fetch("http://localhost:3001/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resetEmail, otp: resetOtp, newPassword })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) { setMessage(data.error || "Failed to reset password."); return; }
            setMessage("Password reset successfully! You can now log in.");
            setStep("login");
            setResetEmail(""); setResetOtp(""); setNewPassword(""); setConfirmPw("");
        } catch {
            setMessage("Could not reach the server. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    function goBackToLogin() {
        setStep("login");
        setMessage("");
        setResetEmail(""); setResetOtp(""); setNewPassword(""); setConfirmPw("");
    }

    return (
        <div>
            <header className="navbar">
                <img src={logo} alt="Xyon Logo" className="logo" onClick={onShowSplash} style={{ cursor: onShowSplash ? "pointer" : "default" }} />
            </header>

            <div className="login-page">
                <div className="login-card">

                    {/* ── Login ── */}
                    {step === "login" && (
                        <>
                            <h2 className="login-title">Login</h2>
                            <form className="login-form" onSubmit={handleSubmit}>
                                <input className="login-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                <input className="login-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                                <button className="login-button" type="submit">Log in</button>
                            </form>
                            <div className="forgot-password" onClick={() => { setStep("forgot"); setMessage(""); }}>
                                Forgot password?
                            </div>
                            <div className="forgot-password" onClick={onShowSignup}>
                                Don&apos;t have an account? Sign up
                            </div>
                            {message && <p className="login-message">{message}</p>}
                        </>
                    )}

                    {/* ── Step 1: enter email ── */}
                    {step === "forgot" && (
                        <>
                            <h2 className="login-title">Reset Password</h2>
                            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>
                                Enter your email and we'll send you a reset code.
                            </p>
                            <form className="login-form" onSubmit={handleSendOtp}>
                                <input
                                    className="login-input"
                                    type="email"
                                    placeholder="Email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    required
                                />
                                <button className="login-button" type="submit" disabled={loading}>
                                    {loading ? "Sending…" : "Send Code"}
                                </button>
                            </form>
                            <div className="forgot-password" onClick={goBackToLogin}>← Back to login</div>
                            {message && <p className="login-message">{message}</p>}
                        </>
                    )}

                    {/* ── Step 2: enter OTP + new password ── */}
                    {step === "verify" && (
                        <>
                            <h2 className="login-title">Reset Password</h2>
                            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>
                                Enter the 6-digit code sent to <strong>{resetEmail}</strong> and choose a new password.
                            </p>
                            <form className="login-form" onSubmit={handleResetPassword}>
                                <input
                                    className="login-input"
                                    type="text"
                                    placeholder="6-digit code"
                                    maxLength={6}
                                    value={resetOtp}
                                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                                    required
                                />
                                <input
                                    className="login-input"
                                    type="password"
                                    placeholder="New password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <input
                                    className="login-input"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={confirmPw}
                                    onChange={(e) => setConfirmPw(e.target.value)}
                                    required
                                />
                                <button className="login-button" type="submit" disabled={loading}>
                                    {loading ? "Resetting…" : "Reset Password"}
                                </button>
                            </form>
                            <div className="forgot-password" onClick={() => { setStep("forgot"); setMessage(""); }}>
                                ← Resend code
                            </div>
                            {message && <p className="login-message">{message}</p>}
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
