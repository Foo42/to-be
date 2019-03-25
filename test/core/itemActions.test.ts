import { changeTitle, markCompleted, TodoUpdate, addContexts, setEstimate, setParentTask, addTags, setDueDate, addNote, addBlockingTask, markDeleted, setBlockedUntil, clearBlockedUntil, addWaitingOn, removeWaitingOn } from '../../src/core/actions'
import { assert, expect } from 'chai'
import { applyListAction } from '../../src/core/evolveList'
import { todo, Note } from '../../src/core/todo'
import { applyUpdate } from '../../src/core/evolveItem'
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

  describe('addNote', () => {
    it('should add a note', () => {
      const original = todo('123', 'do stuff')
      const note: Note = { textMarkdown: 'hello' }
      const updated = applyUpdate(original, addNote(note))
      assert.deepEqual(updated.notes, [note])
      assert.deepEqual(original.notes, [])
    })
  })

  describe('addBlockingTask', () => {
    it('should add a blocking task to the list', () => {
      const original = todo('123', 'do stuff')
      const other = todo('456', 'do this stuff first!')
      const updated = applyUpdate(original, addBlockingTask(other.id))
      assert.deepEqual(updated.blockingTaskIds, [other.id])
      assert.deepEqual(original.blockingTaskIds, [])
    })
  })

  describe('markDeleted', () => {
    it('should set "deleted" to truthy value', () => {
      const original = todo('123', 'do stuff')
      const updated = applyUpdate(original, markDeleted())
      expect(updated.deleted).to.deep.equal({})
    })

    it('should set deleted.reason if provided', () => {
      const deleteReason = 'some reason'
      const original = todo('123', 'do stuff')
      const updated = applyUpdate(original, markDeleted(deleteReason))
      expect(updated.deleted).to.deep.equal({ reason: deleteReason })
    })
  })

  describe('setBlockedUntil', () => {
    it('should set blockedUntil to provided date', () => {
      const original = todo('123', 'so stuff')
      const targetDate = new Date('2025-01-13')
      const updated = applyUpdate(original, setBlockedUntil(targetDate))
      expect(updated.blockedUntil).to.deep.equal(targetDate)
    })
  })

  describe('clearBlockedUntil', () => {
    it('should clear blockedUntil', () => {
      const original = { ...todo('123', 'so stuff'), blockedUntil: new Date() }
      const updated = applyUpdate(original, clearBlockedUntil())
      expect(updated.blockedUntil).to.deep.equal(undefined)
    })
  })

  describe('addWaitingOn', () => {
    it('should evolve item to append given people', () => {
      const original = todo('123', 'do stuff')
      original.waitingOn = [{ name: 'Bob' }, { name: 'Mary' }]

      const updated = applyUpdate(original, addWaitingOn([{ name: 'Sue' }, { name: 'Keith' }]))
      assert.deepEqual(updated.waitingOn, [{ name: 'Bob' }, { name: 'Mary' }, { name: 'Sue' }, { name: 'Keith' }])
    })
  })

  describe('removeWaitingOn', () => {
    it('should evolve item to remove given people', () => {
      const original = todo('123', 'do stuff')
      original.waitingOn = [{ name: 'Bob' }, { name: 'Mary' }]

      const updated = applyUpdate(original, removeWaitingOn([{ name: 'Mary' }, { name: 'Keith' }]))
      assert.deepEqual(updated.waitingOn, [{ name: 'Bob' }])
    })
  })
})
