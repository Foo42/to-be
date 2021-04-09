export type Sorter<T> = (left: T, right: T) => number
export function sortBy<RequiredForSortingT> (sorter: Sorter<RequiredForSortingT>) {
  return {
    sort<ToSortT extends RequiredForSortingT> (left: ToSortT, right: ToSortT): number {
      return sorter(left, right)
    },
    thenBy<AdditionalSortingRequirementT> (furtherSorter: Sorter<AdditionalSortingRequirementT>) {
      type CompositSortingRequirmentT = RequiredForSortingT & AdditionalSortingRequirementT
      const compositSorter = (left: CompositSortingRequirmentT, right: CompositSortingRequirmentT) => sorter(left, right) || furtherSorter(left, right)
      return sortBy<CompositSortingRequirmentT>(compositSorter)
    }
  }
}
