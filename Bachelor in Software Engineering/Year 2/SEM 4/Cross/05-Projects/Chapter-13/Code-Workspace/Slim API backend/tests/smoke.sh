#!/usr/bin/env bash
# ============================================================================
#  End-to-end smoke test for the Books API.
#  Exercises every endpoint + the auth/ownership rules from the lab manual.
#
#  Usage:
#     bash tests/smoke.sh                       # tests http://localhost:8000
#     bash tests/smoke.sh https://your-api-url  # tests a deployed API
#
#  Requires: curl + bash (Git Bash on Windows works fine).
# ============================================================================
set -u
BASE="${1:-http://localhost:8000}"
PASS=0; FAIL=0
say() { printf '%s\n' "$*"; }
ok()  { PASS=$((PASS+1)); say "  PASS  $1"; }
no()  { FAIL=$((FAIL+1)); say "  FAIL  $1   (got: $2)"; }

# helper: status-only request
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
# helper: pull "access_token" out of a JSON body
token_of() { grep -o '"access_token":"[^"]*"' | sed 's/.*:"//; s/"$//'; }
# helper: pull numeric "id" out of a JSON body (first match)
id_of() { grep -o '"id":[0-9]*' | head -1 | sed 's/.*://'; }

say "== Books API smoke test =="
say "Target: $BASE"
say ""

# 1. Health / root
c=$(code "$BASE/"); [ "$c" = 200 ] && ok "GET /  -> 200 health" || no "GET / health" "$c"
c=$(code "$BASE/api/health"); [ "$c" = 200 ] && ok "GET /api/health -> 200" || no "GET /api/health" "$c"

# 2. Public list + search
c=$(code "$BASE/api/books"); [ "$c" = 200 ] && ok "GET /api/books (public) -> 200" || no "GET /api/books" "$c"
n=$(curl -s "$BASE/api/books?q=clean" | grep -o '"id":[0-9]*' | wc -l | tr -d ' ')
[ "$n" -ge 2 ] && ok "GET /api/books?q=clean -> $n rows (>=2)" || no "search clean" "$n rows"

# 3. Negative: protected route without a token
c=$(code "$BASE/auth/me"); [ "$c" = 401 ] && ok "GET /auth/me (no token) -> 401" || no "me without token" "$c"

# 4. Negative: bad credentials
c=$(code -X POST -H 'Content-Type: application/json' \
      -d '{"email":"member@books.test","password":"wrong"}' "$BASE/auth/login")
[ "$c" = 401 ] && ok "POST /auth/login (bad password) -> 401" || no "bad login" "$c"

# 5. Login as member
MEMBER_TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' \
      -d '{"email":"member@books.test","password":"password"}' "$BASE/auth/login" | token_of)
[ -n "$MEMBER_TOKEN" ] && ok "POST /auth/login (member) -> token" || no "member login token" "empty"

# 6. /auth/me with token
c=$(code -H "Authorization: Bearer $MEMBER_TOKEN" "$BASE/auth/me")
[ "$c" = 200 ] && ok "GET /auth/me (member) -> 200" || no "me with token" "$c"

# 7. Create a book as member (-> 201) and capture id
CREATED=$(curl -s -X POST -H "Authorization: Bearer $MEMBER_TOKEN" -H 'Content-Type: application/json' \
      -d '{"title":"Smoke Test Book","author":"CI","year":2024,"genre":"Testing"}' "$BASE/api/books")
NEW_ID=$(printf '%s' "$CREATED" | id_of)
[ -n "$NEW_ID" ] && ok "POST /api/books (member) -> created id=$NEW_ID" || no "create book" "$CREATED"

# 8. Member edits OWN book (-> 200)
c=$(code -X PUT -H "Authorization: Bearer $MEMBER_TOKEN" -H 'Content-Type: application/json' \
      -d '{"title":"Smoke Test Book (edited)","author":"CI","year":2025}' "$BASE/api/books/$NEW_ID")
[ "$c" = 200 ] && ok "PUT own book (member) -> 200" || no "edit own book" "$c"

# 9. Member edits a book they do NOT own (book id 1 owned by admin) (-> 403)
c=$(code -X PUT -H "Authorization: Bearer $MEMBER_TOKEN" -H 'Content-Type: application/json' \
      -d '{"title":"hijack"}' "$BASE/api/books/1")
[ "$c" = 403 ] && ok "PUT other's book (member) -> 403" || no "edit foreign book" "$c"

# 10. Login as admin, delete the test book (-> 200)
ADMIN_TOKEN=$(curl -s -X POST -H 'Content-Type: application/json' \
      -d '{"email":"admin@books.test","password":"password"}' "$BASE/auth/login" | token_of)
[ -n "$ADMIN_TOKEN" ] && ok "POST /auth/login (admin) -> token" || no "admin login" "empty"
c=$(code -X DELETE -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/api/books/$NEW_ID")
[ "$c" = 200 ] && ok "DELETE book (admin) -> 200" || no "admin delete" "$c"

# 11. Validation: missing fields (-> 422)
c=$(code -X POST -H "Authorization: Bearer $MEMBER_TOKEN" -H 'Content-Type: application/json' \
      -d '{"title":""}' "$BASE/api/books")
[ "$c" = 422 ] && ok "POST invalid book -> 422" || no "validation" "$c"

say ""
say "== Result: $PASS passed, $FAIL failed =="
[ "$FAIL" = 0 ] || exit 1
