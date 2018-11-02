export function scoreDueDate (dueDate?: Date): number {
  if (dueDate === undefined) {
    return 1
  }
  const factor = 1 / 2
  const factorLifeInDays = 7
  const dayInMs = 60000 * 60 * 24
  const timeRemaining = dueDate.getTime() - Date.now()
  const daysRemaining = Math.floor(timeRemaining / dayInMs)
  return Math.pow(factor, (daysRemaining / factorLifeInDays)) + 1
}
