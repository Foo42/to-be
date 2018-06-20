import * as blessed from 'blessed'
import { TodoTree, deepFilterAll, TreeNode } from '../core/tree'
import { Todo } from '../core/todo'
import { renderTodoTree } from './renderers'
import { Predicate } from '../core/predicate'
import { isUndefined } from 'util'
import { flatMap } from 'lodash'
import { reject } from 'bluebird'

function setup () {
  const screen = blessed.screen({
    title: 'hello world',
    smartCSR: true,
    dockBorders: false,
    fullUnicode: true,
    autoPadding: true
  })

  const treeControl = blessed.text({
    top: 0,
    left: 0,
    height: '80%',
    width: '100%',
    scrollable: true
  })

  const log = blessed.log({ height: 1, width: '100%' })

  const input = blessed.textbox({
    bottom: 0,
    left: 0,
    height: 1,
    width: '100%',
    keys: true,
    mouse: true,
    inputOnFocus: true,
    style: {
      fg: 'white',
      bg: 'blue'	// Blue background so you see this is different from body
    }
  })

  const wrapper = blessed.layout({
    layout: 'grid',
    width: '100%',
    height: '100%'
  })
  wrapper.append(treeControl)
  wrapper.append(log)
  wrapper.append(input)
  screen.append(wrapper)

  screen.render()
  input.focus()

  return { screen, treeControl, input, log }

}

function applyFilter (filter: RegExp | undefined, trees: TodoTree[]): TodoTree[] {
  if (isUndefined(filter)) {
    return trees
  }
  const predicate: Predicate<TodoTree> = (todo) => {
    if (filter.test(todo.title)) {
      return true
    }
    return todo.children.some(predicate)
  }
  return deepFilterAll(trees, predicate)
}

export function interactivePicker (trees: TodoTree[]): Promise<TodoTree> {
  return new Promise((resolve) => {
    const { treeControl, input, screen, log } = setup()
    const setContent = (trees: TodoTree[], showNumbers = false) => {
      const rendered = renderTodoTree(trees, showNumbers)
      treeControl.setContent(rendered)
      screen.render()
    }

    let filter: RegExp | undefined = undefined
    let filteredTrees: TodoTree[] = trees
    let done = false
    input.on('keypress', () => {
      setImmediate(() => {
        if (done) {
          console.log('keypress firing')
          return
        }
        if (input.content.trim() === '') {
          log.add('filter = none')
          filter = undefined
        } else {
          log.add(`filter = ${input.content}`)
          filter = new RegExp(input.content)
        }
        filteredTrees = applyFilter(filter, trees)
        setContent(filteredTrees)
      })
    })
    setContent(filteredTrees)

    input.on('submit', () => {
      done = true
      screen.remove(input)
      input.removeAllListeners()
      input.destroy()

      screen.remove(treeControl)
      treeControl.destroy()
      log.destroy()

      screen.removeAllListeners()
      screen.detach()
      screen.destroy()
      setImmediate(() => {
        const leaves = flatMap(filteredTrees, toLeafList)
        if (leaves.length === 1) {
          return resolve(leaves[0])
        }
        return reject(new Error('ambiguous selection'))
      })
    })
  })
}

function toLeafList<T> (tree: TreeNode<T>): TreeNode<T>[] {
  if (tree.children.length === 0) {
    return [tree]
  }
  return flatMap(tree.children, child => toLeafList(child))
}
