# Drill — Subnetting Reflex (15 problems, ramping)

**Rules of engagement:** no calculator for /24-and-deeper problems — train the powers of 2.
Write binary workings the way the marker wants. Target pace by exam day: P1–P6 ≤ 2 min each,
P7–P12 ≤ 6 min, P13–P15 ≤ 10 min. Answers + full workings in `Drill_Subnetting_Reflex_ANSWERS.md`.

Powers you must know cold: 128 64 32 16 8 4 2 1 ・ /25=128, /26=192, /27=224, /28=240,
/29=248, /30=252 (last-octet masks).

---

## Level 1 — Mask mechanics

**P1.** Convert to dotted-decimal subnet masks: (a) /8 (b) /16 (c) /24 (d) /25 (e) /27 (f) /30.
For each, how many usable host addresses?

**P2.** Write the CIDR prefix for each mask: (a) 255.255.255.192 (b) 255.255.248.0
(c) 255.255.255.240 (d) 255.254.0.0. How many /24 networks fit inside one /20?

**P3.** For 192.168.1.77/26 find: network address, broadcast address, usable range.
Show the binary working for the last octet.

**P4.** For 172.16.45.200/21 find: network address, broadcast address, first and last usable
address. (Careful: the mask boundary is inside the THIRD octet.)

**P5.** *(2020/21 final, 2 marks)* You are given the IP address 192.168.1.4/30.
List ALL the addresses within the same subnet of the given address, and label each one.

**P6.** A technician configures a PC as 10.130.73.95/27. Find the subnet's network and broadcast
addresses — then explain why this configuration is invalid.

## Level 2 — Equal-size subnetting (the recycled exam pattern)

**P7.** *(2020/21 final, 3 marks)* If the IP address 192.168.4.0/24 is divided into 4 equal-sized
subnets, what is the range of usable addresses for **Subnet 1** (the second subnet) and its
subnet mask? Show your workings, then complete the full 4-row subnet table
(network / usable range / broadcast / mask).

**P8.** *(2020/21 final, 3 marks)* If 172.16.14.0/24 is divided into 8 equal-sized subnets, what
is the range of usable addresses for **Subnet 2** and the subnet mask?

**P9.** *(slide self-study pattern)* 200.23.0.0/20 must be divided into **5** subnets
(Subnet 0 … Subnet 4).
(a) Original mask (binary + decimal)? (b) Hosts supported by the original network?
(c) List ALL generated subnet addresses (dotted decimal, with prefix).
(d) New subnet mask? (e) Hosts per new subnet? (f) First 5 valid IPs of Subnet 3.
(g) How many subnets remain unused for the future?

**P10.** *(2016/17 final, 10 marks)* You are given 168.23.0.0/20. The network must be divided
into 5 subnets, first labelled subnet#0.
(a) Mask of the given network (binary + decimal).
(b) Network address (with prefix) of the first THREE subnets.
(c) New subnet mask (binary + decimal).
(d) For the separate address 168.23.20.35/23, calculate its network address — show workings.

## Level 3 — VLSM design (midterm + final pattern)

**P11.** *(your 2024/25 midterm, 7 marks)* Organization block: 192.168.10.0/24.
Departments: HR 50 hosts, IT 30, Sales 20, Management 10. Design subnets with **minimum
wastage** (largest first). For each: subnet address, mask (CIDR + dotted), first usable,
last usable, broadcast.

**P12.** *(2017/18 final pattern, 10 marks)* Topology: three routers R1, R2, R3. Host subnets:
A (off R1), B (off R2), C (off R3). Router-to-router subnets: D (R1–R3), E (R2–R3), F (R1–R2)
— six subnets total. Allocate all addresses from **214.97.254.0/23** with:
A ≥ 200 interfaces, B ≥ 100, C ≥ 50, D/E/F are point-to-point links.
Give network address + prefix for all six, and state how many addresses you wasted.

**P13.** An organization needs 2000 host addresses.
(a) Which prefix length must its ISP allocate, and why (show the power-of-2 step)?
(b) If the ISP gives 163.44.224.0/21, what is the usable host count and the address range?
(c) Why was classful addressing wasteful here? Which class would it have received?

## Level 4 — Forwarding tables (where subnetting meets the router)

**P14.** *(2017/18 final, 10 marks — verified)* A router has four links (0–3) with this
range-based table:

| Destination address range | Link |
|---|---|
| 11001000 00010111 00010000 00000000 – 11001000 00010111 00010111 11111111 | 0 |
| 11001000 00010111 00011000 00000000 – 11001000 00010111 00011000 11111111 | 1 |
| 11001000 00010111 00011001 00000000 – 11001000 00010111 00011111 11111111 | 2 |
| otherwise | 3 |

(a) Rewrite as a 4-entry **longest-prefix-match** table.
(b) Which link for (i) 11001000 00010111 00011000 10101010
    (ii) 11101000 11100111 00010110 10100001? Explain how you decided.

**P15.** Router R has three interfaces: if0 → subnet 192.168.4.0/26, if1 → 192.168.4.64/26,
if2 → link to ISP (default route).
(a) Build R's forwarding table (destination prefix → interface), most specific first.
(b) For destinations 192.168.4.61, 192.168.4.130, 192.168.4.70, 8.8.8.8 — which interface?
(c) R also performs NAT (WAN address 203.0.113.5). Host 192.168.4.10 opens a browser connection
from port 4502 to web server 93.184.216.34:80; the NAT assigns external port 6001.
Write the NAT translation-table row and the (src IP:port, dst IP:port) of the datagram
**before** and **after** translation, in both directions.
