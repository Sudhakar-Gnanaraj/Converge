import type { BudgetFit, BudgetVisibility, GroupProfile, Preference, PrivateBudget } from '../types'
import { inr } from './format'

/**
 * Turns the current member's private context into what the group AI may see.
 * Exact amounts are only included when the member explicitly chose to share them.
 */
export function myGroupProfile(
  memberId: string,
  name: string,
  prefs: Preference[],
  share: Record<string, boolean>,
  budget: PrivateBudget,
  visibility: BudgetVisibility,
): GroupProfile {
  const shareable = prefs.filter((p) => p.category !== 'budget')
  const shared = shareable.filter((p) => share[p.id] !== false)
  return {
    memberId,
    name,
    budgetLabel: budgetLabel(visibility, budget),
    sharedPreferences: shared,
    hiddenCount: shareable.length - shared.length,
  }
}

export function budgetLabel(visibility: BudgetVisibility, b: PrivateBudget): string {
  if (visibility === 'exact' && b.maximum) return `Shared exact · ${inr(b.maximum)}`
  if (visibility === 'range' && b.maximum) return `Shared a range · ${rangeFor(b)}`
  return 'Private · compatibility only'
}

export function rangeFor(b: PrivateBudget): string {
  const lo = Math.floor(((b.ideal ?? b.maximum ?? 0) - 2000) / 1000)
  const hi = Math.ceil((b.maximum ?? 0) / 1000)
  return `₹${Math.max(lo, 1)}–${hi}K`
}

/**
 * Group-facing summary of many members' signals. Deliberately does not count or
 * name members, so a hidden constraint can't be traced back to a person.
 */
export function aggregateFit(signals: BudgetFit[]): { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' } {
  if (signals.includes('above')) return { label: 'Above some members\u2019 comfort range', tone: 'bad' }
  if (signals.includes('stretches')) return { label: 'Stretches some budgets', tone: 'warn' }
  return { label: 'Within everyone\u2019s comfort range', tone: 'good' }
}

export const FIT_COPY: Record<BudgetFit, string> = {
  fits: 'Within your comfort range',
  stretches: 'Above your ideal, under your maximum',
  above: 'Above your maximum',
}
