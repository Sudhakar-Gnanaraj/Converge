import type { ItineraryDay, Member, Proposal } from '../types'

export interface CostLine { id: string; title: string; pricePP: number; joined?: string[] }

/** Shared = every non-optional plan component, split equally among active members. */
export function sharedLines(p: Proposal, itinerary: ItineraryDay[]): CostLine[] {
  const madeOptional = new Set(itinerary.flatMap((d) => d.items).filter((i) => i.kind === 'optional' && i.componentId).map((i) => i.componentId!))
  return p.components.filter((c) => !c.optional && !madeOptional.has(c.id)).map((c) => ({ id: c.id, title: c.title, pricePP: c.pricePP }))
}

/** Optional = paid only by the people who join. */
export function optionalLines(itinerary: ItineraryDay[]): CostLine[] {
  return itinerary.flatMap((d) => d.items).filter((i) => i.kind === 'optional' && i.pricePP > 0).map((i) => ({ id: i.id, title: i.title, pricePP: i.pricePP, joined: i.joined }))
}

export function memberTotal(memberId: string, p: Proposal, itinerary: ItineraryDay[]) {
  const shared = sharedLines(p, itinerary).reduce((s, l) => s + l.pricePP, 0)
  const optional = optionalLines(itinerary).filter((l) => l.joined?.includes(memberId)).reduce((s, l) => s + l.pricePP, 0)
  return { shared, optional, total: shared + optional }
}

export function memberTotals(members: Member[], p: Proposal, itinerary: ItineraryDay[]) {
  return members.filter((m) => m.active).map((m) => ({ member: m, ...memberTotal(m.id, p, itinerary) }))
}
