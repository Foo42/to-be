import { dueSoonest } from '../../src/core/sorters'
import { expect } from 'chai'
import { Sorter } from '../../src/core/tree'
import { multiLevelSorter } from '../../src/core/sorters/multiLevel'

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

  describe('multi-level sorter', () => {
    it('should produce a sorter which sorts according to the first sorter', () => {
      const sortBasedOnArrayValueAtPositionAscending = (position: number) => (left: number[], right: number[]): number => {
        return left[position] - right[position]
      }
      const sorter = multiLevelSorter([sortBasedOnArrayValueAtPositionAscending(0)])
      expect(sorter([1], [1])).to.equal(0)
      expect(sorter([1], [2])).to.be.lessThan(0)
      expect(sorter([2], [1])).to.be.greaterThan(0)
      expect([[2],[1]].sort(sorter)).to.deep.eq([[1],[2]])
    })

    it('should produce a sorter which sorts according to the second sorter when the first is a draw', () => {
      const sortBasedOnArrayValueAtPositionAscending = (position: number) => (left: number[], right: number[]): number => {
        return left[position] - right[position]
      }
      const sorter = multiLevelSorter([
        sortBasedOnArrayValueAtPositionAscending(0),
        sortBasedOnArrayValueAtPositionAscending(1)])

      expect(sorter([1, 10], [1, 10])).to.equal(0)
      expect(sorter([1, 10], [1, 20])).to.be.lessThan(0)
      expect(sorter([1, 20], [1, 10])).to.be.greaterThan(0)
      expect([[1,20], [2, 9] ,[1, 10]].sort(sorter)).to.deep.eq([[1, 10],[1, 20], [2, 9]])
    })
  })
})
