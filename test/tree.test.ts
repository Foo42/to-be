import { Todo } from '../src/core/todo'
import { buildTodoTree, TreeNode } from '../src/core/tree'
import { expect } from 'chai'

describe('todo tree', () => {
  describe('buildTodoTree', () => {
    it('should return an empty list when given an empty list', () => {
      const input: Todo[] = []
      const output = buildTodoTree(input)
      expect(output).to.deep.eq([])
    })

    it('should return a flat list of items without children for an input list without parents', () => {
      const input: Todo[] = [
        { id: 'a', title: 'a', complete: false, createdAt: new Date(), contexts: [] },
        { id: 'b', title: 'b', complete: false, createdAt: new Date(), contexts: [] }
      ]
      const output = buildTodoTree(input)
      const expectedOutput = input.map(withEmptyChildList)
      expect(output).to.deep.eq(expectedOutput)
    })

    it('should include todos with a parent within the parents child array', () => {
      const parentTodo = { id: 'a', title: 'I am a parent', complete: false, createdAt: new Date(), contexts: [] }
      const childTodo = { id: 'b', title: 'I am a child', parentTaskId: 'a', complete: false, createdAt: new Date(), contexts: [] }
      const input: Todo[] = [
        parentTodo,
        childTodo
      ]

      const output = buildTodoTree(input)
      const outputParent = output.find(todo => todo.id === parentTodo.id)

      expect(outputParent && outputParent.children).to.deep.equal([withEmptyChildList(childTodo)])
    })

    it('should not include todos with a parent in the root list', () => {
      const parentTodo = { id: 'a', title: 'I am a parent', complete: false, createdAt: new Date(), contexts: [] }
      const childTodo = { id: 'b', title: 'I am a child', parentTaskId: 'a', complete: false, createdAt: new Date(), contexts: [] }
      const input: Todo[] = [
        parentTodo,
        childTodo
      ]

      const output = buildTodoTree(input)
      const outputChild = output.find(todo => todo.id === childTodo.id)

      expect(outputChild).to.eql(undefined)
    })
  })
})

function withEmptyChildList (todo: Todo): TreeNode<Todo> {
  return { ...todo, children: [] }
}
