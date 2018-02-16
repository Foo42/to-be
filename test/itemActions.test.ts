import { changeTitle, markCompleted, TodoUpdate, addContexts } from '../src/core/actions'
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
})
