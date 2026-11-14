// Simulates the OTHER members' personal AIs, which in a real product run in each
// member's own private context. Their thresholds never leave this module: the only
// export is a compatibility signal (fits / stretches / above), never a number.
import type { BudgetFit, PrivateBudget } from '../types'

const privateThresholds: Record<string, { ideal: number; maximum: number }> = {
  alex: { ideal: 15000, maximum: 20000 },
  sam: { ideal: 11000, maximum: 15000 },
  karan: { ideal: 18000, maximum: 30000 },
  maya: { ideal: 11500, maximum: 16000 },
  priya: { ideal: 13000, maximum: 17000 },
}

export function fitFromBudget(total: number, b: { ideal: number | null; maximum: number | null }): BudgetFit {
  if (b.maximum != null && total > b.maximum) return 'above'
  if (b.ideal != null && total > b.ideal) return 'stretches'
  return 'fits'
}

/** Signal reported by a simulated member's personal AI. */
export function agentSignal(memberId: string, total: number): BudgetFit {
  const t = privateThresholds[memberId]
  if (!t) return 'fits'
  return fitFromBudget(total, t)
}

/** Signal from the current user's own personal AI (computed on-device, in their private context). */
export function mySignal(total: number, mine: PrivateBudget): BudgetFit {
  return fitFromBudget(total, mine)
}
