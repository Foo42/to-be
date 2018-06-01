import { Todo, todo } from '../../src/core/todo'
import { buildTodoTree, TreeNode, deepFilter } from '../../src/core/tree'
import { expect } from 'chai'
import { keyBy } from 'lodash'
import { SummariseDueDates } from '../../src/core/tree/summarisers/dueDates'
import { summariseActionableTasksWithin } from '../../src/core/tree/summarisers/actionableWithin'
import { summariseTagsWithin } from '../../src/core/tree/summarisers/tagsWithin'

const baseTodo = todo

describe('todo tree', () => {
  describe('buildTodoTree', () => {
    it('should return an empty list when given an empty list', () => {
      const input: Todo[] = []
      const output = buildTodoTree(input)
      expect(output).to.deep.eq([])
    })

    it('should return a flat list of items without children for an input list without parents', () => {
      const input: Todo[] = [
        baseTodo('a', 'a'),
        baseTodo('b', 'b')
      ]
      const output = buildTodoTree(input)
      const expectedOutput = input.map(withEmptyChildList)
      expect(output).to.deep.eq(expectedOutput)
    })

    it('should include todos with a parent within the parents child array', () => {
      const parentTodo = baseTodo('a', 'I am a parent')
      const childTodo = { ...baseTodo('b', 'I am a child'), parentTaskId: 'a' }
      const input: Todo[] = [
        parentTodo,
        childTodo
      ]

      const output = buildTodoTree(input)
      const outputParent = output.find(todo => todo.id === parentTodo.id)

      expect(outputParent && outputParent.children).to.deep.equal([withEmptyChildList(childTodo)])
    })

    it('should not include todos with a parent in the root list', () => {
      const parentTodo = baseTodo('a', 'I am a parent')
      const childTodo = { ...baseTodo('b', 'I am a child'), parentTaskId: 'a' }
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
        const todo: Todo = baseTodo('a', 'a')
        const tree = buildTodoTree([todo])[0]
        const summarisedTree = SummariseDueDates(tree)
        expect(summarisedTree.summary.dueDates).to.deep.eq([])
      })

      it('root summary should only include due date of root for a tree with no children', () => {
        const dueDate = new Date('2050-01-15')
        const todo: Todo = { ...baseTodo('a', 'a'), dueDate }
        const tree = buildTodoTree([todo])[0]
        const summarisedTree = SummariseDueDates(tree)
        expect(summarisedTree.summary.dueDates).to.deep.eq([dueDate])
      })

      it('root summary should include due dates of children for a root with children', () => {
        const dueDate = new Date('2050-01-15')
        const todos = [
          { ...baseTodo('a', 'I am a parent'), dueDate },
          { ...baseTodo('b', 'I am a child'), parentTaskId: 'a', dueDate: new Date('2060-02-16') },
          { ...baseTodo('c', 'I am another child'), parentTaskId: 'a', dueDate: new Date('2070-03-17') },
          { ...baseTodo('d', 'child without due date'), parentTaskId: 'a' }
        ]
        const tree = buildTodoTree(todos)[0]
        const summarisedTree = SummariseDueDates(tree)
        expect(summarisedTree.summary.dueDates).to.deep.eq([new Date('2060-02-16'), new Date('2070-03-17'), new Date('2050-01-15')])
      })

      it('root summary should include due dates of all decendent children', () => {
        const dueDate = new Date('2050-01-15')
        const todos = [
          { ...baseTodo('a', 'I am a parent'), dueDate: new Date('2050-01-15') },
          { ...baseTodo('b', 'I am a child'), parentTaskId: 'a', dueDate: new Date('2060-02-16') },
          { ...baseTodo('c', 'I am a grandchild'), parentTaskId: 'b', dueDate: new Date('2070-03-17') },
          { ...baseTodo('d', 'I am a great grandchild'), parentTaskId: 'c', dueDate: new Date('2080-04-18') },
          { ...baseTodo('e', 'I am a great grandchild'), parentTaskId: 'c', dueDate: new Date('2090-05-19') }
        ]
        const tree = buildTodoTree(todos)[0]
        const summarisedTree = SummariseDueDates(tree)
        const actualDateSet = new Set(summarisedTree.summary.dueDates)
        const expectedDateSet = new Set([new Date('2050-01-15'), new Date('2060-02-16'), new Date('2070-03-17'), new Date('2080-04-18'), new Date('2090-05-19')])
        expect(actualDateSet).to.deep.equal(expectedDateSet)
      })
    })

    describe('summariseActionableTasksWithin', () => {
      it('should return 0 for a tree with no children and a inactionable root', () => {
        const inactionableTodo: Todo = baseTodo('a', 'a')
        const isActionable = (todo: Todo) => false
        const tree = buildTodoTree([inactionableTodo])[0]
        const summarisedTree = summariseActionableTasksWithin(tree, isActionable)
        expect(summarisedTree.summary.actionableWithin).to.deep.eq(0)
      })
      it('should return 1 for a tree with no children and an actionable root', () => {
        const actionableTodo: Todo = baseTodo('a', 'a')
        const isActionable = (todo: Todo) => true
        const tree = buildTodoTree([actionableTodo])[0]
        const summarisedTree = summariseActionableTasksWithin(tree, isActionable)
        expect(summarisedTree.summary.actionableWithin).to.deep.eq(1)
      })
      it('should return number of todos in tree when tree of todos all actionabe', () => {
        const actionableTodo: Todo = baseTodo('a', 'a')
        const childA: Todo = { ...baseTodo('childA', 'Child A'), parentTaskId: 'a' }
        const childB: Todo = { ...baseTodo('childB', 'Child B'), parentTaskId: 'a' }
        const grandchildA: Todo = { ...baseTodo('grandchildA', 'Grandchild A'), parentTaskId: 'childA' }
        const isActionable = (todo: Todo) => true
        const tree = buildTodoTree([actionableTodo, childA, childB, grandchildA])[0]
        const summarisedTree = summariseActionableTasksWithin(tree, isActionable)
        expect(summarisedTree.summary.actionableWithin).to.deep.eq(4)
      })
      it('should return number of active todos in tree when tree has some actionable and some not', () => {
        const actionableTodo: Todo = baseTodo('a', 'a')
        const childA: Todo = { ...baseTodo('childA', 'Child A'), parentTaskId: 'a' }
        const childB: Todo = { ...baseTodo('childB', 'Child B'), parentTaskId: 'a' }
        const grandchildA: Todo = { ...baseTodo('grandchildA', 'Grandchild A'), parentTaskId: 'childA' }
        const isActionable = (todo: Todo) => todo.id !== 'childA'
        const tree = buildTodoTree([actionableTodo, childA, childB, grandchildA])[0]
        const summarisedTree = summariseActionableTasksWithin(tree, isActionable)
        expect(summarisedTree.summary.actionableWithin).to.deep.eq(3)
      })
    })

    describe('summariseTagsWithin', () => {
      it('should return no tags for a todo without tags', () => {
        const todo: Todo = baseTodo('someId', 'some title')
        const tree = buildTodoTree([todo])[0]
        const summarised = summariseTagsWithin(tree)
        expect(summarised.summary.tagsWithin).to.deep.equal({})
      })

      it('should return tags from a todo with tags', () => {
        const todo: Todo = { ...baseTodo('someId', 'some title'), tags: [{ name: 'A' }, { name: 'B' }] }
        const tree = buildTodoTree([todo])[0]
        const summarised = summariseTagsWithin(tree)
        expect(summarised.summary.tagsWithin).to.deep.equal(keyBy(todo.tags, 'name'))
      })

      it('should return set of all childrens tags', () => {
        const rootTodo: Todo = { ...baseTodo('a', 'a'), tags: [{ name: 'a' },{ name: 'x' }] }
        const childA: Todo = { ...baseTodo('childA', 'Child A'), parentTaskId: rootTodo.id, tags: [{ name: 'y' }] }
        const childB: Todo = { ...baseTodo('childB', 'Child B'), parentTaskId: rootTodo.id, tags: [{ name: 'x' }, { name: 'y' }, { name: 'z' }] }
        const tree = buildTodoTree([rootTodo, childA, childB])[0]

        const summarised = summariseTagsWithin(tree)
        const expectedTags = {
          a: { name: 'a' },
          x: { name: 'x' },
          y: { name: 'y' },
          z: { name: 'z' }
        }
        expect(summarised.summary.tagsWithin).to.deep.equal(expectedTags)
      })
    })

    describe('deepFilter', () => {
      it('should remove any decendents which do not pass the predicate', () => {
        const shouldRemoveTag = { name: 'removeMe' }
        const actionableTodo: Todo = baseTodo('a', 'a')
        const childA: Todo = { ...baseTodo('childA', 'Child A'), parentTaskId: 'a' }
        const childB: Todo = { ...baseTodo('childB', 'Child B'), parentTaskId: 'a', tags: [shouldRemoveTag] }
        const grandchildA: Todo = { ...baseTodo('grandchildA', 'Grandchild A'), parentTaskId: 'childA', tags: [shouldRemoveTag] }
        const tree = buildTodoTree([actionableTodo, childA, childB, grandchildA])[0]

        const predicate = (todo: Todo) => !todo.tags.some(tag => tag === shouldRemoveTag)
        const filtered = deepFilter(tree, predicate)

        expect(filtered.children.map(child => child.id)).to.deep.eq([childA.id])
        expect(filtered.children[0].children).to.deep.eq([])
      })
    })
  })
})

function withEmptyChildList (todo: Todo): TreeNode<Todo> {
  return { ...todo, children: [], summary: {} }
}
