import { assert } from "chai";
import { applyListAction } from "../src/core/evolveList";
import { Todo, todo } from "../src/core/todo";
import { addToList, updateItemInList } from "../src/core/listActions";
import { changeTitle } from "../src/core/actions";

describe('list actions.', () => {
  describe('add to list', () => {
    it('should add an item to list', () => {
      const original: Todo[] = []
      const item = todo('123','something')
      const action = addToList(item)
      const updated = applyListAction(original, action)
      assert.deepEqual(updated, [item])
    })
  })
  describe('updateItem', () => {
    it('should apply given update to item to list', () => {
      const original: Todo[] = [todo('123', 'original'), todo('456', 'something else')]
      const [shouldBeUnchanged,shouldBeUpdated] = applyListAction(original, updateItemInList('456', changeTitle('updated title')))

      assert.deepEqual(shouldBeUpdated.title, 'updated title')
      assert.deepEqual(shouldBeUnchanged, original[0])
    })
  })
})