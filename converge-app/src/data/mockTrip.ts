// ─────────────────────────────────────────────────────────────
// ALL DATA IN THIS FILE IS ILLUSTRATIVE SAMPLE DATA.
// Names are fictional. Prices are planning estimates, not quotes.
// ─────────────────────────────────────────────────────────────
import type { ItineraryDay, Member, Preference, Proposal, TripComponent } from '../types'

export const ME = 'riya'

export const TRIP = {
  name: 'December long weekend',
  from: 'Bengaluru',
  dates: 'Fri 11 – Sun 13 Dec 2026',
  nights: 2,
  deadline: 'Wed 18 Nov, 9 PM',
  prompt: 'A relaxed long weekend with good food and a little adventure.',
}

export const MEMBERS: Member[] = [
  { id: 'alex', name: 'Alex', initials: 'AL', color: '#3B6FD8', role: 'organiser', archetype: 'Organiser', setupDone: true, active: true, preApproval: false },
  { id: 'riya', name: 'Riya', initials: 'RI', color: '#C2557A', role: 'member', archetype: 'Budget-conscious', setupDone: false, active: true, preApproval: false },
  { id: 'sam', name: 'Sam', initials: 'SA', color: '#6E59C9', role: 'member', archetype: 'Low-involvement', setupDone: false, active: true, preApproval: true },
  { id: 'karan', name: 'Karan', initials: 'KA', color: '#D9822B', role: 'member', archetype: 'Experience seeker', setupDone: true, active: true, preApproval: false },
  { id: 'maya', name: 'Maya', initials: 'MA', color: '#1F9C8B', role: 'member', archetype: 'Member', setupDone: true, active: true, preApproval: false },
  { id: 'priya', name: 'Priya', initials: 'PR', color: '#5A7A2B', role: 'member', archetype: 'Member', setupDone: true, active: true, preApproval: false },
]

/** What other members chose to share with the group (group-safe by construction). */
export const OTHER_SHARED: Record<string, { budgetLabel: string; prefs: Preference[]; hiddenCount: number }> = {
  alex: {
    budgetLabel: 'Shared a range · ₹15–20K',
    hiddenCount: 1,
    prefs: [
      { id: 'a1', category: 'destination', label: 'Goa', priority: 'prefer' },
      { id: 'a2', category: 'dates', label: 'Back in Bengaluru by Sun night', priority: 'must-have' },
      { id: 'a3', category: 'style', label: 'Relaxed, one big experience', priority: 'prefer' },
    ],
  },
  karan: {
    budgetLabel: 'Shared exact · ₹30K',
    hiddenCount: 0,
    prefs: [
      { id: 'k1', category: 'want', label: 'Scuba or water sports', priority: 'prefer' },
      { id: 'k2', category: 'destination', label: 'Beach', priority: 'prefer' },
      { id: 'k3', category: 'stay', label: 'Stay: anything works', priority: 'flexible' },
    ],
  },
  maya: {
    budgetLabel: 'Private · compatibility only',
    hiddenCount: 2,
    prefs: [
      { id: 'm1', category: 'stay', label: 'Stay near the beach', priority: 'prefer' },
      { id: 'm2', category: 'dates', label: 'Back in Bengaluru by Sun night', priority: 'must-have' },
      { id: 'm3', category: 'want', label: 'Good local food', priority: 'prefer' },
    ],
  },
  priya: {
    budgetLabel: 'Shared a range · ₹12–17K',
    hiddenCount: 0,
    prefs: [
      { id: 'p1', category: 'destination', label: 'Goa', priority: 'prefer' },
      { id: 'p2', category: 'stay', label: 'Nice stay near the beach', priority: 'prefer' },
      { id: 'p3', category: 'avoid', label: 'Long road trips', priority: 'prefer' },
    ],
  },
  sam: {
    budgetLabel: 'Private · compatibility only',
    hiddenCount: 1,
    prefs: [
      { id: 's1', category: 'style', label: 'Happy with whatever the group picks', priority: 'flexible' },
      { id: 's2', category: 'dates', label: 'Back in Bengaluru by Sun night', priority: 'must-have' },
    ],
  },
}

const goaFlights: TripComponent = { id: 'goa-flights', kind: 'transport', title: 'Flights BLR ⇄ GOI', detail: 'Fri 06:05 → 07:15 · Sun 19:10 → 20:20 · economy, 15 kg', pricePP: 6600, verification: 'estimate' }
const goaCruise: TripComponent = { id: 'cruise', kind: 'activity', title: 'Mandovi sunset cruise', detail: 'Sat evening · 90 min · together', pricePP: 1200, verification: 'estimate' }
const goaScuba: TripComponent = { id: 'scuba', kind: 'activity', title: 'Intro scuba dive, Grande Island', detail: 'Sat morning · only those who join pay', pricePP: 3500, optional: true, verification: 'estimate' }

export const BASE_PROPOSALS: Proposal[] = [
  {
    id: 'goa-north@1', baseId: 'goa-north', version: 1, status: 'awaiting-approval',
    name: 'Goa North · beach & sunsets', destination: 'North Goa', dates: TRIP.dates,
    tagline: 'Fly in Friday morning, stay a short walk from Candolim beach.',
    image: 'linear-gradient(135deg,#0E7FB8 0%,#44B8D6 55%,#F6C772 100%)',
    components: [
      goaFlights,
      { id: 'resort', kind: 'stay', title: 'Beach resort, Candolim', detail: '2 nights · 3 twin rooms · 2 min walk to beach · pool', pricePP: 5400, verification: 'estimate' },
      { id: 'cabs', kind: 'local', title: 'Shared cabs', detail: 'Airport transfers + 2 day trips, split 6 ways', pricePP: 900, verification: 'estimate' },
      goaCruise,
      goaScuba,
    ],
    why: [
      'Most of the group leans Goa and beach; this keeps everyone on the same Fri–Sun dates.',
      'Morning flight gives a full first day; return Sunday evening meets every "back by Sunday night" must-have.',
      'Scuba is optional, so people who want a big experience get one without raising everyone’s cost.',
    ],
    tradeoffs: ['Highest cost of the three options', 'December is peak season — flight estimates move quickly'],
    assumptions: ['3 twin-sharing rooms', 'Meals and personal spends not included', 'Flight estimate from typical December fares'],
    benefits: ['Members who want a beach stay', 'Members who want one big experience'],
    mustHaveIssues: [],
  },
  {
    id: 'goa-south@1', baseId: 'goa-south', version: 1, status: 'draft',
    name: 'Goa South · slow & simple', destination: 'Palolem, South Goa', dates: 'Thu night – Mon morning',
    tagline: 'Overnight sleeper bus, beach huts on Palolem, scooters to explore.',
    image: 'linear-gradient(135deg,#127A5B 0%,#3FB58A 55%,#F2D27A 100%)',
    components: [
      { id: 'bus', kind: 'transport', title: 'Overnight sleeper bus ⇄ Canacona', detail: 'Thu 21:30 → Fri 07:30 · Sun 20:00 → Mon 06:30', pricePP: 1800, verification: 'estimate' },
      { id: 'huts', kind: 'stay', title: 'Beach huts, Palolem', detail: '2 nights · 3 huts · on the beach · basic', pricePP: 3200, verification: 'estimate' },
      { id: 'scooters', kind: 'local', title: 'Scooters × 3', detail: '2-day rental + fuel, split', pricePP: 700, verification: 'estimate' },
      { id: 'dolphins', kind: 'activity', title: 'Dolphin-spotting boat', detail: 'Sat morning · together', pricePP: 600, verification: 'estimate' },
      { id: 'kayak', kind: 'activity', title: 'Kayaking, Galgibaga river', detail: 'Sat afternoon · only those who join pay', pricePP: 800, optional: true, verification: 'estimate' },
    ],
    why: ['Lowest overall cost while keeping a beach.', 'Palolem is quieter — suits a relaxed pace.'],
    tradeoffs: ['Two overnight bus journeys', 'Basic stay', 'Arrives back Monday morning'],
    assumptions: ['Bus fares from typical weekend prices', 'Meals not included'],
    benefits: ['Members who want to keep cost low', 'Members who want a quiet beach'],
    mustHaveIssues: ['Returns Mon 06:30 — conflicts with a "back by Sunday night" must-have held by some members.'],
  },
  {
    id: 'coorg@1', baseId: 'coorg', version: 1, status: 'draft',
    name: 'Coorg · coffee & hills', destination: 'Madikeri, Coorg', dates: TRIP.dates,
    tagline: 'Drive out Friday morning to a coffee-estate homestay, meals included.',
    image: 'linear-gradient(135deg,#2F5D3A 0%,#5E9B5A 55%,#C9B37A 100%)',
    components: [
      { id: 'suv', kind: 'transport', title: 'Self-drive · 2 rented SUVs', detail: '265 km · ~5.5 h each way · fuel & tolls split', pricePP: 2200, verification: 'estimate' },
      { id: 'homestay', kind: 'stay', title: 'Coffee-estate homestay', detail: '2 nights · 3 rooms · all meals included', pricePP: 4200, verification: 'estimate' },
      { id: 'estate', kind: 'activity', title: 'Estate walk & coffee tasting', detail: 'Sat morning · together', pricePP: 500, verification: 'estimate' },
      { id: 'jeep', kind: 'activity', title: 'Mandalpatti jeep ride', detail: 'Sat afternoon · together', pricePP: 600, verification: 'estimate' },
      { id: 'trek', kind: 'activity', title: 'Tadiandamol sunrise trek', detail: 'Sun early · only those who join pay', pricePP: 400, optional: true, verification: 'estimate' },
      { id: 'rafting', kind: 'activity', title: 'Barapole river rafting', detail: 'Couldn’t confirm December operation — not included in totals', pricePP: 0, optional: true, verification: 'unverified' },
    ],
    why: ['Well within comfort ranges; meals included makes the cost predictable.', 'Same Fri–Sun dates, back Sunday evening.'],
    tradeoffs: ['No beach — most of the group leaned beach', 'About 11 hours of driving in total', 'Some members prefer to avoid long road trips'],
    assumptions: ['Two drivers per car', 'Homestay rates include meals'],
    benefits: ['Members who want to keep cost low', 'Members who want quiet and nature'],
    mustHaveIssues: [],
  },
]

export type CompromiseId = 'A' | 'B' | 'C' | 'D'

export interface Compromise {
  id: CompromiseId
  title: string
  summary: string
  changes: string[]
  benefits: string
  givesUp: string
  itineraryEffect: string
  patch: (p: Proposal) => TripComponent[]
  mustHaveIssue?: string
  priceNote?: string
}

const swap = (cs: TripComponent[], id: string, next: TripComponent) => cs.map((c) => (c.id === id ? next : c))

export const COMPROMISES: Compromise[] = [
  {
    id: 'A',
    title: 'Villa a little inland, private cab included',
    summary: 'Swap the beach resort for a shared villa in Assagao and add a cab on call all weekend.',
    changes: ['Stay → shared villa with pool, Assagao (15 min to Vagator beach)', 'Local travel → private cab on call Fri–Sun'],
    benefits: 'Lower cost for everyone; the cab keeps beaches easy to reach.',
    givesUp: 'Walk-to-the-beach mornings.',
    itineraryEffect: 'Add ~15 min drive before beach plans. Nothing removed.',
    patch: (p) =>
      swap(
        swap(p.components, 'resort', { id: 'villa', kind: 'stay', title: 'Shared villa, Assagao', detail: '2 nights · 3 rooms · private pool · 15 min to Vagator beach', pricePP: 3400, verification: 'estimate' }),
        'cabs',
        { id: 'private-cab', kind: 'local', title: 'Private cab on call', detail: 'Driver Fri–Sun incl. airport, split 6 ways', pricePP: 1100, verification: 'estimate' },
      ),
  },
  {
    id: 'B',
    title: 'Keep the beach resort, lighten the rest',
    summary: 'Stay on Candolim beach; take less popular flight times and make the cruise optional.',
    changes: ['Flights → Fri 05:40 / Sun 21:55 (cheaper slots)', 'Sunset cruise → optional, paid by those who join'],
    benefits: 'Keeps the beach stay that several members prefer.',
    givesUp: 'A very early start and a late Sunday return; the cruise is no longer a shared moment.',
    itineraryEffect: 'Sat evening becomes free time for those who skip the cruise.',
    patch: (p) =>
      swap(
        swap(p.components, 'goa-flights', { ...goaFlights, id: 'goa-flights-late', detail: 'Fri 05:40 → 06:50 · Sun 21:55 → 23:05 · economy, 15 kg', pricePP: 5900 }),
        'cruise',
        { ...goaCruise, optional: true, detail: 'Sat evening · only those who join pay' },
      ),
  },
  {
    id: 'C',
    title: 'Two stay tiers, everything else together',
    summary: 'Book villa rooms and resort rooms next to each other. Each person picks a tier privately.',
    changes: ['Stay → villa rooms (from ₹3,400) or resort rooms (₹5,400), chosen privately', 'Flights, cabs and the cruise stay shared'],
    benefits: 'People who value the resort keep it without raising anyone else’s cost.',
    givesUp: 'Not everyone sleeps under one roof.',
    itineraryEffect: 'No change — both stays are in Candolim.',
    priceNote: 'Shown at the lower tier. Your tier choice is visible only to you.',
    patch: (p) =>
      swap(p.components, 'resort', { id: 'tiers', kind: 'stay', title: 'Villa or resort rooms, Candolim', detail: '2 nights · each person picks a tier privately · same street', pricePP: 3400, verification: 'estimate' }),
  },
  {
    id: 'D',
    title: 'Fly in, sleeper bus back',
    summary: 'Keep the flight out on Friday; return by overnight sleeper bus on Sunday night.',
    changes: ['Return → Sun 20:30 sleeper bus, arrives Mon 06:30'],
    benefits: 'Lowest cost that keeps the beach resort.',
    givesUp: 'A full night on a bus; back on Monday morning.',
    itineraryEffect: 'Leave Sunday earlier for the bus stand.',
    mustHaveIssue: 'Conflicts with a "back in Bengaluru by Sunday night" must-have held by some members. I won’t relax it unless they choose to.',
    patch: (p) =>
      swap(p.components, 'goa-flights', { id: 'fly-bus', kind: 'transport', title: 'Flight out, sleeper bus back', detail: 'Fri 06:05 flight · Sun 20:30 bus → Mon 06:30', pricePP: 4400, verification: 'estimate' }),
  },
]

export const STAY_PRICE_RISE = 700

export const ITINERARY: ItineraryDay[] = [
  {
    id: 'd1', label: 'Day 1', date: 'Fri 11 Dec',
    items: [
      { id: 'i1', time: '06:05', title: 'Flight to Goa', place: 'BLR → GOI', kind: 'shared', pricePP: 0, joined: [], locked: true },
      { id: 'i2', time: '09:30', title: 'Check in & pool time', place: 'Your stay', kind: 'shared', pricePP: 0, joined: [] },
      { id: 'i3', time: '13:00', title: 'Goan thali lunch', place: 'Mapusa', kind: 'shared', pricePP: 0, joined: [], alternates: [{ title: 'Seafood lunch by the river', place: 'Siolim', pricePP: 0 }, { title: 'Café crawl', place: 'Assagao', pricePP: 0 }] },
      { id: 'i4', time: '17:15', title: 'Sunset at Chapora Fort', place: 'Vagator', kind: 'shared', pricePP: 0, joined: [], alternates: [{ title: 'Sunset at Ozran cliffs', place: 'Vagator', pricePP: 0 }] },
    ],
  },
  {
    id: 'd2', label: 'Day 2', date: 'Sat 12 Dec',
    items: [
      { id: 'i5', componentId: 'scuba', time: '08:00', title: 'Intro scuba dive', place: 'Grande Island', kind: 'optional', pricePP: 3500, joined: ['alex', 'karan'] },
      { id: 'i6', time: '10:00', title: 'Slow morning + Fontainhas walk', place: 'Panjim', kind: 'optional', pricePP: 0, joined: ['maya', 'priya', 'sam'], alternates: [{ title: 'Spice plantation visit', place: 'Ponda', pricePP: 400 }] },
      { id: 'i7', componentId: 'cruise', time: '17:30', title: 'Mandovi sunset cruise', place: 'Panjim jetty', kind: 'shared', pricePP: 1200, joined: [] },
      { id: 'i8', time: '20:30', title: 'Saturday night market', place: 'Arpora', kind: 'optional', pricePP: 0, joined: ['karan', 'maya', 'priya'] },
    ],
  },
  {
    id: 'd3', label: 'Day 3', date: 'Sun 13 Dec',
    items: [
      { id: 'i9', time: '09:30', title: 'Beach breakfast', place: 'Vagator', kind: 'shared', pricePP: 0, joined: [], alternates: [{ title: 'Brunch at a garden café', place: 'Assagao', pricePP: 0 }] },
      { id: 'i10', time: '12:00', title: 'Souvenir & cashew shopping', place: 'Mapusa market', kind: 'optional', pricePP: 0, joined: ['maya', 'alex'] },
      { id: 'i11', time: '19:10', title: 'Flight home', place: 'GOI → BLR', kind: 'shared', pricePP: 0, joined: [], locked: true },
    ],
  },
]
