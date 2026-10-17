const dimensionMeta = require("../data/bigFiveDimensions")
const { isRewardedUnlockEnabled } = require("../services/ad")

const dimensionKeys = ["openness", "conscientiousness", "extraversion", "agreeableness", "emotionalStability"]

function calculateBigFiveResult(questions, answers) {
  const scores = dimensionKeys.reduce((acc, key) => {
    acc[key] = { raw: 0, max: 0 }
    return acc
  }, {})

  questions.forEach((question, index) => {
    const selected = answers[question.id] !== undefined ? answers[question.id] : answers[index]
    if (selected === undefined || selected === null) return

    const value = question.reverse ? 4 - selected : selected
    scores[question.dimension].raw += value
    scores[question.dimension].max += 4
  })

  const dimensions = dimensionKeys.map((key) => {
    const score = scores[key]
    const percent = score.max === 0 ? 0 : Math.round((score.raw / score.max) * 100)
    return {
      key,
      name: dimensionMeta[key].name,
      percent,
      level: getLevel(percent),
      text: getLevelText(key, percent)
    }
  })

  const top = dimensions.slice().sort((a, b) => b.percent - a.percent)[0]

  return {
    testId: "big-five",
    type: "bigFive",
    typeLabel: "五维人格画像",
    summary: `你的五维画像里，${top.name}相对更突出。它可以帮助你理解自己在探索、执行、社交、合作和情绪调节上的自然倾向。`,
    scores,
    dimensions,
    topDimension: top,
    unlockedFullResult: !isRewardedUnlockEnabled()
  }
}

function getLevel(percent) {
  if (percent >= 68) return "较高"
  if (percent >= 38) return "中等"
  return "较低"
}

function getLevelText(key, percent) {
  const meta = dimensionMeta[key]
  if (percent >= 68) return meta.high
  if (percent >= 38) return meta.mid
  return meta.low
}

module.exports = {
  calculateBigFiveResult
}
