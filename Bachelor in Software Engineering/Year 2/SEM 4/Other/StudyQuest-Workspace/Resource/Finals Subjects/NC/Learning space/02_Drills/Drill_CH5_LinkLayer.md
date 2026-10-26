# Drill — CH5 Link Layer & LANs (8 problems)

Past-paper-shaped. Answers with full workings in `Drill_CH5_LinkLayer_ANSWERS.md`.

---

**Topology for P1–P3** (the 1819-final layout, cleaned):

```
PCA ---+                       +--- PCC
       |                       |
PCB ---+--[ R1 int1 | int2 ]---+--- PCD
   LAN1: 192.168.1.0/24     LAN2: 192.168.55.0/24
```

| Node | IP | MAC |
|---|---|---|
| PCA | 192.168.1.111/24 | 01-12-23-34-45-56 |
| PCB | 192.168.1.115/24 | 31-13-33-33-45-56 |
| PCC | 192.168.55.222/24 | 62-FE-F7-11-89-A3 |
| PCD | 192.168.55.223/24 | 7C-BA-B2-B4-91-10 |
| R1 int1 | 192.168.1.1/24 | 6A-12-55-34-55-55 |
| R1 int2 | 192.168.55.1/24 | 9A-12-66-34-75-58 |

**P1 (4 marks, 1819 Q8a).** Describe the ARP process used by PCA when it needs to transmit a
datagram to **PCB** (same subnet). Assume PCA's ARP table is empty. Numbered steps; name the
destination MAC of each ARP message.

**P2 (4 marks, 1819 Q8b).** Describe the ARP process used by PCA when it needs to transmit a
datagram to **PCC** (other subnet). Do not explain routing. Whose MAC does PCA actually need, and
why?

**P3 (2+4 marks).**
(a) PCC needs to send datagrams to PCB and PCD. Construct PCC's ARP table (columns: IP, MAC).
(b) *(1617 Q4a style)* For a datagram PCA→PCC, complete:

| Location | src IP | dst IP | src MAC | dst MAC |
|---|---|---|---|---|
| X: frame on LAN1 (PCA→R1) | | | | |
| Y: frame on LAN2 (R1→PCC) | | | | |

**P4 (10 marks, 1718 Q7 style).** Hosts A–F connect to an Ethernet switch on ports 1–6.
Switch table initially **empty**. For each event give: what the switch LEARNS (table state) and
on which link(s) the frame is forwarded, with one-line justification.
(a) C sends a frame to A
(b) A replies with a frame to C
(c) F sends a frame to A
(d) D sends a frame to F
(e) A sends a frame to D

**P5 (5 marks, 2020/21 + 1819 real).** A sender must transmit data **100100** using CRC with
r = 3 and G = **1101**.
(a) What is R? (b) What is the complete transmitted bit pattern? Show the XOR long division.

**P6 (5+4 marks).**
(a) *(2020/21 real)* The data **100100001** was received. Using CRC with G = 1101, clarify the
error status of the received data. Show all workings.
(b) *(1819 real)* The data **100000001** was received, G = 1101. What is the remainder, and is
an error detected?

**P7 (5 marks).** Received 2-D EVEN-parity block (last column = row parity; last row = column
parity):

```
1 0 1 1 0 1 0 | 0
1 1 1 0 1 0 1 | 0
0 1 0 1 1 0 1 | 0
--------------+--
0 0 0 0 1 1 0 | 0
```
(a) Name the scheme and its advantage over single-bit parity.
(b) Locate the error bit (row, column) and give the corrected value. Show the row/column checks.

**P8 (12 marks, 1819 Q7 essay).** Describe the operation of **CSMA/CD** for a broadcast channel
and how the collision issue is handled. Cover: carrier sensing, transmission rule, detection,
jam signal, binary exponential backoff (the K and 512-bit-times formula), and why CD works on
wires but not wireless. Close with one sentence each on how CSMA/CD differs from (i) pure CSMA
and (ii) CSMA/CA.
