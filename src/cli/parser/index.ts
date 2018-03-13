import { parseConfig, CommandSpec, ActionFunction } from './configParser'
import { ParsedArgs, parseInput, matches } from './inputParser'
import _ = require('lodash')

export class Commander {
  commands: CommandSpec[] = []
  command (definition: string) {
    const parsed = parseConfig(definition)
    const commandList = this.commands
    return {
      action (f: ActionFunction) {
        parsed.action = f
        commandList.push(parsed)
        return this
      },
      option (name: string, requiresValue = false) {
        parsed.flags.push({ name, requiresValue })
        return this
      }
    }
  }
  parseArgv (argv: string[]) {
    this.parseInput(argv.slice(2))
  }
  parseInput (input: string[]) {
    const matching = this.commands.find(commandSpec => matches(input, commandSpec))
    if (!matching) {
      console.error('No matching command')
      process.exit(1)
      return
    }
    const parsed = parseInput(input, matching)
    const actionResult = matching.action(parsed)
    if (actionResult) {
      actionResult.then(() => undefined, (error: Error) => console.error(error))
    }
  }
}
