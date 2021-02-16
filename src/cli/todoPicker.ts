import chalk from 'chalk'
import { TodoTree, deepFilterAll, TreeNode } from '../core/tree'
import { renderTodoTree } from './renderers'
import { Predicate } from '../core/predicate'
import { isUndefined } from 'util'
import { flatMap } from 'lodash'
import { clearScreen } from 'ansi-escapes'

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

  console.log('start of todo picker')
  return new Promise((resolve) => {

    process.stdin.setRawMode!(true)
    process.stdin.setEncoding('utf8')

    const drawTrees = (trees: TodoTree[], showNumbers = false) => {
      const rendered = renderTodoTree(trees, showNumbers)
      process.stdout.write(clearScreen)
      console.log(rendered)
    }
    const drawTreesWithPrompt = (trees: TodoTree[], prompt: string) => {
      drawTrees(trees)
      console.log()
      process.stdout.write(prompt)
    }

    let filter: RegExp | undefined = undefined
    let filterString = ''
    let filteredTrees: TodoTree[] = trees

    const processKey = (key: string) => {
      if (key === '\u0003') {
        process.exit()
      }

      if (key.charCodeAt(0) === 13) {
        process.stdin.setRawMode!(false)
        process.stdin.removeListener('data', processKey)
        process.stdout.write(clearScreen)
        resolve(getFinalResult(filteredTrees))
        return
      }

      if (key.charCodeAt(0) === 127) {
        filterString = filterString.slice(0,-1)
      } else {
        filterString = (filterString || '') + key
      }

      filter = new RegExp(filterString || '.*', 'i')
      filteredTrees = applyFilter(filter, trees)
      const isUniqueMatch = flatMap(filteredTrees, toLeafList).length === 1
      const promptStyle = isUniqueMatch ? chalk.greenBright : chalk.white
      const prompt = 'filter: ' + promptStyle(filterString)
      drawTreesWithPrompt(filteredTrees, prompt)
      return
    }

    process.stdin.on('data', processKey)

    const prompt = 'filter: ' + filterString
    drawTreesWithPrompt(filteredTrees, prompt)
  })
}

function getFinalResult (filteredTrees: TodoTree[]) {
  const leaves = flatMap(filteredTrees, toLeafList)
  if (leaves.length !== 1) {
    throw new Error('ambiguous selection')
  }
  return leaves[0]
}

function toLeafList<T> (tree: TreeNode<T>): TreeNode<T>[] {
  if (tree.children.length === 0) {
    return [tree]
  }
  return flatMap(tree.children, child => toLeafList(child))
}
