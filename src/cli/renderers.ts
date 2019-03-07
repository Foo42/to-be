import { Todo } from '../core/todo'
import { TreeNode } from '../core/tree'
import { flatMap } from 'lodash'
import chalk from 'chalk'
import { ScoreSummary } from '../core/tree/summarisers/score'
import { isBlockedUntilFutureDate } from '../core/filters'

export function renderTodoList (todos: Todo[], showNumbers = false): string {
  return todos.map((todo, i) => {
    const prefix = showNumbers ? `#${i}` : ''
    return renderTodo(todo, prefix)
  }).join('\n')
}

export function renderTodoTree (todos: (TreeNode<Todo> | TreeNode<Todo, ScoreSummary>)[], showNumbers = false): string {
  return preRenderTodoTree(todos, '', showNumbers ? '#' : '').join('\n')
}

function preRenderTodoTree (todos: (TreeNode<Todo>[] | TreeNode<Todo, ScoreSummary>), currentIndent = '', numberingPrefix = ''): string[] {
  const indentUnit = '  '
  const isTopLevel = currentIndent === ''
  return flatMap(todos, (todo, i) => {
    const prefix = `${currentIndent}${numberingPrefix ? (numberingPrefix + i) : ''}`
    const numberingPrefixForSubTree = numberingPrefix ? prefix + '.' : ''
    const trailingLines = isTopLevel ? [''] : []
    return [renderTodo(todo, prefix), ...preRenderTodoTree(todo.children, currentIndent + indentUnit, numberingPrefixForSubTree), ...trailingLines]
  })
}

function renderTodo (todo: Todo | TreeNode<Todo> | TreeNode<Todo, ScoreSummary>, prefix?: string): string {
  const parts: string[] = []
  if (prefix) {
    parts.push(prefix)
  }

  let checkContents = ' '
  if (todo.complete) {
    checkContents = '✓'
  } else if (todo.blockingTaskIds.length > 0) {
    checkContents = chalk.red('BLOCKED')
  } else if (isBlockedUntilFutureDate(todo)) {
    checkContents = chalk.red(`BLOCKED UNTIL ${todo.blockedUntil}`)
  } else if (todo.waitingOn.length > 0) {
    checkContents = chalk.yellow(`Waiting on ${todo.waitingOn.map(person => person.name).join(', ')}`)
  }
  parts.push(`[${checkContents}]`)

  parts.push(todo.title)
  if (todo.contexts.length) {
    parts.push(todo.contexts.map(context => chalk.blueBright(`@${context}`)).join(', '))
  }
  if (todo.tags.length) {
    parts.push(todo.tags.map(tag => `#${tag.name}`).join(', '))
  }
  if (todo.estimateMinutes) {
    parts.push(`[${todo.estimateMinutes} mins]`)
  }
  if (todo.dueDate) {
    parts.push(`(Due by: ${todo.dueDate.toISOString().slice(0,10)})`)
  }
  if ('summary' in todo && 'compositeScore' in todo.summary && process.env['SHOW_SCORES']) {
    const scoreSummary: ScoreSummary = todo.summary
    const scoreParts = Object.keys(scoreSummary.scoreComponents).map(key => `${key}=${scoreSummary.scoreComponents[key]}`).join(', ')
    parts.push(`{${scoreSummary.compositeScore}: ${scoreParts}}`)
  }
  const isActionable = !todo.complete && ('children' in todo ? todo.children.length === 0 : true)
  const styler = isActionable ? chalk.white : chalk.grey
  return styler(parts.join(' '))

}
