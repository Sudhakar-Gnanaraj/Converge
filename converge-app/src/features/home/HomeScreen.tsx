import { useState } from 'react'
import { BedDouble, Bus, Car, ChevronRight, Home, Plane, Search, TrainFront, TreePalm, UserPlus, Users } from 'lucide-react'
import { useStore } from '../../app/store'
import { TRIP } from '../../data/mockTrip'
import { AvatarStack, Button, Card, Pill, Sheet, cx } from '../../components/ui'
import { useNextAction } from '../trip/nextAction'

const SERVICES = [
  { label: 'Flights', icon: Plane },
  { label: 'Hotels', icon: BedDouble },
  { label: 'Homestays', icon: Home },
  { label: 'Holidays', icon: TreePalm },
  { label: 'Trains', icon: TrainFront },
  { label: 'Buses', icon: Bus },
  { label: 'Cabs', icon: Car },
  { label: 'Group trip', icon: Users, highlight: true },
]

export function HomeScreen() {
  const { s, navigate, openTab, toast } = useStore()
  const next = useNextAction()
  const [create, setCreate] = useState(false)
  const [join, setJoin] = useState(false)

  return (
    <div className="flex-1">
      <div className="bg-gradient-to-b from-navy to-navy-2 px-4 pt-5 pb-14 text-white">
        <p className="text-[13px] text-white/70">Good evening,</p>
        <p className="text-[22px] font-bold">Riya</p>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-[14px] text-muted">
          <Search size={17} /> Where to next?
        </div>
      </div>

      <div className="-mt-9 px-4">
        <Card className="grid grid-cols-4 gap-y-3 p-3">
          {SERVICES.map(({ label, icon: Icon, highlight }) => (
            <button key={label} onClick={() => (highlight ? openTab('overview') : toast(`${label} is outside this prototype`))} className="flex flex-col items-center gap-1.5">
              <span className={cx('grid h-11 w-11 place-items-center rounded-xl', highlight ? 'bg-brand text-white' : 'bg-brand-soft text-brand-dark')}>
                <Icon size={20} />
              </span>
              <span className={cx('text-[11.5px]', highlight ? 'font-semibold text-brand-dark' : 'text-ink')}>{label}</span>
            </button>
          ))}
        </Card>
      </div>

      <div className="px-4 pt-6 pb-8">
        <div className="mb-1 flex items-center gap-2 px-1">
          <h2 className="text-[16px] font-bold">Plan with friends</h2>
          <Pill tone="brand">New</Pill>
        </div>
        <p className="mb-3 px-1 text-[13px] text-muted">Your budget stays private. The group decides together.</p>

        <Card className="overflow-hidden" onClick={() => openTab('overview')}>
          <div className="h-20 bg-[linear-gradient(120deg,#0E7FB8,#44B8D6_55%,#2F5D3A)] px-4 py-3 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">Your active trip</p>
            <p className="text-[18px] font-bold">{TRIP.name}</p>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[13px] font-medium">Goa or Coorg · {TRIP.dates}</p>
                <p className="text-[12px] text-muted">From {TRIP.from} · organised by Alex</p>
              </div>
              <AvatarStack members={s.members} size={24} />
            </div>
            <div className={cx('flex items-center justify-between rounded-xl px-3 py-2.5', next.tone === 'action' ? 'bg-brand-soft' : next.tone === 'done' ? 'bg-ok-soft' : 'bg-bg')}>
              <div className="min-w-0">
                <p className={cx('text-[13px] font-semibold', next.tone === 'action' ? 'text-brand-dark' : next.tone === 'done' ? 'text-ok' : 'text-ink')}>{next.title}</p>
                <p className="truncate text-[12px] text-muted">{next.detail}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-muted" />
            </div>
          </div>
        </Card>
        {next.to && next.tone === 'action' && (
          <Button className="mt-3 w-full" onClick={() => navigate(next.to!)}>{next.cta}</Button>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="secondary" size="sm" icon={<Users size={15} />} onClick={() => setCreate(true)}>Start a group trip</Button>
          <Button variant="secondary" size="sm" icon={<UserPlus size={15} />} onClick={() => setJoin(true)}>Join with code</Button>
        </div>
      </div>

      <Sheet open={create} onClose={() => setCreate(false)} title="Start a group trip">
        <div className="space-y-3 text-[14px]">
          {[
            ['Trip name', 'Long weekend with the gang'],
            ['Leaving from', 'Bengaluru'],
            ['Destination', 'Open — let the group decide'],
            ['Dates', 'Flexible · a long weekend in Dec'],
            ['Group size', '6 people'],
          ].map(([k, v]) => (
            <label key={k} className="block">
              <span className="text-[12px] font-medium text-muted">{k}</span>
              <input defaultValue={v} className="mt-1 h-11 w-full rounded-xl border border-line px-3 outline-none focus:border-brand" />
            </label>
          ))}
          <label className="block">
            <span className="text-[12px] font-medium text-muted">Describe the trip (optional)</span>
            <textarea defaultValue={TRIP.prompt} rows={2} className="mt-1 w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-brand" />
          </label>
          <Button className="w-full" onClick={() => { setCreate(false); toast('This demo continues with Alex’s trip') }}>Create & invite</Button>
        </div>
      </Sheet>
      <Sheet open={join} onClose={() => setJoin(false)} title="Join with an invite code">
        <input placeholder="e.g. GOA-DEC-6F" className="h-11 w-full rounded-xl border border-line px-3 outline-none focus:border-brand" />
        <Button className="mt-3 w-full" onClick={() => { setJoin(false); openTab('overview') }}>Join</Button>
      </Sheet>
    </div>
  )
}
