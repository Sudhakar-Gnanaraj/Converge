import { useState } from 'react'
import { ArrowLeftRight, CircleAlert, CircleHelp, Handshake, Sparkles } from 'lucide-react'
import { useStore } from '../../app/store'
import { AiTag, BottomBar, Button, Card, EstimateLabel, Header, KIND_ICON, Pill, PrivateNote, SectionTitle, Sheet, cx } from '../../components/ui'
import { useMyFit } from '../../lib/selectors'
import { totalPP } from '../../lib/proposalRules'
import { FIT_COPY } from '../../lib/privacy'
import { inr, signed } from '../../lib/format'
import { FitPill, useProposals } from './OptionsTab'
import type { TripComponent } from '../../types'

/** Alternatives the AI can offer for each part of the plan in decision. */
const ALTERNATIVES: Record<string, TripComponent[]> = {
  transport: [
    { id: 'goa-flights', kind: 'transport', title: 'Flights BLR ⇄ GOI', detail: 'Fri 06:05 · Sun 19:10', pricePP: 6600, verification: 'estimate' },
    { id: 'goa-flights-late', kind: 'transport', title: 'Flights, cheaper slots', detail: 'Fri 05:40 · Sun 21:55', pricePP: 5900, verification: 'estimate' },
  ],
  stay: [
    { id: 'resort', kind: 'stay', title: 'Beach resort, Candolim', detail: '2 nights · 2 min walk to beach · pool', pricePP: 5400, verification: 'estimate' },
    { id: 'villa', kind: 'stay', title: 'Shared villa, Assagao', detail: '2 nights · private pool · 15 min to Vagator beach', pricePP: 3400, verification: 'estimate' },
    { id: 'guesthouse', kind: 'stay', title: 'Boutique guesthouse, Anjuna', detail: '2 nights · 6 min walk to beach · no pool', pricePP: 3900, verification: 'estimate' },
  ],
  local: [
    { id: 'cabs', kind: 'local', title: 'Shared cabs', detail: 'Airport transfers + 2 day trips', pricePP: 900, verification: 'estimate' },
    { id: 'private-cab', kind: 'local', title: 'Private cab on call', detail: 'Driver Fri–Sun incl. airport', pricePP: 1100, verification: 'estimate' },
    { id: 'scooters', kind: 'local', title: 'Scooters × 3 + airport cabs', detail: 'For those who ride; cabs for the rest', pricePP: 700, verification: 'estimate' },
  ],
}

export function ProposalDetail({ id }: { id: string }) {
  const { s, back, go, openTab, swapComponent, toast, current } = useStore()
  const list = useProposals()
  const p = list.find((x) => x.id === id) ?? list.find((x) => x.baseId === id.split('@')[0])!
  const myFit = useMyFit()(p)
  const inDecision = p.baseId === current.baseId
  const [swapping, setSwapping] = useState<TripComponent | null>(null)
  const total = totalPP(p)

  const doSwap = (next: TripComponent) => {
    if (!swapping) return
    const { material, version } = swapComponent(swapping.id, next)
    setSwapping(null)
    toast(material ? `v${version} created. Approvals reset, everyone reviews just this change.` : 'Updated')
    openTab('approval')
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <Header title={p.name} subtitle={`${p.destination} · ${p.dates}`} onBack={back} />
      <div className="h-28 px-4 py-3 text-white" style={{ background: p.image }}>
        <div className="flex h-full flex-col justify-end">
          <div className="flex flex-wrap gap-1.5">
            {inDecision ? <span className="rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-navy">In decision · v{p.version}</span> : <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold text-navy">Alternative option</span>}
          </div>
        </div>
      </div>
      <div className="flex-1 px-4 pb-6">
        <Card className="-mt-6 relative p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[12px] text-muted">Estimated per person</p>
              <p className="text-[26px] font-bold leading-tight">{inr(total)}</p>
            </div>
            <div className="text-right text-[12px] text-muted">Shared costs, split equally<br />+ optional extras you join</div>
          </div>
          <EstimateLabel className="mt-1" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            <FitPill p={p} />
            {p.mustHaveIssues.length ? <Pill tone="bad"><CircleAlert size={11} /> Breaks a must-have</Pill> : <Pill tone="good">All must-haves met</Pill>}
          </div>
          {p.mustHaveIssues.map((m) => <p key={m} className="mt-2 text-[12.5px] text-bad">{m}</p>)}
          {s.viewAs === 'me' && myFit && <div className="mt-3"><PrivateNote>Your AI: {FIT_COPY[myFit].toLowerCase()}.</PrivateNote></div>}
        </Card>

        {p.changeSummary && p.changeSummary.length > 0 && (
          <Card className="mt-3 border-ai/20 bg-ai-soft p-3.5">
            <p className="text-[12px] font-semibold text-ai">What changed in v{p.version}</p>
            <ul className="mt-1 space-y-0.5 text-[13px]">{p.changeSummary.map((c) => <li key={c}>• {c}</li>)}</ul>
          </Card>
        )}

        <SectionTitle>What&rsquo;s in the plan</SectionTitle>
        <Card className="divide-y divide-line">
          {p.components.filter((c) => !c.optional).map((c) => (
            <div key={c.id} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-dark">{KIND_ICON[c.kind]({ size: 16 })}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">{c.title}</p>
                <p className="text-[12px] text-muted">{c.detail}</p>
                <p className="mt-0.5 text-[12px] font-semibold">{inr(c.pricePP)} <span className="font-normal text-muted">/person · estimate</span></p>
              </div>
              {inDecision && ALTERNATIVES[c.kind] && (
                <button onClick={() => setSwapping(c)} className="flex shrink-0 items-center gap-1 rounded-lg border border-line px-2 py-1 text-[12px] font-semibold text-brand-dark hover:border-brand/50">
                  <ArrowLeftRight size={13} /> Swap
                </button>
              )}
            </div>
          ))}
        </Card>

        {p.components.some((c) => c.optional) && (
          <>
            <SectionTitle>Optional · only those who join pay</SectionTitle>
            <Card className="divide-y divide-line">
              {p.components.filter((c) => c.optional).map((c) => (
                <div key={c.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-dashed border-brand/50 text-brand-dark">{KIND_ICON[c.kind]({ size: 16 })}</span>
                  <div className="flex-1">
                    <p className="text-[14px] font-medium">{c.title}</p>
                    <p className="text-[12px] text-muted">{c.detail}</p>
                    {c.verification === 'unverified' ? <Pill tone="warn" className="mt-1"><CircleHelp size={11} /> Couldn&rsquo;t verify · not in totals</Pill> : <p className="mt-0.5 text-[12px] font-semibold">{inr(c.pricePP)} <span className="font-normal text-muted">if you join</span></p>}
                  </div>
                </div>
              ))}
            </Card>
          </>
        )}

        <SectionTitle>Why this could work</SectionTitle>
        <Card className="p-4">
          <AiTag />
          <ul className="mt-2 space-y-2 text-[13.5px]">{p.why.map((w) => <li key={w} className="flex gap-2"><Sparkles size={14} className="mt-0.5 shrink-0 text-ai" /> {w}</li>)}</ul>
          <p className="mt-3 text-[12px] font-semibold text-muted">Works well for</p>
          <div className="mt-1 flex flex-wrap gap-1.5">{p.benefits.map((b) => <Pill key={b} tone="brand">{b}</Pill>)}</div>
        </Card>

        <SectionTitle>Trade-offs & assumptions</SectionTitle>
        <Card className="space-y-2 p-4 text-[13.5px]">
          {p.tradeoffs.map((t) => <p key={t} className="flex gap-2"><CircleAlert size={14} className="mt-0.5 shrink-0 text-warn" /> {t}</p>)}
          {p.assumptions.map((a) => <p key={a} className="flex gap-2 text-muted"><CircleHelp size={14} className="mt-0.5 shrink-0" /> {a}</p>)}
        </Card>
      </div>

      <BottomBar>
        {inDecision ? (
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" icon={<Handshake size={16} />} onClick={() => go({ name: 'common-ground' })}>Find common ground</Button>
            <Button className="flex-1" onClick={() => openTab('approval')}>Decide</Button>
          </div>
        ) : (
          <Button variant="secondary" className="w-full" onClick={() => toast('Suggested to the group. The current decision continues until everyone has weighed in.')}>Suggest this option to the group</Button>
        )}
      </BottomBar>

      <Sheet open={!!swapping} onClose={() => setSwapping(null)} title={`Swap: ${swapping?.title ?? ''}`}>
        <p className="mb-3 text-[12.5px] text-muted">Only this part changes. Everything else stays as it is. A swap of travel or stay is a material change, so everyone will be asked to review it.</p>
        <div className="space-y-2">
          {swapping && ALTERNATIVES[swapping.kind].filter((a) => a.id !== swapping.id).map((a) => {
            const d = a.pricePP - swapping.pricePP
            return (
              <button key={a.id} onClick={() => doSwap(a)} className="flex w-full items-start gap-3 rounded-xl border border-line p-3 text-left hover:border-brand/50">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-dark">{KIND_ICON[a.kind]({ size: 16 })}</span>
                <span className="flex-1">
                  <span className="block text-[14px] font-medium">{a.title}</span>
                  <span className="block text-[12px] text-muted">{a.detail}</span>
                </span>
                <span className={cx('shrink-0 text-[13px] font-semibold', d < 0 ? 'text-ok' : d > 0 ? 'text-warn' : 'text-muted')}>{signed(d)}</span>
              </button>
            )
          })}
        </div>
        <EstimateLabel className="mt-3" />
      </Sheet>
    </div>
  )
}
