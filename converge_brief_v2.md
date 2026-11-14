# Converge — Prototype Brief v2

**Converge** — *Different preferences. One shared journey.*
A group-trip planning feature inside the MakeMyTrip mobile app, where an AI mediator turns each friend's private preferences into group-safe constraints, proposes transparent compromises, and carries the plan all the way to a booking that every member has explicitly approved.

> Design exercise concept for the Razorpay Design × NID assignment. Not affiliated with or endorsed by MakeMyTrip. All names, prices and availability are sample data.

---

## 0. What changed from v1

| Area | v1 | v2 | Why |
|---|---|---|---|
| Platform | Standalone "Converge" app with its own brand and 4-tab nav | A feature inside MakeMyTrip mobile ("Plan with friends"), MMT-inspired visual language, no separate tab bar | Assignment constraint: design for Cleartrip/MMT's existing platform |
| End of journey | Stops at "Not booked yet" | Approval → booking cart → each member pays their own share (payment screens stubbed) | Assignment: "intent to booking" |
| Plan editing | Proposals are fixed bundles | Each part (transport, stay, local travel) can be swapped on its own; the new version shows exactly what changed so re-approval is quick | Assignment: "swap pieces … without starting over" |
| Mid-booking change | Not covered | Price change during the fare hold = material change → targeted re-approval of that line only | Assignment edge case: "plans change mid-booking" |
| Non-responders | Silence ≠ consent, nothing else | Response deadline + one nudge, opt-in **pre-approval within my limits**, "I'm out for this trip" | Research: #1 frustration is people not responding; unanimity could deadlock |
| Privacy | Hide exact budget | Also prevent inference: no counts ("stretches some budgets", never "1 member"), stay-tier choices visible only to the chooser | 6-person group makes counts identifying |
| Demo point of view | Unspecified | **Riya** (budget-conscious), with a "View as group" toggle to prove what the group sees | Strongest emotional story; directly from interview P2 |
| Proposals | Goa or Coorg, generic | Goa (flights) vs Coorg (road) with specific, non-generic places and reasoning tied to inputs | Coorg has no airport; research worry about generic suggestions |
| Scope | 5 core + 7 supporting screens | Cut Create Trip, Invite, My AI tab, Profile to stubs | 8–12 h total incl. research + slides |

---

## 1. Persona — refined by research

We started with **The Group Coordinator** ("Get 6 friends to agree on one trip").
Of 4 interviewees (ages 28–32, groups of 3–10), only one is an organiser. The other three are participants — and they are where plans stall or quietly go wrong:

| Participant | Role | What we learned | Design response |
|---|---|---|---|
| P1 (30) | Organiser | Getting everyone to respond is the hardest part; planning is more tiring than the trip | Deadlines + single nudge; pre-approval; action-only notifications |
| P2 (28) | Participant | Agrees to expensive options to avoid looking constrained; won't share exact budget | Private budget; compatibility signal only; no identifying counts |
| P3 (28) | Follower | Too many messages; doesn't want every small decision | Only material decisions need him; digest for the rest |
| P4 (32) | Ideas person | Groups drop good activities over cost; fine with not everyone joining | Optional activities paid only by those who join |

**Reframe:** *We serve the coordinator's goal by designing for the participants.*

Archetypes in the demo group: Alex (organiser), Riya (budget-conscious — **demo user**), Sam (low involvement), Karan (experience seeker), Maya, Priya.

---

## 2. Scenario

Six friends in Bengaluru, long weekend **Fri 11 – Sun 13 Dec 2026**. Considering Goa or Coorg.
Tension: everyone wants one shared trip, but comfort with spend and what makes the trip "worth it" differ.

---

## 3. Product rules (source of truth)

### 3.1 Equal decision rights
Every active member has equal rights on material decisions. The organiser manages admin (invite, deadline) but cannot approve for anyone.

### 3.2 Approval, not majority
- Actions: **Approve · Request changes · Reject**.
- Final only when **every active member** has explicitly approved the current version.
- Silence is never consent. No response = Pending.
- Material changes (destination, dates, transport, stay, price change ≥ ₹500/person or ≥ 5%, major itinerary change) create a new version and reset approvals to **Review needed**.
- Swapping one component creates a new version; the approval screen shows only what changed ("Only the stay changed") so re-approval takes seconds.
- Minor copy edits don't reset.

### 3.3 Keeping things moving (new)
- Organiser sets a response deadline; Converge sends **one** nudge 12 h before, then a digest.
- **Pre-approval within my limits** (opt-in, revocable): "Approve on my behalf only if every must-have is met and cost stays in my comfort range." Shown as *Approved via your limits*, never as a plain Approved; anything outside the limits still asks.
- **I'm out for this trip**: member leaves; remaining members' approval decides.
- On Reject, the AI asks the member privately what would change their mind.

### 3.4 Budget privacy
- Choice per member: Private / Share range / Share exact. Editable at any time; future recommendations use the new setting.
- Personal AI sends the group a compatibility signal only ("fits", "stretches", "above comfort").
- **Anti-inference:** group-facing text never counts or names members behind a budget signal ("stretches some budgets", not "1 member"). The combined budget-fit label appears only once every active member has shared, otherwise the moment it changes would reveal whose signal changed it. Stay-tier choices in a split-tier plan are visible only to the chooser and the payment line.
- Private values live only in the member's private store; group components never receive them (not hidden with CSS).

### 3.5 AI is the mediator, not the authority
May: summarise, find conflicts and common ground, propose and explain, estimate with labelled sample data, diff versions.
Must not: relax a must-have silently, claim unanimity, decide, claim verified prices, reveal private data.
Every price: **"Planning estimate · Sample data · Not a live quote"** until the booking step, where held fares are labelled **"Held fare (simulated)"**.

### 3.6 Preference types
Must-have · Prefer · Flexible · Not sure. The AI asks before treating a must-have as flexible.

---

## 4. Demo journey (~3 minutes)

1. **MMT home → "Plan with friends" card** → trip workspace for *December weekend*. "Your turn: tell your AI what you want" (4 of 6 done).
2. **Private AI chat (Riya)** — conversational, quick replies, extracted preference chips editable inline with priority.
3. **Privacy review** — budget sharing selector, live preview of the group view.
4. **Common ground** — progress, aligned items, conflicts, AI summary; **View as: Riya / Group** toggle.
5. **Proposals** — 3 options, consistent structure, "Why this could work", trade-offs, AI work log ("Checked 14 stays · ruled out 9…"). Swap any component.
6. **Find Common Ground** — stay comfort vs cost conflict; 3 compromises with who-benefits and cost effect; pick one → v2.
7. **Approval** — v1 approvals reset; simulated members respond (one via pre-approval, one after a nudge); final only when all six approve.
8. **Itinerary & cost split** — shared vs optional activities, toggle optional, per-person totals update.
9. **Booking cart** — fare hold timer; hotel price rises mid-hold → targeted re-approval of the stay line → group confirms → each pays own share (payment stubbed) → trip confirmed (simulated).

## 5. Edge states to show
No-one finished setup (empty) · member pending · changes requested · reject with private follow-up · no option meets all must-haves · price changed mid-booking · estimate can't be verified · budget-sharing changed · member leaves · AI thinking/loading.

## 6. Scope

| Build fully | Light | Stub |
|---|---|---|
| Chat → chips → privacy · Common ground · Proposals + Find Common Ground · Approval + version reset · Booking cart + mid-booking change | Itinerary · Cost split · Trip home | MMT home, Create Trip (pre-filled), Invite (share sheet) |

## 7. Visual direction
MMT-inspired: white cards on a cool grey background, blue primary (#008CFF → #0062E3 gradient CTAs), dark navy header, rounded 12–16 px cards, compact status chips. Green only for genuine Approved states; amber for Pending/Review needed; red for Rejected. No MMT logo. Calm, no glowing AI effects; the AI appears as a small "Converge AI" marker, not a chatbot skin.

## 8. Tech
React + TypeScript + Vite + Tailwind, local state, deterministic AI scripts. No backend or API keys. Mobile frame (390 px) centred on desktop for presenting.
