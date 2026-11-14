import { useStore } from '../../app/store'
import { ME } from '../../data/mockTrip'
import { APPROVED, isFinal } from '../../lib/proposalRules'
import type { Screen } from '../../types'

export interface NextAction {
  title: string
  detail: string
  cta: string
  to: Screen | null
  tone: 'action' | 'waiting' | 'done'
}

export function useNextAction(): NextAction {
  const { s, current } = useStore()
  const done = s.members.filter((m) => m.setupDone && m.active).length
  const active = s.members.filter((m) => m.active).length
  if (!s.discoveryDone) return { title: 'Your turn: share what you want', detail: `${done} of ${active} friends are done · about 2 min · private`, cta: 'Start private chat', to: { name: 'discovery' }, tone: 'action' }
  if (!s.privacyDone) return { title: 'Choose what the group can see', detail: 'Your answers are saved privately', cta: 'Review & share', to: { name: 'privacy' }, tone: 'action' }
  if (s.optionsState !== 'ready')
    return {
      title: s.optionsState === 'generating' ? 'Preparing options…' : 'Waiting for Sam',
      detail: s.optionsState === 'generating' ? 'Comparing everyone’s shared preferences' : `${done} of ${active} done. You’ll be notified only when it’s your turn.`,
      cta: 'See group overview', to: { name: 'trip', tab: 'overview' }, tone: 'waiting',
    }
  if (s.booking === 'paid') return { title: 'Your share is paid (simulated)', detail: 'Waiting for other members’ shares', cta: 'View trip summary', to: { name: 'confirmed' }, tone: 'done' }
  if (s.booking !== 'idle') return { title: 'Booking in progress', detail: 'Fares are on hold', cta: 'Continue booking', to: { name: 'booking' }, tone: 'action' }
  if (isFinal(s.decisions, s.members, current.version)) return { title: 'Everyone approved', detail: `${current.name} · v${current.version}`, cta: 'Review & book', to: { name: 'booking' }, tone: 'done' }
  const mine = s.decisions[ME]
  if (!mine || !APPROVED.includes(mine.status)) return { title: `Review trip proposal v${current.version}`, detail: `${current.name} · needs your decision`, cta: 'Review proposal', to: { name: 'trip', tab: 'approval' }, tone: 'action' }
  return { title: 'Waiting on others', detail: 'You approved. You’ll hear from us only if something changes.', cta: 'See approvals', to: { name: 'trip', tab: 'approval' }, tone: 'waiting' }
}
