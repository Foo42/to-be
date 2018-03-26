import { dueSoonest } from '../src/core/sorters'
import { expect } from 'chai'

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
})
