# CH0 — Prerequisite Refresher (Ch1–3, NOT directly examined)

> Final exam scope = Chapter 4 to the end. But Ch4–6 questions silently assume you know
> layering, encapsulation, and TCP vs UDP. This is the 15-minute version from your own
> Chapter 1–3 slides. Read once, then live in CH4–CH6.

---

## 1. The 5-Layer Internet Stack (TCP/IP)

**The courier-company picture:** sending data = sending a parcel overseas.

| # | Layer | Job (slide wording) | PDU name | Courier analogy |
|---|-------|---------------------|----------|-----------------|
| 5 | Application | supporting network applications (HTTP, SMTP, IMAP, DNS) | **message** | the letter you write |
| 4 | Transport | process-to-process data transfer (TCP, UDP) | **segment** | registered vs ordinary mail service |
| 3 | Network | routing of datagrams source → destination (IP, routing protocols) | **datagram** | the international sorting system choosing the route |
| 2 | Link | data transfer between neighbouring network elements (Ethernet, 802.11, PPP) | **frame** | the truck/plane for ONE leg of the journey |
| 1 | Physical | bits "on the wire" | bits | the road itself |

**Exam reflex:** Layer-2 PDU = **frame**, Layer-3 PDU = **datagram**, Layer-4 PDU = **segment**, Layer-5 = **message**. This exact question appeared as an MCQ (1718 Part A Q5).

## 2. Encapsulation (the Russian-doll rule)

Source: message → [+ transport header] = segment → [+ IP header] = datagram → [+ frame header/trailer] = frame → bits.

- Each layer **adds its own header** (link layer also adds a **trailer** — the CRC).
- Routers open parcels up to **layer 3** only (read the address label, never the letter).
- Switches open up to **layer 2** only. Hosts open everything.
- DHCP example from the Ch4 slides: *DHCP message inside UDP inside IP inside Ethernet* — encapsulation chains are exam-favourite phrasing.

## 3. Addresses at each layer

| Layer | Address | Size | Example |
|---|---|---|---|
| Transport | port number | 16-bit | 80, 53, 67 |
| Network | IP address | **32-bit (IPv4)** / 128-bit (IPv6) | 161.139.68.204 |
| Link | MAC address | **48-bit** | 74-29-2F-10-54-1A |

MCQ trap (1718 A6): "How big is the MAC address space?" → **2^48**.

## 4. TCP vs UDP (30-second table)

| Property | TCP | UDP |
|---|---|---|
| Connection | connection-oriented (handshake) | connectionless, no handshake |
| Reliability | reliable, in-order byte stream | unreliable, may be lost / out-of-order |
| Congestion/flow control | yes | no |
| Speed/overhead | heavier (20-byte header) | "no-frills" (8-byte header) |
| Used by | HTTP, SMTP, FTP — and **BGP, OpenFlow** | DNS, SNMP, streaming, **DHCP (ports 67/68)**, traceroute probes |

Why this matters in YOUR scope: DHCP runs over **UDP**, OSPF runs **directly over IP** (neither TCP nor UDP), BGP runs over **TCP**, ICMP is carried **in IP datagrams**. These cross-layer facts are MCQ gold (e.g., 1819 A3: "ICMP uses UDP" = FALSE).

## 5. Two service-model words

- **Best-effort service** (the Internet/IP model): no guarantees — no bandwidth, no loss, no order, no timing guarantee. (1617 A7 asks which guarantee is FALSE for the Internet.)
- **Circuit-switched / ATM model**: call setup first, guarantees possible. ATM = the classic "virtual circuit" MCQ answer.

That's all the prerequisite you need. Go to CH4.
