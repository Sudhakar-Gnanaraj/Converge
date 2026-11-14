import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  ActivityItem, BudgetVisibility, ChatMessage, DecisionStatus, ItineraryDay, Member, MemberDecision,
  Preference, PreferencePriority, PrivateBudget, Proposal, Screen, TripComponent, TripTab,
} from '../types'
import { BASE_PROPOSALS, COMPROMISES, ITINERARY, MEMBERS, ME, PEAK_FLIGHT_RISE, STAY_PRICE_RISE, type CompromiseId } from '../data/mockTrip'
import { CLOSING, STEPS } from '../features/discovery/script'
import { parseAnswer } from '../features/discovery/parser'
import { agentSignal } from '../lib/personalAgents'
import { APPROVED, diffProposals, isFinal, isMaterialChange, resetDecisions, totalPP } from '../lib/proposalRules'
import { now, prefText, uid } from '../lib/format'

export type BookingStage = 'idle' | 'checking' | 'holding' | 'price-changed' | 'reapproval' | 'ready' | 'paying' | 'paid'

interface State {
  stack: Screen[]
  members: Member[]
  chat: ChatMessage[]
  chatStep: number
  aiTyping: boolean
  myPrefs: Preference[]
  budget: PrivateBudget
  visibility: BudgetVisibility
  share: Record<string, boolean>
  discoveryDone: boolean
  privacyDone: boolean
  optionsState: 'waiting' | 'generating' | 'ready'
  versions: Proposal[]
  decisions: Record<string, MemberDecision>
  nudged: Record<string, boolean>
  activity: ActivityItem[]
  itinerary: ItineraryDay[]
  booking: BookingStage
  holdEndsAt: number
  toast: { id: string; text: string } | null
  viewAs: 'me' | 'group'
  noViable: boolean
}

const firstChat = (): ChatMessage[] => [{ id: uid(), from: 'ai', text: STEPS[0].ai }]

const seedDecisions = (): Record<string, MemberDecision> =>
  Object.fromEntries(MEMBERS.map((m) => [m.id, { memberId: m.id, proposalVersion: 1, status: 'pending' as DecisionStatus }]))

const initial = (): State => ({
  stack: [{ name: 'home' }],
  members: MEMBERS.map((m) => ({ ...m })),
  chat: firstChat(),
  chatStep: 0,
  aiTyping: false,
  myPrefs: [],
  budget: { ideal: null, maximum: null, currency: 'INR' },
  visibility: 'private',
  share: {},
  discoveryDone: false,
  privacyDone: false,
  optionsState: 'waiting',
  versions: [BASE_PROPOSALS[0]],
  decisions: seedDecisions(),
  nudged: {},
  activity: [
    { id: uid(), at: 'Mon', text: 'Alex created the trip and invited 5 friends', tone: 'neutral' },
    { id: uid(), at: 'Mon', text: 'Alex, Karan, Maya and Priya shared their preferences', tone: 'neutral' },
  ],
  itinerary: ITINERARY.map((d) => ({ ...d, items: d.items.map((i) => ({ ...i, joined: [...i.joined] })) })),
  booking: 'idle',
  holdEndsAt: 0,
  toast: null,
  viewAs: 'me',
  noViable: false,
})

function useStoreValue() {
  const [s, setS] = useState<State>(initial)
  const ref = useRef(s)
  ref.current = s
  const timers = useRef<number[]>([])
  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const patch = useCallback((p: Partial<State> | ((s: State) => Partial<State>)) => {
    setS((prev) => ({ ...prev, ...(typeof p === 'function' ? p(prev) : p) }))
  }, [])

  const toast = useCallback((text: string) => {
    const id = uid()
    patch({ toast: { id, text } })
    later(3200, () => setS((p) => (p.toast?.id === id ? { ...p, toast: null } : p)))
  }, [patch, later])

  const log = useCallback((text: string, tone: ActivityItem['tone'] = 'neutral') => {
    setS((p) => ({ ...p, activity: [{ id: uid(), at: now(), text, tone }, ...p.activity] }))
  }, [])

  // ── navigation ────────────────────────────────────────────
  const go = useCallback((screen: Screen) => {
    setS((p) => ({ ...p, stack: [...p.stack, screen] }))
    document.getElementById('scroller')?.scrollTo({ top: 0 })
  }, [])
  const replace = useCallback((screen: Screen) => {
    setS((p) => ({ ...p, stack: [...p.stack.slice(0, -1), screen] }))
    document.getElementById('scroller')?.scrollTo({ top: 0 })
  }, [])
  const resetTo = useCallback((stack: Screen[]) => {
    setS((p) => ({ ...p, stack }))
    document.getElementById('scroller')?.scrollTo({ top: 0 })
  }, [])
  const back = useCallback(() => setS((p) => ({ ...p, stack: p.stack.length > 1 ? p.stack.slice(0, -1) : p.stack })), [])
  const openTab = useCallback((tab: TripTab) => {
    setS((p) => {
      const base = p.stack.findIndex((x) => x.name === 'trip')
      const stack = base >= 0 ? [...p.stack.slice(0, base), { name: 'trip' as const, tab }] : [...p.stack, { name: 'trip' as const, tab }]
      return { ...p, stack }
    })
    document.getElementById('scroller')?.scrollTo({ top: 0 })
  }, [])

  const navigate = useCallback((screen: Screen) => (screen.name === 'trip' ? openTab(screen.tab) : go(screen)), [go, openTab])

  // ── simulated members ─────────────────────────────────────
  /** Other members respond to `version`. Priya only responds after a nudge (shows the pending state). */
  const simulateResponses = useCallback((p: Proposal, opts: { priyaWaits: boolean }) => {
    const version = p.version
    const total = totalPP(p)
    const plan: [string, number][] = [['karan', 1300], ['maya', 2300], ['alex', 3200], ['sam', 1800]]
    if (!opts.priyaWaits) plan.push(['priya', 3800])
    for (const [id, ms] of plan) {
      later(ms, () => {
        const cur = ref.current
        const m = cur.members.find((x) => x.id === id)
        if (!m?.active || cur.decisions[id]?.proposalVersion !== version || APPROVED.includes(cur.decisions[id].status)) return
        if (id === 'sam') {
          // Pre-approval is explicit, opt-in consent with limits; outside the limits Sam must decide.
          const ok = m.preApproval && agentSignal('sam', total) !== 'above' && p.mustHaveIssues.length === 0
          if (!ok) return
          setS((x) => ({ ...x, decisions: { ...x.decisions, sam: { memberId: 'sam', proposalVersion: version, status: 'approved-via-limits', note: 'Within the limits Sam set' } } }))
          log(`Sam’s pre-approval applied to v${version} (within Sam’s limits)`, 'good')
          return
        }
        setS((x) => ({ ...x, decisions: { ...x.decisions, [id]: { memberId: id, proposalVersion: version, status: 'approved' } } }))
        log(`${m.name} approved v${version}`, 'good')
      })
    }
  }, [later, log])

  // ── personal AI chat ─────────────────────────────────────
  const addPrefs = (prefs: Omit<Preference, 'id'>[]) => prefs.map((x) => ({ ...x, id: uid() }))

  const answer = useCallback((text: string, fromQuickReply: boolean) => {
    const cur = ref.current
    if (cur.aiTyping || cur.chatStep >= STEPS.length) return
    const step = cur.chatStep
    const res = fromQuickReply ? { ...STEPS[step].extract(text), unsure: [] as string[] } : parseAnswer(step, text)
    const prefs = addPrefs(res.prefs)
    const isBudget = step === 3
    setS((p) => ({
      ...p,
      chat: [...p.chat, { id: uid(), from: 'me', text }],
      myPrefs: isBudget ? [...p.myPrefs.filter((x) => x.category !== 'budget'), ...prefs] : [...p.myPrefs, ...prefs],
      budget: res.budget ? { ...p.budget, ...res.budget } : p.budget,
      aiTyping: true,
    }))
    later(900, () => {
      const next = step + 1
      const ack = res.unsure.length
        ? `I noted “${res.unsure.join('”, “')}” but couldn’t tell how strongly you feel, so it’s marked Not sure. Tap the card to set it.`
        : fromQuickReply
          ? ''
          : prefs.length
            ? (ref.current.chat.some((m) => m.text.startsWith('Got it. I’ve guessed')) ? '' : 'Got it. I’ve guessed how strongly you feel from your wording. Tap a card if I got it wrong.')
            : 'Noted, nothing to add there.'
      const msgs: ChatMessage[] = [{ id: uid(), from: 'ai', text: ack, extracted: prefs.map((x) => `${prefText(x)} (${PRIORITY_LABEL[x.priority]})`) }]
      if (next < STEPS.length) msgs.push({ id: uid(), from: 'ai', text: STEPS[next].ai })
      else msgs.push({ id: uid(), from: 'ai', text: CLOSING })
      setS((p) => ({ ...p, chat: [...p.chat, ...msgs.filter((m) => m.text || m.extracted?.length)], chatStep: next, aiTyping: false, discoveryDone: next >= STEPS.length }))
    })
  }, [later])

  const updatePref = useCallback((id: string, changes: Partial<Pick<Preference, 'label' | 'priority'>>) => {
    setS((p) => ({ ...p, myPrefs: p.myPrefs.map((x) => (x.id === id ? { ...x, ...changes } : x)) }))
  }, [])
  const removePref = useCallback((id: string) => setS((p) => ({ ...p, myPrefs: p.myPrefs.filter((x) => x.id !== id) })), [])
  const setBudget = useCallback((b: Partial<PrivateBudget>) => setS((p) => ({ ...p, budget: { ...p.budget, ...b } })), [])

  // ── privacy ───────────────────────────────────────────────
  const setVisibility = useCallback((v: BudgetVisibility) => {
    const was = ref.current.visibility
    patch({ visibility: v })
    if (ref.current.privacyDone && was !== v) {
      log('Riya updated budget sharing (group sees the new setting from now on)', 'neutral')
      toast('Saved. Future group suggestions use your new setting.')
    }
  }, [patch, log, toast])
  const setShare = useCallback((id: string, on: boolean) => setS((p) => ({ ...p, share: { ...p.share, [id]: on } })), [])
  const setPreApproval = useCallback((on: boolean) => {
    setS((p) => ({ ...p, members: p.members.map((m) => (m.id === ME ? { ...m, preApproval: on } : m)) }))
    toast(on ? 'Pre-approval on. You’ll still be asked about anything outside your limits.' : 'Pre-approval off. Every decision will wait for you.')
  }, [toast])

  const confirmPrivacy = useCallback(() => {
    const first = !ref.current.privacyDone
    setS((p) => ({ ...p, privacyDone: true, members: p.members.map((m) => (m.id === ME ? { ...m, setupDone: true } : m)) }))
    if (!first) { toast('Sharing settings updated'); return }
    log('Riya shared preferences with the group AI', 'neutral')
    // Sam finishes shortly after, then the group AI prepares options.
    later(2200, () => {
      setS((p) => ({ ...p, members: p.members.map((m) => (m.id === 'sam' ? { ...m, setupDone: true } : m)) }))
      log('Sam shared preferences (took the 2-minute version)', 'neutral')
      toast('Sam finished. Everyone’s in — preparing options')
      setS((p) => ({ ...p, optionsState: 'generating' }))
      later(3200, () => {
        setS((p) => ({ ...p, optionsState: 'ready' }))
        log('Group AI prepared 3 options and sent Goa North (v1) for approval', 'ai')
        simulateResponses(BASE_PROPOSALS[0], { priyaWaits: true })
      })
    })
  }, [later, log, toast, simulateResponses])

  // ── decisions ─────────────────────────────────────────────
  const current = s.versions[s.versions.length - 1]

  const decide = useCallback((status: DecisionStatus, note?: string) => {
    const cur = ref.current
    const v = cur.versions[cur.versions.length - 1].version
    setS((p) => ({ ...p, decisions: { ...p.decisions, [ME]: { memberId: ME, proposalVersion: v, status, note } } }))
    const words: Record<string, string> = { approved: 'approved', 'changes-requested': 'requested changes to', rejected: 'rejected' }
    log(`Riya ${words[status] ?? 'responded to'} v${v}${note && status === 'changes-requested' ? ` — “${note}”` : ''}`, status === 'approved' ? 'good' : status === 'rejected' ? 'bad' : 'warn')
  }, [log])

  const nudge = useCallback((id: string) => {
    const cur = ref.current
    const m = cur.members.find((x) => x.id === id)
    if (!m || cur.nudged[id]) return
    const v = cur.versions[cur.versions.length - 1].version
    setS((p) => ({ ...p, nudged: { ...p.nudged, [id]: true } }))
    log(`Reminder sent to ${m.name} (one per decision)`, 'neutral')
    toast(`Reminder sent to ${m.name}`)
    later(2600, () => {
      const c = ref.current
      if (c.decisions[id]?.proposalVersion !== v || APPROVED.includes(c.decisions[id].status) || !c.members.find((x) => x.id === id)?.active) return
      setS((p) => ({ ...p, decisions: { ...p.decisions, [id]: { memberId: id, proposalVersion: v, status: 'approved' } } }))
      log(`${m.name} approved v${v}`, 'good')
    })
  }, [later, log, toast])

  /** Creates a new version. Material changes reset every response to "Review needed". */
  const createVersion = useCallback((components: TripComponent[], label: string, opts: { priyaWaits: boolean; mustHaveIssues?: string[]; simulate?: boolean } = { priyaWaits: true }) => {
    const cur = ref.current
    const prev = cur.versions[cur.versions.length - 1]
    const next: Proposal = {
      ...prev,
      id: `${prev.baseId}@${prev.version + 1}`,
      version: prev.version + 1,
      components,
      mustHaveIssues: opts.mustHaveIssues ?? [],
      status: 'awaiting-approval',
    }
    next.changeSummary = diffProposals(prev, next)
    const material = isMaterialChange(prev, next)
    setS((p) => ({
      ...p,
      versions: [...p.versions, next],
      decisions: material
        ? resetDecisions(p.decisions, next.version)
        : Object.fromEntries(Object.entries(p.decisions).map(([k, d]) => [k, { ...d, proposalVersion: next.version }])),
      nudged: material ? {} : p.nudged,
    }))
    log(`${label} → v${next.version}${material ? '. Material change: all approvals reset' : ' (minor, approvals kept)'}`, 'ai')
    if (material && opts.simulate !== false) simulateResponses(next, opts)
    return { version: next.version, material }
  }, [log, simulateResponses])

  const applyCompromise = useCallback((id: CompromiseId) => {
    const c = COMPROMISES.find((x) => x.id === id)!
    const prev = ref.current.versions[ref.current.versions.length - 1]
    return createVersion(c.patch(prev), `Riya proposed compromise ${id}: ${c.title}`, { priyaWaits: true, mustHaveIssues: c.mustHaveIssue ? [c.mustHaveIssue] : [] })
  }, [createVersion])

  const swapComponent = useCallback((oldId: string, next: TripComponent) => {
    const prev = ref.current.versions[ref.current.versions.length - 1]
    return createVersion(prev.components.map((c) => (c.id === oldId ? next : c)), `Riya swapped ${prev.components.find((c) => c.id === oldId)?.title}`, { priyaWaits: false })
  }, [createVersion])

  // ── itinerary ─────────────────────────────────────────────
  const mapItem = (fn: (i: ItineraryDay['items'][number]) => ItineraryDay['items'][number]) =>
    setS((p) => ({ ...p, itinerary: p.itinerary.map((d) => ({ ...d, items: d.items.map(fn) })) }))

  const toggleJoin = useCallback((itemId: string) => mapItem((i) => (i.id === itemId ? { ...i, joined: i.joined.includes(ME) ? i.joined.filter((x) => x !== ME) : [...i.joined, ME] } : i)), [])
  const makeOptional = useCallback((itemId: string) => {
    const active = ref.current.members.filter((m) => m.active).map((m) => m.id)
    mapItem((i) => (i.id === itemId ? { ...i, kind: 'optional', joined: active } : i))
    toast('Made optional — everyone’s still in until they opt out. Minor change, no re-approval.')
    log('Riya made an activity optional (minor change, included in the daily digest)', 'neutral')
  }, [toast, log])
  const toggleLock = useCallback((itemId: string) => mapItem((i) => (i.id === itemId ? { ...i, locked: !i.locked } : i)), [])
  const regenerate = useCallback(() => {
    let changed = 0
    mapItem((i) => {
      if (i.locked || !i.alternates?.length) return i
      changed++
      const [nextAlt, ...rest] = i.alternates
      return { ...i, title: nextAlt.title, place: nextAlt.place, pricePP: nextAlt.pricePP, alternates: [...rest, { title: i.title, place: i.place, pricePP: i.pricePP }] }
    })
    toast('Regenerated unlocked suggestions around your locked plans')
    void changed
  }, [toast])

  // ── booking ───────────────────────────────────────────────
  const startBooking = useCallback(() => {
    patch({ booking: 'checking' })
    later(1800, () => {
      patch({ booking: 'holding', holdEndsAt: Date.now() + 15 * 60 * 1000 })
      log('Fares held for 15 min (simulated)', 'neutral')
      later(3600, () => {
        if (ref.current.booking !== 'holding') return
        patch({ booking: 'price-changed' })
        log(`Stay price changed by +₹${STAY_PRICE_RISE}/person while holding`, 'warn')
      })
    })
  }, [patch, later, log])

  const respondToPriceChange = useCallback((choice: 'accept' | 'swap') => {
    const prev = ref.current.versions[ref.current.versions.length - 1]
    const stay = prev.components.find((c) => c.kind === 'stay')!
    const next: TripComponent = choice === 'accept'
      ? { ...stay, pricePP: stay.pricePP + STAY_PRICE_RISE, detail: stay.detail + ' · updated rate' }
      : { id: 'villa-siolim', kind: 'stay', title: 'Similar villa, Siolim', detail: '2 nights · 3 rooms · pool · 10 min to Morjim beach', pricePP: stay.pricePP + 200, verification: 'estimate' }
    createVersion(prev.components.map((c) => (c.id === stay.id ? next : c)), choice === 'accept' ? 'Stay price update accepted for group review' : 'Riya proposed a similar villa instead', { priyaWaits: false })
    patch({ booking: 'reapproval' })
  }, [createVersion, patch])

  // move booking forward once everyone re-approves
  useEffect(() => {
    if (s.booking === 'reapproval' && isFinal(s.decisions, s.members, current.version)) {
      patch({ booking: 'ready', holdEndsAt: Date.now() + 15 * 60 * 1000 })
      log(`Everyone approved v${current.version}. Hold extended (simulated)`, 'good')
    }
  }, [s.booking, s.decisions, s.members, current.version, patch, log])

  const pay = useCallback(() => {
    patch({ booking: 'paying' })
    later(1500, () => {
      patch({ booking: 'paid' })
      log('Riya’s share paid (simulated). Waiting on other shares', 'good')
      go({ name: 'confirmed' })
    })
  }, [patch, later, log, go])

  // ── demo controls ─────────────────────────────────────────
  const reset = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setS(initial())
  }, [])

  const memberLeaves = useCallback((id: string) => {
    const m = ref.current.members.find((x) => x.id === id)
    if (!m?.active || ref.current.booking !== 'idle') return
    setS((p) => ({ ...p, members: p.members.map((x) => (x.id === id ? { ...x, active: false } : x)) }))
    log(`${m.name} stepped out of this trip. Decisions now need the remaining ${ref.current.members.filter((x) => x.active).length - 1}`, 'warn')
    toast(`${m.name} stepped out. Approval now needs the remaining members.`)
  }, [log, toast])

  const memberRejects = useCallback((id: string) => {
    const cur = ref.current
    if (cur.booking !== 'idle') return
    const v = cur.versions[cur.versions.length - 1].version
    const m = cur.members.find((x) => x.id === id)!
    setS((p) => ({ ...p, decisions: { ...p.decisions, [id]: { memberId: id, proposalVersion: v, status: 'rejected', note: 'Wants a stay closer to the dive spots' } } }))
    log(`${m.name} rejected v${v}. ${m.name}’s AI is privately asking what would change the decision`, 'bad')
  }, [log])

  /** Jump straight to a demo checkpoint (for presenting). */
  const jump = useCallback((to: 'start' | 'group' | 'approval') => {
    reset()
    if (to === 'start') return
    const prefs: Preference[] = addPrefs([
      { category: 'style', label: 'Relaxed pace', priority: 'prefer' },
      { category: 'want', label: 'Good local food', priority: 'prefer' },
      { category: 'destination', label: 'Goa', priority: 'prefer' },
      { category: 'dates', label: 'Back in Bengaluru by Sun night', priority: 'must-have' },
      { category: 'budget', label: 'Up to ₹14K total', priority: 'must-have' },
      { category: 'stay', label: 'Stay: clean & safe, location flexible', priority: 'flexible' },
      { category: 'avoid', label: 'Late-night clubbing', priority: 'prefer' },
    ])
    setS((p) => ({
      ...p,
      myPrefs: prefs,
      budget: { ideal: 12000, maximum: 14000, currency: 'INR' },
      chatStep: STEPS.length,
      discoveryDone: true,
      chat: [...p.chat, { id: uid(), from: 'ai', text: CLOSING }],
      stack: [{ name: 'home' }, { name: 'trip', tab: to === 'group' ? 'overview' : 'approval' }],
    }))
    later(50, () => confirmPrivacy())
  }, [reset, later, confirmPrivacy])

  /** Peak prices: flight estimates rise, so the current version is re-priced (a material change)
   *  and nobody is asked to approve it until the group decides what to revisit. */
  const triggerNoViable = useCallback(() => {
    const cur = ref.current
    if (cur.booking !== 'idle') return
    const prev = cur.versions[cur.versions.length - 1]
    const flight = prev.components.find((c) => c.kind === 'transport' && /flight/i.test(c.title))
    if (flight && !flight.detail.includes('peak fare')) {
      const raised = { ...flight, pricePP: flight.pricePP + PEAK_FLIGHT_RISE, detail: flight.detail + ' · peak fare' }
      createVersion(prev.components.map((c) => (c.id === flight.id ? raised : c)), `December flight estimates rose by ₹${PEAK_FLIGHT_RISE.toLocaleString('en-IN')}/person`, { priyaWaits: true, simulate: false })
    }
    patch({ noViable: true })
    openTab('options')
  }, [createVersion, patch, openTab])

  /** The group has answered the "what would you revisit?" question; members can respond to the re-priced version again. */
  const resolveNoViable = useCallback(() => {
    const cur = ref.current
    patch({ noViable: false })
    simulateResponses(cur.versions[cur.versions.length - 1], { priyaWaits: true })
  }, [patch, simulateResponses])

  return {
    s, current, go, navigate, back, replace, resetTo, openTab, toast, log, patch,
    answer, updatePref, removePref, setBudget,
    setVisibility, setShare, setPreApproval, confirmPrivacy,
    decide, nudge, createVersion, applyCompromise, swapComponent,
    toggleJoin, makeOptional, toggleLock, regenerate,
    startBooking, respondToPriceChange, pay,
    reset, memberLeaves, memberRejects, jump, triggerNoViable, resolveNoViable,
  }
}

type Store = ReturnType<typeof useStoreValue>
const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore outside provider')
  return v
}

export const PRIORITY_LABEL: Record<PreferencePriority, string> = {
  'must-have': 'Must-have',
  prefer: 'Prefer',
  flexible: 'Flexible',
  'not-sure': 'Not sure',
}

export function useMemoMe() {
  const { s } = useStore()
  return useMemo(() => s.members.find((m) => m.id === ME)!, [s.members])
}
