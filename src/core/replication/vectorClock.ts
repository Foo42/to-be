import { uniq, last } from 'lodash'
import { Dict } from '../../util/deserialising'
import { ClockedLog } from './clockedLog'

export interface Clock extends Dict<number> {
}

const getTotalKeys = (left: Clock, right: Clock) => uniq(Object.keys(left).concat(Object.keys(right)))

export interface ClockComparisonResult {
  verdict: 'concurrent' | 'leftEarliest' | 'rightEarliest'
  earliest?: Clock
}

export function compareClocks (left: Clock, right: Clock): ClockComparisonResult {
  const totalKeys = getTotalKeys(left,right)
  let someOfLeftLower = false
  let someOfRightLower = false
  for (const key of totalKeys) {
    const leftValue = left[key] || 0
    const rightValue = right[key] || 0
    if (leftValue < rightValue) {
      someOfLeftLower = true
    } else if (rightValue < leftValue) {
      someOfRightLower = true
    }
  }
  if (someOfLeftLower && !someOfRightLower) {
    return { verdict: 'leftEarliest', earliest: left }
  }
  if (someOfRightLower && !someOfLeftLower) {
    return { verdict: 'rightEarliest', earliest: right }
  }
  return { verdict: 'concurrent' }
}

export function mergeClocks (left: Clock, right: Clock): Clock {
  return getTotalKeys(left,right).reduce((merged, key) => {
    const leftValue = left[key] || 0
    const rightValue = right[key] || 0
    const maxValue = Math.max(leftValue, rightValue)
    return { ...merged, [key]: maxValue }
  }, {} as Clock)
}

export function incrementKey (key: string, clock: Clock): Clock {
  const originalValue = clock[key] || 0
  return { ...clock, [key]: originalValue + 1 }
}
export function currentTime<T> (localId: string, logs: ClockedLog<T>[]): Clock {
  const merged = logs
    .filter(log => log.length > 0)
    .map(log => last(log)!)
    .reduce((acc, { clock }) => mergeClocks(acc, clock), {} as Clock)
  return incrementKey(localId, merged)
}
