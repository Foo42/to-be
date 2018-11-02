export function scaleScore (score: number, weight: number): number {
  return ((score - 1) * weight) + 1
}
