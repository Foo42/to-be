import { Todo } from '../src/core/todo'
import { expect } from 'chai'
import { allContextsActive } from '../src/core/filters'

describe('filters.', () => {
  describe('allContextsActive', () => {
    it('always allows todos without any required contexts', () => {
      const todo: Todo = {
        title: 'no context required',
        id: 'something',
        complete: false,
        createdAt: new Date(),
        contexts: []
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
        contexts: ['business-hours']
      }
      const activeContexts: string[] = []
      expect(allContextsActive(todo, activeContexts)).to.eql(false)
    })
  })
})
