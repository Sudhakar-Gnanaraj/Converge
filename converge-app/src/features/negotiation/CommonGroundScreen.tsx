import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, CircleAlert, Lock, MessageSquarePlus, RefreshCw, Scale } from 'lucide-react'
import { useStore } from '../../app/store'
import { COMPROMISES, type Compromise, type CompromiseId } from '../../data/mockTrip'
import { AiTag, BottomBar, Button, Card, EstimateLabel, Header, Pill, PrivateNote, SectionTitle, Sheet, Typing, cx } from '../../components/ui'
import { useGroupFit, useMyFit } from '../../lib/selectors'
import { totalPP } from '../../lib/proposalRules'
import { FIT_COPY } from '../../lib/privacy'
import { inr, signed } from '../../lib/format'
import type { Proposal } from '../../types'

function CompromiseCard({ c, base, selected, onSelect }: { c: Compromise; base: Proposal; selected: boolean; onSelect: () => void }) {
  const { s } = useStore()
  const groupFit = useGroupFit()
  const myFit = useMyFit()
  const after: Proposal = { ...base, components: c.patch(base), mustHaveIssues: c.mustHaveIssue ? [c.mustHaveIssue] : [] }
  const delta = totalPP(after) - totalPP(base)
  const fit = groupFit(after)
  const mine = myFit(after)
  return (
    <button onClick={onSelect} aria-pressed={selected} className={cx('anim-rise block w-full rounded-2xl border-2 bg-white p-4 text-left transition', selected ? 'border-brand shadow-[0_0_0_4px_rgba(0,140,255,.12)]' : 'border-line hover:border-brand/40')}>
      <div className="flex items-start gap-3">
        <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-bold', selected ? 'bg-brand text-white' : 'bg-bg text-ink')}>{selected ? <Check size={15} strokeWidth={3} /> : c.id}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold leading-snug">{c.title}</p>
          <p className="mt-0.5 text-[12.5px] text-muted">{c.summary}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-bg px-3 py-2">
        <span className="text-[12.5px] text-muted line-through">{inr(totalPP(base))}</span>
        <ArrowRight size={13} className="text-muted" />
        <span className="text-[15px] font-bold">{inr(totalPP(after))}</span>
        <span className="text-[12px] text-muted">/person{c.priceNote ? '*' : ''}</span>
        <span className={cx('ml-auto text-[12.5px] font-semibold', delta < 0 ? 'text-ok' : 'text-warn')}>{signed(delta)}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Pill tone={fit.tone}>{fit.label}</Pill>
        {c.mustHaveIssue ? <Pill tone="bad"><CircleAlert size={11} /> Breaks a must-have</Pill> : <Pill tone="good">Must-haves kept</Pill>}
      </div>
      {c.priceNote && <p className="mt-1.5 text-[11.5px] text-muted">* {c.priceNote}</p>}
      <dl className="mt-3 grid gap-1.5 text-[12.5px]">
        <div className="flex gap-2"><dt className="w-[78px] shrink-0 font-semibold text-ok">Helps</dt><dd>{c.benefits}</dd></div>
        <div className="flex gap-2"><dt className="w-[78px] shrink-0 font-semibold text-warn">Gives up</dt><dd>{c.givesUp}</dd></div>
        <div className="flex gap-2"><dt className="w-[78px] shrink-0 font-semibold text-muted">Itinerary</dt><dd>{c.itineraryEffect}</dd></div>
      </dl>
      {c.mustHaveIssue && <p className="mt-2 rounded-lg bg-bad-soft px-2.5 py-2 text-[12px] text-bad">{c.mustHaveIssue}</p>}
      {s.viewAs === 'me' && mine && <div className="mt-3"><PrivateNote>Your AI: {FIT_COPY[mine].toLowerCase()}.</PrivateNote></div>}
    </button>
  )
}

export function CommonGroundScreen() {
  const { back, current, applyCompromise, openTab, toast } = useStore()
  const groupFit = useGroupFit()
  const [phase, setPhase] = useState<'thinking' | 'ready'>('thinking')
  const [shown, setShown] = useState<CompromiseId[]>(['A', 'B', 'C'])
  const [selected, setSelected] = useState<CompromiseId | null>(null)
  const [more, setMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setPhase('ready'), 1400)
    return () => clearTimeout(t)
  }, [])

  // Compromises are always computed against the version currently in decision.
  const base = current
  const baseFit = groupFit(base)
  const applicable = useMemo(() => COMPROMISES.filter((c) => JSON.stringify(c.patch(base)) !== JSON.stringify(base.components)), [base])
  const list = applicable.filter((c) => shown.includes(c.id))
  const sel = COMPROMISES.find((c) => c.id === selected)

  const another = () => {
    setLoadingMore(true)
    setTimeout(() => {
      const nextC = applicable.find((c) => !shown.includes(c.id))
      if (nextC) setShown((x) => [...x, nextC.id])
      setLoadingMore(false)
      setTimeout(() => nextC && document.getElementById(`cmp-${nextC.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    }, 1100)
  }

  const propose = () => {
    if (!selected) return
    const { version } = applyCompromise(selected)
    toast(`v${version} sent to the group. Earlier approvals were reset.`)
    openTab('approval')
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <Header title="Find common ground" subtitle={`${base.name} · v${base.version}`} onBack={back} />
      <div className="flex-1 px-4 pb-6">
        <SectionTitle>The disagreement</SectionTitle>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-warn" />
            <p className="text-[15px] font-semibold">Beach-side resort vs. lower overall cost</p>
          </div>
          <p className="mt-2 text-[13.5px] leading-relaxed">
            v{base.version} is <b className={cx(baseFit.tone === 'bad' ? 'text-bad' : 'text-warn')}>{baseFit.label.toLowerCase()}</b>. Several members prefer staying near the beach, but <b>nobody marked it a must-have</b>, so it can be traded. The stay is the biggest cost after flights.
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted"><Lock size={12} /> Based on compatibility signals only. No one&rsquo;s budget is visible here.</p>
        </Card>

        <SectionTitle>Kept fixed in every compromise</SectionTitle>
        <Card className="space-y-1.5 p-4 text-[13px]">
          {['Fri 11 – Sun 13 Dec, same for everyone', 'Back in Bengaluru by Sunday night (must-have)', 'Each member’s private maximum (checked by their own AI)'].map((x) => (
            <p key={x} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-ok" /> {x}</p>
          ))}
          <p className="pt-1 text-[12px] text-muted">If an idea would break one of these, I&rsquo;ll flag it and ask. I won&rsquo;t relax it on my own.</p>
        </Card>

        <SectionTitle>Possible compromises</SectionTitle>
        {phase === 'thinking' ? (
          <Card className="flex items-center gap-3 p-4">
            <Typing />
            <p className="text-[13px] text-muted">Looking for ways that cost less without dropping anyone&rsquo;s must-haves…</p>
          </Card>
        ) : list.length === 0 ? (
          <Card className="p-4 text-[13px]">
            <AiTag />
            <p className="mt-1">I don&rsquo;t have another compromise for v{base.version} that keeps every must-have. You can swap a single part of the plan instead, or ask the group which constraint they&rsquo;d revisit.</p>
          </Card>
        ) : (
          <>
            <Card className="mb-3 p-3.5">
              <AiTag />
              <p className="mt-1 text-[13px]">Here are {list.length} ways to close the gap. None of them is the &ldquo;right&rdquo; answer. Each one helps different people. Pick one to propose, or ask for another.</p>
            </Card>
            <div className="space-y-3">
              {list.map((c) => (
                <div key={c.id} id={`cmp-${c.id}`}>
                  <CompromiseCard c={c} base={base} selected={selected === c.id} onSelect={() => setSelected(c.id)} />
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" size="sm" disabled={!applicable.some((c) => !shown.includes(c.id)) || loadingMore} icon={<RefreshCw size={14} className={loadingMore ? 'animate-spin' : ''} />} onClick={another}>
                {loadingMore ? 'Thinking…' : !applicable.some((c) => !shown.includes(c.id)) ? 'No more for now' : 'Show another'}
              </Button>
              <Button variant="secondary" size="sm" icon={<MessageSquarePlus size={14} />} onClick={() => setMore(true)}>None of these</Button>
            </div>
            <EstimateLabel className="mt-3 justify-center" />
          </>
        )}
      </div>

      <BottomBar>
        {sel?.mustHaveIssue && <p className="mb-2 text-[12px] text-bad">This breaks a must-have. Members who hold it will have to agree explicitly.</p>}
        <Button className="w-full" disabled={!selected} onClick={propose}>
          {selected ? `Propose ${selected} as v${base.version + 1} to the group` : 'Select a compromise to propose'}
        </Button>
        <p className="mt-1.5 text-center text-[11px] text-muted">A new version resets everyone&rsquo;s approval. Nothing is decided until all approve.</p>
      </BottomBar>

      <Sheet open={more} onClose={() => setMore(false)} title="What would work better?">
        <p className="mb-2 text-[12.5px] text-muted">Tell your AI in your own words. It shares only what&rsquo;s needed with the group AI.</p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {['Keep the beach, cut flights', 'Cheaper stay is fine', 'Make more things optional'].map((q) => (
            <button key={q} onClick={() => setNote(q)} className="rounded-full border border-brand/40 bg-brand-soft px-3 py-1 text-[12.5px] text-brand-dark">{q}</button>
          ))}
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded-xl border border-line p-3 text-[14px] outline-none focus:border-brand" placeholder="e.g. I'd rather skip the cruise than move away from the beach" />
        <Button className="mt-3 w-full" disabled={!note.trim()} onClick={() => {
          setMore(false)
          const pick: CompromiseId = /beach|flight/i.test(note) ? 'B' : /optional|skip/i.test(note) ? 'B' : 'A'
          setSelected(pick)
          toast(`Closest match is ${pick}. Selected it for you to review.`)
          setNote('')
        }}>Ask the AI</Button>
      </Sheet>
    </div>
  )
}
