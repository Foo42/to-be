import * as _ from 'lodash'
import { ParsedArgs } from './inputParser'

export interface Dict<T> {
  [key: string]: T
}

const firstGroup = (pattern: RegExp) => (text: string) => (pattern.exec(text) || [])[1]

export type ActionFunction = (options: ParsedArgs) => Promise<void> | void

export interface FlagSpec {
  name: string,
  requiresValue: boolean
}
export interface CommandSpec {
  commands: string[]
  subCommands: string[]
  optionalSubCommands: string[]
  action: ActionFunction
  flags: FlagSpec[]
}

export interface ParsedInput {
  commands: string[]
  subCommands: Dict<string>
  flags: Dict<string>
}

export function parseConfig (config: string): CommandSpec {
  const parts = config.split(' ')
  const commands = _.takeWhile(parts, part => /^\w/.test(part))
  return { action: () => undefined, commands, ...parseConfigAfterCommands(parts.slice(commands.length)), flags: [] }
}

function parseConfigAfterCommands (config: string[]) {
  const pattern = /^<([^>]+)>$/
  const subCommands = _.takeWhile(config, word => pattern.test(word)).map(firstGroup(pattern))
  return { subCommands, ...parseConfigAfterSubCommands(config.slice(subCommands.length)) }
}

function parseConfigAfterSubCommands (config: string[]) {
  const pattern = /^\[<([^>]+)>\]$/
  const optionalSubCommands = _.takeWhile(config, word => pattern.test(word)).map(firstGroup(pattern))
  return { optionalSubCommands }
}

function parseConfigAfterOptionalSubCommands (config: string[]) {
  const pattern = /-\w+/
  const switches = _.takeWhile(config, word => pattern.test(word))
  return { switches }
}
