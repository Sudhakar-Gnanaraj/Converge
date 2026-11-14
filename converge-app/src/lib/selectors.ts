import { useStore } from '../app/store'
import { ME, OTHER_SHARED } from '../data/mockTrip'
import type { GroupProfile, Proposal } from '../types'
import { agentSignal, mySignal } from './personalAgents'
import { aggregateFit, myGroupProfile } from './privacy'
import { totalPP } from './proposalRules'

/** Group-safe profiles of members who finished setup. */
export function useGroupProfiles(): GroupProfile[] {
  const { s } = useStore()
  return s.members
    .filter((m) => m.active && m.setupDone)
    .map((m) =>
      m.id === ME
        ? myGroupProfile(ME, m.name, s.myPrefs, s.share, s.budget, s.visibility)
        : { memberId: m.id, name: m.name, budgetLabel: OTHER_SHARED[m.id].budgetLabel, sharedPreferences: OTHER_SHARED[m.id].prefs, hiddenCount: OTHER_SHARED[m.id].hiddenCount },
    )
}

/** Each member's personal AI reports only fits / stretches / above; the group sees an aggregate. */
export function useGroupFit() {
  const { s } = useStore()
  return (p: Proposal) => {
    const active = s.members.filter((m) => m.active)
    // Anti-inference: if the label appeared or changed as each person joined, the group could
    // tell whose signal moved it. So it is shown only once every active member has shared.
    if (active.some((m) => !m.setupDone)) return { label: 'Budget fit shown once everyone has shared', tone: 'neutral' as const }
    const total = totalPP(p)
    const signals = active
      .map((m) => (m.id === ME ? mySignal(total, s.budget) : agentSignal(m.id, total)))
    return aggregateFit(signals)
  }
}

/** Private to the current member. Only used inside <PrivateNote> in "My view". */
export function useMyFit() {
  const { s } = useStore()
  return (p: Proposal) => (s.budget.maximum == null ? null : mySignal(totalPP(p), s.budget))
}
