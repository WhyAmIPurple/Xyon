import React, { useEffect, useState } from "react";
import "./SplashPage.css";
import logo from "../assets/logo.png";

export default function SplashPage({ onGetStarted, onLogin }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation after mount
        const t = setTimeout(() => setVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="splash-root">
            <header className="navbar">
                <img src={logo} alt="Xyon Logo" className="logo" />
                <nav className="nav-links">
                    <button className="nav-btn-ghost" onClick={onLogin}>Log In</button>
                    <button className="nav-btn-pink" onClick={onGetStarted}>Get Started</button>
                </nav>
            </header>

            <main className={`splash-hero ${visible ? "splash-hero--visible" : ""}`}>
                <div className="splash-badge">The student calendar, reimagined</div>

                <h1 className="splash-headline">
                    Track everything<br />
                    <span className="splash-headline-accent">in one place.</span>
                </h1>

                <p className="splash-sub">
                    The Xyon planner brings your schedule, assignments, extracurriculars, and more into one customizable system designed to keep you organized and give you peace of mind.
                </p>

                <div className="splash-cta-row">
                    <button className="splash-btn-primary" onClick={onGetStarted}>
                        Get Started
                    </button>
                    <button className="splash-btn-secondary" onClick={onLogin}>
                        I already have an account
                    </button>
                </div>
            </main>

            <section className="splash-features">
                <div className="splash-feature-card">
                    <span className="splash-feature-icon">📅</span>
                    <h3>Smart Scheduling</h3>
                    <p>Add and view events and assignments at a glance with multiple, customizable views.</p>
                </div>
                <div className="splash-feature-card">
                    <span className="splash-feature-icon">🔔</span>
                    <h3>Never Miss a Beat</h3>
                    <p>Keep track of everything that matters, all in one place.</p>
                </div>
                <div className="splash-feature-card">
                    <span className="splash-feature-icon">✨</span>
                    <h3>Minimal & Beautiful</h3>
                    <p>A calm, focused design that gets out of your way.</p>
                </div>
            </section>

            <footer className="splash-footer">
                © {new Date().getFullYear()} Xyon. All rights reserved.
            </footer>
        </div>
    );
}
