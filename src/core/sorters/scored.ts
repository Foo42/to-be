export function scoredSorterDesc<T> (scoreFunction: (toScore: T) => number) {
  return function sorter (left: T, right: T) {
    return scoreFunction(right) - scoreFunction(left)
  }
}
