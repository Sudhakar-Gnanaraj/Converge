import { useEffect, useState } from 'react'
import { Check, Clock, CreditCard, Loader2, TriangleAlert } from 'lucide-react'
import { useStore } from '../../app/store'
import { ME, STAY_PRICE_RISE } from '../../data/mockTrip'
import { Avatar, BottomBar, Button, Card, Header, KIND_ICON, Pill, SectionTitle, Sheet, StatusBadge, cx } from '../../components/ui'
import { isFinal, APPROVED } from '../../lib/proposalRules'
import { memberTotal, optionalLines } from '../../lib/costCalculations'
import { inr } from '../../lib/format'

function useCountdown(endsAt: number) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const left = Math.max(0, endsAt - now)
  return `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}`
}

export function BookingScreen() {
  const { s, current, back, startBooking, respondToPriceChange, decide, pay, openTab } = useStore()
  const [paySheet, setPaySheet] = useState(false)
  const timer = useCountdown(s.holdEndsAt)
  const final = isFinal(s.decisions, s.members, current.version)
  const stage = s.booking
  const mine = memberTotal(ME, current, s.itinerary)
  const myOptional = optionalLines(s.itinerary).filter((l) => l.joined?.includes(ME))

  if (stage === 'idle' && !final)
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <Header title="Book your trip" onBack={back} />
        <div className="p-4">
          <Card className="p-5 text-center">
            <Clock className="mx-auto text-warn" size={22} />
            <p className="mt-2 text-[15px] font-semibold">Booking opens once everyone approves</p>
            <p className="mt-1 text-[13px] text-muted">The organiser can&rsquo;t book on the group&rsquo;s behalf before that.</p>
            <Button className="mt-4 w-full" onClick={() => openTab('approval')}>See approvals</Button>
          </Card>
        </div>
      </div>
    )

  const lineStatus = (kind: string) => {
    if (stage === 'idle') return <Pill>Ready to hold</Pill>
    if (stage === 'checking') return <Loader2 size={15} className="animate-spin text-muted" />
    if (kind === 'stay' && stage === 'holding') return <span className="flex items-center gap-1 text-[11.5px] text-muted"><Loader2 size={13} className="animate-spin" /> Confirming rate</span>
    if (kind === 'stay' && (stage === 'price-changed' || stage === 'reapproval')) return <Pill tone="warn">Rate changed</Pill>
    return <Pill tone="good"><Check size={11} strokeWidth={3} /> Held</Pill>
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <Header title="Book your trip" subtitle={`${current.name} · v${current.version}`} onBack={back} />
      <div className="flex-1 px-4 pb-6">
        {(stage === 'holding' || stage === 'price-changed' || stage === 'reapproval' || stage === 'ready') && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-navy px-3 py-2.5 text-[13px] text-white">
            <Clock size={15} /> Fares held · <b>{timer}</b> left <span className="ml-auto text-[11px] text-white/60">simulated</span>
          </div>
        )}

        {stage === 'price-changed' && (
          <Card className="anim-rise mt-3 border-warn/40 p-4">
            <p className="flex items-center gap-1.5 text-[14px] font-semibold text-warn"><TriangleAlert size={16} /> The stay&rsquo;s rate went up while holding</p>
            <p className="mt-1 text-[13px]">+{inr(STAY_PRICE_RISE)} per person (sample). That&rsquo;s a material change (₹500 or more), so <b>the group has to approve it before anyone pays</b>. Nothing has been charged.</p>
            <div className="mt-3 grid gap-2">
              <Button size="sm" onClick={() => respondToPriceChange('accept')}>Ask the group to approve the new rate</Button>
              <Button size="sm" variant="secondary" onClick={() => respondToPriceChange('swap')}>Propose a similar villa nearby (+₹200)</Button>
              <Button size="sm" variant="ghost" onClick={back}>Pause booking</Button>
            </div>
          </Card>
        )}

        {stage === 'reapproval' && (
          <Card className="anim-rise mt-3 p-4">
            <p className="text-[14px] font-semibold">Quick re-approval · v{current.version}</p>
            <p className="text-[12.5px] text-muted">Only the stay changed: {current.changeSummary?.join(', ')}. Everyone confirms just this.</p>
            <div className="mt-3 space-y-2">
              {s.members.filter((m) => m.active).map((m) => {
                const d = s.decisions[m.id]
                return (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <Avatar m={m} size={26} />
                    <span className="flex-1 text-[13px]">{m.id === ME ? 'You' : m.name}</span>
                    <StatusBadge status={d?.proposalVersion === current.version ? d.status : 'pending'} />
                  </div>
                )
              })}
            </div>
            {!APPROVED.includes(s.decisions[ME]?.status) && (
              <Button variant="ok" size="sm" className="mt-3 w-full" icon={<Check size={15} />} onClick={() => decide('approved')}>Approve the change</Button>
            )}
          </Card>
        )}

        {stage === 'ready' && (
          <Card className="anim-rise mt-3 border-ok/40 bg-ok-soft p-3.5">
            <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ok"><Check size={16} /> Everyone approved v{current.version}. Hold extended.</p>
          </Card>
        )}

        <SectionTitle>Shared bookings</SectionTitle>
        <Card className="divide-y divide-line">
          {current.components.filter((c) => !c.optional).map((c) => (
            <div key={c.id} className={cx('flex items-center gap-3 px-4 py-3', stage === 'checking' && 'opacity-70')}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-dark">{KIND_ICON[c.kind]({ size: 15 })}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">{c.title}</p>
                <p className="text-[12px] text-muted">{inr(c.pricePP)} × {s.members.filter((m) => m.active).length} people</p>
              </div>
              {lineStatus(c.kind)}
            </div>
          ))}
        </Card>

        <SectionTitle>Your extras</SectionTitle>
        <Card className="divide-y divide-line">
          {myOptional.length ? myOptional.map((l) => (
            <div key={l.id} className="flex justify-between px-4 py-2.5 text-[13.5px]"><span>{l.title}</span><span>{inr(l.pricePP)} · pay at venue</span></div>
          )) : <p className="px-4 py-3 text-[13px] text-muted">You haven&rsquo;t joined any paid optional activity.</p>}
        </Card>

        <Card className="mt-4 p-4">
          <div className="flex justify-between text-[13.5px]"><span className="text-muted">Your share of shared bookings</span><span>{inr(mine.shared)}</span></div>
          <div className="mt-1 flex justify-between text-[13.5px]"><span className="text-muted">Your optional extras (pay later)</span><span>{inr(mine.optional)}</span></div>
          <div className="mt-2 flex justify-between border-t border-line pt-2 text-[16px] font-bold"><span>Pay now</span><span>{inr(mine.shared)}</span></div>
          <p className="mt-2 text-[12px] text-muted">Each member pays their own share. Bookings confirm once every share is in. Prices are sample data.</p>
        </Card>
      </div>

      <BottomBar>
        {stage === 'idle' && <Button className="w-full" onClick={startBooking}>Hold fares & continue</Button>}
        {stage === 'checking' && <Button className="w-full" disabled icon={<Loader2 size={16} className="animate-spin" />}>Checking availability…</Button>}
        {(stage === 'holding' || stage === 'price-changed' || stage === 'reapproval') && <Button className="w-full" disabled>{stage === 'holding' ? 'Confirming the stay rate…' : 'Waiting for the group to approve'}</Button>}
        {stage === 'ready' && <Button className="w-full" icon={<CreditCard size={16} />} onClick={() => setPaySheet(true)}>Pay my share · {inr(mine.shared)}</Button>}
        {stage === 'paying' && <Button className="w-full" disabled icon={<Loader2 size={16} className="animate-spin" />}>Processing…</Button>}
      </BottomBar>

      <Sheet open={paySheet} onClose={() => setPaySheet(false)} title="Pay your share">
        <p className="text-[13.5px]">Payment screens are outside this prototype&rsquo;s scope. In the product, you&rsquo;d pay through the app&rsquo;s normal checkout, and only for your own share.</p>
        <Button className="mt-4 w-full" onClick={() => { setPaySheet(false); pay() }}>Simulate payment of {inr(mine.shared)}</Button>
      </Sheet>
    </div>
  )
}
