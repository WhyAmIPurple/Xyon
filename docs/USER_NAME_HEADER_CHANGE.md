# User Name Header Change

This update replaces the hard-coded `John Doe` label in the top-right header with the actual logged-in user's name.

## What changed

- `client/src/App.jsx`
  - added a `user` state
  - restored the saved user from `localStorage` on app load
  - refreshed the `user` state after login
  - cleared the `user` state on logout
- `client/src/pages/CalendarPage.jsx`
  - accepts the `user` prop and passes it to `AppShell`
- `client/src/components/layout/AppShell.jsx`
  - builds a display name from `first_name` and `last_name`
  - shows that value in the top-right header instead of `John Doe`

## Data flow

1. Login succeeds in `client/src/view/LoginPage.jsx`
2. The backend response includes:
   - `first_name`
   - `last_name`
   - `email`
   - `user_id`
3. The login page saves that object in `localStorage` under `user`
4. `App.jsx` reads that saved object and passes it down to `AppShell`
5. `AppShell` renders the user's full name in the header

## Fallback behavior

If there is no saved user in `localStorage`, the header still shows `John Doe` as a fallback.
