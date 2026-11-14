# Converge — group trip prototype

*Different preferences. One shared journey.*

An interactive concept prototype for the Razorpay Design × NID "AI Travel Agent" assignment (Group Coordinator persona). Converge is a group-trip feature inside a MakeMyTrip-style app. Each friend talks privately to a personal AI; the group AI only receives what each member allows; the AI proposes transparent compromises; and the trip is final only when **every** active member explicitly approves.

> Design exercise, not affiliated with MakeMyTrip. All people, prices and availability are fictional sample data. AI responses are scripted (no LLM, no API keys, no backend).

## Run it

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open the printed localhost URL. On a wide screen the app sits in a phone frame with a demo guide beside it; on a phone it fills the screen (the small flask tab on the right edge opens demo controls).

Build a static version (deployable to Vercel, Netlify or GitHub Pages):

```bash
npm run build
```

## Demo script (~3 min)

You play **Riya**, the budget-conscious member.

1. **Home → Start private chat.** Answer with quick replies or type freely. Chips under "What I understood" are editable (wording + Must-have / Prefer / Flexible / Not sure). Free text the AI can't classify is marked *Not sure*.
2. **Choose what the group sees.** Budget: private / range / exact, with a live preview of Riya's group profile. Optional "Pre-approve within my limits".
3. **Group overview.** Sam finishes, the group AI shows its work while preparing options. Common ground, conflicts, AI summary. Toggle **Riya / Group** to prove private notes never reach the group view.
4. **Options.** Three options (cards or compare table), "Why this could work", trade-offs, unverified items, no single score.
5. **Decisions.** v1 has 4 of 6 approvals; Riya's private note says it's above her maximum. **Ask the AI to find common ground** → pick a compromise → propose v2 → every approval resets to *Review needed*. Members respond; Priya stays pending until you tap the bell (one reminder). Approve → "Approved by everyone".
6. **Review & book → Hold fares.** The stay's rate rises mid-hold (+₹700, a material change), so booking pauses for a quick group re-approval of v3. Then pay your own share (simulated) → trip summary, still "Not booked yet" until every share is paid.

Demo controls (side panel / flask tab): jump to checkpoints, Karan rejects, Priya steps out, "no option meets every must-have", reset.

## How the rules are enforced in code

| Rule | Where |
|---|---|
| Final only when every **active** member approved **this** version | `src/lib/proposalRules.ts` → `isFinal` |
| Material change (stay, transport, destination, dates, ≥ ₹500 or ≥ 5%) resets approvals | `isMaterialChange`, `resetDecisions` |
| Other members' budgets never leave their "personal AI"; only fits / stretches / above | `src/lib/personalAgents.ts` |
| Group sees a combined signal with no counts or names, and only after everyone has shared | `src/lib/privacy.ts` → `aggregateFit`, `src/lib/selectors.ts` → `useGroupFit` |
| Group-facing components receive a `GroupProfile`, which has no private amounts | `myGroupProfile`, `src/components/GroupProfileCard.tsx` |
| Pre-approval applies only within the member's limits and is labelled differently | `simulateResponses` in `src/app/store.tsx` |
| Shared costs split equally; optional activities paid only by joiners | `src/lib/costCalculations.ts` |

## Structure

```
src/
  app/            App shell, phone frame, demo panel, store (state + simulation)
  components/     UI kit (Header, Card, StatusBadge, Sheet, PrivateNote…), GroupProfileCard
  data/           mockTrip.ts — all sample data (members, proposals, compromises, itinerary)
  features/
    home/         Host-app home with "Plan with friends"
    discovery/    Private AI chat, scripted conversation, preference editor
    privacy/      Budget sharing + group preview
    trip/         Trip workspace, overview / common ground, members
    proposals/    Options, compare table, proposal detail + swap
    negotiation/  Find Common Ground
    approvals/    Decision screen
    itinerary/    Day-by-day + who pays what
    booking/      Fare hold, mid-booking change, pay share, final summary
  lib/            Rules, privacy, cost maths, selectors
```

## What is simulated

- The personal and group AI (deterministic scripts and rules).
- Other members' responses (timed, seeded), Priya needs one reminder.
- Prices, fare holds, the mid-booking price change, and payment.
- Invite links and share sheets.

## Next steps if continued

- A real LLM for the private chat that outputs structured preference chips, with the scripted path kept as a fallback.
- Delivering the group's view to each member on their own device, so private data never leaves it (here it's a front-end separation only).
- Deadline handling: what happens when the deadline passes with members still pending.
- Usability test the "Approved via limits" wording and the re-approval flow with the four interviewees.
