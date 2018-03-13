import { CommandSpec, Dict, FlagSpec } from './configParser'
import _ = require('lodash')

export interface ParsedArgs {
  commands: string[]
  allSubCommands: Dict<string | undefined>
  flags: Dict<string>
}

function processFlagValue (flagName: string, input: string[], allowedFlags: FlagSpec[], acc: { flags: Dict<string>, rest: string[] }): { flags: Dict<string>, rest: string[] } {
  const x = input[0]
  acc.flags[flagName] = x
  return processForFlags(input.slice(1), allowedFlags, acc)
}

function processForFlags (input: string[], allowedFlags: FlagSpec[], acc: { flags: Dict<string>, rest: string[] }): { flags: Dict<string>, rest: string[] } {
  const x = input[0]
  if (!x) {
    return acc
  }
  if (x.startsWith('--')) {
    const name = x.substring(2)
    const flag = allowedFlags.find((flagSpec) => flagSpec.name === name)
    if (!flag) {
      throw new Error('Unknown flag ' + name)
    }
    if (flag.requiresValue) {
      return processFlagValue(flag.name, input.slice(1), allowedFlags, acc)
    }
    acc.flags[name] = 'true'
  } else {
    acc.rest.push(x)
  }
  return processForFlags(input.slice(1), allowedFlags, acc)
}

export function matches (input: string[], commandSpec: CommandSpec): boolean {
  try {
    const { rest } = processForFlags(input, commandSpec.flags, { flags: {}, rest: [] })
    const zipped = _.zip(rest.slice(0, commandSpec.commands.length), commandSpec.commands)
    return zipped.every(([inputArg, requiredArg]) => inputArg === requiredArg)
  } catch (err) {
    return false
  }
}

export function parseInput (input: string[], commandSpec: CommandSpec): ParsedArgs {
  const { flags, rest } = processForFlags(input, commandSpec.flags, { flags: {}, rest: [] })
  return { flags, ...parseWithoutFlags(rest, commandSpec) }
}

function parseWithoutFlags (input: string[], commandSpec: CommandSpec) {
  const commandValues = input.slice(0, commandSpec.commands.length)
  return { commands: commandValues, ...parseAfterCommand(input.slice(commandValues.length), commandSpec) }
}

function parseAfterCommand (input: string[], commandSpec: CommandSpec) {
  const allSubCommands = [...commandSpec.subCommands, ...commandSpec.optionalSubCommands]
  const allSubCommandValues = _.takeWhile(input.slice(0, allSubCommands.length), arg => !arg.startsWith('-'))
  const subCommandMap = _.zipObject(allSubCommands, allSubCommandValues)
  return { allSubCommands: { ...subCommandMap } }
}
