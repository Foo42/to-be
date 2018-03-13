import { expect } from 'chai'
import { Commander } from '../../src/cli/parser'
import { CommandSpec } from '../../src/cli/parser/configParser'
import { ParsedArgs } from '../../src/cli/parser/inputParser'

const noop = () => undefined

describe('parser', () => {
  it('should interpret configuration strings with fixed commands, subcommands, and optional subcommands', () => {
    const commander = new Commander()
    commander.command('edit todo set <what> [<newValue>]').action(noop)
    const expected: Partial<CommandSpec> = {
      commands: ['edit', 'todo', 'set'],
      subCommands: ['what'],
      optionalSubCommands: ['newValue']
    }
    expect(commander.commands[0]).to.deep.include(expected)
  })

  it('should execute matching command assigning values to subcommands', () => {
    const commandline = ['node', '/path/script.js', 'edit', 'todo', 'set', 'title', 'banana']
    const expected: Partial<ParsedArgs> = {
      commands: ['edit', 'todo', 'set'],
      allSubCommands: {
        what: 'title',
        newValue: 'banana'
      }
    }
    const commander = new Commander()
    commander.command('edit todo set <what> [<newValue>]').action(parsed => {
      expect(parsed).to.deep.include(expected)
    })
    commander.parseArgv(commandline)
  })

  it('should collect flags regardless of position', () => {
    const commandline = ['node', '/path/script.js', '--foo', 'edit', '--tag', 'something', 'todo', 'set', 'title', '--bar', 'banana']
    const expected: Partial<ParsedArgs> = {
      commands: ['edit', 'todo', 'set'],
      allSubCommands: {
        what: 'title',
        newValue: 'banana'
      },
      flags: {
        foo: 'true',
        bar: 'true',
        tag: 'something'
      }
    }
    const commander = new Commander()
    commander
      .command('edit todo set <what> [<newValue>]')
      .option('foo')
      .option('bar')
      .option('tag', true)
      .action(parsed => {
        expect(parsed).to.deep.include(expected)
      })
    commander.parseArgv(commandline)
  })
})
