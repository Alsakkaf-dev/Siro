# GreenStep — Presentation Slides Outline
# Group RM2Z | PR4 | July 2, 2026

> Max 20 slides. Follow this exactly. Use Google Slides or PowerPoint.
> Green color theme to match the GreenStep brand.

---

## SLIDE 1 — Title Slide
**Content:**
- Title: GreenStep 🌱
- Subtitle: Personal Carbon Footprint & Eco Lifestyle Tracker
- Course: SCSM2223 — Cross-Platform Application Development
- Group: RM2Z | Section 02 | 2025/2026 Semester II
- Date: 2 July 2026

---

## SLIDE 2 — Team Profile and Roles
**Content (put a photo and name for each member):**

| Name | Role | What they built |
|------|------|-----------------|
| Zineb Ennabili | DevOps, Mobile & Integration Lead | Deployment, bug fixes, Android APK, integration testing |
| Zeng Liting (Kay) | Frontend Lead | Vue 3 pages, routing, state management, responsive UI |
| Rawan MohamedSalih | Database & Security Lead | ER diagram, MySQL schema, PDO layer, JWT, input validation |
| Mohammed Alsakkaf | Backend & API Lead | PHP Slim 4 API, all controllers, JWT middleware, badge evaluator, challenge progress engine |

**Also add:**
- Screenshot of GitHub commit graph showing each member's contributions
- Note: Mohammed = 29 commits (all Backend/), Zineb = 21, Kay = 9, Rawan = 3

---

## SLIDE 3 — Problem Statement
**Content:**
- Title: The Problem

**Two problems with existing carbon apps:**
1. Too simple → just "green tips", no real tracking, no personalization
2. Too complicated → ask for full utility bills, life-cycle assessments → users give up

**The Gap:**
No app that combines easy daily logging with real scientific CO2 calculations.

**Quote to add:**
> "Individuals lack immediate, quantifiable feedback on the carbon implications of their daily actions."

---

## SLIDE 4 — Our Solution: GreenStep
**Content:**
- Title: GreenStep — Small daily steps. Measurable climate impact.

**Features list:**
- ✅ Log daily activities in under 60 seconds (transport, meals, electricity, recycling)
- ✅ Real-time CO2 calculation using DEFRA UK & IPCC AR6 emission factors
- ✅ Personal dashboard with weekly trend charts
- ✅ Gamification: streaks, badges, daily eco tips
- ✅ Community challenges with collective CO2 tracking
- ✅ 3 roles: User, Community Leader, Administrator

**Add a screenshot of the app dashboard here**

---

## SLIDE 5 — Target Users
**Content:**
- Title: Who Uses GreenStep?

**3 User Personas:**

1. **Environmentally Curious Individual** (main user)
   - Logs daily activities, views dashboard, earns badges, joins challenges

2. **Community Leader**
   - Creates and manages group challenges, tracks collective progress
   - Has all user permissions + challenge management

3. **Platform Administrator**
   - Manages eco tip library and emission factors
   - Ensures data credibility and platform integrity

**Add a simple diagram showing the 3 roles**

---

## SLIDE 6 — Technology Stack
**Content:**
- Title: Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Vue 3 + Vite + Pinia + Vue Router | Responsive SPA, state management |
| Backend | PHP 8.1 + Slim 4 Framework | RESTful API, business logic |
| Database | MySQL + PDO | Persistent relational storage |
| Auth | JWT (JSON Web Tokens) + Bcrypt | Secure authentication |
| Mobile | Capacitor | Android APK wrapper |
| Deployment | Render (API) + Netlify (Frontend) + Cloud SQL (DB) | Public hosting |

---

## SLIDE 7 — DevOps: Version Control & Collaboration
**Content:**
- Title: DevOps — Version Control

**GitHub:**
- Repository: github.com/ennabilizineb/GreenStep
- Branch strategy: all work pushed to `main`, final deliverable in `PR3` branch
- Each member contributed via direct commits with clear commit messages

**Add screenshot of:**
- GitHub commit history page (showing all members' names)
- The commit graph / contributors section

**Commit summary:**
- Mohammed: 29 commits (Backend/)
- Zineb: 21 commits (bug fixes, styling)
- Kay: 9 commits (Frontend/)
- Rawan: 3 commits (database schema & seed)

---

## SLIDE 8 — DevOps: Deployment
**Content:**
- Title: DevOps — CI/CD & Deployment

**Frontend:** Deployed on Netlify / Vercel
- Automatic rebuild on push to main branch
- Public URL: [Zineb will provide this]

**Backend API:** Deployed on Render
- PHP Slim 4 server running on cloud
- Environment variables (.env) configured securely in Render dashboard

**Database:** Google Cloud SQL / PlanetScale
- MySQL hosted on cloud
- Connected to backend via PDO

**Mobile:** Capacitor Android APK
- Vue 3 web app wrapped as native Android app
- Tested on Android emulator

**Tools used:** Laragon (local dev), Composer (PHP dependencies), npm (JS dependencies), Postman (API testing)

---

## SLIDE 9 — System Architecture Diagram
**Content:**
- Title: System Architecture

**Draw this diagram:**
```
[User Browser / Android App]
         ↓  HTTP/HTTPS
[Vue 3 Frontend — Netlify]
         ↓  REST API calls (JSON) + JWT token in header
[PHP Slim 4 API — Render]
         ↓  PDO + Prepared Statements
[MySQL Database — Cloud SQL]
```

**Label each layer with the technology name.**
**Add arrows showing the direction of communication.**

---

## SLIDE 10 — Sequence Diagram: Log an Activity
**Content:**
- Title: Sequence Diagram — Log Daily Activity

**Draw UML sequence diagram with these participants:**
User → Vue Frontend → PHP API → MySQL Database

**Steps:**
1. User fills the Daily Log form (transport, meals, electricity, recycling)
2. Vue Frontend sends POST /api/logs with JWT token in Authorization header
3. JwtAuthMiddleware verifies the token → extracts user_id
4. LogController validates input (activity_type_id, amount, logged_on)
5. LogController queries Activity_Type table to confirm the activity exists
6. LogController inserts new row into Activity_Log table
7. MySQL returns success (new log ID)
8. API returns 201 Created + { activity_log_id }
9. Vue Frontend shows "Activity log saved successfully."
10. Vue Router redirects user to Dashboard

---

## SLIDE 11 — Activity Diagram: User Login Flow
**Content:**
- Title: Activity Diagram — User Authentication Flow

**Draw activity diagram:**
- Start → User opens app
- Decision: Is JWT token in localStorage?
  - YES → Verify token not expired → Load Dashboard
  - NO → Show Login page
- User enters email + password → Click Login
- Decision: Are credentials correct?
  - NO → Show "Invalid credentials" error → Stay on Login
  - YES → Backend issues JWT token → Store in localStorage → Redirect to Dashboard
- End

---

## SLIDE 12 — Deployment Diagram
**Content:**
- Title: Deployment Diagram

**Draw boxes showing:**
- **Client Device** (user's browser or Android phone)
  - Runs: Vue 3 SPA / Android APK (Capacitor)
  - Protocol: HTTPS
- **Frontend Server** (Netlify / Vercel)
  - Hosts: compiled Vue 3 static files
- **API Server** (Render)
  - Runs: PHP 8.1 + Slim 4
  - Port: 8080
  - Protocol: REST/JSON over HTTPS
- **Database Server** (Google Cloud SQL)
  - Runs: MySQL 8
  - Connection: PDO over TCP

**Draw arrows between each box with protocol labels (HTTPS, PDO/TCP)**

---

## SLIDE 13 — Database: ER Diagram
**Content:**
- Title: Database Design — Entity Relationship Diagram

**Show the 10 tables and their connections:**

Tables:
- Role (role_id, name)
- User (user_id, role_id FK, name, email, password_hash)
- Category (category_id, name)
- Activity_Type (activity_type_id, category_id FK, name, unit, kg_co2_per_unit)
- Activity_Log (activity_log_id, user_id FK, activity_type_id FK, amount, logged_on)
- Badge (badge_id, name, criteria_json)
- User_Badge (user_id FK, badge_id FK, awarded_on)
- Challenge (challenge_id, name, start_date, end_date, target_co2_reduction)
- Challenge_Member (challenge_id FK, user_id FK)
- Tip (tip_id, category_id FK, added_by FK, title, body)

**Draw lines between related tables.**

---

## SLIDE 14 — Database: Security & Validation
**Content:**
- Title: Database Security & Data Integrity

**Security measures:**

| Threat | Our Defense |
|--------|------------|
| SQL Injection | PDO with parameterized queries — user input never concatenated into SQL |
| Password theft | Bcrypt hashing — passwords stored as irreversible hash |
| Unauthorized access | JWT tokens on all protected routes — invalid/expired tokens rejected with 401 |
| Wrong role access | Role claim inside JWT checked by middleware — users cannot reach admin endpoints |
| Duplicate joins | Primary key (challenge_id, user_id) prevents joining same challenge twice |
| Orphaned records | Foreign key constraints with ON DELETE CASCADE |

**Add a small code snippet showing PDO prepared statement:**
```php
$stmt = $this->db->prepare(
    'SELECT * FROM User WHERE email = :email'
);
$stmt->execute([':email' => $email]);
```

---

## SLIDE 15 — CO2 Calculation Engine
**Content:**
- Title: How CO2 is Calculated

**Simple explanation:**
```
CO2 (kg) = amount × kg_co2_per_unit
```

**Example table:**

| Activity | Amount Logged | Emission Factor | CO2 Produced |
|----------|--------------|-----------------|--------------|
| Car | 10 km | 0.17 kg CO2/km | 1.70 kg |
| Public Transport | 15 km | 0.089 kg CO2/km | 1.34 kg |
| Red Meat meal | 1 meal | 2.5 kg CO2/meal | 2.50 kg |
| Recycling | 5 items | -0.1 kg CO2/item | -0.50 kg |

**Source:** DEFRA UK Greenhouse Gas Conversion Factors + IPCC AR6 Report

**Key point:** Emission factors are stored in the database, not hardcoded. Admin can update them at any time via the API.

---

## SLIDE 16 — Live Demo: Login & Dashboard
**Content:**
- Title: Live Demo — Step 1: Login & Dashboard

**Screenshot of Login page**
**Screenshot of Dashboard after login**

**Talk points:**
- User logs in with email + password
- Backend verifies credentials, issues JWT token
- Frontend stores token in localStorage
- Dashboard calls GET /api/dashboard → backend calculates all stats
- Shows: today's CO2, 7-day chart, streak count, category breakdown

---

## SLIDE 17 — Live Demo: Log Activity & See Update
**Content:**
- Title: Live Demo — Step 2: Log Activity

**Screenshot of Daily Log form (filled in)**
**Screenshot of Dashboard AFTER logging (CO2 number increased)**

**Talk points:**
- User selects activity type from dropdown (populated by GET /api/activity-types)
- Fills in distance/amount
- Clicks "Calculate & Save"
- Backend stores log → dashboard re-fetches → CO2 number updates

---

## SLIDE 18 — Live Demo: Challenges & Badges
**Content:**
- Title: Live Demo — Step 3: Challenges & Badges

**Screenshot of Challenges page** (show a challenge with progress bar, participants, days left)
**Screenshot of Badges page** (show some earned 🏅 and some locked 🔒)

**Talk points:**
- Challenges track collective CO2 savings across all members who joined
- Badges are awarded automatically by BadgeEvaluator every time dashboard loads
- Example: "Green Streak" badge = 7 consecutive days of logging

---

## SLIDE 19 — Entrepreneurial Pitch
**Content:**
- Title: GreenStep — Business Potential

**Revenue Model 1: B2B Corporate SaaS**
- Companies need to meet ESG (Environmental, Social, Governance) goals
- Offer paid subscription for companies to run private sustainability challenges for employees
- Corporate dashboard with anonymized analytics for sustainability reporting

**Revenue Model 2: Affiliate Brand Partnerships**
- Keep consumer version free
- Users earn points for eco-achievements
- Points redeemable for discount codes from eco-friendly brand partners
- Revenue from partnership placement fees

**Trust factor:**
- Emission factors from DEFRA UK & IPCC AR6 (not made up)
- Admin can update factors live in the database as energy grids improve

---

## SLIDE 20 — Conclusion & Thank You
**Content:**
- Title: Conclusion

**What we built:**
- ✅ Full-stack cross-platform app: Vue 3 + PHP Slim 4 + MySQL + JWT
- ✅ 18 REST API endpoints with role-based access control
- ✅ Gamification engine: streaks, badges, community challenges
- ✅ Real CO2 calculations using scientific emission factors
- ✅ Deployed at public URL + Android APK

**What we learned:**
- Cross-platform development (web + mobile from one codebase)
- RESTful API design and security (JWT, Bcrypt, PDO)
- Team collaboration with Git and GitHub

**Thank you!**
Group RM2Z — SCSM2223 | 2025/2026 Semester II

---

## NOTES FOR MOHAMMED (What to say during presentation)

**Your turn is Slide 9–15 (Architecture + Backend + Database + CO2 calculation)**

Say this:
> "Hi, I'm Mohammed, the Backend and API Lead. I built the entire server-side of GreenStep using PHP Slim 4. This includes all 18 API endpoints, the JWT authentication middleware, the CO2 calculation logic, the automatic badge evaluation system, and the challenge progress tracking engine."

Then explain the architecture diagram on Slide 9.
Then explain how CO2 is calculated on Slide 15.

**Be ready to answer:**
- How does JWT work? → "It's a signed token issued on login. Every request includes it in the Authorization header. The middleware verifies the signature before letting the request through."
- How is SQL injection prevented? → "PDO with parameterized queries. We never concatenate user input into SQL strings."
- How do badges work? → "The BadgeEvaluator class runs automatically every time the dashboard loads. It checks criteria like streak count and total logs, and inserts into User_Badge if the user qualifies."
