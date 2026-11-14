import { useState } from 'react'
import { Lock, LockOpen, MoreHorizontal, RefreshCw, Users } from 'lucide-react'
import { useStore } from '../../app/store'
import { ME } from '../../data/mockTrip'
import { Avatar, Button, Card, EstimateLabel, Pill, SectionTitle, Segmented, Sheet, cx } from '../../components/ui'
import { isFinal } from '../../lib/proposalRules'
import { memberTotal, memberTotals, optionalLines, sharedLines } from '../../lib/costCalculations'
import { inr, signed } from '../../lib/format'
import type { ItineraryItem } from '../../types'

function Itinerary() {
  const { s, current, toggleJoin, makeOptional, toggleLock, regenerate, toast } = useStore()
  const [menu, setMenu] = useState<ItineraryItem | null>(null)
  const [impact, setImpact] = useState<{ id: string; delta: number } | null>(null)
  const stay = current.components.find((c) => c.kind === 'stay')
  const mine = memberTotal(ME, current, s.itinerary).total
  const byId = Object.fromEntries(s.members.map((m) => [m.id, m]))

  const join = (i: ItineraryItem) => {
    const delta = i.joined.includes(ME) ? -i.pricePP : i.pricePP
    toggleJoin(i.id)
    if (i.pricePP) setImpact({ id: i.id, delta })
    setTimeout(() => setImpact((x) => (x?.id === i.id ? null : x)), 2600)
  }

  return (
    <>
      <Card className="mt-3 flex items-center justify-between p-3.5">
        <div>
          <p className="text-[12px] text-muted">Your estimated total</p>
          <p className="text-[19px] font-bold">{inr(mine)}</p>
        </div>
        <div className="flex gap-3 text-[11.5px]">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-brand" /> Together</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border-2 border-dashed border-brand" /> Optional</span>
        </div>
      </Card>

      {s.itinerary.map((d) => (
        <div key={d.id}>
          <SectionTitle>{d.label} · {d.date}</SectionTitle>
          <div className="relative space-y-2 pl-5">
            <span className="absolute top-2 bottom-2 left-[7px] w-0.5 rounded bg-line" />
            {d.items.map((i) => {
              const optional = i.kind === 'optional'
              const imIn = i.joined.includes(ME)
              return (
                <div key={i.id} className="relative">
                  <span className={cx('absolute top-4 -left-[17px] h-3 w-3 rounded-full border-2', optional ? 'border-brand bg-white' : 'border-brand bg-brand')} />
                  <div className={cx('rounded-2xl bg-white p-3', optional ? 'border-2 border-dashed border-brand/40' : 'border border-line')}>
                    <div className="flex items-start gap-2">
                      <span className="w-11 shrink-0 pt-0.5 text-[12px] font-semibold text-muted">{i.time}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium leading-snug">{i.title}</p>
                        <p className="text-[12px] text-muted">{i.place === 'Your stay' && stay ? stay.title : i.place}{i.pricePP ? ` · ${inr(i.pricePP)}${optional ? ' if you join' : ''}` : ''}</p>
                        {optional && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex -space-x-1.5">{i.joined.map((id) => byId[id] && <Avatar key={id} m={byId[id]} size={20} ring="#fff" />)}</div>
                            <span className="text-[11.5px] text-muted">{i.joined.length} going</span>
                            <button onClick={() => join(i)} className={cx('ml-auto rounded-full px-2.5 py-1 text-[12px] font-semibold transition', imIn ? 'bg-ok-soft text-ok' : 'bg-brand-soft text-brand-dark')}>
                              {imIn ? '✓ I’m in' : 'Join'}
                            </button>
                          </div>
                        )}
                        {impact?.id === i.id && (
                          <p className={cx('anim-rise mt-1.5 text-[12px] font-semibold', impact.delta > 0 ? 'text-warn' : 'text-ok')}>Your total {signed(impact.delta)} → {inr(mine)}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        {i.locked && <Lock size={13} className="text-muted" aria-label="Locked" />}
                        <button onClick={() => setMenu(i)} aria-label={`Options for ${i.title}`} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-bg"><MoreHorizontal size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <Button variant="secondary" className="mt-4 w-full" icon={<RefreshCw size={15} />} onClick={regenerate}>Suggest new ideas around locked plans</Button>
      <p className="mt-2 px-1 text-center text-[11.5px] text-muted">Locked items stay put. Flights and the stay are part of the approved plan and can&rsquo;t be changed here.</p>

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.title ?? ''}>
        {menu && (
          <div className="grid gap-2">
            {menu.kind === 'shared' && !['i1', 'i11'].includes(menu.id) && (
              <Button variant="secondary" icon={<Users size={15} />} onClick={() => { makeOptional(menu.id); setMenu(null) }}>Make optional (only joiners pay)</Button>
            )}
            <Button variant="secondary" icon={menu.locked ? <LockOpen size={15} /> : <Lock size={15} />} onClick={() => { toggleLock(menu.id); setMenu(null); toast(menu.locked ? 'Unlocked' : 'Locked — new suggestions will plan around this') }}>
              {menu.locked ? 'Unlock' : 'Lock this in'}
            </Button>
            {['i1', 'i11'].includes(menu.id) && <p className="text-[12.5px] text-muted">Flights are part of the approved plan. To change them, propose a new version from Options.</p>}
          </div>
        )}
      </Sheet>
    </>
  )
}

function Costs() {
  const { s, current } = useStore()
  const shared = sharedLines(current, s.itinerary)
  const optional = optionalLines(s.itinerary)
  const totals = memberTotals(s.members, current, s.itinerary)
  const byId = Object.fromEntries(s.members.map((m) => [m.id, m]))
  const sharedSum = shared.reduce((a, l) => a + l.pricePP, 0)

  return (
    <>
      <SectionTitle>Shared · split equally</SectionTitle>
      <Card className="divide-y divide-line">
        {shared.map((l) => (
          <div key={l.id} className="flex justify-between px-4 py-2.5 text-[13.5px]"><span>{l.title}</span><span className="font-medium">{inr(l.pricePP)}</span></div>
        ))}
        <div className="flex justify-between px-4 py-2.5 text-[13.5px] font-semibold"><span>Per person</span><span>{inr(sharedSum)}</span></div>
      </Card>

      <SectionTitle>Optional · only joiners pay</SectionTitle>
      <Card className="divide-y divide-line">
        {optional.map((l) => (
          <div key={l.id} className="flex items-center gap-3 px-4 py-2.5 text-[13.5px]">
            <span className="flex-1">{l.title}</span>
            <div className="flex -space-x-1.5">{l.joined!.map((id) => byId[id] && <Avatar key={id} m={byId[id]} size={20} ring="#fff" />)}</div>
            <span className="w-16 text-right font-medium">{inr(l.pricePP)}</span>
          </div>
        ))}
        {optional.length === 0 && <p className="px-4 py-3 text-[13px] text-muted">No paid optional activities.</p>}
      </Card>

      <SectionTitle>Per person estimate</SectionTitle>
      <Card className="divide-y divide-line">
        {totals.map((t) => (
          <div key={t.member.id} className="flex items-center gap-3 px-4 py-2.5">
            <Avatar m={t.member} size={26} />
            <span className="flex-1 text-[13.5px] font-medium">{t.member.id === ME ? 'You' : t.member.name}</span>
            {t.optional > 0 && <Pill tone="brand">+{inr(t.optional)} optional</Pill>}
            <span className="w-[70px] text-right text-[14px] font-semibold">{inr(t.total)}</span>
          </div>
        ))}
      </Card>
      <p className="mt-2 px-1 text-[12px] text-muted">Meals and personal spends aren&rsquo;t included. Shares show what each person chose to join, never their budget.</p>
      <EstimateLabel className="mt-2" />
    </>
  )
}

export function PlanTab() {
  const { s, current } = useStore()
  const [view, setView] = useState<'itinerary' | 'costs'>('itinerary')
  const final = isFinal(s.decisions, s.members, current.version)
  return (
    <div className="pt-3">
      {s.optionsState !== 'ready' ? (
        <Card className="p-5 text-center">
          <p className="text-[15px] font-semibold">No itinerary yet</p>
          <p className="mt-1 text-[13px] text-muted">A day-by-day plan appears once there&rsquo;s a proposal to look at.</p>
        </Card>
      ) : (
        <>
          <Segmented value={view} onChange={setView} options={[{ value: 'itinerary', label: 'Day by day' }, { value: 'costs', label: 'Who pays what' }]} />
          <p className={cx('mt-2 px-1 text-[12px]', final ? 'text-ok' : 'text-muted')}>
            {final ? `Based on approved v${current.version}.` : `Draft for v${current.version} — not yet approved by everyone.`}
          </p>
          {view === 'itinerary' ? <Itinerary /> : <Costs />}
        </>
      )}
    </div>
  )
}
