export type PreferencePriority = 'must-have' | 'prefer' | 'flexible' | 'not-sure'
export type BudgetVisibility = 'private' | 'range' | 'exact'
export type DecisionStatus =
  | 'pending'
  | 'approved'
  | 'approved-via-limits'
  | 'changes-requested'
  | 'rejected'
  | 'review-needed'

/** Compatibility signal a personal AI may pass to the group AI. Never a number. */
export type BudgetFit = 'fits' | 'stretches' | 'above'

export type PreferenceCategory =
  | 'style'
  | 'dates'
  | 'destination'
  | 'budget'
  | 'stay'
  | 'want'
  | 'avoid'

export interface Preference {
  id: string
  category: PreferenceCategory
  label: string
  priority: PreferencePriority
  /** budget chips are always private-by-construction; see lib/privacy.ts */
  sensitive?: boolean
}

/** Lives only in the current member's private context. Never passed to group-facing components. */
export interface PrivateBudget {
  ideal: number | null
  maximum: number | null
  currency: 'INR'
}

export interface Member {
  id: string
  name: string
  initials: string
  color: string
  role: 'organiser' | 'member'
  archetype: string
  setupDone: boolean
  active: boolean
  /** opt-in standing consent: "approve only if must-haves are met and cost is within my comfort range" */
  preApproval: boolean
}

/** What the group AI is allowed to know about a member. */
export interface GroupProfile {
  memberId: string
  name: string
  budgetLabel: string
  sharedPreferences: Preference[]
  hiddenCount: number
}

export type ComponentKind = 'transport' | 'stay' | 'local' | 'activity'

export interface TripComponent {
  id: string
  kind: ComponentKind
  title: string
  detail: string
  pricePP: number
  optional?: boolean
  verification: 'estimate' | 'unverified'
}

export interface Proposal {
  id: string
  baseId: string
  version: number
  name: string
  destination: string
  dates: string
  tagline: string
  image: string
  components: TripComponent[]
  why: string[]
  tradeoffs: string[]
  assumptions: string[]
  benefits: string[]
  mustHaveIssues: string[]
  changeSummary?: string[]
  status: 'draft' | 'awaiting-approval' | 'approved'
}

export interface MemberDecision {
  memberId: string
  proposalVersion: number
  status: DecisionStatus
  note?: string
}

export interface ActivityItem {
  id: string
  at: string
  text: string
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'ai'
}

export interface ItineraryItem {
  id: string
  time: string
  title: string
  place: string
  kind: 'shared' | 'optional'
  pricePP: number
  joined: string[]
  locked?: boolean
  componentId?: string
  alternates?: { title: string; place: string; pricePP: number }[]
}

export interface ItineraryDay {
  id: string
  label: string
  date: string
  items: ItineraryItem[]
}

export interface ChatMessage {
  id: string
  from: 'ai' | 'me'
  text: string
  extracted?: string[]
}

export type TripTab = 'overview' | 'options' | 'approval' | 'plan' | 'members'

export type Screen =
  | { name: 'home' }
  | { name: 'trip'; tab: TripTab }
  | { name: 'discovery' }
  | { name: 'privacy' }
  | { name: 'proposal'; id: string }
  | { name: 'common-ground' }
  | { name: 'booking' }
  | { name: 'confirmed' }
