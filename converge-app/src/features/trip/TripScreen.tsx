import { Eye, Lock } from 'lucide-react'
import { useStore } from '../../app/store'
import { TRIP } from '../../data/mockTrip'
import { AvatarStack, Header, cx } from '../../components/ui'
import type { TripTab } from '../../types'
import { OverviewTab } from './OverviewTab'
import { OptionsTab } from '../proposals/OptionsTab'
import { ApprovalTab } from '../approvals/ApprovalTab'
import { PlanTab } from '../itinerary/PlanTab'
import { MembersTab } from './MembersTab'
import { ME } from '../../data/mockTrip'
import { APPROVED } from '../../lib/proposalRules'

const TABS: { id: TripTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'options', label: 'Options' },
  { id: 'approval', label: 'Decisions' },
  { id: 'plan', label: 'Itinerary' },
  { id: 'members', label: 'Members' },
]

export function ViewAsToggle() {
  const { s, patch } = useStore()
  return (
    <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2">
      <span className="flex items-center gap-1.5 text-[12px] text-muted">
        {s.viewAs === 'me' ? <Lock size={13} className="text-private" /> : <Eye size={13} className="text-brand-dark" />}
        {s.viewAs === 'me' ? 'Your view, with private notes' : 'Exactly what the group sees'}
      </span>
      <div className="flex rounded-lg bg-bg p-0.5 text-[12px] font-semibold">
        {(['me', 'group'] as const).map((v) => (
          <button key={v} onClick={() => patch({ viewAs: v })} className={cx('rounded-md px-2.5 py-1 transition', s.viewAs === v ? 'bg-white text-ink shadow-sm' : 'text-muted')}>
            {v === 'me' ? 'Riya' : 'Group'}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TripScreen({ tab }: { tab: TripTab }) {
  const { s, back, openTab, current } = useStore()
  const needsMe = s.optionsState === 'ready' && !APPROVED.includes(s.decisions[ME]?.status) && s.booking === 'idle'
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div className="sticky top-0 z-20">
      <Header sticky={false} title={TRIP.name} subtitle={TRIP.dates} onBack={back} right={<AvatarStack members={s.members} size={22} />} />
      <nav className="grid grid-cols-5 gap-0.5 bg-navy px-1.5 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => openTab(t.id)}
            className={cx('relative rounded-full px-1 py-1.5 text-[12.5px] font-semibold whitespace-nowrap transition', tab === t.id ? 'bg-white text-navy' : 'text-white/70 hover:text-white')}
          >
            {t.label}
            {t.id === 'approval' && needsMe && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#FF6B4A]" aria-label="Needs your decision" />}
            {t.id === 'options' && s.optionsState === 'generating' && <span className="ml-1 text-[11px] opacity-70">…</span>}
          </button>
        ))}
      </nav>
      </div>
      <div className="flex-1 px-4 pb-8" key={tab + current.version}>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'options' && <OptionsTab />}
        {tab === 'approval' && <ApprovalTab />}
        {tab === 'plan' && <PlanTab />}
        {tab === 'members' && <MembersTab />}
      </div>
    </div>
  )
}
