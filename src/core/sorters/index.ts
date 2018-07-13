import { last, max } from 'lodash'
import { DueDateSummary } from '../tree/summarisers/dueDates'
import { TagsWithinSummary } from '../tree/summarisers/tagsWithin'
import { Dict } from '../dict'

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

export type WithSummarisedTagsWithin = {summary: TagsWithinSummary}
export function sortByHighestWeightTagWithin (tagWeghts: Dict<number>) {
  return function sorter (a: WithSummarisedTagsWithin, b: WithSummarisedTagsWithin): number {
    const highestA = findHighestTagWeight(a, tagWeghts)
    const highestB = findHighestTagWeight(b, tagWeghts)
    return highestB - highestA
  }
}

function findHighestTagWeight (item: WithSummarisedTagsWithin, tagWeghts: Dict<number>) {
  return max(Object.keys(item.summary.tagsWithin).map(tagName => tagWeghts[tagName] || 1)) || 1
}
