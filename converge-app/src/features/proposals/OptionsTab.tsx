import { useState } from 'react'
import { ChevronRight, CircleAlert, Info, Loader, Sparkles, TriangleAlert } from 'lucide-react'
import { useStore } from '../../app/store'
import { BASE_PROPOSALS, PEAK_FLIGHT_RISE } from '../../data/mockTrip'
import { AiTag, Card, EstimateLabel, KIND_ICON, Pill, PrivateNote, SectionTitle, Segmented, Sheet, cx } from '../../components/ui'
import { useGroupFit, useMyFit } from '../../lib/selectors'
import { totalPP } from '../../lib/proposalRules'
import { FIT_COPY } from '../../lib/privacy'
import { inr } from '../../lib/format'
import { AiWorking } from '../trip/OverviewTab'
import { ViewAsToggle } from '../trip/TripScreen'
import type { Proposal } from '../../types'

export function useProposals(): Proposal[] {
  const { current, s } = useStore()
  // Once peak fares hit, options not in decision show peak flight estimates too.
  const peak = (p: Proposal): Proposal => (!s.peakApplied ? p : {
    ...p,
    components: p.components.map((c) => (c.kind === 'transport' && /flight/i.test(c.title) ? { ...c, pricePP: c.pricePP + PEAK_FLIGHT_RISE, detail: c.detail + ' · peak fare' } : c)),
  })
  return BASE_PROPOSALS.map((p) => (p.baseId === current.baseId ? current : peak(p)))
}

export function FitPill({ p }: { p: Proposal }) {
  const fit = useGroupFit()(p)
  return <Pill tone={fit.tone}>{fit.label}</Pill>
}

function ProposalCard({ p }: { p: Proposal }) {
  const { go, s, current } = useStore()
  const inApproval = p.baseId === current.baseId
  const myFit = useMyFit()(p)
  return (
    <Card className="overflow-hidden" onClick={() => go({ name: 'proposal', id: p.id })}>
      <div className="relative h-24 px-4 py-3 text-white" style={{ background: p.image }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[17px] font-bold drop-shadow-sm">{p.name}</p>
            <p className="text-[12px] text-white/90">{p.destination} · {p.dates}</p>
          </div>
          {inApproval && <span className="rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-navy">In decision · v{p.version}</span>}
        </div>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-[13px] text-muted">{p.tagline}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[12.5px]">
          {p.components.filter((c) => !c.optional).map((c) => (
            <span key={c.id} className="flex items-center gap-1 text-ink">{KIND_ICON[c.kind]({ size: 13 })} {c.title}</span>
          ))}
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[20px] font-bold leading-none">{inr(totalPP(p))}<span className="text-[12px] font-medium text-muted"> /person</span></p>
            <p className="mt-1 text-[11px] text-muted">Estimate · sample data</p>
          </div>
          <ChevronRight size={18} className="text-muted" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FitPill p={p} />
          {p.mustHaveIssues.length > 0 ? <Pill tone="bad"><CircleAlert size={11} /> Breaks a must-have</Pill> : <Pill tone="good">All must-haves met</Pill>}
        </div>
        {s.viewAs === 'me' && myFit && myFit !== 'fits' && <PrivateNote>Your AI: {FIT_COPY[myFit].toLowerCase()}.</PrivateNote>}
      </div>
    </Card>
  )
}

function CompareTable({ list }: { list: Proposal[] }) {
  const fit = useGroupFit()
  const rows: { k: string; v: (p: Proposal) => React.ReactNode }[] = [
    { k: 'Travel', v: (p) => p.components.find((c) => c.kind === 'transport')?.title },
    { k: 'Stay', v: (p) => p.components.find((c) => c.kind === 'stay')?.title },
    { k: 'Together', v: (p) => p.components.filter((c) => c.kind === 'activity' && !c.optional).map((c) => c.title).join(', ') || '—' },
    { k: 'Optional', v: (p) => p.components.filter((c) => c.optional && c.verification !== 'unverified').map((c) => c.title).join(', ') || '—' },
    { k: 'Per person', v: (p) => <b>{inr(totalPP(p))}</b> },
    { k: 'Budget fit', v: (p) => <span className={cx('font-semibold', { good: 'text-ok', warn: 'text-warn', bad: 'text-bad', neutral: 'text-muted' }[fit(p).tone])}>{fit(p).label}</span> },
    { k: 'Must-haves', v: (p) => (p.mustHaveIssues.length ? <span className="font-semibold text-bad">1 broken</span> : <span className="text-ok">All met</span>) },
    { k: 'Main trade-off', v: (p) => p.tradeoffs[0] },
  ]
  return (
    <div className="hscroll -mx-4 overflow-x-auto px-4 pb-2">
      <table className="w-[560px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-line bg-white text-left text-[12.5px]">
        <thead>
          <tr>
            <th className="sticky left-0 w-[92px] bg-white p-2.5" />
            {list.map((p) => <th key={p.id} className="border-l border-line p-2.5 text-[13px] font-semibold">{p.name.split(' · ')[0]}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.k}>
              <td className="sticky left-0 border-t border-line bg-white p-2.5 font-medium text-muted">{r.k}</td>
              {list.map((p) => <td key={p.id} className="border-t border-l border-line p-2.5 align-top">{r.v(p)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function NoViable() {
  const { s, answerNoViable, setBudget, toast } = useStore()
  const [budgetAnswered, setBudgetAnswered] = useState(false)
  if (s.noViable === 'watching')
    return (
      <Card className="mt-3 border-warn/30 p-4">
        <p className="flex items-center gap-1.5 text-[14px] font-semibold text-warn"><Loader size={16} className="animate-spin" /> Watching December fares</p>
        <p className="mt-1 text-[13px] text-ink">The plan stays on hold and nobody is asked to approve it. I&rsquo;ll tell everyone as soon as fares drop.</p>
      </Card>
    )
  const choices: [Parameters<typeof answerNoViable>[0], string, string][] = [
    ['coorg', 'Consider Coorg instead', 'Keeps every must-have; road trip, no beach'],
    ['monday', 'Return Monday morning', 'Cheaper flights, one more night; breaks some members’ Sunday must-have'],
    ['wait', 'Leave it — keep looking', 'Hold the plan and watch for fares to drop'],
  ]
  return (
    <Card className="mt-3 border-bad/30 p-4">
      <p className="flex items-center gap-1.5 text-[14px] font-semibold text-bad"><TriangleAlert size={16} /> No option meets every must-have right now</p>
      <p className="mt-1 text-[13px] text-ink">December flight estimates rose by {inr(PEAK_FLIGHT_RISE)} per person, so I&rsquo;ve re-priced the current plan. I can&rsquo;t find a Goa option that keeps everyone&rsquo;s comfort range <i>and</i> the &ldquo;back by Sunday night&rdquo; must-have. I won&rsquo;t relax any must-have on my own.</p>
      <p className="mt-3 text-[12px] font-semibold text-muted">Which constraint, if any, would you revisit? Your pick becomes a new version that everyone still has to approve.</p>
      <div className="mt-2 grid gap-1.5">
        {choices.map(([id, label, hint]) => (
          <button key={id} onClick={() => answerNoViable(id)} className="rounded-xl border border-line px-3 py-2 text-left hover:border-brand/50">
            <span className="block text-[13px] font-semibold">{label}</span>
            <span className="block text-[12px] text-muted">{hint}</span>
          </button>
        ))}
      </div>
      {!budgetAnswered && s.budget.maximum !== null && (
        <div className="mt-3">
          <PrivateNote>
            Your AI: your {'₹'} maximum is a must-have. Keep it, or allow a little flexibility for this trip?
            <span className="mt-2 flex gap-2">
              <button className="rounded-lg bg-white px-2 py-1 font-semibold" onClick={() => { setBudgetAnswered(true); toast('Kept as a must-have. Nothing above it will be approved for you.') }}>Keep it</button>
              <button className="rounded-lg bg-white px-2 py-1 font-semibold" onClick={() => {
                const max = Math.round(((s.budget.maximum ?? 0) * 1.1) / 500) * 500
                setBudget({ maximum: max })
                setBudgetAnswered(true)
                toast(`Your private maximum is now ${inr(max)}. Still never shared with the group.`)
              }}>Allow 10% more</button>
            </span>
          </PrivateNote>
        </div>
      )}
    </Card>
  )
}

export function OptionsTab() {
  const { s } = useStore()
  const list = useProposals()
  const [mode, setMode] = useState<'cards' | 'compare'>('cards')
  const [how, setHow] = useState(false)

  if (s.optionsState === 'waiting')
    return (
      <div className="pt-4">
        <Card className="p-5 text-center">
          <Sparkles className="mx-auto text-ai" size={22} />
          <p className="mt-2 text-[15px] font-semibold">Options appear once everyone has shared</p>
          <p className="mt-1 text-[13px] text-muted">Waiting on {s.members.filter((m) => m.active && !m.setupDone).map((m) => (m.id === 'riya' ? 'you' : m.name)).join(' and ')}. Nobody is rushed: you&rsquo;ll get one reminder before the deadline.</p>
        </Card>
        <div className="mt-3 space-y-3">{[0, 1].map((i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div>
      </div>
    )
  if (s.optionsState === 'generating') return <div className="pt-4"><AiWorking /><div className="skeleton mt-3 h-40 rounded-2xl" /></div>

  return (
    <div className="pt-1">
      <ViewAsToggle />
      {s.noViable && <NoViable />}
      <div className="mt-3 flex items-center justify-between">
        <div className="w-[190px]"><Segmented size="sm" value={mode} onChange={setMode} options={[{ value: 'cards', label: 'Options' }, { value: 'compare', label: 'Compare' }]} /></div>
        <button onClick={() => setHow(true)} className="flex items-center gap-1 text-[12.5px] font-semibold text-brand-dark"><Info size={14} /> How we compare</button>
      </div>
      <Card className="mt-3 p-3.5">
        <AiTag />
        <p className="mt-1 text-[13px]">Three different ways to spend the weekend. There&rsquo;s no single score. Compare what matters to you, then ask me for a compromise.</p>
      </Card>
      <div className="mt-3 space-y-3">
        {mode === 'cards' ? list.map((p) => <ProposalCard key={p.id} p={p} />) : <CompareTable list={list} />}
      </div>
      <EstimateLabel className="mt-3 justify-center" />

      <Sheet open={how} onClose={() => setHow(false)} title="How options are compared">
        <ul className="space-y-3 text-[13.5px]">
          <li><b>Must-haves</b> · checked against every shared must-have. A broken one is always shown, never hidden.</li>
          <li><b>Budget fit</b> · each member&rsquo;s own AI privately checks the cost and reports only <i>fits</i>, <i>stretches</i> or <i>above</i>. The group sees a combined label that never says how many or who.</li>
          <li><b>Preferences</b> · what members marked Prefer or Flexible shapes the options, but doesn&rsquo;t rank them.</li>
          <li><b>No score</b> · the AI explains trade-offs. The group decides.</li>
        </ul>
        <SectionTitle>Not included in prices</SectionTitle>
        <p className="text-[13px] text-muted">Meals (unless stated), personal spends and optional activities you don&rsquo;t join.</p>
      </Sheet>
    </div>
  )
}
