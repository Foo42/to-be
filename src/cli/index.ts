require('source-map-support/register')
import { Commander } from './parser'
import { updateItemInList, addToList } from '../core/listActions'
import { Todo } from '../core/todo'
import { appendActionToFile } from '../file/save'
import { loadActionsFromFile, buildStateFromActions } from '../file/load'
import * as path from 'path'
import { markCompleted, addContexts, changeTitle, setEstimate, setParentTask, addTags, setDueDate, addNote, addBlockingTask, markDeleted, setBlockedUntil, addWaitingOn, removeWaitingOn } from '../core/actions'
import { allowAnyTodo, isIncomplete } from '../core/filters/index'
import * as readline from 'readline'
import { TreeNode, buildTodoTree } from '../core/tree'
import { renderTodoTree, renderTodoList } from './renderers'
import { showNext } from './commands/next'
import { getDefaults } from './config/defaults'
import { interactivePicker } from './todoPicker'
import { loadConfigFromFile } from './config/loader'
import { createCommand } from './commands/create'
import { hasTag } from '../core/filters/hasTag'
import { unionOf } from '../core/filters/union'
import { intersectionOf } from '../core/filters/intersection'
import { quickAddParse } from './quickAdd'

const defaultFilePath = path.join(process.cwd(), 'todo.log.yml')
export const todoFilePath = process.env.TODO_FILE || defaultFilePath

const defaultConfigFilePath = path.join(path.dirname(todoFilePath), 'todo.config.yml')
const configFilePath = process.env.TODO_CONFIG_FILE || defaultConfigFilePath
const loadConfig = () => loadConfigFromFile(configFilePath).catch(() => getDefaults())

const activeContexts = (process.env.ACTIVE_CONTEXTS ? process.env.ACTIVE_CONTEXTS.split(',') : []).map(context => context.trim().toLowerCase())

const commander = new Commander()

commander
  .command('create <title>')
  .option('sub-task')
  .action(createCommand)

commander
  .command('tree')
  .option('filter', true)
  .action(({ flags }) => {
    let filter = isIncomplete
    if (flags.filter === 'all') {
      filter = allowAnyTodo
    }
    return showTreeFromFile(todoFilePath, filter)
  })

commander
  .command('next')
  .option('available-time', true)
  .action(showNext(todoFilePath, loadConfig, activeContexts))

commander
  .command('list [<viewName>]')
  .option('available-time', true)
  .option('only-tags', true)
  .action(({ flags }) => {
    let filter = isIncomplete
    const onlyTags = flags['only-tags']
    if (onlyTags) {
      const tags = onlyTags.split(',')
      const tagFilters = tags.map(tagName => hasTag({ name: tagName }))
      if (tagFilters.length) {
        const union = unionOf(...tagFilters)
        filter = intersectionOf(filter, union)
      }
    }
    return showTreeFromFile(todoFilePath, filter)
  })

commander
  .command('show')
  .action(() => {
    let filter = isIncomplete
    return loadActionsFromFile(todoFilePath)
      .then(buildStateFromActions)
      .then(todos => todos.filter(filter))
      .then(todos => buildTodoTree(todos))
      .then(trees => renderTodoTree(trees, true))
      .then(console.log)
      .then(() => undefined)
  })

commander
  .command('pick [<id>]')
  .action((options) => {
    const id = options.allSubCommands.id
    console.log('id', id, typeof (id))
    const gettingId = id ? Promise.resolve(id) : todoIdPicker()
    return gettingId.then(id => {
      process.stdin.setRawMode!(false)
      console.log('picked:', id)
      process.stdin.eventNames().forEach(name => console.log(name, process.stdin.listeners(name)))
    }).catch(console.error)
  })

commander
  .command('done [<id>]')
  .action((options) => {
    const id = options.allSubCommands.id
    console.log('id', id, typeof (id))
    const gettingId = id ? Promise.resolve(id) : todoIdPicker()
    return gettingId.then(id => {
      console.log(`${id} marked as done`)
      const update = updateItemInList(id, markCompleted())
      return appendActionToFile(update, todoFilePath)
    })
    .then(() => showTreeFromFile(todoFilePath))
  })

commander
  .command('delete [<id>]')
  .option('reason', true)
  .action((options) => {
    const id = options.allSubCommands.id
    console.log('id', id, typeof (id))
    const gettingId = id ? Promise.resolve(id) : todoIdPicker()
    return gettingId.then(id => {
      console.log(`${id} marked as deleted`)
      const reason = options.flags.reason
      const update = updateItemInList(id, markDeleted(reason))
      return appendActionToFile(update, todoFilePath)
    })
    .then(() => showTreeFromFile(todoFilePath))
  })

commander
  .command('edit set-title [<title>] [<id>]')
  .action((options) => {
    const { title, id } = options.allSubCommands
    const gettingId = id ? Promise.resolve(id) : todoIdPicker()
    const gettingTitle = title ? Promise.resolve(title) : gettingId.then(() => promptInput('New title'))
    return Promise.all([gettingId, gettingTitle]).then(([id, title]) => {
      const update = updateItemInList(id, changeTitle(title))
      return appendActionToFile(update, todoFilePath)
    })
  })

commander
  .command('edit add-context [<context>] [<id>]')
  .action((options) => {
    const { id, context } = options.allSubCommands
    console.log(`in add-context. context: ${context}, id: ${id}`)
    const gettingId = id ? Promise.resolve(id) : todoIdPicker()
    const gettingContext = context ? Promise.resolve(context) : gettingId.then(() => promptInput('Context to add'))
    return Promise.all([gettingId, gettingContext]).then(([id, context]) => {
      if (context.startsWith('@')) {
        context = context.substring(1)
      }
      const update = updateItemInList(id, addContexts([context]))
      return appendActionToFile(update, todoFilePath)
    })
  })

commander
  .command('edit add-tag [<tagName>] [<id>]')
  .action((options) => {
    const { id, tagName } = options.allSubCommands
    const gettingId = id ? Promise.resolve(id) : todoIdPicker()
    const gettingTag = tagName ? Promise.resolve(tagName) : gettingId.then(() => promptInput('Tag to add'))
    return Promise.all([gettingId, gettingTag]).then(([id, tagName]) => {
      if (tagName.startsWith('#')) {
        tagName = tagName.substring(1)
      }
      const update = updateItemInList(id, addTags([{ name: tagName }]))
      return appendActionToFile(update, todoFilePath)
    })
  })

commander
  .command('edit set-estimate [<estimate>] [<id>]')
  .action((options) => {
    const { estimate, id } = options.allSubCommands
    const gettingId = id ? Promise.resolve(id) : todoIdPicker()
    const gettingEstimate = estimate ? Promise.resolve(estimate) : gettingId.then(() => promptInput('Estimate in minutes'))
    return Promise.all([gettingId, gettingEstimate]).then(([id, estimateString]) => {
      const estimateInMinutes = parseInt(estimateString, 10)
      const update = updateItemInList(id, setEstimate(estimateInMinutes))
      return appendActionToFile(update, todoFilePath)
    })
  })

commander
  .command('edit set-parent [<parent>] [<id>]')
  .action((options) => {
    const { parent, id } = options.allSubCommands
    const gettingId = id ? Promise.resolve(id) : todoIdPicker('target todo (the child)')
    const gettingParentId = parent ? Promise.resolve(parent) : gettingId.then(() => todoIdPicker('parent todo'))
    return Promise.all([gettingId, gettingParentId]).then(([id, parentId]) => {
      const update = updateItemInList(id, setParentTask(parentId))
      return appendActionToFile(update, todoFilePath)
    })
  })

commander
  .command('edit set-due [<dueDate>] [<id>]')
  .action((options) => {
    const { dueDate, id } = options.allSubCommands
    const gettingId = id ? Promise.resolve(id) : todoIdPicker()
    const gettingDueDate = dueDate ? Promise.resolve(dueDate) : gettingId.then(() => promptInput('Due Date (iso format)'))
    return Promise.all([gettingId, gettingDueDate]).then(([id, dueDateString]) => {
      const dueDate = new Date(dueDateString)
      if (isNaN(dueDate.getTime())) {
        console.error('Date parse error')
        throw new Error('Date parse error')
      }
      const update = updateItemInList(id, setDueDate(dueDate))
      return appendActionToFile(update, todoFilePath)
    })
  })

commander
  .command('edit add-note [<noteText>] [<id>]')
  .action((options) => {
    const { id, noteText } = options.allSubCommands
    const gettingId = id ? Promise.resolve(id) : todoIdPicker()
    const gettingNoteText = noteText ? Promise.resolve(noteText) : gettingId.then(() => promptInput('Note Text'))
    return Promise.all([gettingId, gettingNoteText]).then(([id, noteText]) => {
      const update = updateItemInList(id, addNote({ textMarkdown: noteText }))
      return appendActionToFile(update, todoFilePath)
    })
  })

commander
  .command('edit add-blocking-task [<blocker>] [<id>]')
  .action((options) => {
    const { blocker, id } = options.allSubCommands
    const gettingTargetId = id ? Promise.resolve(id) : todoIdPicker('target todo (the blocked todo)')
    const gettingBlockerId = blocker ? Promise.resolve(blocker) : gettingTargetId.then(() => todoIdPicker('blocking todo'))
    return Promise.all([gettingTargetId, gettingBlockerId]).then(([id, blockerId]) => {
      const update = updateItemInList(id, addBlockingTask(blockerId))
      return appendActionToFile(update, todoFilePath)
    })
  })

commander
  .command('edit set-blocked-until [<date>] [<id>]')
  .action((options) => {
    const { date, id } = options.allSubCommands
    const gettingId = id ? Promise.resolve(id) : todoIdPicker()
    const gettingBlockedUntilDate = date ? Promise.resolve(date) : gettingId.then(() => promptInput('Blocked until date (iso format)'))
    return Promise.all([gettingId, gettingBlockedUntilDate]).then(([id, blockedUntilDateString]) => {
      const blockedUntilDate = new Date(blockedUntilDateString)
      if (isNaN(blockedUntilDate.getTime())) {
        console.error('Date parse error')
        throw new Error('Date parse error')
      }
      const update = updateItemInList(id, setBlockedUntil(blockedUntilDate))
      return appendActionToFile(update, todoFilePath)
    })
  })

commander
  .command('edit add-waiting-on [<person>] [<id>]')
  .action(async (options) => {
    const id = await (options.allSubCommands.id ? Promise.resolve(options.allSubCommands.id) : todoIdPicker())
    const name = options.allSubCommands.person || await promptInput('Name of person waiting on: ')
    const update = updateItemInList(id, addWaitingOn([{ name }]))
    await appendActionToFile(update, todoFilePath)
    const shouldAddChaser = (await promptInput('Would you like to add a chase up task? (y/n)')).toLowerCase().startsWith('y')
    if (shouldAddChaser) {
      const chaserTask: Todo = { ...quickAddParse(await promptInput('Chase up: ')), parentTaskId: id }
      await appendActionToFile(addToList(chaserTask), todoFilePath)
    }
    return showTreeFromFile(todoFilePath)
  })

commander
  .command('edit remove-waiting-on [<person>] [<id>]')
  .action(async (options) => {
    const id = await (options.allSubCommands.id ? Promise.resolve(options.allSubCommands.id) : todoIdPicker())
    const name = options.allSubCommands.person || await promptInput('Name of person to remove waiting on: ')
    const update = updateItemInList(id, removeWaitingOn([{ name }]))
    await appendActionToFile(update, todoFilePath)
    return showTreeFromFile(todoFilePath)
  })

function promptInput (question: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question(question + ': ', (answer) => {
      rl.close()
      return resolve(answer)
    })
  })
}

export function todoIdPicker (prompt = 'number'): Promise<string> {
  return loadActionsFromFile(todoFilePath)
    .then(buildStateFromActions)
    .then(todos => todos.filter(isIncomplete))
    .then(todos => buildTodoTree(todos))
    .then(interactivePicker)
    .then(todo => todo.id)
}

function promptForTodoCardinalPath (prompt: string) {
  return (todos: TreeNode<Todo>[]) => {
    return promptInput(prompt).then(answer => {
      const address = answer.split(/[\.\s]/).map(part => parseInt(part, 10))
      const siblings = address.slice(0, -1).reduce((list: TreeNode<Todo>[], i: number) => {
        return list[i].children
      }, todos) || todos
      const todo = siblings[address[address.length - 1]]
      return Promise.resolve(todo.id)
    })
  }
}

function showListFromFile (todoFilePath: string, filter = isIncomplete) {
  return loadActionsFromFile(todoFilePath)
    .then(buildStateFromActions)
    .then(todos => todos.filter(filter))
    .then(renderTodoList)
    .then(console.log)
    .catch(console.error)
}

export function showTreeFromFile (todoFilePath: string, filter = isIncomplete) {
  return loadActionsFromFile(todoFilePath)
    .then(buildStateFromActions)
    .then(todos => todos.filter(filter))
    .then(todos => buildTodoTree(todos))
    .then(renderTodoTree)
    .then(console.log)
    .catch(console.error)
}

commander.parseArgv(process.argv)
