import { parseConfig, CommandSpec } from './configParser'
import { ParsedArgs, parseInput } from './inputParser'
import _ = require('lodash')

type ActionFunction = (options: ParsedArgs) => void
export class Commander {
  commands: CommandSpec[] = []
  command (definition: string) {
    const parsed = parseConfig(definition)
    const commandList = this.commands
    return {
      action (f: ActionFunction) {
        parsed.action = f
        commandList.push(parsed)
      }
    }
  }
  parseArgv (argv: string[]) {
    this.parseInput(argv.slice(2))
  }
  parseInput (input: string[]) {
    const matching = this.commands.find(commandSpec => {
      const zipped = _.zip(input.slice(0, commandSpec.commands.length), commandSpec.commands)
      return zipped.every(([inputArg, requiredArg]) => inputArg === requiredArg)
    })
    if (!matching) {
      console.error('No matching command')
      process.exit(1)
      return
    }
    const parsed = parseInput(input, matching)
    matching.action(parsed)
  }
}

// const example = 'major minor <mode> [<optionalMode>] -a -b'
// console.log(parseConfig(example))

// const c = new Commander()
// c.command('major minor <mode> [<optionalMode>]').action(parsed => console.log('got', parsed))
// c.parseArg(process.argv)
