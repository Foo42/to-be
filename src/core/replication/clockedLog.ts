import { Clock, compareClocks } from './vectorClock'

export interface ClockedValue<T> {
  clock: Clock
  value: T
}

export type ClockedLog<T> = ClockedValue<T>[]

export type ConflictResolutionFunc<T> = (conflicting: ClockedValue<T>[]) => ClockedValue<T>[]

export function dropConflicts<T> (conflicting: ClockedValue<T>[]): ClockedValue<T>[] {
  return []
}

export function mergeLogs<T> (left: ClockedLog<T>, right: ClockedLog<T>, resolveConflict: ConflictResolutionFunc<T> = dropConflicts): ClockedLog<T> {
  const l = [...left]
  const r = [...right]
  const merged: ClockedLog<T> = []
  while (l.length || r.length) {
    if (!l.length) {
      return merged.concat(r)
    }
    if (!r.length) {
      return merged.concat(l)
    }
    const { verdict } = compareClocks(l[0].clock, r[0].clock)
    if (verdict === 'leftEarliest') {
      merged.push(l.shift()!)
    } else if (verdict === 'rightEarliest') {
      merged.push(r.shift()!)
    } else {
      merged.push(...resolveConflict([l.shift()!, r.shift()!]))
    }
  }
  return merged
}
