import { changeTitle, markCompleted, TodoUpdate, addContexts, setEstimate, setParentTask, addTags, setDueDate } from '../src/core/actions'
import { assert } from 'chai'
import { applyListAction } from '../src/core/evolveList'
import { todo } from '../src/core/todo'
import { applyUpdate } from '../src/core/evolveItem'
import { toASCII } from 'punycode'

describe('item actions.', () => {
  describe('changeTitle', () => {
    it('should change the title of given todo without affecting the original', () => {
      const originalTitle = 'some todo'
      const original = todo('123', originalTitle)
      const newTitle = 'new title'
      const updated = applyUpdate(original, changeTitle(newTitle))

      assert.deepEqual(updated.title, newTitle)
      assert.deepEqual(original.title, originalTitle)
    })
  })

  describe('markComplete', () => {
    it('should mark the todo as complete without affecting the original', () => {
      const original = todo('123', 'do stuff')
      const updated = applyUpdate(original, markCompleted())

      assert.deepEqual(updated.complete, true)
      assert.deepEqual(original.complete, false)
    })
  })

  describe('addContexts', () => {
    it('should evolve item to append given contexts', () => {
      const original = todo('123', 'do stuff')
      original.contexts = ['originalContext', 'anotherOriginal']

      const updated = applyUpdate(original, addContexts(['a new context', 'another new']))
      assert.deepEqual(updated.contexts, ['originalContext', 'anotherOriginal', 'a new context', 'another new'])
    })
  })

  describe('setEstimate', () => {
    it('should set a time estimate', () => {
      const original = todo('123', 'do stuff')
      const updated = applyUpdate(original, setEstimate(5))

      assert.deepEqual(updated.estimateMinutes, 5)
      assert.deepEqual(original.estimateMinutes, undefined)
    })
  })

  describe('setParentTask', () => {
    it('should set a the parentTaskId', () => {
      const parent = todo('123', 'do big stuff')
      const original = todo('567', 'do little stuff')
      const updated = applyUpdate(original, setParentTask(parent.id))

      assert.deepEqual(updated.parentTaskId, parent.id)
      assert.deepEqual(original.parentTaskId, undefined)
    })
  })

  describe('addTags', () => {
    it('should evolve item to append given tags', () => {
      const original = todo('123', 'do stuff')
      original.tags = [{ name: 'stuff' }, { name: 'things' }]

      const updated = applyUpdate(original, addTags([{ name: 'foo' }, { name: 'bar' }]))
      assert.deepEqual(updated.tags, [{ name: 'stuff' }, { name: 'things' }, { name: 'foo' }, { name: 'bar' }])
    })
  })

  describe('setDueDate', () => {
    it('should evolve item to set the dueDate field', () => {
      const original = todo('123', 'do stuff')
      const dueDate = new Date()
      const updated = applyUpdate(original, setDueDate(dueDate))
      assert.deepEqual(updated.dueDate, dueDate)
      assert.deepEqual(original.dueDate, undefined)
    })
  })
})
