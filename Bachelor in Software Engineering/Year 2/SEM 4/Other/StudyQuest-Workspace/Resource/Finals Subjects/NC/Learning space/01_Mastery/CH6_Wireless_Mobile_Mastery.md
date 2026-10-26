# CH6 — Wireless & Mobile Networks Mastery

**Source deck:** `Chapter_7_V7_01_M@dni Updated Version.pptx` (the course's "Chapter 6: Wireless
and Mobile Networks" is taught from this 7th-edition file).

---

## 0. The Systemic Picture: Couriers Without Roads

Same courier company — but now the last leg has **no fixed road**:

- **Wireless** = the *link* problem: the van is replaced by a radio shout across open air —
  weaker with distance, drowned by other shouts, echoing off walls.
- **Mobility** = the *addressing* problem: the customer keeps moving house, but everyone still
  mails parcels to one permanent address. The trick: a **home agent** (family member at the
  permanent address) forwards mail to wherever you are now (**care-of address**).
- Two different challenges — the slides insist: **wireless (communication over the link)
  ≠ mobility (user changes point of attachment)**. Don't conflate them in essays.

## 1. Elements of a wireless network (definition pack)

| Element | Definition | Analogy |
|---|---|---|
| **Wireless host** | laptop/smartphone/IoT running applications; may be stationary or mobile — *wireless ≠ mobility* | the customer |
| **Base station** | typically connected to wired network; **relay** responsible for sending packets between wired network and wireless host(s) in its "area" — e.g., **cell towers, 802.11 access points** | neighbourhood pickup kiosk |
| **Wireless link** | connects mobile to base station / backbone; multiple access protocol coordinates access; various rates/distances | the shouting distance |
| **Infrastructure mode** | base station connects mobiles into wired network | kiosk-served suburb |
| **Ad hoc mode** | **no base stations**; nodes transmit only within link coverage and **organize themselves into a network: route among themselves** | neighbours passing parcels hand to hand |

**Taxonomy table (MCQ favourite — 1718 A9, 1617 A17):**

| | single hop | multiple hops |
|---|---|---|
| **infrastructure** | host↔base station↔Internet (WiFi, cellular) | mesh net (relay via wireless nodes) |
| **no infrastructure** | Bluetooth, ad hoc nets | **MANET, VANET** |

## 2. Wireless link characteristics (why wireless ≠ wire)

The three impairments (1617 Q7b — explain any two):
1. **Decreased signal strength / path loss**: radio attenuates as it propagates through matter.
2. **Interference from other sources**: shared frequencies (2.4 GHz WiFi + cellular + motors…).
3. **Multipath propagation**: signal reflects off objects/ground, copies arrive at slightly
   different times.

- **SNR (signal-to-noise ratio)**: larger SNR → easier to extract signal from noise.
  **SNR↑ ⇒ BER↓** (given physical layer); given SNR, pick the modulation meeting BER with highest
  throughput → **rate adaptation** (modulation/rate changes dynamically as the mobile moves).
- **Hidden terminal problem** (2020/21 Q3a — 4 marks with fading): A and C both hear B, but A and
  C **cannot hear each other** (obstacle or range) → unaware of their interference at B; their
  frames collide at B undetected. **Fading / signal attenuation** version: A and C's signals are
  too weak at each other's location, though both reach B. Draw the two-circles diagram.
- Consequence: **collision DETECTION is impossible in wireless** (your own transmission
  overwhelms the weak incoming signal; and hidden terminals exist anyway) → use **CSMA/CA
  (Collision AVOIDANCE)**, not CD.

## 3. CDMA (channel partitioning by code)

Unique **"chipping" code** assigned to each user; **all users share the same frequency**, each
encodes data with its own code (code set partitioning).
Encode: Zᵢ,ₘ = dᵢ · cₘ (data bit × code chip). Decode: dᵢ = (1/M)·Σ Zᵢ,ₘ·cₘ.
With carefully chosen (orthogonal) codes, two senders can transmit simultaneously and a receiver
using sender 1's code recovers sender 1's data from the summed channel. Used in cellular.

## 4. IEEE 802.11 (WiFi)

**Standards table (know 2–3 rows):** 802.11b — 2.4 GHz, 11 Mbps; 802.11g — 2.4 GHz, 54 Mbps;
802.11n (WiFi 4) — 2.4/5 GHz, 600 Mbps; 802.11ac (WiFi 5) — 5 GHz, ~3.5 Gbps; 802.11ax (WiFi 6).
**All use CSMA/CA**; all have base-station and ad-hoc versions.
802.11b spectrum 2.4–2.485 GHz divided into **11 channels** (1819 A20); AP admin picks the
channel; neighbouring APs on the same channel can interfere.

**Architecture:** **BSS (Basic Service Set, "cell")** = wireless hosts + **AP (access point =
base station)** in infrastructure mode (ad hoc = hosts only).

### Association (how a host joins — 1819 Q9a: "4 steps until host gets IP")
1. Host **scans channels, listening for beacon frames** (containing **AP's name = SSID** and
   **MAC address**) ← the TWO key beacon contents (2020/21 Q3 real).
2. Host **selects an AP**; sends **Association Request**; AP replies **Association Response**.
3. (May authenticate.)
4. Host runs **DHCP** to get an IP address in the AP's subnet.

- **Passive scanning**: APs send beacons; host listens. **Beacon frames are sent BY the AP,
  to all hosts in range.**
- **Active scanning**: host broadcasts a **Probe Request**; APs answer with Probe Responses;
  then association request/response. ("TWO ways to get connected" — 2020/21 real.)

### CSMA/CA — the 802.11 MAC protocol (write the algorithm)

**802.11 sender:**
1. If channel sensed **idle for DIFS** → transmit entire frame (**no collision detection!**).
2. If busy → start a **random backoff timer**; timer **counts down only while channel idle**
   (freezes when busy); transmit when timer hits 0; **if no ACK received, increase backoff
   interval and repeat step 2**.

**802.11 receiver:** if frame received OK → **return ACK after SIFS**.
**Why ACKs at all? Hidden terminal problem** — the sender can't detect the collision itself.
Why no CD: can't sense collisions while transmitting (weak received signal vs own transmission —
fading), and hidden terminals make detection useless anyway.

### RTS/CTS (collision avoidance "reservation")
Sender first transmits a small **Request-To-Send (RTS)** to the AP (RTS frames may still collide
— but they're short). AP broadcasts **Clear-To-Send (CTS)**; CTS heard by ALL nodes → the chosen
sender transmits the long data frame; **all other stations defer**. Result: long data frames
never collide ("reserve the channel with small packets").

### 802.11 frame addressing (THE 3-address trap)
- **Address 1** = MAC of the wireless host/AP that should **RECEIVE this frame** (next wireless hop)
- **Address 2** = MAC of the host/AP **TRANSMITTING this frame**
- **Address 3** = MAC of the **ROUTER interface** to which the AP attaches (the off-LAN anchor)
- **Address 4** = ad hoc mode only.
H1→AP→R1: frame from H1 has [A1=AP, A2=H1, A3=R1]. (Ethernet needs only 2 addresses; 802.11
needs 3 because the AP is a relay between the wireless cell and the wired subnet.)
Other frame fields: **duration** (reserved transmission time, RTS/CTS), **seq #** (for the
ACK/rdt scheme), **frame type** (RTS/CTS/ACK/data).

### Mobility within the same subnet + extras
- H1 moves BSS1→BSS2 inside one subnet: **IP address stays the same**; the **switch self-learning**
  fixes delivery (it sees H1's frames arriving via the new AP's port). (Definition of handoff-lite.)
- **Power management**: node tells AP "sleeping until next beacon"; beacon lists mobiles with
  queued frames; node wakes if it has traffic waiting.
- **802.15 / Bluetooth**: <10 m "personal area network", cable replacement, **ad hoc, master/slave**
  (slaves request permission from master), 2.4 GHz.

## 5. Cellular networks (3G/4G — labeling questions)

**2G (voice) chain:** mobiles → **BTS (Base Transceiver Station)** → **BSC (Base Station
Controller)** [BTS+BSC = **BSS, Base Station System**] → **MSC (Mobile Switching Center)** →
**Gateway MSC** → public telephone network.

**3G (voice+data) — the labeled-figure question (1617 Q7a, 12 marks; 1819 Q8; 2020/21 Q3b):**
Key insight (quote it): *the new cellular DATA network operates in PARALLEL with the existing
cellular voice network (except at the edge); voice core unchanged.*
- **Radio interface:** WCDMA / HSPA. **Radio Access Network: UTRAN** (Universal Terrestrial Radio
  Access Network) = mobiles → base stations (Node B) → **RNC (Radio Network Controller)**.
- **Voice path:** RNC → **MSC → GMSC → public telephone network**.
- **Data path:** RNC → **SGSN (Serving GPRS Support Node) → GGSN (Gateway GPRS Support Node) →
  public Internet**. (Core = GPRS Core Network.)
So: a 3G user's **voice** rides RNC→MSC→GMSC→PSTN; **data** rides RNC→SGSN→GGSN→Internet.

**4G LTE differences (short answer):** **all-IP core** (no separate voice/data — everything over
IP, tunneled from base station to gateway). Components: **UE** (user element), **eNodeB** (base
station), **MME** (Mobility Management Entity, control), **HSS** (Home Subscriber Service DB),
**S-GW** (Serving Gateway), **P-GW** (PDN Gateway, to Internet). 3G's RNC/SGSN/GGSN roughly map
to eNodeB/S-GW/P-GW. 5G: millimetre wave, pico-cells 10–100 m, dense base stations.

**First-hop spectrum sharing:** combined **FDMA/TDMA** (frequency channels × time slots), or
**CDMA**.

## 6. Mobility & Mobile IP (the diagram question — every year)

**Vocabulary (exact!):**

| Term | Definition |
|---|---|
| **Home network** | permanent "home" of the mobile (e.g., 128.119.40/24) |
| **Permanent address** | address in home network; **can ALWAYS be used to reach the mobile**; remains constant (e.g., 128.119.40.186) |
| **Home agent (HA)** | entity in home network performing mobility functions on behalf of the mobile when it is remote |
| **Visited network** | network where the mobile currently resides (e.g., 79.129.13/24) |
| **Care-of address (COA)** | address in the VISITED network (e.g., 79.129.13.2); used by the home agent to forward datagrams to the mobile |
| **Foreign agent (FA)** | entity in visited network performing mobility functions for the mobile |
| **Correspondent** | the host that wants to communicate with the mobile |

**Registration:** mobile arrives in visited network → obtains COA → FA registers the mobile with
the HA. End result: *FA knows the mobile; HA knows the LOCATION (COA) of the mobile.*

**Indirect routing ("triangle") — number the arrows (2020/21 Q3b real, 5 marks):**
1. Correspondent addresses datagram to the **permanent address** → it arrives at the home network.
2. **Home agent intercepts**, **encapsulates** (packet-within-a-packet) and **tunnels** the
   datagram to the **care-of address** in the visited network.
3. **Foreign agent decapsulates** and delivers to the mobile.
4. Mobile **replies DIRECTLY to the correspondent** (normal IP).
Properties: mobile location **transparent** to correspondent; mobile uses TWO addresses;
**triangle routing is inefficient** when correspondent and mobile sit in the same network.
Moving between networks while talking: register with new FA → new FA registers with HA → HA
updates COA → ongoing connections maintained ("transparent mobility").

**Direct routing (solves triangle routing — 1819 Q9b, 6 marks):**
1. Correspondent **requests and receives the mobile's COA from the home agent** (one lookup).
2. Correspondent then **sends datagrams straight to the care-of address / foreign agent**.
Costs: **non-transparent** to the correspondent; and if the mobile changes visited network,
the **anchor foreign agent** (the first visited FA) must forward/chain data to the new FA.

**Mobile IP (RFC 3344)** = exactly these pieces: **indirect routing of datagrams + agent
discovery (ICMP type 9 agent advertisements, R/H/F bits) + registration with home agent**.

**Cellular mobility version:** home network keeps an **HLR (Home Location Register)** database
(permanent #, profile, current location); visited network keeps a **VLR (Visitor Location
Register)** (one entry per visiting user). GSM uses indirect routing through the home MSC.

**GSM handoff (common MSC):** *handoff = mobile changes its point of attachment (base station)
mid-call* — goal: reroute via the new base station **without interruption**. Reasons: stronger
signal from new BSS / load balancing. Initiated by the **old BSS**. Steps (condensed):
old BSS→MSC "handoff needed" with list of new BSSs → MSC sets up path/resources to new BSS →
new BSS allocates a radio channel → "ready" signalled → **old BSS tells the mobile: hand off
now** → mobile + new BSS activate the channel → mobile signals MSC via new BSS → **MSC reroutes
the call**, old resources released. (1819 A17 MCQ: this process is called **handoff**.)

## Top Traps

1. **Wireless ≠ mobile** — a desktop on WiFi is wireless, not mobile; state both challenges.
2. CSMA/**CA** in 802.11 because collision **detection is impossible** (fading + hidden
   terminals) — never write "wifi uses CSMA/CD".
3. 802.11 receiver ACKs after **SIFS**; sender waits **DIFS** before transmitting — don't swap.
4. The 802.11 frame has **3 addresses** in infrastructure mode (A3 = router interface).
5. Beacon contains **SSID + AP MAC** — those exact two items.
6. Indirect routing: HA **encapsulates/tunnels** (say the word "encapsulation") to the **COA**.
7. Permanent address used BY THE CORRESPONDENT; COA used BY THE HOME AGENT — examiners check the
   direction.
8. Triangle-routing problem is solved by **direct routing** (correspondent learns COA first).
9. 3G: data exits via **SGSN→GGSN**, voice via **MSC→GMSC** — never cross them.
10. Handoff within a subnet (802.11) keeps the IP; it's the SWITCH (self-learning) that adapts.
