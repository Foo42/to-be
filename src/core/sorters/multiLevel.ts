import { Sorter } from '../tree'

export function multiLevelSorter<T> (sorters: Array<Sorter<T>>): Sorter<T> {
  return (a: T, b: T): number => {
    for (let index = 0; index < sorters.length; index++) {
      const sorter = sorters[index]
      const sorterResult = sorter(a, b)
      if (sorterResult !== 0) {
        return sorterResult
      }
    }
    return 0
  }
}
