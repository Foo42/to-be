import { Todo, todo, Tag } from '../../src/core/todo'
import { expect } from 'chai'
import { allContextsActive, noLongerThan, notBlocked, isLeaf, isNotDeleted, FilterFunc } from '../../src/core/filters'
import { buildTodoTree, TodoTree } from '../../src/core/tree'
import { markDeleted, addTags } from '../../src/core/actions'
import { applyUpdate } from '../../src/core/library'
import { hasTag } from '../../src/core/filters/hasTag'
import { times } from 'lodash'
import { intersectionOf } from '../../src/core/filters/intersection'

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

    it('returns false for todos with "blockedUntil" set to a future date', () => {
      const futureDate = new Date(Date.now() + 100000)
      const todo: Todo = {
        ...baseTodo('someId', 'I am blocked for now'),
        blockedUntil: futureDate
      }
      expect(notBlocked(() => true)(todo)).to.equal(false)
    })
    it('returns true for todos with "blockedUntil" set to a date in the past', () => {
      const futureDate = new Date(Date.now() - 1)
      const todo: Todo = {
        ...baseTodo('someId', 'I am no longer blocked'),
        blockedUntil: futureDate
      }
      expect(notBlocked(() => true)(todo)).to.equal(true)
    })

    it('returns false for todos with people in the waitingOn list', () => {
      const todo: Todo = { ...baseTodo('some id', 'I am waiting on people'), waitingOn: [{ name: 'Mr Slow' }] }
      expect(notBlocked(() => true)(todo)).to.equal(false)
    })
  })

  describe('isLeaf', () => {
    it('returns true for a todo without children', () => {
      const todo = baseTodo('123', 'I have no children')
      expect(isLeaf(todo)).to.eql(true)
    })
    it('returns true for a todo tree without children', () => {
      const todo = baseTodo('123', 'I have no children')
      const tree: TodoTree = buildTodoTree([todo])[0]
      expect(isLeaf(tree)).to.eql(true)
    })
    it('returns false for a todo tree with children', () => {
      const parent = baseTodo('parent', 'I have children')
      const child = { ...baseTodo('child', 'I am a child'), parentTaskId: parent.id }
      const tree: TodoTree = buildTodoTree([parent, child])[0]
      expect(isLeaf(tree)).to.eql(false)
    })
  })

  describe('isNotDeleted', () => {
    it('returns true for todos without "deleted" set', () => {
      const todo = baseTodo('123', 'do stuff')
      expect(isNotDeleted(todo)).to.equal(true)
    })

    it('returns false after a todo is deleted', () => {
      const todo = baseTodo('123', 'do stuff')
      const deleted = applyUpdate(todo, markDeleted())
      expect(isNotDeleted(deleted)).to.equal(false)
    })
  })

  describe('hasTag', () => {
    it('returns false for todos without required tag', () => {
      const todo = baseTodo('123', 'without tag')
      const tag: Tag = { name: 'some tag' }
      expect(hasTag(tag)(todo)).to.equal(false)
    })

    it('returns true for todos with required tag', () => {
      const withTag = applyUpdate(baseTodo('123', 'with tag'), addTags([{ name: 'some tag' }]))
      const tag: Tag = { name: 'some tag' }
      expect(hasTag(tag)(withTag)).to.equal(true)
    })
  })

  describe('intersectionOf', () => {
    it('returns true if all sub-filers return true', () => {
      const subFilters: FilterFunc[] = times(5, () => () => true)
      const someTodo = baseTodo('123', 'whatever')
      expect(intersectionOf(...subFilters)(someTodo)).to.equal(true)
    })

    it('returns false if any of the sub-filers return false', () => {
      const subFilters: FilterFunc[] = [...times(4, () => () => true), () => false]
      const someTodo = baseTodo('123', 'whatever')
      expect(intersectionOf(...subFilters)(someTodo)).to.equal(false)
    })
  })
})
