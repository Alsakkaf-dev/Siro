# MOCK FINAL v1 — ANSWERS & MARKING SCHEME
All computations machine-verified.

## PART A (1 mark each)
1 **C** (DV algorithm is control plane, not in the fabric) ・ 2 **C** ・ 3 **B** ・ 4 **D** (ICMP rides
in IP, no transport protocol) ・ 5 **D** ・ 6 **C** ・ 7 **A** ・ 8 **B** ・ 9 **D** ・ 10 **B**
(161 ∈ 128–191) ・ 11 **C** ・ 12 **C** ・ 13 **C** ・ 14 **C** ・ 15 **B** ・ 16 **B** ・ 17 **B** ・
18 **A** ・ 19 **C** ・ 20 **A**

## PART B

### Q1 [6]
(a) Buffer = (RTT × C)/√N = (0.3 s × 40 Mbps)/√36 = 12 Mbits / 6 = **2 Mbits**.
*(1m formula, 1m substitution with unit conversion, 1m answer+unit.)*
(b) HOL: with an input-queued fabric, if two datagrams at the front of DIFFERENT input queues
contend for the SAME output port, only one is switched; the loser stays at the head of its queue
and **blocks the datagrams behind it — even those destined to FREE output ports**. Queueing delay
and loss follow despite available capacity. *(1m contention, 1m "front blocks behind", 1m "even
though their outputs are free".)*

### Q2 [12]
(a) Largest first: 200→/24 (254), 100→/25 (126), 50→/26 (62), links→/30.

| Subnet | Network | Mask | First | Last | Broadcast |
|---|---|---|---|---|---|
| A (200) | 10.20.30.0/24 | 255.255.255.0 | 10.20.30.1 | 10.20.30.254 | 10.20.30.255 |
| B (100) | 10.20.31.0/25 | 255.255.255.128 | 10.20.31.1 | 10.20.31.126 | 10.20.31.127 |
| C (50) | 10.20.31.128/26 | 255.255.255.192 | 10.20.31.129 | 10.20.31.190 | 10.20.31.191 |
| L1 | 10.20.31.192/30 | 255.255.255.252 | 10.20.31.193 | 10.20.31.194 | 10.20.31.195 |
| L2 | 10.20.31.196/30 | 255.255.255.252 | 10.20.31.197 | 10.20.31.198 | 10.20.31.199 |

*(9m: ~1.8 per subnet — network+prefix ½, mask ½, range ½, broadcast ¼ each, rounded.)*
(b) Waste: A 254−200=**54**, B 126−100=**26**, C 62−50=**12**. *(½ each.)*
(c) **/30** — smallest classic subnet with exactly **2 usable** addresses, one per router
interface. *(1.5m.)*

### Q3 [6]
d = 1300−20 = 1280 (divisible by 8 ✓); D = 5500−20 = 5480; n = ⌈5480/1280⌉ = **5 fragments**;
last data = 5480 − 4×1280 = 360.

| Fragment | Length | ID | Fragflag | Offset |
|---|---|---|---|---|
| 1 | 1300 | 512 | 1 | 0 |
| 2 | 1300 | 512 | 1 | 160 |
| 3 | 1300 | 512 | 1 | 320 |
| 4 | 1300 | 512 | 1 | 480 |
| 5 | **380** | 512 | **0** | 640 |

*(1m fragment count/data math; 1m per row attributes ≈ 4m; 1m flags/offset units correct.)*

### Q4 [8]
(a) Ranges → prefixes (LPM lets the longer entries punch holes in the /8):

| Prefix match | Link |
|---|---|
| 11100000 00 (10 bits) | 0 |
| 11100000 01000000 (16 bits) | 1 |
| 11100000 (8 bits) | 2 |
| otherwise | 3 |

*(5m: 1m each correct prefix + 2m for recognizing link 2 collapses to the 8-bit prefix because
the longer prefixes override inside it.)*
(b)(i) starts 11100000 01000000 → matches 16-bit (link 1) and 8-bit (link 2); **longest = Link 1**.
(ii) starts 11100001 → fails all prefixes → **otherwise = Link 3**. *(1.5m each: answer + "longest
prefix that matches" reasoning.)*

### Q5 [13]
(a) Dijkstra from A *(7m: init row 1m; each iteration row ~1m; correct min-selection visible)*:

| Step | N′ | D(B),p | D(C),p | D(D),p | D(E),p | D(F),p |
|---|---|---|---|---|---|---|
| 0 | A | 3,A | **1,A** | 6,A | ∞ | ∞ |
| 1 | AC | **2,C** | — | 3,C | 5,C | ∞ |
| 2 | ACB | — | — | **3,C** | 5,C | ∞ |
| 3 | ACBD | — | — | — | **5,C** | 10,D |
| 4 | ACBDE | — | — | — | — | **7,E** |
| 5 | ACBDEF | complete |

Walk: add C(1) → relax B: min(3, 1+1)=2 via C; D: min(6, 1+2)=3 via C; E: 1+4=5 via C.
Add B(2) → E: min(5, 2+5)=5 unchanged. Add D(3) → F: 3+7=10 via D. Add E(5) → F: min(10, 5+2)=7
via E. Add F(7).

(b) Forwarding table for A *(3m)* — trace predecessors: every shortest path leaves A on link
**(A,C)**:

| Destination | Link | Least cost |
|---|---|---|
| B | (A,C) | 2 |
| C | (A,C) | 1 |
| D | (A,C) | 3 |
| E | (A,C) | 5 |
| F | (A,C) | 7 |

*(Trap check: B is cheaper via C (2) than direct (3).)*

(c) **D_A(F) = min{ c(A,B)+D_B(F), c(A,C)+D_C(F), c(A,D)+D_D(F) }**
= min{3+7, 1+6, 6+7} = min{10, 7, 13} = **7** *(1m complete equation over ALL neighbours,
1m neighbour costs D_B(F)=7, D_C(F)=6, D_D(F)=7, 1m result).*

### Q6 [12]
(a) P talked to S and T (other subnet → frames go via R) and possibly R directly; it NEVER
learns S/T MACs. **P's ARP table contains exactly one row: 172.20.1.1 → CC-CC-CC-CC-CC-01
(R int1).** Q is absent (no communication). *(2m table, 2m reasoning "off-subnet ⇒ only the
router's mapping is needed/learned".)*
(b)

| Location | src IP | dst IP | src MAC | dst MAC |
|---|---|---|---|---|
| X | 172.20.1.10 | 172.20.2.21 | AA-AA-AA-AA-AA-01 | CC-CC-CC-CC-CC-01 |
| Y | 172.20.1.10 | 172.20.2.21 | CC-CC-CC-CC-CC-02 | BB-BB-BB-BB-BB-02 |

*(1m per row's IPs — unchanged; 1m per row's MACs.)*
(c)
| Event | Table after | Forwarded on | Why |
|---|---|---|---|
| 1. P→R frame | (P,1) | **flood: 2,3** | dst CC-..-01 unknown |
| 2. R→P frame | (P,1),(Rint1,3) | **1 only** | P known |
| 3. Q→P frame | +(Q,2) | **1 only** | P known |
*(Learn ½ + action ½ + reason ⅓ per event ≈ 4m.)*

### Q7 [9]
(a) G=1001 has 4 bits → **r = 3 CRC bits**. Dividend 1101011**000**; XOR-divide by 1001 →
remainder **R = 111**; transmitted = **1101011111**. *(1m r; 2m division steps; 1m answer.)*
(b) Divide 1011011011 by 1001 → remainder **010 ≠ 000 → error detected, frame rejected**.
*(2m division, 1m verdict.)*
(c) Row 2 (0100|0) has one 1 → odd → fails; column 3 (0,0,0 | 1) → odd → fails.
**Error bit = row 2, column 3; received 0, corrected to 1.** *(1m location, 1m correction.)*

### Q8 [7]
(a) Model answer (5m): carrier sense — NIC senses channel; idle → transmit entire frame, busy →
defer until idle (1m). While transmitting, NIC LISTENS; if it detects another transmission it
**aborts immediately and sends a jam signal** (2m). It then enters **binary exponential
backoff**: after the m-th collision, pick K randomly from {0,1,…,2^m −1} and wait **K × 512 bit
times** before re-sensing — the window doubles with each collision, adapting to load (2m).
(b) In wireless, the sender's own signal **overwhelms the weak received signal** (and hidden
terminals/fading mean some collisions can't be heard at all) → detection impossible (1m).
802.11 uses **CSMA/CA — collision AVOIDANCE**: DIFS wait + random backoff before sending,
receiver ACK after SIFS, optional **RTS/CTS** reservation (1m).

### Q9 [7]
(a) Sent **by the AP** (broadcast to all stations in range); contain the **SSID (AP name)** and
the **AP's MAC address**. *(2m.)*
(b) 1. H sends the datagram to M's **permanent address** → routed to M's **home network**.
2. The **home agent** intercepts and **encapsulates/tunnels** it to M's **care-of address** in
the visited network. 3. The **foreign agent** decapsulates and delivers to M. 4. M replies
**directly** to H. *(¾m per step incl. agent names.)*
(c) **RNC → SGSN → GGSN → public Internet** (the GPRS core). *(2m.)*

---
**Self-grading bands:** ≥80 exam-ready ・ 65–79 drill the lost archetypes ・ 50–64 redo the
mastery files' worked examples ・ <50 restart from CH4 mastery + drills.
