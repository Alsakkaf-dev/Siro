# CH4 — Network Layer Mastery (Data Plane + the Routing Essentials)

**Source decks:** `Chapter_4_V8_0 Muhalim Firoz Fariz v3 2024.pptx` (Data Plane) and
`Chapter_5_v8.0 Muhalim Firoz v2.pptx` (Control Plane).
**Heads-up on numbering:** your course's "Chapter 5" in the weekly schedule is *Link Layer & LANs*,
but the slide file named `Chapter_5_v8.0` is Kurose's *Network Layer: Control Plane* (Dijkstra,
Bellman-Ford, OSPF, BGP, ICMP). That control-plane material **appears in real finals**
(2020/21 Q1b Bellman-Ford; 1819 Q5 Dijkstra+BF for 13 marks; 1617 Q3 for 20 marks), so Part B
of this file covers it. Do not skip Part B.

---

## 0. The Systemic Picture: a National Courier Company

Hold this one picture for the whole chapter:

- **The network layer = the courier company's sorting-and-trucking system.** It moves parcels
  (datagrams) from any house (host) to any other house, hop by hop through **sorting depots (routers)**.
- **Forwarding (data plane)** = what one depot does with one parcel in nanoseconds: read the
  destination postcode, look it up in the depot's **local sorting chart (forwarding table)**, throw
  the parcel onto the right outgoing conveyor. *Local, per-router, hardware-fast.*
- **Routing (control plane)** = head-office planning: deciding what every depot's sorting chart
  should say so parcels follow good end-to-end routes. *Network-wide logic, software, milliseconds.*
  - Traditional: every depot manager talks to neighbouring depots and computes his own chart
    (**per-router control** — OSPF/BGP).
  - SDN: one **remote headquarters (remote controller)** computes all charts and installs them
    (**logically centralized control**).
- **Slide analogy (memorize, it is quotable in answers):** *routing = planning the trip from
  source to destination; forwarding = getting through a single interchange.*

---

# PART A — THE DATA PLANE (deck Chapter_4_V8)

## A1. Two key network-layer functions

| Function | Plane | Scope | Timescale | Implemented in |
|---|---|---|---|---|
| **Forwarding** — move packet from router's input to appropriate output | Data plane | local, per-router | nanoseconds | hardware |
| **Routing** — determine route taken by packets source→destination (routing algorithms) | Control plane | network-wide | milliseconds | software (router or remote SDN server) |

The **routing algorithm fills in the forwarding table**; the forwarding table is the interface
between the two planes. (Classic MCQ: "What does a router use to fill its forwarding table?" →
**routing algorithm**, 1819 A7.)

**Internet's service model = best effort**: no guarantee of delivery, order, bandwidth or timing.
(ATM CBR/ABR are the contrast rows in the slide table.)

## A2. Inside a router (the depot floor plan)

Four components (slide: "Four router components"):
1. **Input ports** — line termination (physical), link-layer protocol (e.g., Ethernet), then
   **lookup + forwarding + queueing**: using header fields, look up output port in a **shadow copy**
   of the forwarding table held *in input-port memory* ("match plus action").
   *Why shadow copy? Forwarding decisions are made locally at the input port, avoiding a bottleneck
   at the central routing processor.* (Direct past short-answer.)
2. **Switching fabric** — transfers packet input→output. **Switching rate**: ideally N × line rate.
3. **Output ports** — buffering (queueing) + link layer (send) + line termination.
4. **Routing processor** — runs routing protocols (RIP, OSPF, BGP), computes tables.

**Three switching fabrics (know all three + their bottleneck):**

| Fabric | How | Bottleneck / note | Analogy |
|---|---|---|---|
| **Memory** | 1st-gen routers; CPU copies packet into RAM, lookup, copy to output | speed limited by memory bandwidth (**2 bus crossings per datagram**) | a clerk carries every parcel across the room himself |
| **Bus** | input port memory → output port memory via one shared bus | **bus contention**; one packet on bus at a time (e.g., 32 Gbps Cisco 5600) | one conveyor belt everyone must share |
| **Crossbar / interconnection network** | grid of switches; parallel transfers; fragment datagram into fixed-length **cells**, switch, reassemble at exit | overcomes bus limit; multistage; Cisco CRS: 8 planes, 100s Tbps | a grid of conveyor belts running simultaneously |

**Queueing — the two exam-favourite phenomena:**
- **Input port queueing**: happens when *the fabric is slower than the combined input ports*.
  Causes **HOL (Head-of-the-Line) blocking**: *the queued datagram at the FRONT of the queue
  prevents others BEHIND it in the queue from moving forward* (even though their output port is
  free, because the front packet's output port is contended). Exam: define HOL (1617 A4, 1819 Q2).
  Analogy: the front truck waits for dock 1, and trucks behind it bound for free dock 2 cannot pass.
- **Output port queueing**: arrival rate via the fabric exceeds the output line speed → buffer
  overflow → loss. Needs a **drop policy** (which packet to drop, e.g., tail drop / priority) and a
  **scheduling discipline** (which queued packet to send next).

**Buffer sizing — A GUARANTEED CALCULATION (1617 Q1a, 1819 Q1, slide exercise):**
- Old rule (RFC 3439): buffer = RTT × C.
- **With N flows: buffer = (RTT × C) / √N** ← the formula the exams use.
- Worked: C=20 Mbps, RTT=400 ms, N=16 → (0.4 s × 20 Mbps)/√16 = 8 Mbits/4 = **2 Mbits**.
- Always: convert ms→s, state units (Mbits), simplify √N first.

## A3. IP datagram format (the parcel label)

20-byte header (no options). Fields you must be able to NAME and USE:

```
 0                   15 16                              31
+---------+-----------+--------------------------------+
| ver|hl  | TOS       |  total length (bytes)          |
+---------------------+-----+--------------------------+
| 16-bit identifier   |flags|  13-bit fragment offset  |
+---------------------+-----+--------------------------+
| TTL     | upper-layer protocol | header checksum     |
+------------------------------------------------------+
|            32-bit source IP address                  |
+------------------------------------------------------+
|            32-bit destination IP address             |
+------------------------------------------------------+
|            options (if any) / data                   |
+------------------------------------------------------+
```

- **total length** = header + data, in bytes. Max 65,535.
- **identifier, flags, fragment offset** = the fragmentation trio (below).
- **TTL** decremented at each router; at 0 → discard + ICMP type 11 code 0.
- **upper-layer protocol**: 6 = TCP, 17 = UDP (used only at final destination).
- Overhead reminder from slides: datagram header 20 B *plus* TCP/UDP's own overhead.

## A4. Fragmentation & reassembly — THE recipe (appears in EVERY paper)

**Facts:** links have an **MTU (Maximum Transfer Unit) = largest possible link-level frame**.
Ethernet MTU = 1500 B. A big datagram is fragmented IN the network (at the router meeting the
small-MTU link) and **reassembled ONLY at the final destination**.

**Recipe** (datagram of L bytes, link MTU = M, ID = x):
1. Usable data per full fragment: `d = M − 20`, then **round DOWN to a multiple of 8**.
   (For M=1500: d=1480. For M=500: d=480. For M=1860: d=1840. For M=2100: d=2080.)
2. Original data to carry: `D = L − 20`.
3. Number of fragments: `n = ⌈D / d⌉`.
4. Fragment i (i = 0…n−1): data `dᵢ = d` except last = `D − d(n−1)`;
   **length = dᵢ + 20**; **ID = x** (same for ALL fragments);
   **flag = 1** (more fragments) except **last flag = 0**;
   **offset = (d × i)/8** (units of 8 bytes!).
5. Check: Σ data = D. Offsets increase by d/8.

**Worked (slide example, verified):** L=5000, M=1500, ID=333 →
D=4980, d=1480, n=4: fragments (length/ID/flag/offset):
**(1500, 333, 1, 0), (1500, 333, 1, 185), (1500, 333, 1, 370), (560, 333, 0, 555)**.
Note 4980 = 1480+1480+1480+540 and 540+20 = 560.

**Worked (2020/21 real):** L=7000, M=1860, ID=629 → d=1840, D=6980, n=4:
**(1860,629,1,0), (1860,629,1,230), (1860,629,1,460), (1480,629,0,690)**.

**Reverse direction (1718 Q3):** given fragments with a gap in offsets, the missing fragment's
offset = previous offset + (previous data)/8; reassembled original length = Σ data + 20.

**Traps:** offset is in 8-byte units, not bytes; data per fragment must divide by 8; ID identical
across fragments; last flag = 0; "why 1480 not 1500?" → 1480 data + 20 header = 1500 = MTU.

## A5. IPv4 addressing & subnetting — the computational core

**Definitions (exact wording matters):**
- **IP address**: 32-bit identifier for each **host or router INTERFACE**. (One IP per interface;
  routers typically have multiple interfaces.)
- **Interface**: connection between host/router and physical link.
- **Subnet**: device interfaces that can physically reach each other **without passing through an
  intervening router**; a logical, visible subdivision of an IP network.
- **Subnet mask**: 32 bits; **1s in the network portion, 0s in the host portion**; *used to
  separate the network portion of an IP address from the host portion* (this exact sentence is
  MCQ answer 1617 A6).
- **Network address**: host portion all 0s (the first address — names the subnet).
- **Broadcast address**: host portion all 1s (the last address).
- **Usable hosts in a /p subnet = 2^(32−p) − 2.**
- **CIDR (Classless Inter-Domain Routing)**: format a.b.c.d/x; subnet portion of arbitrary length;
  replaced **classful addressing** (A: /8, B: /16, C: /24) which wasted addresses (an org needing
  2000 hosts got a class B with 65,534 — CIDR gives /21 = 2046).

**The two mechanical methods (show one in workings, the other to check):**
1. **AND method (network address):** write IP in binary, AND with mask → network address.
2. **Binary method (range):** freeze the network bits, set host bits all-0 (network) and all-1
   (broadcast); first usable = network+1, last usable = broadcast−1.

**Equal-size subnetting recipe (slides' 6 steps, condensed):**
1. Write address in binary; mark network portion (NP) vs host portion (HP).
2. Need S subnets → borrow x bits where 2^x ≥ S (borrow from the **leftmost** HP bits).
3. New prefix = old prefix + x; new mask accordingly.
4. Enumerate subnets by counting in the borrowed bits: 00…, 01…, 10…, 11…
5. In each subnet: network addr (HP all 0), broadcast (HP all 1), usable = in between.
6. Build the table: Subnet | Network address | Usable range | Broadcast | Mask.

**Worked (slide, verified):** 192.168.1.0/24 into 4 subnets → borrow 2 bits → /26
(255.255.255.192):

| Subnet | Network | Usable range | Broadcast |
|---|---|---|---|
| 0 | 192.168.1.0 | .1 – .62 | 192.168.1.63 |
| 1 | 192.168.1.64 | .65 – .126 | 192.168.1.127 |
| 2 | 192.168.1.128 | .129 – .190 | 192.168.1.191 |
| 3 | 192.168.1.192 | .193 – .254 | 192.168.1.255 |

**"5 subnets" twist (1617 Q2, slide self-study):** need 5 → 2^3 = 8 subnets (3 bits), 3 spare
"for future use". From /20 → new prefix /23. Subnets advance in steps of 2 in the third octet
(200.23.0.0/23, 200.23.2.0/23, 200.23.4.0/23, …).

**VLSM (different sizes — your 2025 midterm style):** allocate **largest first**, each dept the
smallest power of 2 that fits (hosts+2 ≤ 2^h): 50→/26, 30→/27, 20→/27, 10→/28; place each next
subnet at the next free boundary. Router-to-router links → /30 (2 usable).

**How addresses are obtained:** network gets its block from its ISP / regionally from
**ICANN → 5 regional registries (ARIN, RIPE, APNIC, LACNIC...)**; a host gets its address
**statically (sysadmin)** or via **DHCP**.

## A6. DHCP — Dynamic Host Configuration Protocol

Goal: host **dynamically obtains IP address (a lease)** from server when joining the network;
**plug-and-play**; supports mobile users; addresses reused.

**The 4-step process (in order — ordering was a real question, 1415):**
1. **DHCP discover** (host broadcasts; src 0.0.0.0, dst 255.255.255.255, UDP port 67) *(optional)*
2. **DHCP offer** (server responds, broadcast; may receive offers from >1 server) *(optional)*
3. **DHCP request** (host echoes/chooses its selected offer)
4. **DHCP ACK** (server confirms; "yiaddr" = your IP address)

Mnemonic: **D-O-R-A**. DHCP returns more than an IP: **first-hop router address, DNS server name
& IP, network mask**. Trap (1718 A4): there is no "DHCP answer" message — it is **ACK**.
Encapsulation chain: DHCP in **UDP** in **IP** in **Ethernet** (frame broadcast FF-FF-FF-FF-FF-FF).

## A7. NAT — Network Address Translation

**Idea:** all devices in the local network share ONE public IPv4 address as far as the outside
world is concerned; inside they use **private addresses**: **10/8, 172.16/12, 192.168/16**
(memorize these three prefixes).

**Advantages (4 — quotable list):** one ISP address for all devices; can change inside hosts'
addresses without telling the world; can change ISP without renumbering inside; security —
inside devices not directly addressable/visible.

**Router mechanics (the 3 musts):**
1. **Outgoing**: replace (source IP, port) with (NAT IP, new port).
2. **Remember** in the **NAT translation table**: (NAT IP, new port) ↔ (source IP, port).
3. **Incoming**: replace (NAT IP, new port) in destination fields with stored (source IP, port).

**Translation table worked example (slide numbers):** host 10.0.0.1 port 3345 → server
128.119.40.186:80, NAT WAN address 138.76.29.7:

| WAN side addr | LAN side addr |
|---|---|
| 138.76.29.7, **5001** | 10.0.0.1, **3345** |

Datagram legs: (s=10.0.0.1:3345 → d=128.119.40.186:80) ⇒ NAT ⇒ (s=138.76.29.7:5001 → d=server:80);
reply (s=server:80 → d=138.76.29.7:5001) ⇒ NAT ⇒ (d=10.0.0.1:3345).
**Controversy (essay fodder):** routers "should" only process up to layer 3; violates end-to-end
argument; shortage should be solved by IPv6; NAT traversal problem. Yet "NAT is here to stay."

## A8. IPv6 + transition

Motivation: 32-bit space exhausted (ICANN allocated the last chunk in 2011); also **faster
processing via 40-byte FIXED header** and flow treatment (QoS).

| IPv4 | IPv6 |
|---|---|
| 32-bit addresses | **128-bit** addresses |
| variable 20–60 B header | **fixed 40-byte** header |
| fragmentation by routers | **NO fragmentation** (ICMPv6 "Packet Too Big") |
| header checksum at every hop | **NO checksum** (faster per-hop processing) |
| options in header | options outside header via **next header** field |
| broadcast | no broadcast (multicast) |

IPv6 header fields: ver, **pri (traffic class)**, **flow label**, **payload len** (data only —
payload 4 B ⇒ total 44 B), **next hdr** (upper-layer protocol), **hop limit**, src/dst (128b).

**Transition = tunneling:** *IPv6 datagram carried as PAYLOAD inside an IPv4 datagram* between
IPv4 routers ("packet within a packet"). No flag days. Draw: logical view = IPv6 tunnel over the
IPv4 cloud.

## A9. Generalized forwarding & SDN (match+action / OpenFlow)

- **Destination-based forwarding** (traditional): match destination IP only → forward.
- **Generalized forwarding (SDN/OpenFlow)**: match ANY header fields (link/network/transport),
  actions = **drop / forward(port) / modify / send to controller**; plus priority & counters.
- **Flow table entry = Match + Action + Stats.**
- Unifying view (quotable): Router = match longest dest prefix → forward; Switch = match dest MAC
  → forward or flood; Firewall = match IP+ports → permit/deny; NAT = match IP+port → rewrite.

---

# PART B — CONTROL PLANE ESSENTIALS (deck Chapter_5_v8) — tested in real finals

## B1. Link-State: Dijkstra's algorithm (the table question)

**Properties:** centralized — full topology and link costs known to all nodes (via link-state
broadcast); computes least-cost paths from ONE source to all nodes → that node's forwarding
table; iterative — after k iterations, know least-cost path to k destinations. Complexity O(n²).

**Algorithm (table method — write EXACTLY this way in exams):**
- Init: N′={u}; D(v)=c(u,v) for neighbours, ∞ otherwise.
- Loop: add the node w ∉ N′ with minimum D(w) to N′; for every neighbour v ∉ N′:
  **D(v) = min(D(v), D(w) + c(w,v))**; record predecessor p(v). Until all nodes in N′.

**Worked (the classic u-topology used in your slides; verified):**
costs: u-v=2, u-x=1, u-w=5, v-x=2, v-w=3, x-w=3, x-y=1, w-y=1, w-z=5, y-z=2.

| Step | N′ | D(v),p | D(w),p | D(x),p | D(y),p | D(z),p |
|---|---|---|---|---|---|---|
| 0 | u | 2,u | 5,u | **1,u** | ∞ | ∞ |
| 1 | ux | **2,u** | 4,x | — | 2,x | ∞ |
| 2 | uxv | — | 3,v* | — | **2,x** | ∞ |
| 3 | uxvy | — | **3,y** | — | — | 4,y |
| 4 | uxvyw | — | — | — | — | **4,y** |
| 5 | uxvywz | done |

*(ties, e.g., v vs y at cost 2, may be broken arbitrarily — say so if asked; w reaches 3 via
v (2+3=5→ actually min(4, 2+3)=4 stays via x, then 2+1=3 via y) — final: D = v2,w3,x1,y2,z4.)*
- **Forwarding table for u**: trace predecessors back to u's outgoing link:
  v→(u,v); x→(u,x); y→(u,x); w→(u,x); z→(u,x).

## B2. Distance Vector: Bellman-Ford (the equation question)

**The equation (write it verbatim, it earns the marks):**
`Dx(y) = min over all neighbours v of x { c(x,v) + Dv(y) }`

- DV is **decentralized, iterative, asynchronous**: each node sends its own distance vector
  estimate to its NEIGHBOURS only, from time to time; recompute on local cost change or on
  receiving a neighbour's DV; notify neighbours only if your DV changed ("self-stopping").
- **Good news travels fast; bad news travels slow → count-to-infinity problem** (the 4→60 example:
  y and z bounce ever-increasing costs to x through each other).
- Slide worked example: Du(z) = min{c(u,v)+Dv(z), c(u,x)+Dx(z), c(u,w)+Dw(z)}
  = min{2+5, 1+3, 5+3} = **4**.

**Exam pattern (2020/21 Q1b, 4+2 marks):** "Write the COMPLETE Bellman-Ford equation for router A
to router B" = list ALL of A's neighbours inside the min{...} with their link costs + the
neighbours' costs to B, then evaluate; then "construct the least cost paths" = draw the tree.

## B3. LS vs DV comparison (MCQ/short answer)

| | Link State (Dijkstra) | Distance Vector (Bellman-Ford) |
|---|---|---|
| Info needed | full topology (broadcast) | neighbours' DVs only |
| Messages | O(n²) | neighbour exchanges; convergence varies |
| Convergence problems | oscillations possible | routing loops; **count-to-infinity** |
| Robustness | wrong cost ad → each node computes only its OWN table | wrong path ad propagates ("black-holing"); errors spread |

## B4. Internet routing in practice (definition-level)

- **AS (autonomous system)**: routers aggregated into regions/"domains"; needed for **scale**
  (billions of destinations) and **administrative autonomy**.
- **Intra-AS = IGP**: **RIP** (classic DV, 30 s exchanges), **EIGRP** (DV), **OSPF** (link-state;
  floods LSAs **directly over IP**; each router runs Dijkstra; all messages **authenticated**;
  **hierarchical OSPF**: areas + backbone for large nets).
- **Inter-AS: BGP** — "the glue that holds the Internet together," de facto standard;
  **eBGP** obtains reachability from neighbouring ASes; **iBGP** propagates it to AS-internal
  routers; route choice is **policy-driven** (policy > performance inter-AS; performance focus
  intra-AS). MCQ: which protocol for distant ASes? → **BGP** (1819 A6).
- **SDN control plane**: remote controller computes/installs flow tables; southbound API =
  **OpenFlow (over TCP)**; northbound API to network-control apps; why centralize? easier
  management, programmable, avoids per-router misconfig; traffic engineering impossible-with-LS/DV
  examples (split flows, per-flow routing).
- **ICMP**: used by hosts & routers to communicate **network-level information** (error reporting:
  unreachable host/network/port/protocol; echo). Carried **IN IP datagrams**. Know:
  **type 8/0 echo request, type 0/0 echo reply (ping), type 11/0 TTL expired (traceroute),
  type 3/3 dest port unreachable (traceroute termination)**.
- **Traceroute mechanics**: send UDP segments with TTL=1,2,3,… to an unlikely port; nth router
  drops and returns ICMP 11/0 (router name+IP → RTT measured); destination returns ICMP 3/3 →
  stop.

---

## Terminology Table (exact definitions the marker wants)

| Term | Exact definition (from your slides) | Courier analogy |
|---|---|---|
| Forwarding | move packets from router's input to appropriate router output | getting through one interchange |
| Routing | determine route taken by packets from source to destination | planning the whole trip |
| Forwarding table | local table mapping destination address ranges → output link | depot sorting chart |
| Longest prefix match | when looking for a forwarding-table entry, use the **longest address prefix that matches** the destination address | the most specific postcode rule wins |
| HOL blocking | queued datagram at FRONT of input queue prevents others in queue from moving forward | front truck blocks the lane |
| MTU | largest possible link-level frame | max parcel size a truck can carry |
| Fragmentation | dividing a large IP datagram into several smaller datagrams, reassembled only at destination | splitting a shipment into boxes, rejoined by the receiver |
| Subnet | device interfaces that can physically reach each other without an intervening router | houses on one street |
| Subnet mask | 32 bits: 1s in network portion, 0s in host portion; separates network from host part | the part of the postcode naming the street |
| Network address | host bits all 0 — identifies the subnet | the street's name |
| Broadcast address | host bits all 1 — message to all hosts on subnet | "every house on this street" |
| CIDR | classless inter-domain routing; a.b.c.d/x, arbitrary-length subnet portion | flexible postcode lengths |
| DHCP | protocol letting a host dynamically obtain ("lease") an IP from a server; plug-and-play | hotel reception assigns you a room |
| NAT | router replaces (source IP, port) of outgoing datagrams with (NAT IP, new port), remembering each pair in a translation table | the receptionist relabels all outgoing mail with the hotel's address + a tracking number |
| Tunneling | IPv6 datagram carried as payload inside an IPv4 datagram | a parcel inside another parcel |
| Match+action | match bits in arriving packet's header(s), take action (forward/drop/modify) | sorting rule card |
| AS | group of routers under same administrative control ("domain") | one courier company's region |
| ICMP | protocol for network-level error reporting & signaling, carried in IP | "return to sender" slips |

## Top Traps (lose-marks list)

1. **Offset in 8-byte units** — writing byte offsets in fragmentation tables loses the question.
2. **−2 for usable hosts** (network + broadcast are not assignable) — but a /30 still has 2 usable;
   /31 and /32 are special (don't use them unless asked).
3. Subnetting: **borrow from the LEFTMOST host bits**; network portion NEVER changes.
4. "Need 5 subnets" → round UP to 8 (2³); state the spare-subnet count if asked.
5. Longest prefix match: a more-specific (longer) prefix **beats** an earlier shorter one — order
   in the table is not what wins; LENGTH wins.
6. Dijkstra: update ONLY neighbours of the node just added, and only if not already in N′; show
   p(v) predecessors or you lose the forwarding-table marks.
7. Bellman-Ford "complete equation" = enumerate ALL neighbours, not just the best one.
8. DHCP step 4 is **ACK** (not "answer"); discover/offer are the optional pair.
9. NAT table columns are **WAN side | LAN side** — each row is one (IP, port) pair mapping.
10. IPv6: no fragmentation, no checksum, fixed 40-B header — three "what changed" marks.
11. Buffer formula: **divide by √N**, not N.
12. ICMP is carried in IP datagrams — it does NOT use UDP/TCP (1819 A3 trap).
