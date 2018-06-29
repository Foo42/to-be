import { compareClocks, Clock, mergeClocks, incrementKey, currentTime } from '../../../src/core/replication/vectorClock'
import { expect } from 'chai'
import { ClockedLog } from '../../../src/core/replication/clockedLog'

describe('vector clocks', () => {
  describe('comparison', () => {
    it('should find 2 empty clocks "concurrent"', () => {
      const { verdict } = compareClocks({}, {})
      expect(verdict).to.equal('concurrent')
    })

    it('clocks with elements at t0 should be treated equal to those without those keys', () => {
      const { verdict } = compareClocks({ a: 0 }, {})
      expect(verdict).to.equal('concurrent')
    })

    it('clock with a single non-zero element is later than an empty clock', () => {
      const shouldBeEarliest = {}
      const shouldBeLatest = { a: 1 }
      const { verdict, earliest } = compareClocks(shouldBeEarliest, shouldBeLatest)
      expect(verdict).to.equal('leftEarliest')
      expect(earliest).to.equal(shouldBeEarliest)
    })

    it('clock with all elements greater than another should be treated as earlier than the other', () => {
      const shouldBeEarliest = { a: 1,b: 1 }
      const shouldBeLatest = { a: 2, b: 2 }
      const { verdict, earliest } = compareClocks(shouldBeEarliest, shouldBeLatest)
      expect(verdict).to.equal('leftEarliest')
      expect(earliest).to.equal(shouldBeEarliest)
    })

    it('clock with all elements equal or greater than another should be treated as earlier than the other', () => {
      const shouldBeEarliest = { a: 1,b: 1, c: 5 }
      const shouldBeLatest = { a: 2, b: 2, c: 5 }
      const { verdict, earliest } = compareClocks(shouldBeEarliest, shouldBeLatest)
      expect(verdict).to.equal('leftEarliest')
      expect(earliest).to.equal(shouldBeEarliest)
    })

    it('two clocks which each have some elements greater than the other should be treated as concurrent', () => {
      const higherA = { a: 2,b: 1, c: 5 }
      const higherB = { a: 1, b: 2, c: 5 }
      const { verdict, earliest } = compareClocks(higherA, higherB)
      expect(verdict).to.equal('concurrent')
      expect(earliest).to.equal(undefined)
    })
  })

  describe('merging', () => {
    it('merged clock should contain all the keys of the input clocks', () => {
      const left: Clock = { a: 1,b: 2 }
      const right: Clock = { b: 2, c: 3 }
      const merged: Clock = mergeClocks(left, right)
      expect(Object.keys(merged).sort()).to.deep.equal(['a','b','c'])
    })

    it('merged clock should use pairwise maximum for each value', () => {
      const left: Clock = { a: 1,b: 6 }
      const right: Clock = { b: 2, c: 3 }
      const merged: Clock = mergeClocks(left, right)
      expect(merged).to.deep.equal({ a: 1, b: 6, c: 3 })
    })
  })

  describe('incrementKey', () => {
    it('should return a new clock with the requested key to 1 if it did not previously exist', () => {
      const before: Clock = { a: 42 }
      const after = incrementKey('b', before)
      expect(after).to.deep.equal({ a: 42, b: 1 })
      expect(before).to.deep.equal({ a: 42 }, 'original should not be mutated')
    })

    it('should return a new clock with the requested key incremented by 1 if it previously existed', () => {
      const before: Clock = { a: 42, b: 100 }
      const after = incrementKey('b', before)
      expect(after).to.deep.equal({ a: 42, b: 101 })
      expect(before).to.deep.equal({ a: 42, b: 100 }, 'original should not be mutated')
    })
  })

  describe('currentTime', () => {
    it('should return merged time from latest of each log, incremented by one in own element', () => {
      const logA: ClockedLog<string> = [
        { value: '', clock: { a: 3, b: 2 } },
        { value: '', clock: { a: 4, b: 2 } }
      ]

      const logB: ClockedLog<string> = [
        { value: '', clock: { a: 3, b: 2 } },
        { value: '', clock: { a: 4, b: 2 } },
        { value: '', clock: { a: 4, b: 3 } }
      ]

      const logC: ClockedLog<string> = [
        { value: '', clock: { c: 1 } }
      ]

      const now = currentTime('b', [logA, logB, logC])
      expect(now).to.deep.equal({ a: 4,b: 4,c: 1 })
    })
  })
})
