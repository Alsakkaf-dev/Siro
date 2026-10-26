# ANSWERS — Subnetting Reflex (all values machine-verified)

## P1
| Prefix | Mask | Usable hosts (2^h − 2) |
|---|---|---|
| /8 | 255.0.0.0 | 2^24−2 = 16,777,214 |
| /16 | 255.255.0.0 | 2^16−2 = 65,534 |
| /24 | 255.255.255.0 | 254 |
| /25 | 255.255.255.128 | 126 |
| /27 | 255.255.255.224 | 30 |
| /30 | 255.255.255.252 | 2 |

## P2
(a) 255.255.255.192 → **/26** (192 = 11000000)
(b) 255.255.248.0 → **/21** (248 = 11111000 in 3rd octet → 16+5)
(c) 255.255.255.240 → **/28**
(d) 255.254.0.0 → **/15**
A /20 contains 2^(24−20) = **16** /24 networks.

## P3 — 192.168.1.77/26
Last octet 77 = **01**001101. /26 ⇒ 2 network bits in the last octet (the bold pair), 6 host bits.
- Network = host bits→0: **01**000000 = 64 → **192.168.1.64**
- Broadcast = host bits→1: **01**111111 = 127 → **192.168.1.127**
- Usable: **192.168.1.65 – 192.168.1.126** (62 hosts)

## P4 — 172.16.45.200/21
/21 ⇒ third octet has 5 network bits. 45 = **00101**101.
- Network third octet: **00101**000 = 40 → network **172.16.40.0/21** (mask 255.255.248.0)
- Broadcast: third octet **00101**111 = 47, fourth 255 → **172.16.47.255**
- First usable **172.16.40.1**, last usable **172.16.47.254** (2046 hosts)

## P5 — 192.168.1.4/30
/30 ⇒ block size 4; 4 ÷ 4 = block starting at 4. The four addresses:
- **192.168.1.4 — network address**
- **192.168.1.5 — usable host**
- **192.168.1.6 — usable host**
- **192.168.1.7 — broadcast address**
*(Exam tip: a /30 is the standard router-to-router link: exactly 2 usable.)*

## P6 — 10.130.73.95/27
Last octet 95 = **010**11111; /27 ⇒ 3 network bits in last octet.
Network = **010**00000 = 64 → **10.130.73.64**; Broadcast = **010**11111 = 95 → **10.130.73.95**.
**Invalid because .95 IS the broadcast address of this subnet** — host bits all 1; it can never be
assigned to a device. (Twin trap: .64 = network address, also unassignable.)

## P7 — 192.168.4.0/24 ÷ 4 (2020/21 real)
4 subnets ⇒ borrow 2 bits ⇒ **/26**, mask **255.255.255.192**. Block size 64.

| Subnet | Network | Usable range | Broadcast |
|---|---|---|---|
| 0 | 192.168.4.0 | .1 – .62 | .63 |
| **1** | **192.168.4.64** | **192.168.4.65 – 192.168.4.126** | **.127** |
| 2 | 192.168.4.128 | .129 – .190 | .191 |
| 3 | 192.168.4.192 | .193 – .254 | .255 |

Asked answer: Subnet 1 usable **192.168.4.65 – 192.168.4.126**, mask **255.255.255.192 (/26)**.

## P8 — 172.16.14.0/24 ÷ 8 (2020/21 real)
8 subnets ⇒ borrow 3 bits ⇒ **/27**, mask **255.255.255.224**. Block size 32.
Subnet 2 starts at 2×32 = 64: network 172.16.14.64, broadcast .95.
**Usable 172.16.14.65 – 172.16.14.94, mask 255.255.255.224 (/27).**

## P9 — 200.23.0.0/20 into 5
(a) /20 = **11111111.11111111.11110000.00000000 = 255.255.240.0**
(b) host bits 12 ⇒ 2^12 − 2 = **4094 hosts**
(c) need 5 ⇒ round to 2^3 = 8 subnets ⇒ borrow 3 bits ⇒ /23; subnets step by 2 in 3rd octet:
**200.23.0.0/23, 200.23.2.0/23, 200.23.4.0/23, 200.23.6.0/23, 200.23.8.0/23, 200.23.10.0/23,
200.23.12.0/23, 200.23.14.0/23**
(d) new mask = **11111111.11111111.11111110.00000000 = 255.255.254.0**
(e) host bits 9 ⇒ 2^9 − 2 = **510 hosts**
(f) Subnet 3 = 200.23.6.0/23 → **200.23.6.1, .2, .3, .4, .5**
(g) 8 generated − 5 needed = **3 spare subnets**

## P10 — 168.23.0.0/20 (1617 real)
(a) **255.255.240.0** = 11111111.11111111.11110000.00000000
(b) 5 ⇒ 8 subnets ⇒ /23: **168.23.0.0/23, 168.23.2.0/23, 168.23.4.0/23**
(c) **255.255.254.0** = 11111111.11111111.11111110.00000000
(d) 168.23.20.35/23 → third octet 20 = 0001010**0** (the /23 boundary leaves the last bit of the
3rd octet as a host bit; 20 is even so it stays 20): AND with 254 → 20. **Network =
168.23.20.0/23** (range 168.23.20.0 – 168.23.21.255).

## P11 — VLSM 192.168.10.0/24 (midterm real; verified)
Largest first; sizes: 50→/26 (62), 30→/27 (30), 20→/27 (30), 10→/28 (14).

| Dept | Subnet | Mask | First usable | Last usable | Broadcast |
|---|---|---|---|---|---|
| HR (50) | 192.168.10.0/26 | 255.255.255.192 | .1 | .62 | .63 |
| IT (30) | 192.168.10.64/27 | 255.255.255.224 | .65 | .94 | .95 |
| Sales (20) | 192.168.10.96/27 | 255.255.255.224 | .97 | .126 | .127 |
| Mgmt (10) | 192.168.10.128/28 | 255.255.255.240 | .129 | .142 | .143 |

Leftover for future: 192.168.10.144 – 192.168.10.255.
*Trap check: IT needs 30 and /27 gives exactly 30 usable — legal. If they ask for 31, jump to /26.*

## P12 — 214.97.254.0/23 design (verified)
Required: A ≥ 200 → /24 (254); B ≥ 100 → /25 (126); C ≥ 50 → /26 (62); D, E, F → /30 (2 each).

| Subnet | Allocation | Usable |
|---|---|---|
| A | **214.97.254.0/24** | 254 |
| B | **214.97.255.0/25** | 126 |
| C | **214.97.255.128/26** | 62 |
| D (R1–R3) | **214.97.255.192/30** | 2 |
| E (R2–R3) | **214.97.255.196/30** | 2 |
| F (R1–R2) | **214.97.255.200/30** | 2 |

Wasted ≈ (254−200)+(126−100)+(62−50) = 92 host slots + the unallocated 214.97.255.204–.255.
**Note on the actual 17/18 exam numbers (250/120/120):** /24+/25+/25 fills the /23 exactly,
leaving nothing for D/E/F — the official Kurose solution carves the router links out of B's
space using /31-style point-to-point hacks. If you ever face "doesn't fit", say so and carve the
/30s from the largest subnet's spare tail — showing the constraint check earns the marks.

## P13
(a) 2000 + 2 ≤ 2^11 = 2048 ⇒ 11 host bits ⇒ prefix **32 − 11 = /21**.
(b) 163.44.224.0/21 → 2046 usable: **163.44.224.1 – 163.44.231.254** (broadcast 163.44.231.255).
(c) Classful would force a **Class B** (/16, 65,534 hosts) — wasting >63,000 addresses; Class C
(/24, 254) is too small. CIDR's arbitrary-length network portion fixes exactly this.

## P14 — Longest prefix match (1718 real; machine-verified)
(a) Ranges → prefixes (count the fixed leading bits):

| Prefix | Link |
|---|---|
| 11001000 00010111 00010*** ******** (21 bits) | 0 |
| 11001000 00010111 00011000 ******** (24 bits) | 1 |
| 11001000 00010111 00011*** ******** (21 bits) | 2 |
| otherwise (default) | 3 |

(b)(i) 11001000 00010111 **00011000** 10101010 matches link 2's 21-bit prefix AND link 1's
24-bit prefix → **longest wins → Link 1**.
(b)(ii) 11101000… fails every prefix at bit 3 → **otherwise → Link 3**.
*Method sentence to write: "the entry with the longest address prefix that matches the
destination address is selected."*

## P15
(a)
| Destination prefix | Interface |
|---|---|
| 192.168.4.0/26 | if0 |
| 192.168.4.64/26 | if1 |
| 0.0.0.0/0 (default) | if2 |

(b) 192.168.4.61 → in .0–.63 → **if0**; 192.168.4.130 → in .128–.191 → no specific entry →
**if2 (default)**; 192.168.4.70 → in .64–.127 → **if1**; 8.8.8.8 → **if2**.
*(Note .130 trap: only two LAN subnets exist; .128/26 is NOT configured here.)*

(c) NAT table row:

| WAN side addr | LAN side addr |
|---|---|
| 203.0.113.5 : 6001 | 192.168.4.10 : 4502 |

Outgoing before: (s=192.168.4.10:4502 → d=93.184.216.34:80)
Outgoing after: (s=**203.0.113.5:6001** → d=93.184.216.34:80)
Reply before: (s=93.184.216.34:80 → d=203.0.113.5:6001)
Reply after NAT: (s=93.184.216.34:80 → d=**192.168.4.10:4502**)
