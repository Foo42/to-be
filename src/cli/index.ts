require('source-map-support/register')
import { Commander } from './parser'
import { addToList, updateItemInList } from '../core/listActions'
import { Todo } from '../core/todo'
import { appendActionToFile } from '../file/save'
import { loadActionsFromFile, buildStateFromActions } from '../file/load'
import * as path from 'path'
import { markCompleted, addContexts, changeTitle, setEstimate, setParentTask, addTags, setDueDate, addNote, addBlockingTask } from '../core/actions'
import { allowAnyTodo, isIncomplete } from '../core/filters/index'
import * as readline from 'readline'
import { TreeNode, buildTodoTree } from '../core/tree'
import { quickAddParse } from './quickAdd'
import { renderTodoTree, renderTodoList } from './renderers'
import { showNext } from './commands/next'
import { loadConfigFromFile } from '../core/config/loader'
import { getDefaults } from '../core/config/defaults'
import { interactivePicker } from './todoPicker'

const defaultFilePath = path.join(process.cwd(), 'todo.log.yml')
const todoFilePath = process.env.TODO_FILE || defaultFilePath

const defaultConfigFilePath = path.join(path.dirname(todoFilePath), 'todo.config.yml')
const configFilePath = process.env.TODO_CONFIG_FILE || defaultConfigFilePath
const loadConfig = () => loadConfigFromFile(configFilePath).catch(() => getDefaults())

const activeContexts = (process.env.ACTIVE_CONTEXTS ? process.env.ACTIVE_CONTEXTS.split(',') : []).map(context => context.trim().toLowerCase())

const commander = new Commander()

commander
  .command('create <title>')
  .option('sub-task')
  .action(async (options) => {
    const parent = await (options.flags['sub-task'] ? todoIdPicker('parent todo') : Promise.resolve(''))
    const toAdd = quickAddParse(options.allSubCommands.title as string)
    if (parent) {
      toAdd.parentTaskId = parent
    }
    const update = addToList(toAdd)
    appendActionToFile(update, todoFilePath)
      .then(() => showTreeFromFile(todoFilePath))
      .catch(console.error)
  })

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
  .action(({ flags }) => {
    let filter = isIncomplete
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
      // .then(interactiveFilter)
      // .then((res) => console.log('got it', res) || res)
      .then(trees => renderTodoTree(trees, true))
      .then(console.log)
      .then(() => undefined)
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
      if(tagName.startsWith('#')){
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

function todoIdPicker (prompt = 'number'): Promise<string> {
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

function showTreeFromFile (todoFilePath: string, filter = isIncomplete) {
  return loadActionsFromFile(todoFilePath)
    .then(buildStateFromActions)
    .then(todos => todos.filter(filter))
    .then(todos => buildTodoTree(todos))
    .then(renderTodoTree)
    .then(console.log)
    .catch(console.error)
}

commander.parseArgv(process.argv)
