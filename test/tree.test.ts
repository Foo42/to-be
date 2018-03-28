import { Todo } from '../src/core/todo'
import { buildTodoTree, TreeNode, SummariseDueDates } from '../src/core/tree'
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
        { id: 'a', title: 'a', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [] },
        { id: 'b', title: 'b', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [] }
      ]
      const output = buildTodoTree(input)
      const expectedOutput = input.map(withEmptyChildList)
      expect(output).to.deep.eq(expectedOutput)
    })

    it('should include todos with a parent within the parents child array', () => {
      const parentTodo = { id: 'a', title: 'I am a parent', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [] }
      const childTodo = { id: 'b', title: 'I am a child', parentTaskId: 'a', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [] }
      const input: Todo[] = [
        parentTodo,
        childTodo
      ]

      const output = buildTodoTree(input)
      const outputParent = output.find(todo => todo.id === parentTodo.id)

      expect(outputParent && outputParent.children).to.deep.equal([withEmptyChildList(childTodo)])
    })

    it('should not include todos with a parent in the root list', () => {
      const parentTodo = { id: 'a', title: 'I am a parent', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [] }
      const childTodo = { id: 'b', title: 'I am a child', parentTaskId: 'a', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [] }
      const input: Todo[] = [
        parentTodo,
        childTodo
      ]

      const output = buildTodoTree(input)
      const outputChild = output.find(todo => todo.id === childTodo.id)

      expect(outputChild).to.eql(undefined)
    })
  })

  describe('summarising', () => {
    describe('SummariseDueDates', () => {
      it('should return an empty list for a tree with no children and no due date', () => {
        const todo: Todo = { id: 'a', title: 'a', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [] }
        const tree = buildTodoTree([todo])[0]
        const summarisedTree = SummariseDueDates(tree)
        expect(summarisedTree.summary.dueDates).to.deep.eq([])
      })

      it('root summary should only include due date of root for a tree with no children', () => {
        const dueDate = new Date('2050-01-15')
        const todo: Todo = { id: 'a', title: 'a', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [], dueDate }
        const tree = buildTodoTree([todo])[0]
        const summarisedTree = SummariseDueDates(tree)
        expect(summarisedTree.summary.dueDates).to.deep.eq([dueDate])
      })

      it('root summary should include due dates of children for a root with children', () => {
        const dueDate = new Date('2050-01-15')
        const todos = [
          { id: 'a', title: 'I am a parent', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [], dueDate: new Date('2050-01-15') },
          { id: 'b', title: 'I am a child', parentTaskId: 'a', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [], dueDate: new Date('2060-02-16') },
          { id: 'c', title: 'I am another child', parentTaskId: 'a', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [], dueDate: new Date('2070-03-17') },
          { id: 'd', title: 'child without due date', parentTaskId: 'a', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [] }
        ]
        const tree = buildTodoTree(todos)[0]
        const summarisedTree = SummariseDueDates(tree)
        expect(summarisedTree.summary.dueDates).to.deep.eq([new Date('2060-02-16'), new Date('2070-03-17'), new Date('2050-01-15')])
      })

      it('root summary should include due dates of all decendent children', () => {
        const dueDate = new Date('2050-01-15')
        const todos = [
          { id: 'a', title: 'I am a parent', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [], dueDate: new Date('2050-01-15') },
          { id: 'b', title: 'I am a child', parentTaskId: 'a', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [], dueDate: new Date('2060-02-16') },
          { id: 'c', title: 'I am a grandchild', parentTaskId: 'b', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [], dueDate: new Date('2070-03-17') },
          { id: 'd', title: 'I am a great grandchild', parentTaskId: 'c', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [], dueDate: new Date('2080-04-18') },
          { id: 'd', title: 'I am a great grandchild', parentTaskId: 'c', complete: false, createdAt: new Date(), contexts: [], notes: [], tags: [], dueDate: new Date('2090-05-19') }
        ]
        const tree = buildTodoTree(todos)[0]
        const summarisedTree = SummariseDueDates(tree)
        const actualDateSet = new Set(summarisedTree.summary.dueDates)
        const expectedDateSet = new Set([new Date('2050-01-15'), new Date('2060-02-16'), new Date('2070-03-17'), new Date('2080-04-18'), new Date('2090-05-19')])
        expect(actualDateSet).to.deep.equal(expectedDateSet)
      })
    })
  })
})

function withEmptyChildList (todo: Todo): TreeNode<Todo> {
  return { ...todo, children: [], summary: undefined }
}
