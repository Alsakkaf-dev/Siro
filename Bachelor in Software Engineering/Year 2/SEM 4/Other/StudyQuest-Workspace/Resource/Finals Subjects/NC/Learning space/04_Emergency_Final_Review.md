# 04 — Emergency Final Review (night-before sheet)

Everything here is exact-term, exam-ready. If you can reproduce this file, you pass.

---

## A. Terminology Glossary (the exact answers MCQs want)

**Network layer**
- **Forwarding**: move packets from a router's input to the appropriate router output (data plane, local, hardware, ns).
- **Routing**: determine the route taken by packets from source to destination (control plane, network-wide, software, ms). Routing algorithm fills the forwarding table.
- **Longest prefix match**: use the longest address prefix that matches the destination address.
- **HOL blocking**: queued datagram at the FRONT of the input queue prevents others in the queue from moving forward.
- **Switching fabrics**: memory (CPU copies, 2 bus crossings), bus (bus contention), crossbar/interconnection network (parallel, cells).
- **MTU**: largest possible link-level frame (Ethernet: 1500 B).
- **Fragmentation**: one datagram → several; reassembled ONLY at final destination; header trio = identifier, flags, offset.
- **Subnet**: interfaces that can physically reach each other without an intervening router.
- **Subnet mask**: 1s in network portion, 0s in host portion; separates network from host part.
- **CIDR**: a.b.c.d/x — arbitrary-length subnet portion (vs classful A=/8, B=/16, C=/24).
- **DHCP**: dynamically obtain (lease) an IP from a server; "plug-and-play"; D-O-R-A = Discover, Offer, Request, ACK (UDP 67/68; also returns first-hop router, DNS, mask).
- **NAT**: replace (src IP, port) of outgoing datagrams with (NAT IP, new port); remember pairs in NAT translation table; reverse for incoming. Private blocks: **10/8, 172.16/12, 192.168/16**.
- **IPv6**: 128-bit addresses, fixed 40-B header, NO fragmentation, NO checksum; transition by **tunneling** (IPv6 inside IPv4).
- **Match+action**: match header-field bits, take action (forward/drop/modify/send-to-controller) — OpenFlow flow table = Match | Action | Stats.
- **AS**: autonomous system ("domain") — scale + administrative autonomy. Intra-AS: RIP (DV), OSPF (LS, Dijkstra, floods LSAs over IP, authenticated). Inter-AS: **BGP** (eBGP/iBGP, policy-driven, TCP).
- **ICMP**: network-level error reporting/signaling carried IN IP datagrams. Types: **8/0 echo request, 0/0 echo reply, 11/0 TTL expired, 3/3 port unreachable** (traceroute uses the last two).
- **Dijkstra (LS)**: needs full topology; D(v)=min(D(v), D(w)+c(w,v)); O(n²).
- **Bellman-Ford (DV)**: **Dx(y) = min over neighbours v {c(x,v) + Dv(y)}**; decentralized; count-to-infinity = "bad news travels slow".

**Link layer**
- Responsibility: transfer datagram from one node to a **physically adjacent** node over a link. L2 PDU = **frame**.
- Services (6): framing/link access, reliable delivery (used on wireless, not fiber), flow control, error detection, error correction, half/full duplex. NOT congestion control.
- Implemented in the **NIC/adapter** in every host AND router.
- **MAC address**: 48-bit, NIC ROM, flat/portable, IEEE-administered; broadcast **FF-FF-FF-FF-FF-FF**. (IP = hierarchical postal address, not portable.)
- **ARP**: IP→MAC on the LAN; table = ⟨IP, MAC, TTL≈20 min⟩; query broadcast, reply unicast; plug-and-play; empty at boot. Cross-subnet: ARP for the ROUTER.
- **CRC**: r bits R such that ⟨D,R⟩ exactly divisible by G (mod 2); r = len(G)−1; detects bursts < r+1 bits.
- **2-D even parity**: detect + CORRECT single bit (failing row × failing column).
- **Multiple access classes**: channel partitioning (TDMA/FDMA/CDMA), random access (ALOHA 18%, S-ALOHA 37%, CSMA, CSMA/CD, CSMA/CA), taking turns (polling: master SPOF; token: token SPOF).
- **CSMA**: listen before transmit; collisions persist due to **propagation delay**.
- **CSMA/CD**: detect while transmitting → abort + **jam signal** → **binary exponential backoff**: after m-th collision wait K×512 bit times, K ∈ {0..2^m−1}. Wired only.
- **Ethernet**: connectionless, unreliable, unslotted CSMA/CD; frame = preamble(8B sync) | dst | src | type | data 46–1500 | CRC.
- **Switch**: self-learning, plug-and-play, transparent link-layer device; table ⟨MAC, interface, time⟩; learn from SRC, forward by DST; **flood if unknown; filter (drop) if dst on arrival segment**; per-link collision domains, full duplex.
- **VLAN**: traffic isolation on one switch; **trunk port** carries multiple VLANs between switches.

**Wireless & mobile**
- Elements: wireless host, **base station (relay: cell tower, AP)**, wireless link; infrastructure vs **ad hoc** (no base station, self-organizing). Taxonomy: MANET/VANET = multi-hop, infrastructure-less.
- Impairments: **path loss** (attenuation), **interference** (shared 2.4 GHz), **multipath propagation** (reflections). SNR↑ ⇒ BER↓; **rate adaptation**.
- **Hidden terminal**: A,C both hear B but not each other → undetectable collision at B (also caused by fading).
- **CDMA**: all share frequency; each user a unique chipping code.
- **802.11**: BSS = hosts + AP; 11 channels in 2.4 GHz (b); **beacon = SSID + AP MAC**; passive vs active scanning; association request/response then DHCP.
- **CSMA/CA**: idle DIFS → send whole frame; busy → random backoff counting down only while idle; receiver ACKs after SIFS; no ACK → bigger backoff. **RTS/CTS** reserves channel for long frames.
- 802.11 frame: **A1 = receiver of this transmission, A2 = transmitter, A3 = router interface** (A4 ad hoc).
- **Mobility vocab**: home network / **permanent address** (used by correspondent, constant) / **home agent** / visited network / **care-of address** (used by home agent) / **foreign agent** / correspondent.
- **Indirect routing**: correspondent→home agent→(encapsulate/tunnel)→COA/foreign agent→mobile; reply direct. Problem: **triangle routing**. **Direct routing**: correspondent asks HA for COA once, sends directly; non-transparent; moving mid-session handled by **anchor foreign agent**.
- **Mobile IP** = indirect routing + agent discovery (ICMP type 9) + registration.
- **3G**: voice RNC→**MSC→GMSC**→PSTN; data RNC→**SGSN→GGSN**→Internet; radio = UTRAN (WCDMA); data core = GPRS. **4G LTE: all-IP core** (eNodeB, MME, HSS, S-GW, P-GW). **HLR/VLR** databases. **Handoff**: old BSS initiates; MSC reroutes; reasons = stronger signal / load balance.

## B. Subnetting Recipe Card

```
GIVEN a.b.c.d/p:
  host bits h = 32−p ; usable = 2^h − 2 ; block size in "interesting octet" = 256 − mask-octet
  network  = address AND mask          (host bits → 0)
  broadcast = network + (block−1)      (host bits → 1)
  usable   = network+1 … broadcast−1

DIVIDE /p INTO S EQUAL SUBNETS:
  borrow x bits, 2^x ≥ S  (need 5 → x=3 → 8 subnets, 3 spare)
  new prefix = p + x ; subnets advance by the new block size
  per subnet: usable = 2^(32−p−x) − 2

VLSM (different sizes):  sort demands DESCENDING; for each, smallest h with 2^h−2 ≥ need;
  allocate at next free boundary; router-router links = /30.

MASK OCTETS:  /25=128 /26=192 /27=224 /28=240 /29=248 /30=252
BLOCK SIZES:  128, 64, 32, 16, 8, 4
POWERS:       2^7=128 … 2^11=2048 (2000 hosts → /21)
```

## C. Fragmentation Recipe Card

```
data per fragment d = (MTU − 20) rounded DOWN to multiple of 8
total data D = L − 20 ; fragments n = ceil(D/d)
each: length = data+20 | same ID | flag 1 (last: 0) | offset += d/8  (8-BYTE UNITS)
check: Σdata = D
```

## D. CRC Recipe Card

```
r = bits(G) − 1
SENDER:  divide D·2^r by G with XOR → remainder R (keep r bits incl. leading 0s); send D|R
RECEIVER: divide received AS-IS by G → remainder 0 = accept, else error
```

## E. Comparison Tables

**IPv4 vs IPv6**
| | IPv4 | IPv6 |
|---|---|---|
| Address | 32-bit | 128-bit |
| Header | variable 20–60 B | fixed 40 B |
| Fragmentation | routers + dst | **none** (ICMPv6 Packet Too Big) |
| Checksum | per-hop header checksum | **none** |
| Options | in header | outside, via next-header |
| New fields | — | flow label, priority/traffic class |

**Router vs Switch**
| | Router | Switch |
|---|---|---|
| Layer | 3 (network) | 2 (link) |
| Address used | IP (longest prefix match) | MAC (exact match) |
| Table built by | routing algorithms (OSPF/BGP) | **self-learning** |
| Unknown destination | default route | **flood** |
| Configuration | required | plug-and-play, transparent |

**CSMA/CD vs CSMA/CA**
| | CSMA/CD (Ethernet, wired) | CSMA/CA (802.11, wireless) |
|---|---|---|
| Collisions | DETECT while transmitting → abort + jam | AVOID — cannot detect (fading, hidden terminals) |
| Backoff | after collision: K×512 bit times, K∈{0..2^m−1} | BEFORE transmitting when busy; countdown only while idle; grows when ACK missing |
| ACKs | none | link-layer ACK after SIFS |
| Reservation | none | optional RTS/CTS |
| Waits | — | DIFS before send, SIFS before ACK |

**UDP vs TCP**
| | UDP | TCP |
|---|---|---|
| Connection | none | handshake, connection-oriented |
| Reliability | none (may lose/reorder) | reliable, in-order |
| Control | none | flow + congestion control |
| Header | 8 B | 20 B |
| Carries | DNS, SNMP, DHCP, streaming | HTTP, SMTP, BGP, OpenFlow |

**LS vs DV routing**
| | Link State (Dijkstra/OSPF) | Distance Vector (Bellman-Ford/RIP) |
|---|---|---|
| Knowledge | full topology via flooding | neighbours' vectors only |
| Compute | each node, O(n²) | distributed, iterative, asynchronous |
| Failure modes | oscillations | routing loops, count-to-infinity |
| Trust | each computes own table | errors propagate (black-holing) |

## F. Header Diagrams (ASCII, reproduce on scrap paper at exam start)

**IPv4 (20 B):**
```
|ver|hlen|  TOS   |        total length         |
|     identifier      |flg|   fragment offset   |
|  TTL   | protocol |       header checksum     |
|              source IP (32)                   |
|           destination IP (32)                 |
```

**IPv6 (40 B):**
```
|ver| pri |        flow label                   |
| payload length      | next hdr  | hop limit   |
|              source address (128)             |
|           destination address (128)           |
```

**Ethernet frame:**
```
| preamble 8B | dst MAC 6B | src MAC 6B | type 2B | DATA 46–1500B | CRC 4B |
```

**802.11 frame (addressing core):**
```
| frame ctl | duration | A1 recv | A2 xmit | A3 router | seq | A4 (adhoc) | payload | CRC |
```

**ARP table row:** `⟨ IP address ; MAC address ; TTL (~20 min) ⟩`
**Switch table row:** `⟨ MAC ; interface ; timestamp ⟩`
**NAT table row:** `⟨ WAN: NAT-IP, new-port ⇄ LAN: src-IP, src-port ⟩`
**DHCP:** Discover → Offer → Request → ACK (UDP 67/68, broadcasts, yiaddr)

## G. The 12 numbers to memorize
1500 (Ethernet MTU) ・ 46–1500 (Ethernet payload) ・ 48-bit MAC / 32-bit IPv4 / 128-bit IPv6 ・
20 B IP header / 40 B IPv6 ・ TTL ~20 min (ARP) ・ K×512 bit times ・ 1/e=37% S-ALOHA, 1/(2e)=18% ALOHA ・
11 channels (802.11b 2.4 GHz) ・ /30 = 2 usable ・ buffer = RTT·C/√N ・ ICMP 11/0 & 3/3 ・
private: 10/8, 172.16/12, 192.168/16
