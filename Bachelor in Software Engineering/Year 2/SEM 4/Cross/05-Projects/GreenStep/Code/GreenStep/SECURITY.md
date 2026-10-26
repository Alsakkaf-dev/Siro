# GreenStep Security Architecture & Threat Model

---

## Overview

This document outlines the security mechanisms, cryptographic standards, and access control policies implemented in the GreenStep API. It is maintained by the Database & Security Lead.

---

## Authentication & Cryptography

The API is entirely stateless and strictly enforces the following cryptographic standards:

* **Password Hashing:** Passwords are never stored in plaintext. We utilize PHP's native `password_hash()` utilizing the `PASSWORD_DEFAULT` algorithm (currently Bcrypt). Passwords are verified via time-safe `password_verify()` checks to prevent timing attacks.
* **Tokenization (JWT):** Upon successful authentication, the server issues a JSON Web Token (JWT) signed with the `HS256` (HMAC-SHA256) algorithm. 
* **Token Payload:** The JWT strictly contains the Issuer (`iss`), Issued At (`iat`), Expiration (`exp`), User ID (`sub`), and User Role (`role`). No sensitive PII is exposed in the token payload.

---

## Threat Mitigation Strategies

The backend application is fortified against common attack vectors using the following methods:

* **SQL Injection (SQLi):** The database connection strictly enforces emulated prepares to be `false` via the PDO configuration. Every single database transaction utilizes parameterized statements. User input is never concatenated directly into SQL strings.
* **User Enumeration:** Failed login attempts return a generic `401 Unauthorized` error. The system does not reveal whether the email exists or if the password was the incorrect factor.
* **Cross-Origin Resource Sharing (CORS):** A strict CORS middleware answers preflight requests and enforces allowed origins and headers, allowing our decoupled Vue 3 frontend to securely consume the API.

---

## Role-Based Access Control (RBAC)

The API uses a layered Middleware architecture (`JwtAuthMiddleware`) to enforce strict authorization constraints based on the `role` claim in the JWT.

* **Public:** Unauthenticated users can access `/health`, register new accounts, and login.
* **User:** Standard JWTs can manage their own Activity Logs, view gamification data, and join existing challenges.
* **Leader:** Elevated JWTs possess all User privileges, plus the ability to Create, Update, and Delete Community Challenges.
* **Admin:** Maximum JWTs possess all privileges, plus managing the shared Eco-Tip library and altering foundational Emission Factors.

---

## Reporting a Vulnerability

If you discover a security vulnerability within GreenStep, please open a secure issue or contact the Database & Security Lead directly. Please do not disclose vulnerabilities publicly until a patch has been released.