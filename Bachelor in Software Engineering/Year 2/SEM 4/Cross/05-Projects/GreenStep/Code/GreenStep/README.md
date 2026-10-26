# 🌱 GreenStep 
**Personal Carbon Footprint & Eco Lifestyle Tracker**

---

## 📑 Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Core Features](#2-core-features)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture & Structure](#4-system-architecture--structure)
5. [Database & Gamification Engine](#5-database--gamification-engine)
6. [Security & Threat Mitigation](#6-security--threat-mitigation)
7. [Role-Based Access Control (RBAC)](#7-role-based-access-control-rbac)
8. [Team Contributions](#8-team-contributions)

---

## 1. Executive Summary
GreenStep is a decoupled, full-stack web application designed to help users track, analyze, and minimize their personal carbon footprints. The platform combines daily activity logging with interactive community challenges, automated eco-tips, and a dynamic gamification engine that rewards sustainable habits. 

This repository serves as the final consolidated submission, containing both the **Vue 3 Frontend Client** and the **PHP Slim 4 Backend API**.

---

## 2. Core Features
* **Real-Time Carbon Tracking:** Users can log daily activities (e.g., transportation, meals, energy usage) and see their carbon footprint calculated instantly based on dynamic emission factors.
* **Community Challenges:** Users can join global eco-challenges with collective baseline-vs-during progress tracking.
* **Gamification & Badges:** An automated streak and badge evaluation engine that rewards users for consistent eco-friendly behavior.
* **Interactive Dashboard:** Visual representation of user statistics, emission trends, and earned achievements.
* **Administrative Control:** System admins can curate a daily eco-tip library and update global CO2 emission factors without touching the codebase.

---

## 3. Technology Stack
**Frontend (Client)**
* **Framework:** Vue 3 (Composition API)
* **Build Tool:** Vite
* **Routing & State:** Vue Router, Pinia/Vuex
* **Language:** JavaScript (ES6+)

**Backend (REST API)**
* **Framework:** Slim 4 (PHP Micro-framework)
* **Language:** PHP 8.1+
* **Authentication:** JSON Web Tokens (JWT - `firebase/php-jwt`)
* **Architecture:** MVC Pattern (Controllers, Middleware, Support Services)

**Database**
* **Engine:** MySQL 8.0 (Relational Database)
* **Interface:** PHP Data Objects (PDO) natively parameterized.

---

## 4. System Architecture & Structure

GreenStep is built as a modern, decoupled full-stack application following an **MVC-inspired architectural pattern**. The design enforces a strict separation of concerns, where the Vue 3 Frontend acts entirely as a presentation and client-side state layer, and the PHP Slim 4 Backend serves purely as a headless, stateless RESTful API wrapper.

### 🗄️ Full Project Directory Blueprint

The repository is structured to cleanly isolate the backend routing, middleware, and database layers from the frontend reactive SPA components:

```text
GreenStep-Repository/
│
├── Backend/                            # PHP Slim 4 RESTful API Core
│   ├── config/
│   │   └── settings.php                # Environment config (DB credentials, JWT keys)
│   ├── public/
│   │   └── index.php                   # Front Controller (Single entry point for all API traffic)
│   ├── sql/
│   │   ├── schema.sql                  # Blueprints for tables, constraints, and data integrity
│   │   └── seed.sql                    # Bootstrapping script (Emission factors, badges, test accounts)
│   ├── src/
│   │   ├── Controllers/                # Handles HTTP requests & maps responses
│   │   │   ├── AdminController.php     # Administrative controls (factors, tips)
│   │   │   ├── AuthController.php      # User registration & cryptographic login
│   │   │   ├── BadgeController.php     # Serves the badge catalog
│   │   │   ├── ChallengeController.php # Handles joining and progress tracking for challenges
│   │   │   ├── LogController.php       # CRUD operations for daily carbon logs
│   │   │   └── TipController.php       # Delivers rotating daily eco-tips
│   │   ├── Database/
│   │   │   └── Database.php            # Hardened PDO Connection Factory (Disables emulated prepares)
│   │   ├── Middleware/                 # Intercepts incoming requests before reaching routes
│   │   │   ├── CorsMiddleware.php      # Manages cross-origin resource sharing headers
│   │   │   └── JwtAuthMiddleware.php   # Validates cryptographic signatures & gates role permissions
│   │   ├── Routes/
│   │   │   └── Api.php                 # The programming contract (Explicit API route maps)
│   │   └── Support/                    # Shared utility engines & operational handlers
│   │       ├── BadgeEvaluator.php      # Algorithmic engine evaluating user streaks & awarding badges
│   │       ├── ChallengeProgress.php   # Mathematical engine calculating group baseline vs goals
│   │       ├── JsonErrorHandler.php    # Catches app failures and returns clean JSON instead of raw HTML
│   │       └── JsonResponse.php        # Enforces unified API response envelopes
│   ├── .env.example                    # Blueprint for environment-specific secrets
│   ├── .gitignore                      # Prevents vendor dependencies and .env keys from pushing to GitHub
│   └── composer.json                   # Manages backend dependencies (Slim, Firebase JWT)
│
├── Frontend/                           # Vue 3 Reactive Single Page Application (SPA)
│    ├── public/
│    │   └── favicon.ico                 # Browser icon asset
│    ├── src/
│    │   ├── assets/                     # Static design files (Global Tailwind/CSS, images, icons)
│    │   ├── components/                 # Atomized, reusable UI elements (Buttons, Modals, Stat Cards)
│    │   ├── router/
│    │   │   └── index.js                # Vue Router setup containing Navigation Guards (client-side RBAC)
│    │   ├── stores/
│    │   │   └── auth.js                 # Pinia/Vuex global state for persistent user session & token retention
│    │   ├── views/                      # Full layout dashboard pages mapped directly to route paths
│    │   │   ├── AdminDashboard.vue      # Specialized view for administrative overrides
│    │   │   ├── ChallengesView.vue      # Interface for checking and joining group challenges
│    │   │   ├── DailyLogView.vue
# Records daily activities for carbon footprint calculation
│    │   │   ├── DashboardView.vue       # Primary workspace tracking metrics and carbon summaries
│    │   │   ├── LoginView.vue           # Authentication gateway interface
│    │   │   └── RegisterView.vue        # New user sign-up panel
│    │   ├── App.vue                     # Main layout frame housing the active `<router-view>`
│    │   └── main.js                     # Application bootstrap point initializing Pinia, Router, and Vue
│    ├── package.json                    # Node dependencies list (Vue, Vite, Pinia, Axios)
│    └── vite.config.js                  # Vite engine bundler rules & build options
│
├── README.md
│
│
└── SECURITY.md
```

---

## 5. Database & Gamification Engine

The data layer is fully normalized to preserve relational integrity across users, core activities, and challenges. 

### Master vs. Transactional Data Split
* **Master Lookup Tables:** Tables like `Badge`, `Challenge`, and `Emission_Factors` are populated immediately upon deployment via `seed.sql`.
* **Transactional Tables:** Tables tracking user state (`activity_log`, `challenge_member`, `user_badge`) remain unseeded and clean by design, awaiting real-time population by live users.

### Dynamic Achievement Logic (Hybrid JSON Strategy)
To avoid database bloat and rigid schema migrations when adding new features, the `Badge` table leverages a **hybrid SQL-and-JSON approach**. 
Badge award thresholds (e.g., maintaining a 7-day streak) are stored directly inside a **`criteria_json`** column. The Slim backend dynamically decodes these rules during user logging, granting the development team massive flexibility to create new gamification rules without altering physical database tables.

---

## 6. Security & Threat Mitigation

The platform implements a robust defense-in-depth model:
* **SQL Injection (SQLi) Prevention:** Direct SQL concatenation is strictly forbidden. The database connection factory explicitly **disables emulated prepared statements** in PDO. All transactional queries compile natively on the MySQL server, isolating user inputs strictly as data parameters.
* **Stateless Authentication:** Session hijacking is prevented by using stateless JSON Web Tokens (JWT) signed via the `HS256` algorithm. 
* **Cryptographic Credential Hashing:** Passwords never enter the database in plaintext. Client credentials undergo forward-compatible hashing via PHP’s native Bcrypt implementation (`password_hash()`) and are validated using time-safe `password_verify()` utilities to prevent timing attacks.
* **Exception Shielding:** A custom `JsonErrorHandler` ensures that stack traces or HTML errors are never leaked to the client in production, returning secure JSON error envelopes instead.

---

## 7. Role-Based Access Control (RBAC)

Access levels are managed at the routing layer via a custom `JwtAuthMiddleware` firewall:

| Role Level | Access Permissions |
| :--------- | :----------------- |
| **Public** | Login (`/api/auth/login`) & Registration (`/api/auth/register`). |
| **Standard User** | Can log activities, view dashboards, fetch daily tips, and join community challenges. |
| **Community Leader** | Inherits User permissions + Create, Update, or Delete community challenges. |
| **System Admin** | Inherits all permissions + Manage global Eco-Tip library and alter systemic Emission Factors. |

---

## 8. Team Contributions

- **Mohammed Alsakkaf:** (Backend Lead) Backend Infrastructure, Core REST API Framework & Active Controller Development.
- **Ennabili Zineb:** (Database & Security Lead) Database Normalization, Automated Deployment/Seed Scripting, PDO Connection Hardening, and Security Architecture.
- **Rawan MohameSalih:** (Security & Database Lead) Authoritative Database Schema Engineering and Final Layout Inspections.
- **Zengliting:** (Frontend Lead) User Interface Design, Vue 3 Architecture, State Retention, and API Consumer Integration.
