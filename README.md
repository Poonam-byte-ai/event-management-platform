# Event Management Platform

A full-stack web application designed to simplify event planning and participant management. The platform allows organizers to manage events, speakers, and sessions while enabling participants to register for events, track attendance, and share feedback.

## Features

- **Role-Based Access:** Separate functionality for organizers and participants.
- **Event Management:** Create and manage events, venues, schedules, capacity, and registrations.
- **Speaker Management:** Add speakers and organize their sessions.
- **Participant Registration:** Register for events with duplicate-registration prevention.
- **QR-Based Attendance:** Support event check-in using dynamically generated QR codes.
- **Feedback System:** Collect feedback from participants after verified attendance.
- **Interest-Based Recommendations:** Recommend events based on participants' interests.
- **Session Scheduling:** Prevent overlapping sessions within an event.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Authentication:** JSON Web Tokens (JWT), bcrypt
- **Testing:** Postman
- **Version Control:** Git and GitHub

## Project Structure

- `frontend/` — User interface and client-side functionality
- `backend/` — REST APIs, authentication, and application logic

## Getting Started

1. Clone the repository.
2. Install the backend dependencies using `npm install` inside the `backend` directory.
3. Configure the database connection and environment variables in a `.env` file.
4. Import the database schema into MySQL.
5. Start the backend server using `node server.js`.
6. Open the frontend using a local development server and configure it to connect to the backend API.

## Purpose

This project demonstrates practical full-stack development skills, REST API integration, database management, authentication, and event workflow automation.

## Author

**Poonam Suryawanshi**
