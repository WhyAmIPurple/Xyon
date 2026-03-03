CREATE DATABASE CalanderDatabase;

CREATE TABLE users (
    userID SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,

)

CREATE TABLE calendars (
    calendarID SERIAL PRIMARY KEY,
    userID INTEGER REFERENCES users(userID),
    name TEXT NOT NULL,
    whenMade TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE calendarEvents (
    eventID SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,

) 