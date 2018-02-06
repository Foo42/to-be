import { changeTitle } from "../src/core/actions";
import { assert } from "chai";
import { applyListAction } from "../src/core/evolveList";
import { todo } from "../src/core/todo";
import { applyUpdate } from "../src/core/evolveItem";

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
})