import { Todo, todo } from '../src/core/todo'
import { expect } from 'chai'
import { allContextsActive, noLongerThan, notBlocked } from '../src/core/filters'

const baseTodo = todo

describe('filters.', () => {
  describe('allContextsActive', () => {
    it('always allows todos without any required contexts', () => {
      const todo: Todo = baseTodo('no context required', 'something')
      const activeContexts: string[] = []
      expect(allContextsActive(todo, activeContexts)).to.eql(true)
    })

    it('always denies todos requiring an inactive context', () => {
      const todo: Todo = {
        ...baseTodo('someId', 'requires business hours'),
        contexts: ['business-hours']
      }
      const activeContexts: string[] = []
      expect(allContextsActive(todo, activeContexts)).to.eql(false)
    })
  })

  describe('noLongerThan', () => {
    it('returns true for todos without an estimate', () => {
      const todo: Todo = baseTodo('someId', 'stuff')
      expect(noLongerThan(1)(todo)).to.eql(true)
    })

    it('returns true for todos with an estimate below the available time', () => {
      const todo: Todo = {
        ...baseTodo('someId', 'stuff'),
        estimateMinutes: 1
      }
      expect(noLongerThan(2)(todo)).to.eql(true)
    })

    it('returns true for todos with an estimate equal to the available time', () => {
      const todo: Todo = {
        ...baseTodo('someId', 'stuff'),
        estimateMinutes: 2
      }
      expect(noLongerThan(2)(todo)).to.eql(true)
    })

    it('returns false for todos with an estimate greater than the available time', () => {
      const todo: Todo = {
        ...baseTodo('someId', 'stuff'),
        estimateMinutes: 3
      }
      expect(noLongerThan(2)(todo)).to.eql(false)
    })
  })

  describe('notBlocked', () => {
    const idOfCompleteTask = '1234'
    const idOfInCompleteTask = '5678'
    const isTaskComplete = (id: string) => id === idOfCompleteTask
    it('returns true for todos with no blocking tasks', () => {
      const todo = {
        ...baseTodo('1234', 'not blocked')
      }
      expect(notBlocked(isTaskComplete)(todo)).to.eql(true)
    })
    it('returns false for todos with any incomplete blocking tasks', () => {
      const todo: Todo = {
        ...baseTodo('someId', 'not blocked'),
        blockingTaskIds: [idOfCompleteTask, idOfInCompleteTask]
      }
      expect(notBlocked(isTaskComplete)(todo)).to.eql(false)
    })
    it('returns true for todos with blocking tasks which are all complete', () => {
      const todo: Todo = {
        ...baseTodo('someId', 'not blocked'),
        blockingTaskIds: [idOfCompleteTask]
      }
      expect(notBlocked(isTaskComplete)(todo)).to.eql(true)
    })

  })
})
