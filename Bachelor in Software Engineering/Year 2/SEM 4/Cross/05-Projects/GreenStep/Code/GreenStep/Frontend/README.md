# GreenStep Frontend

## Overview

This folder contains the frontend application for **GreenStep — Personal Carbon Footprint & Eco-Lifestyle Tracker**.

GreenStep is a cross-platform sustainability application designed to help users monitor and reduce their daily carbon footprint through activity tracking, eco challenges, statistics, streak systems, and environmental awareness features.

The frontend application is developed using **Vue 3** with **Vite**, following a mobile-first responsive design approach to ensure compatibility across smartphones, tablets, and desktop devices.

---

# Frontend Tech Stack

The frontend application utilizes the following technologies:

* Vue 3
* Vite
* Vue Router
* Pinia
* JavaScript
* CSS
* ESLint
* Prettier

Current integrations:

- Fetch API for backend communication
- JWT authentication with Local Storage

Planned integrations:

- Chart.js for dashboard analytics
- Capacitor for Android mobile application wrapping

---

# Project Structure

```text
Frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── router/
│   ├──services/
│   ├── stores/
│   ├── views/
│   │   ├── AdminDashboardView.vue      # Administrative dashboard
│   │   ├── BadgeView.vue               # Displays user achievements and badges
│   │   ├── ChallengeView.vue           # Browse and join sustainability challenges
│   │   ├── DailyLogView.vue            # Records daily activities for carbon footprint calculation
│   │   ├── DashboardView.vue           # Displays user carbon statistics and summaries
│   │   ├── LoginView.vue               # User authentication page
│   │   └── RegisterView.vue            # New user registration page
│   ├── App.vue
│   └── main.js
├── package.json
├── vite.config.js
└── README.md
```

---

# Project Setup

## 1. Install Dependencies

```bash
cd Frontend
npm install
```

## 2. Format Project

```bash
npm run format
```

## 3. Run Development Server

```bash
npm run dev
```

The frontend development server will run at:

```text
http://localhost:5173
```

Before testing API-related features, ensure the backend server is running.

---
# Login Credentials Seed (To test the functionality!)

## 1. In your Laragon Terminal:

```bash
php -r "echo password_hash('password', PASSWORD_DEFAULT);"
```
## 2.  Go to HeidiSQL and run all SQL schemas located in:

```text
./Backend/sql/
```

Then insert a test user into the database using the generated password hash.
