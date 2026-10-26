# Drill — CH6 Wireless & Mobile (6 problems)

Past-paper-shaped. Answers in `Drill_CH6_Wireless_ANSWERS.md`.

---

**P1 (1+2+2+4 marks, 2020/21 + 1819 real).** 802.11 association:
(a) Who sends **beacon frames**, and to whom?
(b) State the TWO most important pieces of information contained in a beacon frame.
(c) State the TWO ways a wireless device can get connected to an Access Point.
(d) List the FOUR steps from a host arriving in a WLAN until it can use an IP address
(1819: "how host associates with an AP until the host gets an IP address").

**P2 (4+1 marks, 2020/21 real).** Stations A and C both transmit to station B wirelessly,
A and C out of each other's range.
(a) Elaborate on the **hidden terminal** and **fading** problems (a labelled sketch earns marks).
(b) Which MAC protocol suits this wireless connectivity, and why not CSMA/CD?

**P3 (6 marks).** Write the **CSMA/CA** algorithm: sender rules (DIFS, backoff behaviour, ACK
handling) and receiver rule (SIFS). Then explain how the **RTS/CTS** exchange avoids collisions
of long data frames — include why RTS collisions are acceptable.

**P4 (6 marks).** H1 is associated with an AP; the AP attaches to a router R1 (the wired side).
For a frame carrying a datagram **from H1 to the Internet via R1**, identify what goes in
**Address 1, Address 2, Address 3** of the 802.11 frame, and state the general rule for each
address field. Why does 802.11 need three addresses where Ethernet needs two?

**P5 (4+6 marks, 1718/1819 real).** Mobile node A (permanent address 128.119.40.186, home
network 128.119.40/24) visits network 79.129.13/24 and receives care-of address 79.129.13.2.
(a) Briefly describe the **permanent address** and **care-of address** (who uses each?).
(b) Correspondent B sends a datagram to A. Draw/number the steps under **indirect routing**,
naming the roles (home agent, foreign agent). Then state the **triangle routing problem** and
how **direct routing** solves it (and the new cost it introduces).

**P6 (5+5 marks, 2020/21 + 1617 real).** 3G architecture:
(a) Explain how a 3G user's **voice** and **data** reach their destinations — name the chain of
components each follows (RNC, MSC, GMSC, SGSN, GGSN, UTRAN, GPRS core).
(b) A mobile user on a call moves from one base station's coverage to another (same MSC).
Name this process, list its two main triggers, and outline the steps in order.
