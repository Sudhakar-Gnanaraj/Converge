import { useEffect, useState } from 'react'
import { Check, CircleAlert, Clock, Handshake, Lock, Sparkles } from 'lucide-react'
import { useStore } from '../../app/store'
import { ME } from '../../data/mockTrip'
import { AiTag, Avatar, Button, Card, PrivateNote, Progress, SectionTitle, Typing, cx } from '../../components/ui'
import { useGroupFit, useGroupProfiles, useMyFit } from '../../lib/selectors'
import { FIT_COPY } from '../../lib/privacy'
import { useNextAction } from './nextAction'
import { ViewAsToggle } from './TripScreen'

export const WORK_LOG = [
  'Read 6 shared profiles (no private amounts)',
  'Compared Goa and Coorg for Fri 11 – Sun 13 Dec',
  'Checked 14 stays · ruled out 9 above comfort ranges or far from beaches',
  'Checked flights and road options against "back by Sunday night"',
  'Could not verify Barapole rafting in December — left it out',
]

export function AiWorking() {
  const [n, setN] = useState(1)
  useEffect(() => {
    const t = setInterval(() => setN((x) => Math.min(x + 1, WORK_LOG.length)), 600)
    return () => clearInterval(t)
  }, [])
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <AiTag label="Group AI is preparing options" />
        <Typing />
      </div>
      <ul className="space-y-1.5">
        {WORK_LOG.slice(0, n).map((l, i) => (
          <li key={l} className="anim-rise flex items-start gap-2 text-[12.5px]">
            {i < n - 1 || n === WORK_LOG.length ? <Check size={14} className="mt-0.5 shrink-0 text-ok" /> : <span className="mt-1 h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-ai border-t-transparent" />}
            <span className={i === n - 1 ? 'text-ink' : 'text-muted'}>{l}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function OverviewTab() {
  const { s, go, navigate, current } = useStore()
  const profiles = useGroupProfiles()
  const groupFit = useGroupFit()
  const myFit = useMyFit()
  const next = useNextAction()
  const active = s.members.filter((m) => m.active)
  const done = active.filter((m) => m.setupDone)

  // Common ground computed only from group-safe profiles.
  const all = profiles.flatMap((p) => p.sharedPreferences)
  const count = (fn: (l: string) => boolean) => all.filter((p) => fn(p.label.toLowerCase())).length
  const goa = count((l) => l.includes('goa'))
  const beachStay = count((l) => l.includes('near the beach'))
  const sundayMust = all.filter((p) => p.priority === 'must-have' && p.label.toLowerCase().includes('sun night')).length
  const roadAvoid = count((l) => l.includes('road trip'))
  const v1Fit = groupFit(s.versions[0])
  const myV = myFit(current)

  return (
    <div className="pt-1">
      <ViewAsToggle />

      <Card className="mt-3 p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[14px] font-semibold">Preferences shared</p>
          <p className="text-[13px] font-semibold text-muted">{done.length} of {active.length}</p>
        </div>
        <Progress value={done.length} total={active.length} tone={done.length === active.length ? 'ok' : 'brand'} />
        <div className="mt-3 grid grid-cols-6 gap-1">
          {s.members.map((m) => (
            <div key={m.id} className={cx('flex flex-col items-center gap-1', !m.active && 'opacity-35')}>
              <div className="relative">
                <Avatar m={m} size={34} />
                <span className={cx('absolute -right-1 -bottom-1 grid h-4 w-4 place-items-center rounded-full ring-2 ring-white', m.setupDone ? 'bg-ok text-white' : 'bg-line text-muted')}>
                  {m.setupDone ? <Check size={10} strokeWidth={3} /> : <Clock size={9} />}
                </span>
              </div>
              <span className="text-[11px] text-muted">{m.id === ME ? 'You' : m.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {next.tone !== 'done' && next.to && (
        <Card className={cx('mt-3 p-4', next.tone === 'action' ? 'border-brand/40 bg-brand-soft' : '')}>
          <p className={cx('text-[14px] font-semibold', next.tone === 'action' && 'text-brand-dark')}>{next.title}</p>
          <p className="text-[12.5px] text-muted">{next.detail}</p>
          {next.tone === 'action' && <Button className="mt-3 w-full" onClick={() => navigate(next.to!)}>{next.cta}</Button>}
        </Card>
      )}

      {s.optionsState === 'generating' && <div className="mt-3"><AiWorking /></div>}

      <SectionTitle>AI summary</SectionTitle>
      <Card className="p-4">
        <AiTag />
        <p className="mt-1.5 text-[14px] leading-relaxed">
          {done.length < active.length ? `Based on ${done.length} of ${active.length} members so far. ` : ''}
          Most of the group wants a relaxed three-day break with some beach time. The main trade-off is between staying close to the beach and keeping the overall cost lower. I&rsquo;ve prepared options that keep the shared dates and vary the stay and optional activities.
        </p>
        <p className="mt-2 text-[11.5px] text-muted">Built only from what each member chose to share.</p>
      </Card>

      <SectionTitle>Common ground</SectionTitle>
      <Card className="divide-y divide-line">
        {[
          { t: 'Same dates for everyone', d: 'Fri 11 – Sun 13 Dec works for all who’ve shared' },
          sundayMust > 0 && { t: 'Back in Bengaluru by Sunday night', d: `Must-have for ${sundayMust} members, so every option respects it` },
          goa > 0 && { t: 'Goa is the front-runner', d: `${goa} of ${done.length} lean Goa; nobody has ruled out Coorg` },
          { t: 'Relaxed pace, one standout experience', d: 'No one wants a packed schedule' },
        ]
          .filter(Boolean)
          .map((x) => x as { t: string; d: string })
          .map((x) => (
            <div key={x.t} className="flex gap-3 px-4 py-3">
              <Handshake size={17} className="mt-0.5 shrink-0 text-ok" />
              <div>
                <p className="text-[14px] font-medium">{x.t}</p>
                <p className="text-[12.5px] text-muted">{x.d}</p>
              </div>
            </div>
          ))}
      </Card>

      <SectionTitle>Needs a compromise</SectionTitle>
      <Card className="divide-y divide-line">
        <div className="flex gap-3 px-4 py-3">
          <CircleAlert size={17} className="mt-0.5 shrink-0 text-warn" />
          <div>
            <p className="text-[14px] font-medium">Beach-side stay vs. lower overall cost</p>
            <p className="text-[12.5px] text-muted">{beachStay} members prefer staying near the beach. {v1Fit.tone === 'neutral' ? 'Budget fit for each option appears once everyone has shared, so no one’s signal can be singled out.' : <>The front-runner option is <b className="font-semibold text-warn">{v1Fit.label.toLowerCase()}</b>.</>}</p>
          </div>
        </div>
        <div className="flex gap-3 px-4 py-3">
          <CircleAlert size={17} className="mt-0.5 shrink-0 text-warn" />
          <div>
            <p className="text-[14px] font-medium">Activity spending</p>
            <p className="text-[12.5px] text-muted">Some members want a premium experience like scuba; others prefer free or low-cost plans. Optional activities, paid only by those who join, can cover both.</p>
          </div>
        </div>
        {roadAvoid > 0 && (
          <div className="flex gap-3 px-4 py-3">
            <CircleAlert size={17} className="mt-0.5 shrink-0 text-warn" />
            <div>
              <p className="text-[14px] font-medium">Long road trips</p>
              <p className="text-[12.5px] text-muted">Some members prefer to avoid them. This mostly affects the Coorg option.</p>
            </div>
          </div>
        )}
      </Card>

      {s.viewAs === 'me' && s.privacyDone && myV && (
        <div className="mt-3">
          <PrivateNote>
            Your AI: {current.name} (v{current.version}) is <b>{FIT_COPY[myV].toLowerCase()}</b>. The group only sees the combined signal above, never yours.
          </PrivateNote>
        </div>
      )}

      {s.viewAs === 'me' && s.privacyDone && (
        <Card className="mt-3 flex items-center justify-between p-4" onClick={() => go({ name: 'privacy' })}>
          <div>
            <p className="flex items-center gap-1.5 text-[14px] font-semibold"><Lock size={14} className="text-private" /> Your sharing settings</p>
            <p className="text-[12.5px] text-muted">Budget: {s.visibility === 'private' ? 'private' : s.visibility === 'range' ? 'range shared' : 'exact shared'} · {s.myPrefs.filter((p) => p.category !== 'budget' && s.share[p.id] !== false).length} preferences shared</p>
          </div>
          <span className="text-[13px] font-semibold text-brand-dark">Edit</span>
        </Card>
      )}

      {s.optionsState === 'ready' && (
        <Button className="mt-4 w-full" variant="secondary" icon={<Sparkles size={16} />} onClick={() => navigate({ name: 'trip', tab: 'options' })}>See 3 trip options</Button>
      )}
    </div>
  )
}
