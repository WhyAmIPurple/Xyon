import React from "react";
import { useState } from "react";
import "./LoginPage.css";

export default function LoginPage(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

function handleSubmit(e) {
    e.preventDefault();
//simple check (replace with backend node.js)
if(email === "example@exaample.com" && password === "1234")
{
    setMessage("Login successful");
} else {
    setMessage("Wrong email or password");
    }
}

return (
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

                    {message && <p className = "login-message">{message}</p>}
                    </div>
                </div> 
            );
        }
                        