# 03 — Exam Intelligence: SCSR2213 Network Communications Final

**Built from the actual papers in** `Storage/Materials/Final Exams/` **+ your 2024/25 course
outline + your slide decks.** Final = 35%, 3 hours (course outline). Scope: Chapter 4 → end.

---

## 1. What's actually in your Final Exams folder (read this first)

| File | What it really is | Use |
|---|---|---|
| netcom Final 1617 / SCSR1213_FINAL_16172 | **2016/17 final** (identical files) | HIGH |
| netcom Final 1718 / SCSR1213_FINAL_17182 | **2017/18 final** (identical files) | HIGH |
| netcom Final 1819 | **2018/19 final** | HIGH |
| Copy of PART B - Questions20202021_2 + "Question s20202021_2" | **2020/21 Sem 1 final, Part B — TWO set variants** (online format, 40-mark structured) | HIGHEST — most recent real questions |
| Answer.pdf / Answer2.pdf / answer3.pdf | **Screenshots of the Feb 2022 ONLINE final (Moodle, SECR1213)** — pages of a 21-page, 46+-question objective exam. NOT model answers. Image-only (no text layer). | Confirms 2021/22 archetypes (CRC with G=10011; 2-D parity) |
| SCSR1213_FINAL_14152 | 2014/15 final | MEDIUM |
| SCSR1213_FINAL_13142 (+ duplicate, + "2013-2014" file) | 2013/14 final | MEDIUM-LOW |
| SCSR1213_FINAL_12132 (+ "2012-2013 Sem 2" file) | 2012/13 final | LOW (old syllabus flavour) |
| **SECR1033 2022_23_2 and 2023_24_2** | **WRONG SUBJECT — "Computer Organization & Architecture"** (assembly, pipelining, cache). Misfiled in this folder. | **IGNORE for NC** |
| Pemakluman Perlaksanaan PSC 2020 | Malay admin notice about 2020 exam arrangements | IGNORE |
| Exams/Mid-Term242502-Ques.pdf | SECR2242 "Computer Networks" mid-term, 17 Jun 2025 — Cisco-flavoured (static routes, RIPv2) but its **Part B Q1 = exactly the VLSM subnetting design archetype** | Subnetting practice signal |

**Weighting rule used below:** 2020/21 + 2018/19 + 2017/18 + 2016/17 weighted highest; 2012–2015
papers counted but down-weighted (they carry old-syllabus items like ATM/virtual-circuit detail
and classful-addressing emphasis that the v8 slides have de-emphasized).

**Chapter-numbering decode (important):** the course's Ch4 = Network Layer *Data Plane* (v8 deck);
the slide file `Chapter_5_v8` = Network Layer *Control Plane* — not on the weekly schedule, BUT
Dijkstra/Bellman-Ford from it are tested in 2016/17 (20 marks), 2018/19 (13 marks) and 2020/21
(6 marks): **treat routing algorithms as examinable**. Course Ch5 = Link Layer (file Chapter_6
V7.01), course Ch6 = Wireless & Mobile (file Chapter_7 V7.01). Chapter 7 has no deck of its own
in your materials beyond that — there is **no separate "Ch7" topic to study**.

## 2. Exam structure (observed → predicted)

| Year | Format |
|---|---|
| 2016/17 | Section A: 20 MCQ (20m) + Section B: 7 structured questions (80m) |
| 2017/18 | Part A: 10 MCQ (10m) + Part B: 9 × 10-mark structured (90m) |
| 2018/19 | Part A: 20 MCQ (20m) + Part B: 9 structured (80m) |
| 2020/21 | online: Part A objective (separate) + **Part B: 3 structured questions (40m)** — Q1 network layer (15), Q2 link layer (15), Q3 wireless (10) |
| 2021/22 | fully online Moodle, ~46 objective/short questions |

**Predicted 2026 (in-hall):** Part A MCQ 10–20 marks + Part B structured 80–90 marks, 3 hours.
Expect 7–9 structured questions sweeping in chapter order: ~2–3 network-layer computational, 1
routing-algorithm, 2–3 link-layer, 1–2 wireless/mobility. The 2020/21 Part B is the cleanest
preview of question STYLE; the 1819 paper is the best full-length rehearsal.

## 3. Mark distribution by chapter (recent papers)

| Paper | Network layer (Ch4 + routing) | Link layer (Ch5) | Wireless (Ch6) |
|---|---|---|---|
| 1718 (100m) | ~33% | ~35% | ~25% |
| 1819 (100m) | ~45% | ~38% | ~15% |
| 2020/21 Part B (40m) | 37.5% | 37.5% | 25% |
| **Planning figure** | **≈ 40%** | **≈ 35%** | **≈ 25%** |

## 4. Question archetypes with frequency (the heart of this file)

**Tier 1 — appears in essentially EVERY recent paper (master to reflex level):**

| Archetype | Appearances (marks) | Exact ask |
|---|---|---|
| **Subnetting / addressing computation** | 1415(8), 1617 Q2(10), 1718 Q2(10), 1819 Q4(13), 2021 Q1a(5 both variants), midterm 24/25(7) | given /x: network+broadcast+usable; divide /24 into 4 or 8 equal subnets; divide /20 into 5 subnets (→8); VLSM design per-department; list all addresses of a /28 or /30 |
| **IP fragmentation table** | 1415(5), 1617 Q1b(6), 1718 Q3(10 reverse), 1819 Q3(5), 2021 Q1c(4 both) | L bytes through MTU M, ID given → fragments with length/ID/flag/offset; or reverse-engineer missing fragment |
| **CRC** | 1314(5), 1718 Q4a(4), 1819 Q6b+c(8), 2021 Q2c(5 both), 2122 online(4) | sender: compute R and transmitted frame; receiver: divide, verdict. G is 4–5 bits (1101, 1001, 10011, 10100) |
| **ARP scenarios** | 1314 Q5(9), 1617 Q4(10), 1718 Q6(10), 1819 Q8(10), 2021 Q2b(5 both) | same-subnet ARP narrative; cross-subnet (need ROUTER's MAC); construct ARP table after given communications; src/dst MAC+IP table at points X/Y around a router |
| **CSMA/CD (+ vs CSMA, vs CA) explanation** | 1314(5), 1617 Q6(5), 1718 Q5(10), 1819 Q7(12), 2021 Q2a(2–5) | algorithm + jam + binary exponential backoff; why collisions still occur (propagation delay); backoff purpose |
| **3G/cellular architecture** | 1314 Q6(15), 1415 Q3(10), 1617 Q7a(12), 1718 Q8(10), 2021 Q3b(5) | label the 3G figure; describe voice path (RNC→MSC→GMSC→PSTN) and data path (RNC→SGSN→GGSN→Internet) |

**Tier 2 — most papers (know cold):**

| Archetype | Appearances | Notes |
|---|---|---|
| **Dijkstra least-cost table + forwarding table** | 1314(15), 1617 Q3(20!), 1819 Q5a,b(9) | step/N′/D(v),p(v) table format given in the paper |
| **Bellman-Ford equation + evaluation** | 1617 Q3c(5), 1819 Q5c(4), 2021 Q1b(6 both variants) | "write the COMPLETE equation from X to Y" |
| **Switch self-learning table evolution** | 1314(5), 1415(7), 1718 Q7(10) | events → table state + forwarded links + why |
| **2-D parity find/correct the bit** | 1314(5), 1617 Q5(5), 1819 Q6a(2), 2122 online | even parity in all observed cases |
| **Mobile IP: permanent vs COA, indirect/direct routing, triangle problem** | 1718 Q9(10), 1819 Q9b(6), 2021-v2 Q3b(5) | draw + number arrows |
| **802.11 association/beacons/scanning** | 1617 A19, 1819 Q9a(4), 2021-v2 Q3(5) | SSID+MAC in beacon; passive vs active |
| **Hidden terminal + fading** | 1617 Q7b(4), 2021 Q3a(4) | two-circle sketch |
| **Router buffer sizing RTT·C/√N** | 1617 Q1a(4), 1819 Q1(3), slide exercise | pure formula plug-in |
| **HOL blocking / input-output queueing** | 1415(8), 1617 A4, 1819 Q2(4) | define + when it occurs |
| **MAC taxonomy (3 classes + examples)** | 1415(10), 1718 Q5a(4), 1819 A14-16, 2021 Q2a-ii(3) | channel partitioning / random access / taking turns |

**Tier 3 — occasional / MCQ-fodder:** DHCP 4-step order (1415, MCQs 1718/1819), NAT
private-address reasoning (1819 Q4d), longest prefix match table (1718 Q1 — 10m, could resurface),
VLAN/trunk MCQs (1819), ICMP type/code MCQs, IPv6 changes (MCQ), OSPF vs RIP vs BGP intra/inter-AS
MCQs (1617 A8/A10, 1819 A6), link-layer services list (1718 Q4b), Ethernet frame fields,
CDMA concept, GSM handoff MCQ, taxonomy of wireless networks (MANET/VANET MCQs).

**Scenario staple:** "given topology + IP/MAC table" drives the ARP/switch/forwarding questions
in 1617, 1718, 1819 — expect one multi-part scenario question built on a 2-subnet-1-router figure.

## 5. The recycling pattern (your biggest edge)

- 2020/21's two Part-B variants are the SAME questions with different numbers
  (/30 vs /28 listing; ÷4 vs ÷8 subnets; BF from A vs from E; 7000/1860/629 vs 8000/2100/714
  fragmentation; CRC sender 100100 vs receiver 100100001 — **which are the same transmission!**).
- 1819's CRC receiver (100000001) is a one-bit corruption of its own sender question (100100001's
  family). Lecturers reuse numbers across parts.
- The fragmentation exercise IN THE SLIDES (5000/MTU1500/ID333) became 1617's 6000/1700/333 —
  same ID, same structure. Slide exercises are exam-question seeds: the buffer exercise
  (20 Mbps/400 ms/16 flows) became 1617's (100/200/25) and 1819's (25/250/9).
- Dijkstra exercise topologies in the Ch5(control-plane) deck (Exercises 5.0–5.9) are the source
  pool for the routing questions.
**⇒ Do every in-slide exercise; they are literally past/future exam questions.**

## 6. Top-10 marks-per-hour priority skills (train in this order)

1. **Equal-size subnetting table** — 10 min of drilled binary work ≈ 10–13 marks. (Drill P7–P10)
2. **CRC XOR division both directions** — 5 min ≈ 5–8 marks, zero theory risk. (Drill CH5 P5–P6)
3. **Fragmentation table** — 5 min ≈ 4–10 marks; memorize d=(MTU−20) rounded to ÷8, offset in
   8-byte units. (Mock Q3)
4. **Dijkstra table + forwarding table** — 10 min ≈ 7–13 marks; the table format is given to you.
5. **Bellman-Ford "complete equation"** — 3 min ≈ 4–6 marks.
6. **ARP narratives + MAC/IP rewrite table** — 10 min ≈ 10 marks; pure pattern.
7. **Switch self-learning evolution table** — 5 min ≈ 7–10 marks.
8. **CSMA/CD essay skeleton** (5 numbered steps + backoff formula + why-collisions) — ≈ 10 marks
   of pre-written prose.
9. **3G voice/data path labeling** — memorize 6 acronyms ≈ 10–12 marks.
10. **Mobile IP indirect/direct diagram** + permanent/COA definitions — ≈ 6–10 marks.
Bonus 2-minute marks: buffer formula (÷√N), HOL definition, DHCP D-O-R-A, beacon contents.

## 7. Risk notes

- **Old-syllabus contamination:** 2012–2015 papers ask ATM/virtual-circuit and class-A/B/C
  detail more heavily than the v8 slides do. Recognize Class A/B/C ranges (MCQ 1617 A9 asks one)
  but don't over-invest.
- **Routing algorithms** are formally in the not-scheduled control-plane deck, yet were worth
  6–20 marks in 3 of the last 4 written finals — prepare them (this is the single most likely
  place an unprepared student loses a full question).
- The lecturer's MCQs quote slide sentences verbatim — your mastery files' terminology tables
  use those exact sentences; memorize them as-is.
- 2 of the 17 PDFs are a different subject (SECR1033) — if you've been "studying" those papers,
  stop; they are Computer Organization.
