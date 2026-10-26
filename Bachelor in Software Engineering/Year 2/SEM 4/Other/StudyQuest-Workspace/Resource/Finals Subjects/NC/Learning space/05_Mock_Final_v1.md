# MOCK FINAL EXAMINATION v1 — SCSR2213 Network Communications

**Time: 3 hours ・ Total: 100 marks ・ Format mirrors the 2016/17–2018/19 + 2020/21 papers.**
Answer ALL questions. Show ALL workings. Do it closed-book, timed. Marking scheme is in
`05_Mock_Final_v1_ANSWERS.md`.

---

## PART A — MULTIPLE CHOICE (20 marks, 1 each)

1. Which of the following is FALSE about the data plane?
A. Queueing may occur at input buffers if datagrams arrive faster than the forwarding rate.
B. It moves datagrams using the local forwarding table inside a router.
C. It implements the distance vector algorithm inside the switching fabric.
D. It is a local, per-router function operating in nanoseconds.

2. What is Head-of-the-Line (HOL) blocking in a router?
A. Queueing delay and loss due to output buffer overflow.
B. The switch fabric is slower than the input ports.
C. A queued datagram at the front of the queue prevents others in the queue from moving forward.
D. A queued datagram at the front of the queue allows others to move forward.

3. The following are switching-fabric techniques EXCEPT:
A. Memory  B. Processor  C. Crossbar  D. Bus

4. All statements about ICMP are TRUE EXCEPT:
A. ICMP is used by ping for echo request/reply.
B. ICMP is used for error reporting.
C. ICMP messages are carried inside IP datagrams.
D. ICMP uses UDP at the transport layer.

5. Because DHCP automates connecting a host into a network, it is often called a ________ protocol.
A. static  B. pre-configured  C. automated  D. plug-and-play

6. Which routing protocol determines optimal paths for source–destination pairs located in
DISTANT Autonomous Systems?
A. RIP  B. OSPF  C. BGP  D. EIGRP

7. What does a router use to fill its forwarding table?
A. Routing algorithm  B. Maximum Segment Size  C. Pipeline algorithm  D. NAT

8. The subnet mask is ________.
A. a logical, visible subdivision of an IP network
B. used to separate the network portion of an IP address from the host portion
C. an interface connecting host/router and physical link
D. the practice of dividing a network into two or more networks

9. Each network link has a largest possible link-level frame known as the:
A. Fragment Datagram  B. Datagram Offset  C. Fragment Overhead  D. Maximum Transfer Unit

10. Given the address 161.139.0.0, under classful addressing it is a:
A. Class A address  B. Class B address  C. Class C address  D. Class D address

11. The Protocol Data Unit (PDU) for Layer 2 is known as a:
A. message  B. segment  C. frame  D. datagram

12. How big is the MAC address space?
A. 2^16  B. 2^32  C. 2^48  D. 2^128

13. Which of these is NOT in the ARP table?
A. IP address  B. MAC address  C. RTT value  D. TTL value

14. Which is the broadcast MAC address?
A. 255.255.255.255  B. 62-FE-F7-11-89-A3  C. FF-FF-FF-FF-FF-FF  D. FF-FF-FF-00-00-00

15. The three broad classes of MAC protocols are the following EXCEPT:
A. channel partitioning  B. multiple thread  C. taking turns  D. random access

16. Which algorithm does CSMA/CD use to decide which node transmits after a collision?
A. Collision detection algorithm  B. Binary exponential backoff algorithm
C. Multiple access collision algorithm  D. Frame transmission turn algorithm

17. A trunk port carries datagrams from ________.
A. multiple VLANs from a single physical switch
B. multiple VLANs from multiple physical switches
C. multiple VLANs from selected port numbers
D. a single VLAN from a single physical switch

18. In 802.11, what lets nearby wireless stations discover and identify an Access Point?
A. Beacon frames  B. Base packets  C. Sensor frames  D. Mirror packets

19. Mobile nodes in MANETs and VANETs are classified as:
A. single-hop, infrastructure-based  B. single-hop, infrastructure-less
C. multi-hop, infrastructure-less  D. multi-hop, infrastructure-based

20. When a mobile host moves beyond one base station's range into another's and changes its
point of attachment, this process is referred to as:
A. handoff  B. multipath propagation  C. fading  D. passive scanning

---

## PART B — STRUCTURED QUESTIONS (80 marks)

### QUESTION 1 [6 marks]
(a) The link capacity of a router is 40 Mbps and the RTT for a packet is 300 msec. If the number
of TCP flows is 36, calculate the buffering needed for the router. [3]
(b) Buffering happens at the input ports of a router. Describe how Head-Of-the-Line (HOL)
blocking may occur inside an input-queued switching fabric. [3]

### QUESTION 2 [12 marks]
An organization is allocated **10.20.30.0/23**. It must create:
LAN A (200 hosts), LAN B (100 hosts), LAN C (50 hosts), plus two router-to-router links L1, L2.
(a) Design the addressing plan with minimum wastage (largest first). For each subnet give:
network address with prefix, subnet mask (dotted), first usable, last usable, broadcast. [9]
(b) State how many usable addresses each LAN wastes. [1.5]
(c) Which prefix length is the standard choice for L1/L2 and why? [1.5]

### QUESTION 3 [6 marks]
A datagram of **5500 bytes** arrives at a router and must be forwarded on a link with an MTU of
**1300 bytes**. The original datagram carries identification number **512**. Draw ALL IP
fragments generated, giving length, ID, fragflag and offset for each, reflecting the original
payload data.

### QUESTION 4 [8 marks]
A router has four links (0–3). Packets are forwarded according to:

| Destination address range | Link |
|---|---|
| 11100000 00000000 00000000 00000000 – 11100000 00111111 11111111 11111111 | 0 |
| 11100000 01000000 00000000 00000000 – 11100000 01000000 11111111 11111111 | 1 |
| 11100000 01000001 00000000 00000000 – 11100000 11111111 11111111 11111111 | 2 |
| otherwise | 3 |

(a) Provide a forwarding table with four entries that uses **longest prefix matching**. [5]
(b) Determine the link interface for each destination address, briefly explaining how you
decided: (i) 11100000 01000000 11000011 00111100  (ii) 11100001 10000000 00010001 01110111. [3]

### QUESTION 5 [13 marks]
Routers A–F are connected with these link costs:
A–B = 3, A–C = 1, A–D = 6, B–C = 1, B–E = 5, C–D = 2, C–E = 4, D–F = 7, E–F = 2.
```
      A ----3---- B
      | \         | \
      1   6       |   5
      |     \     1     \
      C --2-- D   |       E
       \      |  /       /
        4     7 (C-B)   2
         \    |        /
          E   F ------/   (edges: C-E=4, D-F=7, E-F=2)
```
*(Use the cost list as authoritative.)*
(a) Using Dijkstra's shortest-path algorithm with **source node A**, construct the least-cost
table (columns: Step, N′, D(B),p(B), D(C),p(C), D(D),p(D), D(E),p(E), D(F),p(F)). [7]
(b) Produce the forwarding table for node A (Destination | Link | Least cost). [3]
(c) Write the COMPLETE Bellman-Ford equation for node A to node F and calculate the least cost.
[3]

### QUESTION 6 [12 marks] — topology scenario
Two LANs are interconnected by router R:

| Node | IP | MAC |
|---|---|---|
| P | 172.20.1.10/24 | AA-AA-AA-AA-AA-01 |
| Q | 172.20.1.11/24 | AA-AA-AA-AA-AA-02 |
| R int1 (LAN X side) | 172.20.1.1/24 | CC-CC-CC-CC-CC-01 |
| R int2 (LAN Y side) | 172.20.2.1/24 | CC-CC-CC-CC-CC-02 |
| S | 172.20.2.20/24 | BB-BB-BB-BB-BB-01 |
| T | 172.20.2.21/24 | BB-BB-BB-BB-BB-02 |

(a) Host P has had communications with ALL hosts EXCEPT Q. Construct P's ARP table (IP, MAC) and
explain its contents. [4]
(b) P sends a datagram to T. Complete the table: [4]

| Location | src IP | dst IP | src MAC | dst MAC |
|---|---|---|---|---|
| X: frame on LAN X | | | | |
| Y: frame on LAN Y | | | | |

(c) LAN X uses a switch: P on port 1, Q on port 2, R int1 on port 3; switch table initially
empty. For the events (1) P sends the frame in (b); (2) R int1 sends a frame back to P;
(3) Q sends a frame to P — give the switch-table state and the link(s) each frame is forwarded
on, with justification. [4]

### QUESTION 7 [9 marks]
(a) A sender must transmit D = **1101011** using CRC with generator G = **1001**.
How many CRC bits are there? Compute R and the complete transmitted pattern (show the division).
[4]
(b) A receiver receives **1011011011** with G = 1001. Determine the remainder and state whether
the frame is accepted. [3]
(c) The following 2-D even-parity block was received (last column = row parity, last row =
column parity). Locate the error bit and give its corrected value: [2]
```
1 1 0 1 | 1
0 1 0 0 | 0
1 0 0 1 | 0
--------+--
0 0 1 0 | 1
```

### QUESTION 8 [7 marks]
(a) Describe the operation of CSMA/CD in a random-access broadcast channel and how the collision
issue is handled (include the backoff rule). [5]
(b) Explain why collision DETECTION is not workable in wireless LANs and name the protocol and
mechanism 802.11 uses instead. [2]

### QUESTION 9 [7 marks]
(a) In 802.11, who sends beacon frames, and what are the TWO most important pieces of
information they contain? [2]
(b) Mobile node M (permanent address in its home network) is visiting a foreign network.
Correspondent H sends it a datagram. List, in order, the FOUR numbered steps of **indirect
routing**, naming the agents involved. [3]
(c) In a 3G network, name the component chain a user's DATA follows from the radio network
controller to the public Internet. [2]

— END OF QUESTIONS. GOOD LUCK! —
