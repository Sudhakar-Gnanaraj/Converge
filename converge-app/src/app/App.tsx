import { useState } from 'react'
import { Check, FlaskConical, RotateCcw } from 'lucide-react'
import { StoreProvider, useStore } from './store'
import { Sheet, cx } from '../components/ui'
import { HomeScreen } from '../features/home/HomeScreen'
import { TripScreen } from '../features/trip/TripScreen'
import { DiscoveryScreen } from '../features/discovery/DiscoveryScreen'
import { PrivacyScreen } from '../features/privacy/PrivacyScreen'
import { ProposalDetail } from '../features/proposals/ProposalDetail'
import { CommonGroundScreen } from '../features/negotiation/CommonGroundScreen'
import { BookingScreen } from '../features/booking/BookingScreen'
import { ConfirmedScreen } from '../features/booking/ConfirmedScreen'
import { isFinal } from '../lib/proposalRules'

function Router() {
  const { s } = useStore()
  const top = s.stack[s.stack.length - 1]
  switch (top.name) {
    case 'home': return <HomeScreen />
    case 'trip': return <TripScreen tab={top.tab} />
    case 'discovery': return <DiscoveryScreen />
    case 'privacy': return <PrivacyScreen />
    case 'proposal': return <ProposalDetail id={top.id} />
    case 'common-ground': return <CommonGroundScreen />
    case 'booking': return <BookingScreen />
    case 'confirmed': return <ConfirmedScreen />
  }
}

function Toast() {
  const { s } = useStore()
  if (!s.toast) return null
  return (
    <div key={s.toast.id} className="anim-rise pointer-events-none absolute inset-x-4 bottom-24 z-[60] rounded-xl bg-navy px-4 py-3 text-[13px] font-medium text-white shadow-lg">
      {s.toast.text}
    </div>
  )
}

function useJourney() {
  const { s, current } = useStore()
  const final = isFinal(s.decisions, s.members, current.version)
  return [
    { label: 'Private chat with your AI', done: s.discoveryDone },
    { label: 'Choose what the group sees', done: s.privacyDone },
    { label: 'Group common ground', done: s.optionsState === 'ready' },
    { label: 'Compare options & find a compromise', done: s.versions.length > 1 },
    { label: 'Everyone approves', done: final || s.booking !== 'idle' },
    { label: 'Book · handle a mid-booking change', done: s.booking === 'paid' },
  ]
}

function DemoControls({ onDone }: { onDone?: () => void }) {
  const { reset, jump, memberLeaves, memberRejects, triggerNoViable, s } = useStore()
  const act = (fn: () => void) => () => { fn(); onDone?.() }
  const btn = 'w-full rounded-lg border border-line bg-white px-3 py-2 text-left text-[13px] font-medium hover:border-brand/50 disabled:opacity-40'
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Jump to</p>
        <div className="grid gap-1.5">
          <button className={btn} onClick={act(() => jump('start'))}>1 · Start (MMT home)</button>
          <button className={btn} onClick={act(() => jump('group'))}>3 · Group overview (Riya set up)</button>
          <button className={btn} onClick={act(() => jump('approval'))}>5 · Approval of v1</button>
        </div>
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Edge cases</p>
        <div className="grid gap-1.5">
          <button className={btn} disabled={s.optionsState !== 'ready'} onClick={act(() => memberRejects('karan'))}>Karan rejects the current version</button>
          <button className={btn} disabled={!s.members.find((m) => m.id === 'priya')?.active} onClick={act(() => memberLeaves('priya'))}>Priya steps out of the trip</button>
          <button className={btn} onClick={act(triggerNoViable)}>Peak prices: no option meets every must-have</button>
        </div>
      </div>
      <button className="flex items-center gap-1.5 text-[13px] font-semibold text-bad" onClick={act(reset)}>
        <RotateCcw size={14} /> Reset demo
      </button>
    </div>
  )
}

function SidePanel() {
  const steps = useJourney()
  return (
    <aside className="hscroll hidden max-h-full w-[340px] shrink-0 flex-col gap-6 overflow-y-auto py-2 pr-2 lg:flex">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-brand-dark">Concept prototype</p>
        <h1 className="mt-1 text-[34px] font-extrabold leading-none tracking-tight text-navy">Converge</h1>
        <p className="mt-2 text-[15px] text-ink">Different preferences. One shared journey.</p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          A group-trip feature for a MakeMyTrip-style app. You play <b className="text-ink">Riya</b>, one of six friends from Bengaluru planning a December long weekend. Riya's budget stays private; the group decides together, not the AI or the organiser.
        </p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Demo journey</p>
        <ol className="space-y-2.5">
          {steps.map((st, i) => (
            <li key={st.label} className="flex items-center gap-2.5 text-[13px]">
              <span className={cx('grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold', st.done ? 'bg-ok text-white' : 'bg-bg text-muted')}>
                {st.done ? <Check size={12} strokeWidth={3} /> : i + 1}
              </span>
              <span className={st.done ? 'text-muted line-through decoration-muted/40' : 'text-ink'}>{st.label}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <DemoControls />
      </div>
      <p className="text-[11.5px] leading-relaxed text-muted">
        Design exercise for Razorpay Design × NID. Not affiliated with MakeMyTrip. All people, prices and availability are fictional sample data; AI responses are scripted.
      </p>
    </aside>
  )
}

function Shell() {
  const [demoOpen, setDemoOpen] = useState(false)
  return (
    <div className="flex min-h-full items-center justify-center gap-12 lg:h-[100dvh] lg:overflow-hidden lg:p-6">
      <SidePanel />
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-bg sm:h-[844px] sm:max-h-[calc(100dvh-32px)] lg:max-h-full sm:w-[390px] sm:rounded-[44px] sm:border-[10px] sm:border-[#0d1117] sm:shadow-2xl">
        <div id="scroller" className="relative flex flex-1 flex-col overflow-y-auto">
          <Router />
        </div>
        <div id="phone-overlay" className="pointer-events-none absolute inset-0 z-50" />
        <Toast />
        <button onClick={() => setDemoOpen(true)} className="absolute top-1/2 right-0 z-30 grid h-10 w-7 place-items-center rounded-l-xl bg-white/95 text-ai shadow-md ring-1 ring-line lg:hidden" aria-label="Demo controls">
          <FlaskConical size={15} />
        </button>
        <Sheet open={demoOpen} onClose={() => setDemoOpen(false)} title="Demo controls">
          <DemoControls onDone={() => setDemoOpen(false)} />
        </Sheet>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
