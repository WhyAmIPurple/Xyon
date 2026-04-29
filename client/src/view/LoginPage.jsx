import React, { useState } from "react";
import "./Page-Login-Signup.css";
import logo from "../assets/logo.png";

export default function LoginPage({ onLoginSuccess, onShowSignup }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
        const response = await fetch("http://localhost:3001/api/auth/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email, password})
        });

        const data  = await response.json();
        if (!response.ok || !data.ok){
            setMessage(data.error || data.message || "Login unsuccessful");
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setMessage("Login successful");
        // This will bring us to the calendar page, the dashboard if you may
        //navigate("/dashboard"); is what I need to implement
        if (onLoginSuccess) onLoginSuccess();

    } catch (error){
        console.error(error);
        setMessage("An error occurred during login. Please try again later.");
      }
    }

return (
<div> 
    <header className = "navbar"> 
    <img src={logo} alt="Xyon Logo" className="logo" />
    </header>
    <div className = "login-page"> 
        <div className = "login-card">
            <h2 className = "login-title"> Login </h2>

            <form className = "login-form" onSubmit = {handleSubmit}>
                <input 
                    className =  "login-input"
                    type = "email"
                    placeholder = "Email"
                    value = {email}
                    onChange = {(e) => setEmail(e.target.value)} 
                    />

                <input 
                    className = "login-input"
                    type = "password"
                    placeholder = "Password"
                    value = {password}
                    onChange = {(e) => setPassword(e.target.value)}
                    />
                    
                <button className = "login-button" type = "submit">
                    Log in 
                </button> 
                </form> 
                
                <div className="forgot-password" onClick={onShowSignup}>
                    Don&apos;t have an account? Sign up
                </div>

                    {message && <p className = "login-message">{message}</p>}
                    </div>
                </div> 
            </div> 
            );
        }                 
