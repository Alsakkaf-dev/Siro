# Online Food Delivery System — Group Hub (Group 11)

Implementation of the Master SDD (Assignment 3). A distributed food-delivery
platform: browse restaurants, build a cart, place & pay for orders, and track
delivery in real time. Built module-by-module against the SDD's classes,
decision tables, and the 9 GoF design patterns.

| Module | Scope | Patterns |
|---|---|---|
| **M1** | User Auth & Restaurant Browsing | Singleton, Proxy, Strategy |
| M2 | Shopping Cart & Order Placement | Builder, Facade, State |
| M3 | Payment Processing & Delivery Tracking | Factory Method, Adapter, Observer |

## Stack
Java 21 · Spring Boot 3 · Spring Data JPA · Spring Security + JWT · Spring WebSocket (STOMP)
· PostgreSQL (local dev falls back to in-memory H2). Frontend: React 18 + Vite + TS + Tailwind.

## Prerequisites
- JDK 21+. The Maven wrapper `./mvnw` is included — no Maven install needed.
- For the Postgres profile: Docker Desktop (or a managed Postgres).

## Run locally

### Option A — no Docker (in-memory H2)
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local      # Windows: mvnw.cmd
```

### Option B — PostgreSQL (docker-compose)
```bash
docker compose up -d          # Postgres on localhost:5432
cd backend
./mvnw spring-boot:run
```
On boot, `schema.sql` creates the tables and `data.sql` seeds accounts + demo content.
API base: `http://localhost:8080`.

## Environment variables
| Var | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/ofd` | JDBC URL (Postgres profile) |
| `DB_USER` / `DB_PASSWORD` | `ofd` / `ofd` | DB credentials |
| `JWT_SECRET` | dev fallback | HMAC secret for JWT signing (set a real one in prod) |
| `PORT` | `8080` | HTTP port |

## Seeded test accounts (SDD Appendix C)
| Role | Email | Password |
|---|---|---|
| Customer | `customer@foodhub.test` | `Customer@123` |
| Admin | `admin@foodhub.test` | `Admin@123` |
| Driver | `driver@foodhub.test` | `Driver@123` |

## Module 1 endpoints
```bash
# Register (DT-M1-2)
curl -X POST localhost:8080/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@foodhub.test","password":"Secret@123","phone":"0100000000"}'

# Login (DT-M1-1)
curl -X POST localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"customer@foodhub.test","password":"Customer@123"}'

# Browse + search (DT-M1-3) — rating is a minimum filter, all params optional
curl "localhost:8080/api/restaurants?loc=Kuala%20Lumpur&cuisine=Malay&rating=4"

# Menu for a restaurant
curl localhost:8080/api/restaurants/1/menu
```

## Module 2 & 3 endpoints
`$TOKEN` is the JWT from the login call above (sent as `Authorization: Bearer $TOKEN`).
```bash
# Add to cart (DT-M2-1) — quantity validated 1..20
curl -X POST localhost:8080/api/cart/items -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"menuItemId":1,"quantity":2}'

# Place order / checkout (DT-M2-2) — empty-cart & missing-address are rejected
curl -X POST localhost:8080/api/checkout -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"address":"12 Jalan Ampang, KL"}'

# Pay (DT-M3-1) — token drives the demo: any token approves; tok_declined / tok_timeout
curl -X POST localhost:8080/api/payments -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"orderId":1,"token":"tok_ok","amount":42.50}'

# Track delivery (DT-M3-2) — live GPS also streams over WS to /topic/order/{id}
curl localhost:8080/api/deliveries/1
```

## Status
- ✅ **M1 — Auth & Browsing** — Singleton + Strategy + JWT (lock-after-5, duplicate-email);
  Proxy 60s cache with closed-restaurant + no-results handling (DT-M1-1..3).
- ✅ **M2 — Cart & Order** — Builder + Facade + State; quantity 1..20 guard, empty-cart /
  missing-address / out-of-stock checks, and the order-lifecycle state machine (DT-M2-1, DT-M2-2).
- ✅ **M3 — Payment & Delivery** — Factory Method + Adapter + Observer; five payment outcomes
  (approved / declined / invalid / timeout / not-payable) and live GPS pushed every 10s over
  WebSocket, with the order advancing CONFIRMED → OUT_FOR_DELIVERY → DELIVERED (DT-M3-1, DT-M3-2).
- ✅ **Frontend** — React 18 + Vite + TS + Tailwind: full Login → Browse → Menu → Cart →
  Checkout → Payment → live Tracking journey, plus admin & driver consoles.
- ⏳ Deployment (live URL) — pending.
