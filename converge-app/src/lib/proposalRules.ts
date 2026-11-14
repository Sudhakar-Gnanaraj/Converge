import type { DecisionStatus, Member, MemberDecision, Proposal } from '../types'
import { inr } from './format'

export const totalPP = (p: Proposal) => p.components.filter((c) => !c.optional).reduce((s, c) => s + c.pricePP, 0)

export const APPROVED: DecisionStatus[] = ['approved', 'approved-via-limits']

/** Material = destination, dates, transport, stay, or price moves ≥ ₹500 or ≥ 5% per person. */
export function isMaterialChange(prev: Proposal, next: Proposal): boolean {
  if (prev.destination !== next.destination || prev.dates !== next.dates) return true
  const key = (p: Proposal, k: string) => p.components.filter((c) => c.kind === k).map((c) => c.id + c.pricePP).join('|')
  if (key(prev, 'transport') !== key(next, 'transport') || key(prev, 'stay') !== key(next, 'stay')) return true
  const a = totalPP(prev)
  const b = totalPP(next)
  return Math.abs(b - a) >= 500 || Math.abs(b - a) / a >= 0.05
}

/** A new material version invalidates every previous response. Nobody stays approved by default. */
export function resetDecisions(prev: Record<string, MemberDecision>, version: number): Record<string, MemberDecision> {
  const out: Record<string, MemberDecision> = {}
  for (const [id, d] of Object.entries(prev)) {
    out[id] = { memberId: id, proposalVersion: version, status: d.status === 'pending' ? 'pending' : 'review-needed' }
  }
  return out
}

/** Final only when every ACTIVE member has explicitly approved THIS version. Silence is never consent. */
export function isFinal(decisions: Record<string, MemberDecision>, members: Member[], version: number): boolean {
  const active = members.filter((m) => m.active)
  return active.length > 0 && active.every((m) => {
    const d = decisions[m.id]
    return d && d.proposalVersion === version && APPROVED.includes(d.status)
  })
}

export function approvalCount(decisions: Record<string, MemberDecision>, members: Member[], version: number) {
  const active = members.filter((m) => m.active)
  const approved = active.filter((m) => decisions[m.id]?.proposalVersion === version && APPROVED.includes(decisions[m.id].status))
  return { approved: approved.length, total: active.length }
}

export function diffProposals(prev: Proposal, next: Proposal): string[] {
  if (prev.baseId !== next.baseId) {
    // A different trip altogether: summarise instead of listing every swapped part.
    const pick = (p: Proposal, k: string) => p.components.find((c) => c.kind === k && !c.optional)?.title
    const out = [`Trip: ${prev.name} → ${next.name}`]
    for (const [k, label] of [['transport', 'Travel'], ['stay', 'Stay']] as const) {
      const a = pick(prev, k), b = pick(next, k)
      if (a && b && a !== b) out.push(`${label}: ${a} → ${b}`)
    }
    const acts = next.components.filter((c) => c.kind === 'activity' && !c.optional).map((c) => c.title)
    if (acts.length) out.push(`Together: ${acts.join(', ')}`)
    return out
  }
  const out: string[] = []
  for (const n of next.components) {
    const o = prev.components.find((c) => c.kind === n.kind && (c.id === n.id || c.title === n.title))
    if (!o) {
      const replaced = prev.components.find((c) => c.kind === n.kind && !next.components.some((x) => x.id === c.id))
      out.push(replaced ? `${replaced.title} → ${n.title}` : `Added ${n.title}`)
    } else if (o.optional !== n.optional) {
      out.push(`${n.title} → ${n.optional ? 'optional' : 'shared'}`)
    } else if (o.pricePP !== n.pricePP) {
      out.push(`${n.title}: ${inr(o.pricePP)} → ${inr(n.pricePP)} per person`)
    } else if (o.detail !== n.detail) {
      out.push(`${n.title}: updated`)
    }
  }
  return out
}
