import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Bus, Car, Check, Clock, Info, Lock, Plane, Sparkles, Ticket, BedDouble, X } from 'lucide-react'
import type { ComponentKind, DecisionStatus, Member, PreferencePriority } from '../types'

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

// ── layout ──────────────────────────────────────────────────
export function Header({ title, subtitle, onBack, right, tone = 'dark', sticky = true }: { title: string; subtitle?: string; onBack?: () => void; right?: ReactNode; tone?: 'dark' | 'light'; sticky?: boolean }) {
  return (
    <header className={cx(sticky && 'sticky top-0 z-20', 'flex items-center gap-2 px-3 pt-3 pb-3', tone === 'dark' ? 'bg-navy text-white' : 'bg-white text-ink border-b border-line')}>
      {onBack && (
        <button onClick={onBack} aria-label="Back" className={cx('grid h-9 w-9 place-items-center rounded-full', tone === 'dark' ? 'hover:bg-white/10' : 'hover:bg-bg')}>
          <ArrowLeft size={20} />
        </button>
      )}
      <div className={cx('min-w-0 flex-1', !onBack && 'pl-1')}>
        <h1 className="truncate text-[17px] font-semibold leading-tight">{title}</h1>
        {subtitle && <p className={cx('truncate text-xs', tone === 'dark' ? 'text-white/65' : 'text-muted')}>{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={cx('block w-full rounded-2xl border border-line bg-white text-left shadow-[0_1px_2px_rgba(16,24,40,.04)]', onClick && 'transition hover:border-brand/40 active:scale-[.995]', className)}>
      {children}
    </Tag>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-5 flex items-center justify-between px-1">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">{children}</h2>
      {action}
    </div>
  )
}

export function Button({ children, onClick, variant = 'primary', className, disabled, size = 'md', icon }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'ok'; className?: string; disabled?: boolean; size?: 'sm' | 'md'; icon?: ReactNode }) {
  const styles = {
    primary: 'btn-primary text-white shadow-sm',
    secondary: 'bg-white text-brand-dark border border-brand/40',
    ghost: 'text-brand-dark hover:bg-brand-soft',
    danger: 'bg-white text-bad border border-bad/40',
    ok: 'bg-ok text-white',
  }[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cx('inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45', size === 'sm' ? 'h-9 px-3 text-[13px]' : 'h-12 px-4 text-[15px]', styles, className)}
    >
      {icon}
      {children}
    </button>
  )
}

export function BottomBar({ children }: { children: ReactNode }) {
  return <div className="sticky bottom-0 z-20 border-t border-line bg-white/95 px-4 pt-3 pb-4 backdrop-blur">{children}</div>
}

// ── people ──────────────────────────────────────────────────
export function Avatar({ m, size = 32, ring }: { m: Pick<Member, 'initials' | 'color' | 'name'>; size?: number; ring?: string }) {
  return (
    <span title={m.name} className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white" style={{ width: size, height: size, background: m.color, fontSize: size * 0.36, boxShadow: ring ? `0 0 0 2px ${ring}` : undefined }}>
      {m.initials}
    </span>
  )
}

export function AvatarStack({ members, size = 28 }: { members: Member[]; size?: number }) {
  return (
    <div className="flex -space-x-1.5">
      {members.map((m) => (
        <span key={m.id} className={cx(!m.active && 'opacity-35')}>
          <Avatar m={m} size={size} ring="#fff" />
        </span>
      ))}
    </div>
  )
}

// ── status ──────────────────────────────────────────────────
const STATUS: Record<DecisionStatus, { label: string; cls: string }> = {
  approved: { label: 'Approved', cls: 'bg-ok-soft text-ok' },
  'approved-via-limits': { label: 'Approved via limits', cls: 'bg-ok-soft text-ok ring-1 ring-inset ring-ok/30' },
  pending: { label: 'Pending', cls: 'bg-bg text-muted' },
  'review-needed': { label: 'Review needed', cls: 'bg-warn-soft text-warn' },
  'changes-requested': { label: 'Changes requested', cls: 'bg-warn-soft text-warn' },
  rejected: { label: 'Rejected', cls: 'bg-bad-soft text-bad' },
}

export function StatusBadge({ status }: { status: DecisionStatus }) {
  const s = STATUS[status]
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-semibold', s.cls)}>
      {(status === 'approved' || status === 'approved-via-limits') && <Check size={12} strokeWidth={3} />}
      {status === 'pending' && <Clock size={11} />}
      {s.label}
    </span>
  )
}

export function Pill({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'ai' | 'brand' | 'private'; className?: string }) {
  const cls = {
    neutral: 'bg-bg text-muted',
    good: 'bg-ok-soft text-ok',
    warn: 'bg-warn-soft text-warn',
    bad: 'bg-bad-soft text-bad',
    ai: 'bg-ai-soft text-ai',
    brand: 'bg-brand-soft text-brand-dark',
    private: 'bg-private-soft text-private',
  }[tone]
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold', cls, className)}>{children}</span>
}

export const AiTag = ({ label = 'Converge AI' }: { label?: string }) => (
  <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-ai">
    <Sparkles size={13} /> {label}
  </span>
)

export const EstimateLabel = ({ className }: { className?: string }) => (
  <p className={cx('flex items-center gap-1 text-[11px] text-muted', className)}>
    <Info size={12} /> Planning estimate · Sample data · Not a live quote
  </p>
)

/** Content only the current member can see. Rendered only in "My view" — never sent to group components. */
export function PrivateNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-private/20 bg-private-soft px-3 py-2 text-[12.5px] text-private">
      <Lock size={13} className="mt-0.5 shrink-0" />
      <div>
        <span className="font-semibold">Only you see this · </span>
        {children}
      </div>
    </div>
  )
}

export const PRIORITY_STYLE: Record<PreferencePriority, string> = {
  'must-have': 'bg-navy text-white',
  prefer: 'bg-brand-soft text-brand-dark',
  flexible: 'bg-bg text-muted',
  'not-sure': 'bg-warn-soft text-warn',
}

export const KIND_ICON: Record<ComponentKind, (p: { size?: number }) => ReactNode> = {
  transport: ({ size = 16 }) => <Plane size={size} />,
  stay: ({ size = 16 }) => <BedDouble size={size} />,
  local: ({ size = 16 }) => <Car size={size} />,
  activity: ({ size = 16 }) => <Ticket size={size} />,
}
export const BusIcon = Bus

// ── overlays ────────────────────────────────────────────────
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  const host = document.getElementById('phone-overlay')
  const node = (
    <div className="pointer-events-auto absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Close" className="anim-fade absolute inset-0 bg-navy/45" onClick={onClose} />
      <div role="dialog" aria-label={title} className="anim-sheet relative max-h-[86%] overflow-y-auto rounded-t-3xl bg-white px-4 pt-2 pb-5">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line" />
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[17px] font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full hover:bg-bg">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
  return host ? createPortal(node, host) : node
}

export function Segmented<T extends string>({ value, options, onChange, size = 'md' }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; size?: 'sm' | 'md' }) {
  return (
    <div className="flex rounded-xl bg-bg p-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx('flex-1 rounded-lg font-semibold transition', size === 'sm' ? 'py-1.5 text-[12px]' : 'py-2 text-[13px]', value === o.value ? 'bg-white text-ink shadow-sm' : 'text-muted')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cx('relative h-6 w-10 shrink-0 rounded-full transition', on ? 'bg-brand' : 'bg-line')}>
      <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[18px]' : 'left-0.5')} />
    </button>
  )
}

export function Typing() {
  return (
    <span className="typing inline-flex gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-ai" />
      <span className="h-1.5 w-1.5 rounded-full bg-ai" />
      <span className="h-1.5 w-1.5 rounded-full bg-ai" />
    </span>
  )
}

export function Progress({ value, total, tone = 'brand' }: { value: number; total: number; tone?: 'brand' | 'ok' }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg">
      <div className={cx('h-full rounded-full transition-all duration-500', tone === 'ok' ? 'bg-ok' : 'bg-brand')} style={{ width: `${(value / Math.max(total, 1)) * 100}%` }} />
    </div>
  )
}
