# UTM Borrow — 3 Minute Video Script
**SCSE2243 · Group Alpha · NABC format**

Deck: `UTM Borrow - 3 Minute Video Slides (NABC).pptx` — this same narration is in each slide's Speaker Notes, so you can read it from Presenter View.

Timed at **150 words per minute**. Total narration is **417 words** (**167 s**), leaving **13 s** for pauses and transitions. Do not rush. If you run long, cut from Slide 7 — never from the demo.

---

## Slide 1 · INTRODUCTION — `0:00 – 0:14`

> Good morning. We are Group Alpha — Mohammed Alsakkaf, Muaz Ibne Ahmed, and Ahmat Mahamat. Our application is UTM Borrow: a campus-wide circular resource-sharing platform, where every handover is cryptographically signed.

*Delivery:* All three of you on camera, or a static slide with one voice. Whoever speaks, say all three names.

---

## Slide 2 · NEED — the problem — `0:14 – 0:36`

> Every semester, UTM students buy specialised items they use once — lab coats, calculators, drawing sets, formal attire. After one semester, they're worthless. The only place to pass them on is an unverified WhatsApp group. No identity. No reputation. No record of who holds what. So lenders are afraid to lend — and nothing circulates.

*Delivery:* Slow. This is the emotional beat. Let the last sentence land before you click.

---

## Slide 3 · NEED — the evidence — `0:36 – 0:54`

> We surveyed twenty-nine UTM students. Sixty-two per cent spend up to a hundred and fifty ringgit a year on items used once. Thirty-eight per cent fear never getting a lent item back. The demand is there. The infrastructure was not.

*Delivery:* Let each number appear as you say it — set the four boxes to Appear, On Click. The slide shows two more statistics than you speak; that is deliberate, let the eye find them.

---

## Slide 4 · APPROACH — architecture — `0:54 – 1:15`

> We built three subsystems, one each. Ahmat built Identity — only UTM emails may register, and the Trust Score is earned, never claimed. Muaz built the Catalog, with server-enforced categories and college filtering. I built Transaction and Handover, where a request locks the item and every state change is logged.

*Delivery:* Name each owner out loud. The rubric rewards visible individual contribution.

---

## Slide 5 · APPROACH — the mechanism — `1:15 – 1:35`

> A loan is a state machine — Available, Pending, Approved, Borrowed, Completed. It cannot skip a state. The handover itself is proven with a signed token: HMAC-SHA256, re-verified on every scan, expiring in twenty-four hours. A captured code cannot be replayed. A handover cannot be quietly undone.

*Delivery:* This is the technical heart of the project. Say it with confidence, not speed.

---

## Slide 6 · APPROACH — LIVE DEMO — `1:35 – 2:08`

> Here it is running. A student filters the catalog by residential college, opens an item, and sends a borrow request. The item locks immediately, so nobody else can claim it. The lender reviews the borrower's Trust Score and approves. They meet. The borrower shows the QR code; the lender scans it — and only then does the item become Borrowed. When it comes back, a second scan closes the loan, and both students rate each other.

*Delivery:* Hold the card ~3 seconds, then CUT TO SCREEN RECORDING. See the demo shot list below.

### What to record

Record at **1920 × 1080** from `https://utmborrow.alsakkaf.site/login`. Use two browsers side by side — borrower on the left, lender on the right — so the handover is believable.

| # | Beat | Length |
|---|------|--------|
| 1 | Browse the catalog. Apply a college filter. | ~5 s |
| 2 | Open an item, pick dates, send a borrow request. Item flips to **Pending**. | ~7 s |
| 3 | Switch to the lender. Approve the request. | ~5 s |
| 4 | Borrower shows the QR. Lender scans it. Status flips to **Borrowed**. | ~9 s |
| 5 | Return scan. Status flips to **Completed**. The rating dialog opens. | ~7 s |


---

## Slide 7 · APPROACH — technology — `2:08 – 2:21`

> React on Vercel, FastAPI on Render, MongoDB behind it. All twenty-seven use cases implemented. Security is not a diagram: bcrypt, JWTs, signed tokens, and two-factor on every admin action.

*Delivery:* Brisk. This slide is proof, not persuasion. If the video runs long, trim here — never the demo.

---

## Slide 8 · BENEFIT — `2:21 – 2:43`

> Borrowers stop buying — that money stays in their pocket. Lenders lend without fear: the counterpart is verified, and there is proof of both handover and return. The university keeps outsiders out, every decision audited. Every item borrowed is one fewer bought and one fewer discarded — UTM's Smart and Green Campus, and SDG 12.

*Delivery:* Three beats, one per column. Pause between them.

---

## Slide 9 · COMPETITION — `2:43 – 2:57`

> A WhatsApp group verifies nothing. Marketplace apps are built to sell, and let outsiders in. The loan counter only lends what the university owns. None of them can prove a handover happened. UTM Borrow can.

*Delivery:* On the last sentence, point at the final column.

---

## Slide 10 · CLOSE — `2:57 – 3:00`

> UTM Borrow. Every handover, signed. Thank you.

*Delivery:* Hold the QR on screen for the final two seconds. Do not rush the last word.

---

## Before you record

1. **Wake the backend first.** It is on Render's free tier — the first request takes about 30 seconds. Load the site, wait for it, *then* start recording. Otherwise your demo opens on a spinner.
2. **Fix the test-account mismatch.** The Final Report cover says `daniel.tan@graduate.utm.my`; the Access & Testing slide says `alsakkaf@`, `muaz@` and `ahmat@graduate.utm.my`. Decide which accounts are real, demo with those, and make both documents agree. All passwords: `Test1234`.
3. **Two accounts, two windows.** The handover only means something if the borrower and the lender are visibly different people.
4. **Do a silent timing pass.** Read this aloud with a stopwatch before you record a single frame.
