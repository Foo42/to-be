import { CommandSpec, Dict } from './configParser'
import _ = require('lodash')

export interface ParsedArgs {
  commands: string[]
  allSubCommands: Dict<string | undefined>
}

export function parseInput (input: string[], commandSpec: CommandSpec): ParsedArgs {
  const commandValues = input.slice(0, commandSpec.commands.length)
  return { commands: commandValues, ...parseAfterCommand(input.slice(commandValues.length), commandSpec) }
}

function parseAfterCommand (input: string[], commandSpec: CommandSpec) {
  const allSubCommands = [...commandSpec.subCommands, ...commandSpec.optionalSubCommands]
  const allSubCommandValues = _.takeWhile(input.slice(0, allSubCommands.length), arg => !arg.startsWith('-'))
  const subCommandMap = _.zipObject(allSubCommands, allSubCommandValues)
  return { allSubCommands: { ...subCommandMap } }
}
