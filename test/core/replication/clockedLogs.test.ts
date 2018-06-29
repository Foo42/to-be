import { mergeLogs, ClockedLog, ConflictResolutionFunc, ClockedValue } from '../../../src/core/replication/clockedLog'
import { expect } from 'chai'
import { sortBy } from 'lodash'

describe('clockedLogs', () => {
  describe('mergeLogs', () => {
    it('should produce an empty log from 2 empty logs', () => {
      const merged = mergeLogs([],[])
      expect(merged).to.deep.equal([])
    })

    it('should return values one log if the other is empty', () => {
      const logWithContent: ClockedLog<string> = [
        { value: 'first words', clock: { a: 1 } },
        { value: 'second words', clock: { a: 2 } }
      ]
      const merged = mergeLogs([], logWithContent)
      expect(merged).to.deep.equal(logWithContent)
    })

    it('should interleve values from both logs when all values are orderable', () => {
      const alicesLog: ClockedLog<string> = [
        { value: 'hello bob, how are you', clock: { alice: 1 } },
        { value: 'rover is fine thanks', clock: { alice: 2, bob: 1 } }
      ]
      const bobsLog: ClockedLog<string> = [
        { value: 'hello alice, I am well, how is your dog', clock: { alice: 1, bob: 1 } }
      ]
      const merged = mergeLogs(alicesLog, bobsLog)
      const resultingConversation = merged.map(item => item.value)
      expect(resultingConversation).to.deep.equal([
        'hello bob, how are you',
        'hello alice, I am well, how is your dog',
        'rover is fine thanks'
      ])
    })

    it('should pass conflicting values to the conflict resolution function and insert any results it supplies', () => {
      const alphabetiveValueResolver: ConflictResolutionFunc<string> = (conflicting: ClockedValue<string>[]) => {
        const sorted = sortBy(conflicting, ['value'])
        return sorted
      }
      const alicesLog: ClockedLog<string> = [
        { value: 'hello bob, how are you', clock: { alice: 1 } },
        { value: 'rover is fine thanks', clock: { alice: 2, bob: 1 } }
      ]
      const bobsLog: ClockedLog<string> = [
        { value: 'hello alice, I am well, how is your dog', clock: { alice: 1, bob: 1 } },
        { value: 'alice? are you still there?', clock: { alice: 1, bob: 2 } }
      ]
      const merged = mergeLogs(alicesLog, bobsLog, alphabetiveValueResolver)
      const resultingConversation = merged.map(item => item.value)
      expect(resultingConversation).to.deep.equal([
        'hello bob, how are you',
        'hello alice, I am well, how is your dog',
        'alice? are you still there?',
        'rover is fine thanks'
      ])

    })
  })
})
