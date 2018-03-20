import { Todo } from '../src/core/todo'
import { expect } from 'chai'
import { allContextsActive, noLongerThan } from '../src/core/filters'

describe('filters.', () => {
  describe('allContextsActive', () => {
    it('always allows todos without any required contexts', () => {
      const todo: Todo = {
        title: 'no context required',
        id: 'something',
        complete: false,
        createdAt: new Date(),
        contexts: [],
        tags: []
      }
      const activeContexts: string[] = []
      expect(allContextsActive(todo, activeContexts)).to.eql(true)
    })

    it('always denies todos requiring an inactive context', () => {
      const todo: Todo = {
        title: 'no context required',
        id: 'something',
        complete: false,
        createdAt: new Date(),
        contexts: ['business-hours'],
        tags: []
      }
      const activeContexts: string[] = []
      expect(allContextsActive(todo, activeContexts)).to.eql(false)
    })
  })

  describe('noLongerThan', () => {
    it('returns true for todos without an estimate', () => {
      const todo: Todo = {
        title: 'stuff',
        id: 'something',
        complete: false,
        createdAt: new Date(),
        contexts: [],
        tags: []
      }
      expect(noLongerThan(1)(todo)).to.eql(true)
    })

    it('returns true for todos with an estimate below the available time', () => {
      const todo: Todo = {
        title: 'stuff',
        id: 'something',
        complete: false,
        createdAt: new Date(),
        contexts: [],
        tags: [],
        estimateMinutes: 1
      }
      expect(noLongerThan(2)(todo)).to.eql(true)
    })

    it('returns true for todos with an estimate equal to the available time', () => {
      const todo: Todo = {
        title: 'stuff',
        id: 'something',
        complete: false,
        createdAt: new Date(),
        contexts: [],
        tags: [],
        estimateMinutes: 2
      }
      expect(noLongerThan(2)(todo)).to.eql(true)
    })

    it('returns false for todos with an estimate greater than the available time', () => {
      const todo: Todo = {
        title: 'stuff',
        id: 'something',
        complete: false,
        createdAt: new Date(),
        contexts: [],
        tags: [],
        estimateMinutes: 3
      }
      expect(noLongerThan(2)(todo)).to.eql(false)
    })
  })
})
