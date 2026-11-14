import { Check, CircleDashed, Info } from 'lucide-react'
import { useStore } from '../../app/store'
import { ME, TRIP } from '../../data/mockTrip'
import { Avatar, Button, Card, Header, KIND_ICON, Pill, SectionTitle } from '../../components/ui'
import { memberTotal } from '../../lib/costCalculations'
import { inr } from '../../lib/format'

export function ConfirmedScreen() {
  const { s, current, resetTo } = useStore()
  const mine = memberTotal(ME, current, s.itinerary)
  const active = s.members.filter((m) => m.active)
  // Simulated: Alex and Karan paid quickly too.
  const paid = new Set([ME, 'alex', 'karan'])

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header title="Trip summary" subtitle={`${current.name} · v${current.version}`} onBack={() => resetTo([{ name: 'home' }, { name: 'trip', tab: 'overview' }])} />
      <div className="flex-1 px-4 pb-8">
        <div className="mt-3 rounded-2xl p-5 text-white" style={{ background: current.image }}>
          <span className="anim-pop grid h-11 w-11 place-items-center rounded-full bg-white text-ok"><Check size={24} strokeWidth={3} /></span>
          <p className="mt-3 text-[20px] font-bold">Your share is paid</p>
          <p className="text-[13px] text-white/90">{current.destination} · {TRIP.dates}</p>
        </div>

        <Card className="mt-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold">Booking status</p>
            <Pill tone="warn">Not booked yet</Pill>
          </div>
          <p className="mt-1 text-[12.5px] text-muted">Bookings confirm once every share is paid. Fares stay held until 6 PM today (simulated).</p>
          <div className="mt-3 grid grid-cols-6 gap-1">
            {active.map((m) => (
              <div key={m.id} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <Avatar m={m} size={32} />
                  <span className={`absolute -right-1 -bottom-1 grid h-4 w-4 place-items-center rounded-full ring-2 ring-white ${paid.has(m.id) ? 'bg-ok text-white' : 'bg-line text-muted'}`}>
                    {paid.has(m.id) ? <Check size={10} strokeWidth={3} /> : <CircleDashed size={10} />}
                  </span>
                </div>
                <span className="text-[10.5px] text-muted">{paid.has(m.id) ? 'Paid' : 'Pending'}</span>
              </div>
            ))}
          </div>
        </Card>

        <SectionTitle>Approved plan</SectionTitle>
        <Card className="divide-y divide-line">
          <div className="flex items-center justify-between px-4 py-3 text-[13px]">
            <span className="text-muted">Approval</span>
            <span className="flex items-center gap-1 font-semibold text-ok"><Check size={14} /> All {active.length} members · v{current.version}</span>
          </div>
          {current.components.filter((c) => !c.optional).map((c) => (
            <div key={c.id} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 text-brand-dark">{KIND_ICON[c.kind]({ size: 15 })}</span>
              <div className="flex-1">
                <p className="text-[13.5px] font-medium">{c.title}</p>
                <p className="text-[12px] text-muted">{c.detail}</p>
              </div>
              <Pill tone={c.kind === 'activity' ? 'neutral' : 'brand'}>{c.kind === 'activity' ? 'Estimate' : 'Held · simulated'}</Pill>
            </div>
          ))}
        </Card>

        <SectionTitle>Itinerary at a glance</SectionTitle>
        <Card className="divide-y divide-line">
          {s.itinerary.map((d) => (
            <div key={d.id} className="px-4 py-3">
              <p className="text-[12px] font-semibold text-muted">{d.label} · {d.date}</p>
              <p className="mt-0.5 text-[13px]">{d.items.filter((i) => i.kind === 'shared' || i.joined.includes(ME)).map((i) => i.title).join(' · ')}</p>
            </div>
          ))}
        </Card>

        <SectionTitle>Your cost</SectionTitle>
        <Card className="p-4 text-[13.5px]">
          <div className="flex justify-between"><span className="text-muted">Paid (shared bookings)</span><span className="font-semibold">{inr(mine.shared)}</span></div>
          <div className="mt-1 flex justify-between"><span className="text-muted">Optional, pay at venue</span><span>{inr(mine.optional)}</span></div>
          <div className="mt-2 flex justify-between border-t border-line pt-2 font-bold"><span>Estimated trip total</span><span>{inr(mine.total)}</span></div>
        </Card>

        <p className="mt-3 flex items-start gap-1.5 px-1 text-[11.5px] text-muted">
          <Info size={13} className="mt-0.5 shrink-0" /> “Held · simulated” means the prototype pretends a fare is held. Nothing here is a live price, a real booking or a real payment.
        </p>
        <Button variant="secondary" className="mt-4 w-full" onClick={() => resetTo([{ name: 'home' }])}>Back to home</Button>
      </div>
    </div>
  )
}
