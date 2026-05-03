# Xyon — User Guide

**Version:** 2.0  
**Platform:** Web Application (localhost:5173 in development)  
**Built for:** Montclair State University Students

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started](#2-getting-started)
   - [Creating an Account](#21-creating-an-account)
   - [Logging In](#22-logging-in)
   - [Forgot Your Password?](#23-forgot-your-password)
3. [Navigation](#3-navigation)
4. [Dashboard](#4-dashboard)
5. [Calendar](#5-calendar)
   - [Switching Between Month and Week View](#51-switching-between-month-and-week-view)
   - [Adding an Event](#52-adding-an-event)
   - [Editing an Event](#53-editing-an-event)
   - [Deleting an Event](#54-deleting-an-event)
   - [Drag & Drop Rescheduling](#55-drag--drop-rescheduling)
6. [List View](#6-list-view)
7. [Classes — MSU Course Import](#7-classes--msu-course-import)
8. [To-Do](#8-to-do)
   - [Creating a To-Do Card](#81-creating-a-to-do-card)
   - [Color-Coding Cards](#82-color-coding-cards)
   - [Pinning Cards](#83-pinning-cards)
   - [Completing and Deleting Cards](#84-completing-and-deleting-cards)
9. [Settings](#9-settings)
   - [Accent Color](#91-accent-color)
   - [Dark Mode](#92-dark-mode)
   - [Notification Reminders](#93-notification-reminders)
10. [Account Management](#10-account-management)
    - [Editing Your Profile](#101-editing-your-profile)
    - [Changing Your Password](#102-changing-your-password)
    - [Deleting Your Account](#103-deleting-your-account)
11. [Signing Out](#11-signing-out)

---

## 1. Overview

Xyon is a free, all-in-one academic planner designed for Montclair State University students. It replaces scattered apps and sticky notes with a single, organized workspace where you can track classes, assignments, exams, to-dos, and personal events.

**Key features at a glance:**

| Feature | What it does |
|---|---|
| **Smart Calendar** | Visualize your schedule in week or month view. Drag and drop events to reschedule. |
| **Course Catalog** | Import your Montclair State courses directly from Banner — no manual entry required. |
| **Due Date Tracker** | See every assignment and exam in a clean list, sorted by date. |
| **To-Do Board** | Capture quick notes and tasks in a Google Keep-style card board. |
| **Customizable Appearance** | Choose an accent color and toggle dark mode to suit your style. |
| **Event Reminders** | Opt-in browser notifications that alert you before an event starts. |

![Splash Page](screenshots/01_splash_page.png)

---

## 2. Getting Started

### 2.1 Creating an Account

If you are a new user, you must create a free account before accessing Xyon.

**Steps:**

1. Open Xyon in your browser (e.g., `http://localhost:5173`).
2. On the **Splash Page**, click **"Get Started — it's free"** or **"Sign Up"** in the top-right corner.

   ![Splash Page Sign Up Button](screenshots/01_splash_page.png)

3. The **Sign Up** page opens. Fill in all four fields:
   - **First Name** — your given name
   - **Last Name** — your family name
   - **Email** — a valid email address you have access to
   - **Password** — choose a secure password

   ![Sign Up Page](screenshots/03_signup_page.png)

4. Click **"Sign Up"**. If registration succeeds, you will see a success message and be returned to the Login page automatically.
5. A confirmation message will appear. You can now log in with your new credentials.

> **Note:** Each email address can only be registered once. If you see an error saying the email is already taken, use "Forgot Password" to recover access to your existing account.

---

### 2.2 Logging In

**Steps:**

1. On the **Splash Page**, click **"Log In"** (top-right corner or center of the page).
2. The **Login** page opens.

   ![Login Page](screenshots/02_login_page.png)

3. Enter your registered **Email** and **Password**.
4. Click **"Log in"**.
5. If credentials are correct, you are taken directly to the **Dashboard**.

> **Session length:** Your session lasts 3 hours. After that, you will be logged out automatically and need to log in again.

---

### 2.3 Forgot Your Password?

If you cannot remember your password, Xyon provides a secure reset flow using a one-time code sent to your email.

**Steps:**

1. On the **Login** page, click **"Forgot Password?"** below the login form.

   ![Forgot Password Link](screenshots/02_login_page.png)

2. A new input field appears. Enter the **email address** associated with your account and click **"Send Code"**.

   ![Forgot Password — Email Entry](screenshots/04_forgot_password_email.png)

3. Check your inbox for a **6-digit one-time code** (OTP). The code expires in **15 minutes**.
4. Enter the code in the **OTP field** that appears, along with your **new password**. Click **"Reset Password"**.

   ![Forgot Password — OTP Entry](screenshots/05_forgot_password_otp.png)

5. Once reset, you are returned to the Login page. Log in with your new password.

> **Tip:** If you do not receive the email within a few minutes, check your spam/junk folder.

---

## 3. Navigation

After logging in, Xyon displays a **left sidebar** with all main navigation links, plus a **top bar** showing the current page title and your name.

![App Navigation Sidebar](screenshots/06_navigation_sidebar.png)

| Sidebar Item | Page |
|---|---|
| **Dashboard** | Home view with mini-calendar and upcoming events |
| **Calendar** | Full interactive calendar (week/month) |
| **List** | All events listed by date |
| **Classes** | Montclair State course import tool |
| **To Do** | Personal task/note board |
| **Settings** | Appearance and notification preferences |
| **Account** | Profile, password, and account deletion |
| **Sign Out** | Logs you out immediately |

Click any sidebar item to navigate to that section. The active page is highlighted in the sidebar.

---

## 4. Dashboard

The **Dashboard** is your home screen after logging in. It gives you a quick overview of your schedule without needing to open the full calendar.

![Dashboard Overview](screenshots/07_dashboard.png)

The Dashboard is divided into three panels:

### Left Panel — Mini Calendar

A compact month calendar that shows the current month. Each date that has events displays small colored dots below the date number. The colors correspond to event types (green = Class, blue = Assignment, purple = Exam, etc.).

- **Today** is highlighted with a filled circle.
- Click the **‹** or **›** arrows at the top to navigate between months.
- Click any date number to jump to that date in the full Calendar view.
- Click **"View All"** to open the full Calendar page.

![Dashboard Mini Calendar](screenshots/08_dashboard_mini_calendar.png)

### Top-Right Panel — Upcoming Dates

Shows your next **6 upcoming events** of the types: Assignment, Exam, Extracurricular, and Personal. Each row shows:
- The **date** (e.g., "15 May")
- The **event title**
- A **color-coded badge** showing the event type

Click any row to go to the List view for more detail. Click **"View All"** to open the full List page.

![Dashboard Upcoming Dates](screenshots/09_dashboard_upcoming.png)

### Bottom-Right Panel — Today

Shows all events scheduled for **today**, sorted by start time. Each event shows:
- The **time range** (or "All day")
- The **event title or course name**
- A **type badge**

Events are color-coded by type (green for Class, blue for Assignment, etc.).

![Dashboard Today Panel](screenshots/10_dashboard_today.png)

> **Tip:** The week range shown in the top-right of the Dashboard header (e.g., "28 Apr, 2026 – 03 May, 2026") reflects the current week.

---

## 5. Calendar

The **Calendar** page is the core of Xyon. It displays all your events on a full interactive calendar powered by FullCalendar.

![Calendar Page — Month View](screenshots/11_calendar_month.png)

### 5.1 Switching Between Month and Week View

Use the **Month** and **Week** toggle buttons in the top-right of the calendar toolbar to switch views.

- **Month View** — shows the entire month in a grid. Events appear as short colored bars.
- **Week View** — shows a 7-column, time-slotted view of the current week. Events appear as blocks at their scheduled times.

Use the **‹ Prev**, **Today**, and **Next ›** buttons to navigate between time periods.

![Calendar Week View](screenshots/12_calendar_week.png)

**Event type color legend:**

| Color | Type |
|---|---|
| Green | Class |
| Blue | Assignment |
| Purple | Exam |
| Yellow | Extracurricular / Club |
| Pink | Personal |
| Gray (light) | Work |
| Gray | Other |

---

### 5.2 Adding an Event

You can add an event by clicking anywhere on the calendar.

**Steps:**

1. In **Month View**, click on a date cell. In **Week View**, click on a specific time slot.
2. The **Add Event** modal opens.

   ![Add Event Modal](screenshots/13_add_event_modal.png)

3. Fill in the event details:

   | Field | Description | Required? |
   |---|---|---|
   | **Event Type** | Dropdown: Class, Assignment, Exam, Extracurricular, Personal, Work, Other | Yes |
   | **Title** | The name of your event | Yes |
   | **Course** | The course this event belongs to (e.g., "COMP 101") | No |
   | **Start Date & Time** | When the event begins | Yes |
   | **End Date & Time** | When the event ends | Yes |
   | **All Day** | Check this if the event has no specific time | No |
   | **Description** | Additional notes about the event | No |
   | **Location** | Where the event takes place | No |

4. Click **"Add Event"** to save.
5. The event immediately appears on the calendar in the correct color for its type.

> **Tip:** For recurring weekly classes, add each class session individually or import them via the **Classes** page.

---

### 5.3 Editing an Event

**Steps:**

1. Click on any existing event on the calendar.
2. The **Edit Event** modal opens, pre-filled with the event's current details.

   ![Edit Event Modal](screenshots/14_edit_event_modal.png)

3. Modify any fields as needed (title, type, time, description, location, etc.).
4. Click **"Save Changes"** to apply.

---

### 5.4 Deleting an Event

**Steps:**

1. Click on the event you want to delete.
2. In the **Edit Event** modal, click the **"Delete"** button (usually shown in red at the bottom of the modal).

   ![Delete Event Button](screenshots/14_edit_event_modal.png)

3. The event is removed from the calendar immediately.

> **Warning:** Deletion is permanent. There is no undo button.

---

### 5.5 Drag & Drop Rescheduling

You can reschedule events by dragging them to a new time slot or date.

**Steps:**

1. Click and hold an event on the calendar.
2. Drag it to the new date or time.
3. Release the mouse button.
4. A **confirmation popup** appears asking you to confirm the reschedule.

   ![Drag Drop Confirmation](screenshots/15_drag_drop_confirm.png)

5. Click **"Confirm"** to save the new time, or **"Cancel"** to revert.

---

## 6. List View

The **List** page shows all of your events in a clean, date-sorted list. This is useful for quickly scanning upcoming deadlines without navigating the calendar.

![List View](screenshots/16_list_view.png)

**What you see:**

- Events grouped by date (e.g., "May 15, 2026")
- Each event shows:
  - The **event title**
  - The **course name** (if assigned)
  - The **time** (or "All day")
  - A **color-coded type badge** (Assignment, Exam, Class, etc.)

Events are sorted chronologically — earliest upcoming first.

> **Tip:** Use the List view before midterms or finals to quickly see all your upcoming exams and assignments at a glance.

---

## 7. Classes — MSU Course Import

The **Classes** page lets Montclair State University students import their registered courses directly from the Banner system — no manual typing required.

![Classes Page](screenshots/17_classes_page.png)

**Steps:**

1. Navigate to **Classes** in the sidebar.
2. Click **"Browse Courses"**.
3. The **MSU Course Import** modal opens and connects to Montclair State's Banner system.

   ![MSU Import Modal](screenshots/18_msu_import_modal.png)

4. Browse or search for your courses in the course catalog.
5. Select the courses you want to import.
6. Click **"Import"** (or the equivalent confirm button).
7. Your selected courses are added to your calendar as **Class** events, automatically placed at the correct days and times.

> **Note:** This feature uses your Montclair State Banner session. If you are prompted to log in, use your NetID and password.

> **Tip:** Import your courses at the start of each semester to automatically populate your calendar with all class times.

---

## 8. To-Do

The **To-Do** page is a flexible note and task board, similar to Google Keep. You can create color-coded cards with a title and body text, pin important ones to the top, mark them complete, or delete them.

![To-Do Page](screenshots/19_todo_page.png)

---

### 8.1 Creating a To-Do Card

**Steps:**

1. Navigate to **To Do** in the sidebar.
2. Click the **"+ New To-Do"** button (or equivalent "Add" button at the top of the page).
3. A new card editor opens. Fill in:
   - **Title** — a short label for your task (e.g., "Study for Midterm")
   - **Body** — optional additional details or notes
   - **Color** — choose a card color (see below)
4. Click **"Save"** or press Enter to create the card.

![New To-Do Card](screenshots/20_todo_new_card.png)

---

### 8.2 Color-Coding Cards

Each card can have one of six color themes to help you organize visually:

| Color | Suggested Use |
|---|---|
| **Default** (cream/off-white) | General tasks |
| **Pink** | Important or urgent items |
| **Blue** | Class-related work |
| **Green** | Completed or in-progress tasks |
| **Purple** | Personal reminders |
| **Yellow** | Ideas or low-priority notes |

To change a card's color, click on the card to open its editor and select a color dot from the color picker row.

![To-Do Color Picker](screenshots/21_todo_color_picker.png)

---

### 8.3 Pinning Cards

Pin important cards so they always appear at the top of your board, regardless of when they were created.

**Steps:**

1. Click on a card to open it.
2. Click the **pin icon** (or "Pin" button) in the card editor.
3. The card moves to the top of the board and shows a **"PINNED"** label in the top-right corner.

To unpin, click the pin icon again.

![Pinned To-Do Card](screenshots/22_todo_pinned.png)

---

### 8.4 Completing and Deleting Cards

**Marking a card as complete:**

1. Click on a card to open it.
2. Click the **"Mark as Done"** (or checkmark) button.
3. The card's title appears with a strikethrough to indicate it is completed.

**Deleting a card:**

1. Hover over a card — a **delete icon (trash)** appears.
2. Click the trash icon.
3. The card is permanently removed.

> **Warning:** Deleted cards cannot be recovered.

![Completed and Delete Hover](screenshots/23_todo_complete_delete.png)

---

## 9. Settings

The **Settings** page lets you customize Xyon's appearance and configure notification preferences.

![Settings Page](screenshots/24_settings.png)

---

### 9.1 Accent Color

Xyon lets you choose an **accent color** that appears throughout the app (buttons, highlights, active sidebar items, etc.).

**Available colors:**

| Name | Preview |
|---|---|
| Rose (default) | Pink/red tones |
| Blue | Cool blue |
| Green | Sage green |
| Purple | Soft violet |
| Yellow | Warm amber |

**Steps:**

1. Navigate to **Settings**.
2. Under **Accent Color**, click one of the five color swatches.
3. The entire app immediately updates to use the selected color.

Your color preference is saved automatically and persists between sessions.

![Accent Color Picker](screenshots/25_settings_accent.png)

---

### 9.2 Dark Mode

Xyon supports a **dark mode** that switches the color scheme to a dark background with light text — easier on the eyes in low-light environments.

**Steps:**

1. Navigate to **Settings**.
2. Find the **Dark Mode** toggle.
3. Click the toggle to switch between light and dark mode.

The change applies instantly across the entire app.

![Dark Mode Toggle](screenshots/26_settings_dark_mode.png)

You can also toggle dark mode directly from the **Splash Page** (before logging in) using the moon/sun icon in the top navigation bar.

![Dark Mode — Splash Page Toggle](screenshots/27_splash_dark_mode.png)

**Dark mode example:**

![App in Dark Mode](screenshots/28_dark_mode_app.png)

---

### 9.3 Notification Reminders

Xyon can send **browser notifications** to remind you before events start.

**Steps:**

1. Navigate to **Settings**.
2. Under **Notifications**, enable the **Event Reminders** toggle.
3. If your browser asks for notification permission, click **"Allow"**.
4. Choose how far in advance you want to be reminded:
   - 5 minutes before
   - 10 minutes before
   - 15 minutes before
   - 30 minutes before
   - 1 hour before
5. Your preference is saved automatically.

![Notification Settings](screenshots/29_settings_notifications.png)

> **Note:** Notifications only appear when the Xyon browser tab is open. Keep the tab open in the background for reminders to work reliably.

> **Tip:** If you do not see the browser permission prompt, check your browser settings to ensure notifications are not blocked for this site.

---

## 10. Account Management

The **Account** page lets you view and edit your profile, change your password, or permanently delete your account.

![Account Page](screenshots/30_account_page.png)

---

### 10.1 Editing Your Profile

You can update your first and last name at any time.

**Steps:**

1. Navigate to **Account** in the sidebar.
2. Your current name and email are displayed at the top.
3. In the **Edit Profile** section, update your **First Name** and/or **Last Name**.
4. Click **"Save Changes"**.
5. Your name updates immediately, including in the top-right header of the app.

> **Note:** Your email address cannot be changed after registration.

![Edit Profile](screenshots/31_account_edit_profile.png)

---

### 10.2 Changing Your Password

**Steps:**

1. Navigate to **Account**.
2. Scroll to the **Change Password** section.
3. Enter your **Current Password** to verify your identity.
4. Enter your **New Password**.
5. Click **"Update Password"**.

If your current password is correct, the password is updated immediately and you stay logged in.

![Change Password](screenshots/32_account_change_password.png)

> **Tip:** Choose a strong password of at least 8 characters with a mix of letters, numbers, and symbols.

---

### 10.3 Deleting Your Account

> **Warning:** This action is **permanent and irreversible.** All your events, to-do cards, and account data will be deleted and cannot be recovered.

**Steps:**

1. Navigate to **Account**.
2. Scroll to the **Danger Zone** or **Delete Account** section.
3. Type the word **DELETE** (all caps) in the confirmation field.
4. Click the **"Delete Account"** button.
5. Your account, all calendar events, all to-do items, and all settings are permanently deleted.
6. You are automatically signed out and returned to the Splash page.

![Delete Account Confirmation](screenshots/33_account_delete.png)

---

## 11. Signing Out

To sign out of Xyon:

1. Click **"Sign Out"** at the bottom of the left sidebar.

   ![Sign Out Button](screenshots/34_sign_out.png)

2. You are immediately logged out and returned to the **Splash page**.
3. Your session token is cleared from the browser. Anyone who picks up your device will need your password to log back in.

> **Tip:** Always sign out when using Xyon on a shared or public computer.

---

## Appendix A — Event Types Reference

| Type | Badge Color | Description |
|---|---|---|
| **Class** | Green | Regularly scheduled course sessions |
| **Assignment** | Blue | Homework, projects, papers |
| **Exam** | Purple | Midterms, finals, quizzes |
| **Extracurricular** | Yellow | Clubs, sports, student org meetings |
| **Personal** | Pink | Personal appointments, birthdays, etc. |
| **Work** | Light Gray | Job shifts, internship hours |
| **Other** | Gray | Anything that does not fit another category |

---

## Appendix B — Keyboard & Interaction Quick Reference

| Action | How to do it |
|---|---|
| Add an event | Click any date/time slot on the Calendar |
| Edit an event | Click the event block on the Calendar |
| Delete an event | Open the event → click Delete in the edit modal |
| Reschedule an event | Drag the event to a new slot, confirm the popup |
| Navigate months (mini-calendar) | Click ‹ / › on Dashboard or Calendar |
| Switch calendar view | Click Month / Week toggle in Calendar toolbar |
| Jump to today | Click "Today" in Calendar toolbar |
| Pin a to-do | Open card → click Pin |
| Delete a to-do | Hover over card → click trash icon |
| Toggle dark mode | Settings → Dark Mode toggle, or moon icon on Splash page |
| Sign out | Sidebar → Sign Out |

---

## Appendix C — Troubleshooting

| Problem | Solution |
|---|---|
| Events disappear after refreshing | Make sure the backend server is running at `localhost:3001` |
| Can't import MSU courses | The Banner scraper requires network access to Montclair State's servers. Try again on the campus network or VPN. |
| Notifications not appearing | Grant notification permission in browser settings. Keep the Xyon tab open in the background. |
| Forgot password email not received | Check spam/junk folder. The code expires in 15 minutes — request a new one if needed. |
| "Session expired" message | Your JWT token has expired (3-hour limit). Log in again. |
| Drag & drop not working | Try clicking the event first, then dragging. Ensure JavaScript is enabled in your browser. |

---

*Xyon — Built for Montclair State Students*
