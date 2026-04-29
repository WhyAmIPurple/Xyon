# Signup Page Change Guide

This document lists every change needed to add a working signup page that uses the same look and feel as the current login page.

Status: implemented in the current repo state.

## Goal

Use the same layout and styling from the login page for signup, while connecting the form to the backend register route:

- frontend page: `client/src/view/SignupPage.jsx`
- shared styles: `client/src/view/Page.css`
- login page link: `client/src/view/LoginPage.jsx`
- app screen switching: `client/src/App.jsx`
- backend register route: `server/src/routes/authorization.js`

## Good News

The backend register endpoint already exists:

- `POST /api/auth/register`
- file: `server/src/routes/authorization.js`

It expects this request body:

```json
{
  "first_name": "Tushar",
  "last_name": "Moradiya",
  "email": "test@example.com",
  "password": "123456"
}
```

So most of the work is on the frontend.

## 1. Fix `SignupPage.jsx`

File:
- `client/src/view/SignupPage.jsx`

Your current copy has several issues:

- it sends the request to `/api/auth/login` instead of `/api/auth/register`
- it sends `firstName` and `lastName`, but the backend expects `first_name` and `last_name`
- it is missing a comma after `firstName: firstName`
- the page title still says `Login`
- the button still says `Log in`
- it only shows email and password inputs, but signup also needs first name and last name
- it still shows the forgot-password text, which is not the right CTA for signup

### Replace the file with this

```jsx
import React, { useState } from "react";
import "./Page.css";
import logo from "../assets/logo.png";

export default function SignupPage({ onSignupSuccess, onShowLogin }) {
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
        <img src={logo} alt="Xyon Logo" className="logo" />
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
```

## 2. Update `App.jsx` To Switch Between Login And Signup

File:
- `client/src/App.jsx`

Right now `SignupPage` is imported, but it is not used anywhere.

### Add a new state

Inside `App()`, add:

```jsx
const [showSignup, setShowSignup] = useState(false);
```

### Keep existing auth state

Do not remove:

```jsx
const [isAuthenticated, setIsAuthenticated] = useState(false);
```

### Replace the return block

Replace the current return with:

```jsx
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
);
```

### Result

This gives you three screens:

- login page
- signup page
- calendar page after successful login

## 3. Update `LoginPage.jsx` To Open Signup

File:
- `client/src/view/LoginPage.jsx`

### Change the component props

Change:

```jsx
export default function LoginPage({onLoginSuccess}){
```

to:

```jsx
export default function LoginPage({ onLoginSuccess, onShowSignup }) {
```

### Add a signup link

Under the login form, replace:

```jsx
<div className = "forgot-password">
    Forgot Email or Password? 
</div>
```

with:

```jsx
<div className="forgot-password" onClick={onShowSignup}>
  Don’t have an account? Sign up
</div>
```

If you want to keep both options, you can keep the forgot-password text and add the signup line below it.

## 4. Reuse The Existing CSS

File:
- `client/src/view/Page.css`

You do not need a separate signup stylesheet if you want the signup page to look the same as the login page.

The signup page can reuse these classes:

- `.login-page`
- `.login-card`
- `.login-title`
- `.login-form`
- `.login-input`
- `.login-button`
- `.login-message`
- `.forgot-password`
- `.navbar`
- `.logo`

### CSS updates applied

To make the shared auth layout work well for both login and signup, these updates were made:

```css
.login-input {
  width: 100%;
  box-sizing: border-box;
}

.login-button {
  width: 100%;
}

.forgot-password {
  margin-top: 12px;
  text-align: center;
  cursor: pointer;
}
```

These changes remove the rigid positioning that was fine for a two-field login form but not for the longer signup form.

## 5. Backend Contract For Signup

File:
- `server/src/routes/authorization.js`

The backend register route is already ready to use:

```js
router.post("/register", async(req, res) => {
    const {first_name, last_name, email, password} = req.body;
    ...
});
```

Important details:

- frontend must send `first_name`, not `firstName`
- frontend must send `last_name`, not `lastName`
- all four fields are required
- duplicate email returns an error
- successful signup returns:

```json
{
  "ok": true,
  "user_id": 123
}
```

### Important note

Signup currently does not automatically log the user in.

That means after successful signup you should do one of these:

1. send them back to the login page
2. or automatically call login after register

Your current planned flow is option 1, which is simpler.

## 6. Recommended User Flow

The cleanest flow for your current app is:

1. User opens login page
2. User clicks `Don’t have an account? Sign up`
3. App shows signup page
4. User submits signup form
5. Backend creates the user
6. App shows success and returns user to login
7. User logs in
8. App stores token and opens calendar

## 7. Current Files To Change

Frontend:
- `client/src/view/SignupPage.jsx`
- `client/src/view/LoginPage.jsx`
- `client/src/App.jsx`

Optional frontend style tweaks:
- `client/src/view/Page.css`

Backend:
- no backend code changes required for basic signup, because `/register` already exists

## 8. Quick Checklist

- [ ] fix `SignupPage.jsx` request URL to `/api/auth/register`
- [ ] send `first_name` and `last_name`
- [ ] add first name input
- [ ] add last name input
- [ ] change title to `Sign Up`
- [ ] change button text to `Sign Up`
- [ ] add `Already have an account? Log in`
- [ ] update `LoginPage.jsx` to accept `onShowSignup`
- [ ] add signup link to `LoginPage.jsx`
- [ ] add `showSignup` state in `App.jsx`
- [ ] render `SignupPage` from `App.jsx`
- [ ] test register flow
- [ ] test login after signup

## 9. Current Bug In Your Signup Copy

This line in your current `SignupPage.jsx` is invalid:

```jsx
firstName: firstName
lastName: lastName,
```

It needs a comma after `firstName: firstName`, but even after fixing that, the keys are still wrong for your backend.

This:

```jsx
{
  firstName: firstName,
  lastName: lastName,
  email,
  password
}
```

must become:

```jsx
{
  first_name: firstName,
  last_name: lastName,
  email,
  password
}
```

## 10. Best Next Step

Do the changes in this order:

1. fix `SignupPage.jsx`
2. update `App.jsx`
3. update `LoginPage.jsx`
4. test signup
5. test login with the new account

## 11. What Was Implemented

Completed frontend changes:

- `client/src/view/SignupPage.jsx`
  - wired to `POST /api/auth/register`
  - sends `first_name`, `last_name`, `email`, and `password`
  - reuses the login page styling
  - includes a link back to login
- `client/src/view/LoginPage.jsx`
  - accepts `onShowSignup`
  - includes a link to open signup
  - imports the shared logo asset from `client/src/assets/logo.png`
  - removes the temporary hard-coded login check so API auth is the only login path
- `client/src/App.jsx`
  - adds `showSignup` state
  - switches between login and signup before authentication
- `client/src/view/Page.css`
  - makes auth inputs full width
  - makes the auth button full width
  - centers the helper link under the form

Verification:

- `npm run build` passed in `client/`
