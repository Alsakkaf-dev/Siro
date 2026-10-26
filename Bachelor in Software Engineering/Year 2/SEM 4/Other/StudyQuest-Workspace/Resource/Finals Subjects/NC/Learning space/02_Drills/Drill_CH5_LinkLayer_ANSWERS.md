# ANSWERS — CH5 Link Layer & LANs

## P1 — ARP, same subnet (PCA → PCB)
1. PCA checks destination 192.168.1.115 against its own subnet mask → **same subnet** → frame
   goes directly to PCB; PCA needs **PCB's MAC**.
2. PCB not in PCA's (empty) ARP table → PCA **broadcasts an ARP query** containing PCB's IP
   (192.168.1.115); destination MAC = **FF-FF-FF-FF-FF-FF** — all nodes on LAN1 receive it.
3. Only **PCB replies**, unicast to PCA's MAC (01-12-23-34-45-56), carrying PCB's MAC
   **31-13-33-33-45-56**.
4. PCA **caches** (192.168.1.115 → 31-13-33-33-45-56, TTL ≈ 20 min) and sends the datagram in a
   frame with dst MAC = PCB's MAC.

## P2 — ARP, different subnet (PCA → PCC)
1. PCA compares 192.168.55.222 with its subnet → **different subnet** → the frame must go to
   PCA's **default gateway, R1 int1 (192.168.1.1)**.
2. PCA needs the MAC of **R1 int1 — NOT PCC's MAC** (MAC addresses only have meaning on the local
   LAN; a frame cannot cross a router).
3. If 192.168.1.1 is not in its ARP table, PCA broadcasts an ARP query for 192.168.1.1
   (dst FF-FF-FF-FF-FF-FF); **R1 replies** with 6A-12-55-34-55-55 (unicast).
4. PCA sends the frame: dst MAC = 6A-12-55-34-55-55, while the datagram inside keeps
   dst IP = 192.168.55.222. R1 then repeats ARP on LAN2 for PCC if needed.

## P3
(a) PCC talked to PCD (same subnet → direct entry) and to PCB (other subnet → entry for the
**router interface on PCC's side**, never PCB's MAC):

| IP address | MAC address |
|---|---|
| 192.168.55.223 (PCD) | 7C-BA-B2-B4-91-10 |
| 192.168.55.1 (R1 int2) | 9A-12-66-34-75-58 |

(b)

| Location | src IP | dst IP | src MAC | dst MAC |
|---|---|---|---|---|
| X (PCA→R1) | 192.168.1.111 | 192.168.55.222 | 01-12-23-34-45-56 | **6A-12-55-34-55-55** (R1 int1) |
| Y (R1→PCC) | 192.168.1.111 | 192.168.55.222 | **9A-12-66-34-75-58** (R1 int2) | 62-FE-F7-11-89-A3 |

**Rule:** IP addresses never change in transit; MAC addresses are rewritten at every hop.

## P4 — switch self-learning (ports: A=1 … F=6)

| Event | Switch table after event | Forwarded on | Why |
|---|---|---|---|
| (a) C→A | (C,3) | **flood: 1,2,4,5,6** | A unknown → flood all except arrival port 3 |
| (b) A→C | (C,3), (A,1) | **3 only** | C known → selective forward |
| (c) F→A | +(F,6) | **1 only** | A known (learned in b) |
| (d) D→F | +(D,4) | **6 only** | F known |
| (e) A→D | (A,1) refreshed | **4 only** | D known |

Marking pattern: 1 mark per learned entry, 1 per correct forwarding decision + justification.

## P5 — CRC sender: D=100100, G=1101, r=3 (verified)
Append r=3 zeros → dividend **100100000**. XOR division by 1101:

```
100100000
1101         (XOR at bit 1)
---------
 010110000   → leading 1 at bit 2
  1101       (XOR)
 ---------
  001000000  → wait — work bit-by-bit (shown compactly):
1 0 0 1 0 0 0 0 0
^1 1 0 1            → 0 1 0 0 | 0 0 0 0 0
   ^1 1 0 1         → 0 0 1 0 1 | 0 0 0 0   (XOR under the new leading 1)
      ^1 1 0 1      → 0 0 0 1 1 1 | 0 0 0
         ^1 1 0 1   → 0 0 0 0 0 1 1 0 0
                ^1 1 0 1 (at bit 6) → 0 0 0 0 0 0 0 0 1 → remainder last 3 bits
```
Remainder **R = 001**.
(a) **R = 001** (b) transmitted ⟨D,R⟩ = **100100001**.
*Self-check: 100100001 ÷ 1101 leaves remainder 000.*

## P6
(a) Received **100100001**, G=1101 → divide the WHOLE string by 1101 → remainder **000** →
**no error detected; receiver accepts the frame.** (It is exactly P5's transmission.)
(b) Received **100000001**, G=1101 → remainder **011** ≠ 0 → **error detected; frame rejected.**

Marking pattern (5 marks): correct setup 1, visible XOR steps 2, remainder 1, verdict stated 1.

## P7 — 2-D parity
(a) **Two-dimensional (even) parity.** Single-bit parity can only DETECT (an odd number of)
errors; 2-D parity can **detect AND CORRECT a single bit error** (and detect any two-bit error).
(b) Row checks: row1 4 ones + parity 0 ✓; **row2: 5 ones, parity 0 → FAIL**; row3 4 ✓;
parity row consistent ✓.
Column checks (counting all 4 rows): c1=2 ✓, c2=2 ✓, c3=2 ✓, c4=2 ✓, **c5=3 → FAIL**, c6=2 ✓,
c7=2 ✓, parity col=0 ✓.
**Error bit = row 2, column 5: received 1, corrected value 0.**
(Corrected row 2 = 1 1 1 0 **0** 0 1 | 0 — now 4 ones, even ✓.)

## P8 — CSMA/CD essay (model answer skeleton, 12 marks)
*Definition (2m):* CSMA/CD is a **random access** MAC protocol for a shared broadcast channel:
**carrier sense** (listen before transmit) **+ collision detection** (listen WHILE transmitting).

*Operation (Ethernet algorithm, 6m):*
1. NIC receives a datagram from the network layer and builds a frame.
2. **If channel sensed idle → transmit the entire frame; if busy → defer** until idle then transmit.
3. If the NIC transmits the whole frame without detecting another transmission, it is done.
4. **If it detects another transmission while transmitting, it aborts immediately and sends a
   jam signal** (so all senders learn of the collision; channel wastage is cut short).
5. **Binary exponential backoff:** after the m-th collision the NIC picks K uniformly from
   **{0, 1, 2, …, 2^m − 1}** and waits **K × 512 bit times** before returning to step 2 —
   more collisions ⇒ a wider window ⇒ adaptively lighter load.

*Why collisions occur at all (2m):* **propagation delay** — node B may begin transmitting before
node A's signal reaches it; both then talk simultaneously.

*Detection feasibility (1m):* easy on wired LANs (compare transmitted vs received signal
strength); effectively impossible on wireless (own transmission overwhelms received signal;
hidden terminals) — hence 802.11 uses CSMA/CA.

*Differences (1m):*
- vs pure CSMA: CSMA keeps transmitting through a collision (whole frame time wasted);
  **CD aborts early + jam + backoff**.
- vs CSMA/CA: CA **avoids** collisions (DIFS wait, random backoff BEFORE sending, ACKs,
  optional RTS/CTS reservation) because it cannot detect them; CD detects and recovers.
