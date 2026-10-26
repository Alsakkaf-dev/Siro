# CH5 — Link Layer & LANs Mastery

**Source deck:** `Chapter_6_V7.01_AFA_Update.pptx` (the course's "Chapter 5: The Link Layer and
LANs" in the weekly schedule is taught from this 7th-edition file — same content, file just
carries the old number).

---

## 0. The Systemic Picture: One Leg of the Journey

Keep the courier analogy, zoom in on a SINGLE leg:

- The **network layer** plans the journey Princeton→Lausanne. The **link layer** is each
  individual transport mode: *limo Princeton→JFK, plane JFK→Geneva, train Geneva→Lausanne.*
  (This is literally the slide's "transportation analogy": tourist = datagram; transport segment =
  communication link; transportation mode = link-layer protocol; travel agent = routing algorithm.)
- **Nodes** = hosts and routers. **Links** = channels connecting adjacent nodes. The layer-2
  packet is a **frame**, which **encapsulates a datagram**.
- The link layer's responsibility (exact sentence): *transferring a datagram from one node to a
  PHYSICALLY ADJACENT node over a link.*
- Each leg can use a different protocol (Ethernet, then frame relay, then 802.11) — the parcel
  doesn't care which truck carried it on leg 2.
- **Where implemented?** In **every host AND router**, in the **network adapter (NIC)** or chip —
  combination of hardware, software, firmware. Sender side: encapsulates + adds error-check bits;
  receiver side: checks errors, extracts datagram, passes up.

## 1. Link-layer services (the 6-item list — straight past-paper question, 1718 Q4b)

1. **Framing, link access**: encapsulate datagram into frame (header + trailer); **MAC protocol**
   specifies the rules for frame transmission on a shared medium.
2. **Reliable delivery between adjacent nodes**: ACK/retransmission (like Ch3); seldom used on
   low-error links (fiber, twisted pair); **used on wireless links (high error rates)**.
3. **Flow control**: pacing between adjacent sender and receiver.
4. **Error detection**: caused by signal attenuation and noise; receiver detects and asks for
   retransmission or drops.
5. **Error correction**: receiver identifies AND corrects bit errors **without retransmission**.
6. **Half-duplex / full-duplex**: half = both ends can transmit, but not at the same time.

Trap MCQ (1617 A11): **congestion control is NOT a link-layer service.**

## 2. Error detection & correction — the calculations

### 2.1 Single-bit parity (detect only)
Even parity: choose parity bit so total number of 1s (data + parity) is **even**.
Receiver counts 1s; odd count → error occurred (but cannot locate it).

### 2.2 Two-dimensional parity (detect AND CORRECT one bit)
Arrange data in rows; add a parity bit per **row** and per **column** (plus corner).
A single flipped bit ⇒ exactly ONE row parity fails AND ONE column parity fails — the
intersection IS the wrong bit; flip it to correct.
**Method to write in exams:** (1) check each row's 1-count vs its parity bit; (2) check each
column; (3) error bit = (failing row, failing column); (4) state the corrected value.
If ONLY a row (or only a column) fails → the parity bit itself was corrupted.

**Worked (1819 real, verified):** received rows `1111000|0`, `1010101|0`, `1101111|1`,
`1010010|1` (last column = parity). Row 3 has six 1s but parity 1 → row 3 fails. Columns:
column 3 (1,1,0,1) has three 1s → fails. **Error bit = row 3, column 3: the 0 should be 1.**

### 2.3 Internet checksum (for contrast)
Transport-layer technique: 1's-complement sum of 16-bit words (UDP/TCP). Not a link-layer code —
know it exists so you can name "one OTHER method" (1617 Q5c can be answered with checksum or CRC).

### 2.4 CRC — Cyclic Redundancy Check (GUARANTEED 4–5 marks, every recent paper)

**Theory sentences worth marks:** view data bits D as a binary number; choose an (r+1)-bit
**generator G**; compute r CRC bits R so that **⟨D,R⟩ is exactly divisible by G (modulo 2)**;
receiver divides ⟨D,R⟩ by G — **non-zero remainder = error detected**; can detect all **burst
errors less than r+1 bits**; used by Ethernet, 802.11 WiFi, ATM.

**Sender recipe** (D given, G has r+1 bits):
1. r = (bits in G) − 1.
2. Append r zeros to D → dividend D·2^r.
3. XOR-divide by G (no borrows — each step XOR G under the leftmost remaining 1).
4. Remainder (exactly r bits, keep leading zeros!) = **R**.
5. **Transmit D followed by R** (⟨D,R⟩).

**Receiver recipe:** divide the WHOLE received frame by G; remainder 0 → accept ("no error
detected"); else reject/error.

**Worked sender (2020/21 + 1819 real, verified by computation):**
D = 100100, G = 1101 (r = 3). Dividend 100100**000**.
```
100100000 ÷ 1101 (XOR steps):
100100000
1101
-----
 010110000 → 1101 under bits 2-5 ...
remainder = 001
```
**R = 001**, transmitted frame = **100100001**.

**Worked receiver (2020/21 real, verified):** received 100100001, G=1101 → divide → remainder
**000** → **no error; accept**. (Notice: the two 2020/21 exam variants are the sender and
receiver halves of the SAME numbers — they recycle.)

**More verified results to self-check your hand division:**
- received 100000001, G=1101 → remainder **011** ≠ 0 → **error detected** (1819c).
- received 11001001010, G=1001 → remainder **001** → **reject** (1718).
- D=101110, G=1010, r=3 → R=**110**, send 101110110 (slide exercise).
- received 1011101100, G=10100 → remainder **0000** → no error (slide exercise).
- D=110101001, G=10011 → r=**4**, dividend 1101010010000, R=**0011** (2021/22 online final).

**Traps:** keep EVERY leading zero in R (R is exactly r bits); use XOR not subtraction; receiver
divides the whole received bit string (do NOT re-append zeros); "how many CRC bits?" = r =
len(G)−1.

## 3. Multiple access protocols (the taxonomy question)

**Problem:** one shared broadcast channel; two simultaneous transmissions ⇒ **collision** (a node
receives ≥2 signals at once; all collided frames lost — wasted bandwidth). A **multiple access
protocol** is the *distributed algorithm that determines how nodes share the channel, i.e., when
a node can transmit* — and the coordination must use the channel itself (no out-of-band channel).

**Ideal protocol (4 desiderata):** one sender gets full rate R; M senders average R/M each;
fully decentralized (no master, no clock sync); simple.

**THE three classes (memorize examples — 1718 Q5a, 1415, MCQs):**

| Class | Idea | Examples |
|---|---|---|
| **Channel partitioning** | divide channel into pieces (time slots / frequency / code), exclusive use | **TDMA, FDMA, CDMA** |
| **Random access** | no division; allow collisions; detect & RECOVER from them | **ALOHA, slotted ALOHA, CSMA, CSMA/CD, CSMA/CA** |
| **Taking turns** | nodes take turns; longer turns for busier nodes | **polling (master/slave), token passing** (Bluetooth, FDDI, token ring) |

- **TDMA**: access in rounds, each station a fixed-length slot; unused slots idle.
- **FDMA**: spectrum split into frequency bands, one per station; unused bands idle.
- Channel partitioning: efficient & fair at HIGH load; wasteful at LOW load (1/N even if alone).
- Random access: full channel at low load; collision overhead at high load.
- Taking turns: "best of both" — but **polling**: polling overhead, latency, single point of
  failure (master); **token passing**: token overhead, latency, single point of failure (token).
- **Slotted ALOHA**: transmit only at slot start; collision → retransmit each slot w.p. p;
  max efficiency **1/e ≈ 37%**. **Pure ALOHA**: transmit immediately; vulnerable window doubles;
  max efficiency **1/(2e) ≈ 18%**.

### CSMA family (the essay — 1819 Q7 worth 12 marks)

- **CSMA**: *listen before transmit* — if channel idle, send whole frame; if busy, defer.
  **Why do collisions STILL occur? Propagation delay** — two nodes may not yet hear each other's
  just-started transmission (2020/21 Q2a real). Collision wastes the entire packet transmission.
- **CSMA/CD (collision detection)** — Ethernet (wired):
  1. NIC receives datagram, creates frame.
  2. Senses channel: idle → transmit; busy → wait until idle, then transmit.
  3. Transmits entire frame without detecting another transmission → done.
  4. Detects another transmission while transmitting → **abort + send jam signal**.
  5. **Binary (exponential) backoff**: after the m-th collision choose K at random from
     **{0, 1, …, 2^m − 1}** and wait **K × 512 bit times**, then go to step 2. More collisions →
     longer backoff intervals. *(Purpose of backoff — 2020/21 Q2a(i): randomize retry times so
     colliding nodes don't collide again immediately, load-adaptively.)*
  - Collision detection easy on wire (compare transmitted vs received signal strength);
    **difficult in wireless** (received strength overwhelmed by local transmission → that's why
    wireless uses CA, see CH6).
  - Efficiency = 1 / (1 + 5·t_prop/t_trans) → →1 as t_prop→0 or t_trans→∞.

## 4. LAN addressing & ARP

- **MAC (LAN/physical/Ethernet) address**: **48-bit**, burned into NIC ROM, hex notation
  (e.g., 1A-2F-BB-76-09-AD). Function: get a frame from one interface to another
  **physically-connected interface (same subnet)**. Allocation administered by **IEEE**;
  first 3 bytes = manufacturer code. **Broadcast MAC = FF-FF-FF-FF-FF-FF** (1819 A11).
- Analogy (the slides' own): **MAC address = IC/Social Security number** (fixed, portable);
  **IP address = postal address** (changes when you move; hierarchical, NOT portable).
- **ARP table**: in EACH IP node (host or router): **⟨IP address; MAC address; TTL⟩**, TTL
  typically **20 min** — mapping forgotten after that ("soft state"). At first boot the table is
  **EMPTY** (2020/21 Q2b(i)). MCQ: RTT is NOT in the ARP table (1718 A7).

**ARP protocol — same LAN (write as numbered steps):**
1. A wants to send to B, knows B's IP, B's MAC not in A's ARP table.
2. A **broadcasts ARP query** containing B's IP — destination MAC FF-FF-FF-FF-FF-FF; ALL nodes on
   the LAN receive it.
3. **B (only) replies** to A with B's MAC — sent **unicast** to A's MAC.
4. A **caches** the (IP→MAC) pair in its ARP table (until TTL expires).
ARP is **plug-and-play** (no administrator needed).

**ARP across subnets / routing to another LAN (the 4-mark classic — 1819 Q8b, 1718 Q6):**
A (subnet 1) sends to C (subnet 2) via router R:
1. A knows C's IP is on a DIFFERENT subnet (mask tells it) → A must send the frame to its
   **first-hop router R**, so A needs **R's MAC** (ARP for R if needed — NOT for C!).
2. Frame 1: **src MAC = A, dst MAC = R(left interface)**; inside, datagram **src IP = A,
   dst IP = C** (IP addresses never change).
3. R removes datagram, looks up forwarding table, ARPs for C on the right subnet if needed.
4. Frame 2: **src MAC = R(right interface), dst MAC = C**; datagram still src IP A, dst IP C.

**The exam table** (1617 Q4 style) — frame at point X (A→R) and Y (R→C):

| | src IP | dst IP | src MAC | dst MAC |
|---|---|---|---|---|
| X (A→R) | A | C | A | **R left iface** |
| Y (R→C) | A | C | **R right iface** | C |

**ARP-table-contents question (2020/21 real):** "PC-B has communicated with all hosts EXCEPT
Laptop-A — what is PC-B's ARP table?" → one row per **same-subnet** device it talked to
(IP + MAC), **plus the router interface** if it talked to other-subnet hosts (it maps the
ROUTER's IP/MAC, never the remote host's MAC). Laptop-A absent.

## 5. Ethernet

- Dominant wired LAN; cheap, simple; 10 Mbps → 10 Gbps. Topology: **bus** (all in one collision
  domain, till mid-90s) → **star** with an active **switch** in the centre (no collisions).
- **Frame structure:** preamble (7 bytes 10101010 + 1 byte 10101011 — synchronize clocks) |
  dest MAC (6B) | src MAC (6B) | type (higher-layer protocol, usually IP) | **data 46–1500 bytes**
  (max = MTU 1500) | **CRC** (checked at receiver; error → frame dropped).
- Ethernet is **connectionless** (no handshake) and **unreliable** (no ACK/NACK) — dropped frames
  recovered only by higher layers (e.g., TCP). MAC protocol: **unslotted CSMA/CD with binary
  backoff**. 802.3 standards: same MAC + frame format, many speeds/media (100BASE-TX fiber/copper…).

## 6. Switches (self-learning — the table-evolution question)

- **Switch = link-layer device**, store-and-forward frames; uses MAC addresses; **transparent**
  (hosts unaware); **plug-and-play, self-learning** (no configuration). Contrast: router =
  network-layer (IP). (MCQ 1718 A8: switch operates at Data Link layer.)
- Hosts have dedicated, direct connection; switches buffer; **full duplex**;
  **each link its own collision domain**; A→A′ and B→B′ can transmit simultaneously, no collision.
- **Switch table**: ⟨MAC address, interface to reach it, time stamp⟩ — "looks like a routing
  table" but built by **self-learning**: when a frame arrives, the switch records
  (**sender's** MAC, incoming interface).
- **Filtering/forwarding algorithm (memorize verbatim):** when frame arrives:
  1. record incoming link + sender MAC (LEARN);
  2. index table with DESTINATION MAC;
  3. if entry found: if destination is on the SAME segment the frame came from → **drop (filter)**;
     else → **forward on the indicated interface**;
  4. else (no entry) → **flood** on all interfaces except the arriving one.

**Worked evolution (1718 Q7 style):** hosts A…F on ports 1…6, table initially empty.

| Event | Learn (added to table) | Forwarding action |
|---|---|---|
| B sends to E | (B, port2) | E unknown → **flood** all ports except 2 |
| E replies to B | (E, port5) | B known → **forward to port 2 only** |
| A sends to B | (A, port1) | B known → forward to port 2 |
| B replies to A | (B already known; timestamp refreshed) | A known → forward to port 1 |

- **VLANs** (one slide-level idea): a single physical switch partitioned into multiple virtual
  LANs → **traffic isolation**, manage users by group not location; **trunk port** carries frames
  of **multiple VLANs between switches** (802.1Q tag). MCQ 1819 A9/A10: VLANs do NOT solve
  "error recovery"; trunk = multiple VLANs across switches.

## Terminology Table

| Term | Exact definition | Analogy |
|---|---|---|
| Node | host or router | depot or house |
| Link | channel connecting physically adjacent nodes | one leg of the route |
| Frame | layer-2 packet, encapsulates datagram | the truck carrying the parcel for one leg |
| MAC protocol | rules by which nodes share / transmit on the medium | who may speak when |
| MAC address | 48-bit link-layer identifier in NIC ROM, used to move frames between interfaces on the same LAN | person's IC number |
| ARP | Address Resolution Protocol: resolves an IP address into the corresponding MAC address on the LAN | shouting "who lives at No. 7? Tell me your name" |
| ARP table | ⟨IP; MAC; TTL≈20 min⟩ cache in every node | your contact list (entries expire) |
| Collision | node receives two or more signals at the same time; all frames lost | two people talking at once |
| CSMA | carrier sensing: listen before transmit | don't interrupt |
| CSMA/CD | CSMA + abort on detected collision + jam + binary exponential backoff | stop talking the moment you hear someone else, retry later at random |
| Binary exponential backoff | after m-th collision wait K×512 bit times, K random in {0…2^m−1} | flip more coins each time you clash |
| CRC | r check bits R making ⟨D,R⟩ exactly divisible by generator G (mod-2) | tamper-evident seal |
| Switch | self-learning, plug-and-play link-layer device that selectively forwards frames | smart mailroom that learns who sits where |
| Flooding | forwarding a frame on all interfaces except the one it arrived on | asking the whole office |
| VLAN | virtual LAN partitioning one physical switch into isolated broadcast domains | departments sharing one mailroom with separate pigeonholes |
| Trunk port | switch port carrying frames of multiple VLANs between switches | inter-office mailbag |

## Top Traps

1. CRC: dropping leading zeros of R (R must be exactly r bits) — the #1 mark-killer.
2. Receiver-side CRC: divide the received string AS-IS (don't append zeros again).
3. ARP across subnets: A never ARPs for the remote host — it ARPs for the **default router**.
4. The IP src/dst NEVER change hop-by-hop (without NAT); the MACs change at EVERY hop.
5. Switch learns from the **SOURCE** MAC, forwards by the **DESTINATION** MAC.
6. "Filter" (drop) when destination lies on the same segment the frame arrived from.
7. ARP table at boot = EMPTY; entries have TTL ≈ 20 min ("soft state").
8. 2D parity can CORRECT exactly one bit; single parity only DETECTS odd numbers of errors.
9. CSMA collisions still happen because of **propagation delay** (that exact phrase).
10. Broadcast MAC is FF-FF-FF-FF-FF-FF — 255.255.255.255 is an IP, not MAC (1819 A11 trap).
