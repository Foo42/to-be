import { last } from 'lodash'
import { DueDateSummary } from '../tree'

export type WithSummarisedDueDates = { summary: DueDateSummary }
export function dueSoonest (a: WithSummarisedDueDates, b: WithSummarisedDueDates): number {
  const aSoonest = last(a.summary.dueDates.sort()) || undefined
  const bSoonest = last(b.summary.dueDates.sort()) || undefined
  if (aSoonest === undefined) {
    if (bSoonest === undefined) {
      return 0
    }
    return 1
  }
  if (bSoonest === undefined) {
    return -1
  }

  return aSoonest.getTime() - bSoonest.getTime()
}
