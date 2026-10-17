const dimensions = [
  { key: "EI", left: "E", right: "I", tie: "I" },
  { key: "SN", left: "S", right: "N", tie: "N" },
  { key: "TF", left: "T", right: "F", tie: "F" },
  { key: "JP", left: "J", right: "P", tie: "P" }
]

function createEmptyScores() {
  return dimensions.reduce((acc, item) => {
    acc[item.key] = { left: 0, right: 0 }
    return acc
  }, {})
}

function calculateResult(questions, answers) {
  const scores = createEmptyScores()

  questions.forEach((question, index) => {
    const selected = answers[index]
    if (selected === undefined || selected === null) return

    const points = Math.abs(selected)
    if (selected < 0) {
      scores[question.dimension].left += points
    } else if (selected > 0) {
      scores[question.dimension].right += points
    }
  })

  const type = dimensions.map((item) => {
    const score = scores[item.key]
    if (score.left === score.right) return item.tie
    return score.left > score.right ? item.left : item.right
  }).join("")

  return { type, scores }
}

function getDimensionBars(scores) {
  return dimensions.map((item) => {
    const score = scores[item.key]
    const total = score.left + score.right
    const leftPercent = total === 0 ? 50 : Math.round((score.left / total) * 100)
    const rightPercent = 100 - leftPercent
    const winner = score.left === score.right ? item.tie : score.left > score.right ? item.left : item.right
    return {
      key: item.key,
      left: item.left,
      right: item.right,
      leftPercent,
      rightPercent,
      winner
    }
  })
}

module.exports = {
  calculateResult,
  getDimensionBars
}
