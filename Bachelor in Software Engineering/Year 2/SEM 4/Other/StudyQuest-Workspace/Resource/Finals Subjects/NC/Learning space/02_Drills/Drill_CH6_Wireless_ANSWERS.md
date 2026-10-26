# ANSWERS — CH6 Wireless & Mobile

## P1
(a) Beacon frames are sent **by the Access Point (AP)**, periodically, **to all wireless hosts
in its range** (broadcast).
(b) The **AP's name (SSID)** and the **AP's MAC address**.
(c) **Passive scanning** (host listens for beacons) and **active scanning** (host broadcasts a
Probe Request; APs reply with Probe Responses).
(d) Four steps:
1. Host **scans channels / listens for beacon frames** (or sends probe request) → discovers APs.
2. Host **selects an AP and sends an Association Request**.
3. AP replies with an **Association Response** (host is now associated; may authenticate).
4. Host runs **DHCP** (discover-offer-request-ACK) to obtain an IP address in the AP's subnet.

## P2
(a) **Hidden terminal:** A and B hear each other; C and B hear each other; **A and C cannot hear
each other** (range/obstacle) — so A and C are unaware that their simultaneous transmissions
**interfere (collide) at B**, and neither can detect it.
**Fading (signal attenuation):** even within nominal range, A's and C's signals are so attenuated
at each other's location that they cannot sense one another, while both are still strong enough
at B to collide there. Sketch: two overlapping circles around A and C, B in the overlap.
(b) **CSMA/CA (IEEE 802.11 MAC)**. CSMA/CD is unsuitable because a wireless sender **cannot
detect collisions**: its own transmission overwhelms the weak received signal, and hidden
terminals mean some collisions are physically undetectable at the sender.

## P3
**Sender:**
1. If the channel is sensed **idle for DIFS** → transmit the ENTIRE frame (no collision detection).
2. If busy → choose a **random backoff value**; the timer **counts down only while the channel is
idle** (freezes when busy); transmit when it reaches 0.
3. If **no ACK** arrives → assume collision/loss, **increase the backoff interval** and repeat
step 2.
**Receiver:** if the frame is received OK → send an **ACK after SIFS** (ACK needed precisely
because of the hidden terminal problem).
**RTS/CTS:** the sender first sends a short **Request-To-Send**; the AP answers with a
**Clear-To-Send**, which is **heard by ALL stations**: the named sender transmits its long data
frame, everyone else defers. Collisions can then only hit the tiny RTS packets (cheap to lose),
so **long data frames never collide** — the channel is "reserved" by small packets.

## P4
- **Address 1 = MAC of the AP** (the wireless node that must RECEIVE this frame next).
- **Address 2 = MAC of H1** (the wireless node TRANSMITTING this frame).
- **Address 3 = MAC of R1's interface** (the router the AP attaches to — the frame's anchor
beyond the wireless cell).
- (Address 4 only in ad hoc mode.)
Rules: A1 = receiver of this transmission, A2 = transmitter of this transmission, A3 = the
off-cell destination/source on the wired side.
**Why three?** The AP is a link-layer **relay between two different links** (wireless cell and
wired LAN). Ethernet's two addresses only describe one link; 802.11 must additionally carry the
wired-side router's MAC so the AP knows where to bridge the frame (and vice versa on the way in).

## P5
(a) **Permanent address**: A's address in its **home network** (128.119.40.186); **remains
constant**; it is what the **correspondent always uses** — A is always reachable through it.
**Care-of address (COA)**: A's temporary address in the **visited network** (79.129.13.2);
**used by the home agent** to tunnel datagrams to A's current location.
(b) **Indirect routing steps (number these arrows in a sketch):**
1. Correspondent B sends the datagram addressed to the **permanent address** → it is routed to
   A's **home network**.
2. The **home agent** intercepts it, **encapsulates it inside a new datagram** addressed to the
   **care-of address**, and tunnels it to the visited network.
3. The **foreign agent** decapsulates and delivers the original datagram to mobile A.
4. A replies **directly** to B (ordinary IP routing).
**Triangle routing problem:** every packet detours correspondent → home network → mobile, which
is inefficient — worst when B and A are in the SAME visited network.
**Direct routing fix:** B first **queries the home agent once for A's COA**, then sends all
datagrams **straight to the foreign agent/COA**. Cost: **non-transparent** to the correspondent
(it must learn the COA), and if A moves again mid-session, the first ("**anchor**") foreign agent
must chain/forward data to A's new foreign agent.

## P6
(a) The 3G data network runs **in parallel** with the voice network (unchanged voice core):
- Radio leg (both): mobile → Node B (base station) → **RNC (Radio Network Controller)** —
  this radio access network is **UTRAN**, over a WCDMA/HSPA radio interface.
- **Voice:** RNC → **MSC (Mobile Switching Center)** → **Gateway MSC** → public telephone network.
- **Data:** RNC → **SGSN (Serving GPRS Support Node)** → **GGSN (Gateway GPRS Support Node)**
  (the GPRS core network) → **public Internet**.
(b) **Handoff** (1819 MCQ answer). Triggers: (1) **stronger signal** from the new BSS (maintain
connectivity, save battery); (2) **load balancing** (free a channel in the congested cell).
Steps with a common MSC:
1. **Old BSS** tells the MSC a handoff is needed, giving candidate new BSS(s).
2. MSC **sets up the path/resources to the new BSS**.
3. New BSS **allocates a radio channel** and signals "ready" to MSC/old BSS.
4. **Old BSS tells the mobile: perform handoff** to the new BSS.
5. Mobile and new BSS **activate the new channel**; mobile signals the MSC via the new BSS.
6. **MSC reroutes the call** through the new BSS and releases old-BSS resources.
The call continues **without interruption** — that is the design goal.
