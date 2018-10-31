import { dueSoonest, sortByHighestWeightTagWithin } from '../../src/core/sorters'
import { expect } from 'chai'
import { Sorter } from '../../src/core/tree'
import { sortBy } from '../../src/core/sorters/multiLevel'
import { scoredSorterDesc } from '../../src/core/sorters/scored'

describe('sorters', () => {
  describe('dueSoonest', () => {
    it('should sort dueDates before no dates', () => {
      const withDue = { summary: { dueDates: [new Date()] } }
      const withoutDue = { summary: { dueDates: [] } }
      const sorted = [withoutDue, withDue].sort(dueSoonest)
      expect(sorted).to.deep.eq([withDue, withoutDue])
    })

    it('should sort earlier dates first', () => {
      const early = { summary: { dueDates: [new Date('2010-01-01')] } }
      const late = { summary: { dueDates: [new Date('2050-01-01')] } }
      const sorted = [late, early].sort(dueSoonest)
      expect(sorted).to.deep.eq([early, late])
    })
  })

  describe('fluent multi-level sorter', () => {
    type WithFoo = {foo: number}
    type WithBar = {bar: number}
    const sortByFoo = (left: WithFoo, right: WithFoo) => left.foo - right.foo
    const sortByBar = (left: WithBar, right: WithBar) => left.bar - right.bar

    it('should sort according to given sorter when only one given', () => {
      const input = [{ foo: 2 }, { foo: 1 }, { foo: 3 }]
      const sorter = sortBy(sortByFoo).sort
      expect(input.sort(sorter)).to.deep.equal([{ foo: 1 }, { foo: 2 }, { foo: 3 }])
    })

    it('should produce a sorter which sorts according to the second sorter when the first is a draw', () => {
      const input = [{ foo: 2, bar: 2 }, { foo: 2, bar: 1 }, { foo: 3, bar: 42 }]
      const sorter = sortBy(sortByFoo).thenBy(sortByBar).sort
      expect(input.sort(sorter)).to.deep.equal([{ foo: 2, bar: 1 }, { foo: 2, bar: 2 }, { foo: 3, bar: 42 }])
    })
  })

  describe('weightedTagSorter', () => {
    it('should sort todos with highest single value tag above those with lower', () => {
      const tagWeights = { high: 3, medium: 2, alsoMedium: 2, low: 1 }
      const withHigh = { summary: { tagsWithin: { 'high': { name: 'high' } } } }
      const withMedium = { summary: { tagsWithin: { 'medium': { name: 'medium' } } } }
      const sorted = [withMedium, withHigh].sort(sortByHighestWeightTagWithin(tagWeights))
      expect(sorted).to.deep.eq([withHigh, withMedium])
    })
  })

  describe('scoreSorter', () => {
    it('should sort (Descending) accoring to score function', () => {
      const input = [{ score: 2 }, { score: 0 },{ score: 4.3 }, { score: 1 }]
      const scoreFunction = (input: {score: number}) => input.score
      const sorted = input.sort(scoredSorterDesc(scoreFunction))
      expect(sorted).to.deep.equal([{ score: 4.3 }, { score: 2 },{ score: 1 }, { score: 0 }])
    })
  })
})
