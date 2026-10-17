const dimensionMeta = require("../data/careerDimensions")
const { isRewardedUnlockEnabled } = require("../services/ad")

const dimensionKeys = ["creative", "analytical", "practical", "social", "enterprising", "structured"]

function calculateCareerResult(questions, answers) {
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
      shortName: dimensionMeta[key].shortName,
      percent,
      level: getLevel(percent),
      text: getLevelText(key, percent),
      color: dimensionMeta[key].color
    }
  })

  const sorted = dimensions.slice().sort((a, b) => b.percent - a.percent)
  const top = sorted[0]
  const second = sorted[1]

  return {
    testId: "career",
    type: top ? top.key : "creative",
    typeLabel: top ? `${top.name}倾向` : "职业兴趣画像",
    summary: buildSummary(top, second),
    scores,
    dimensions,
    topDimension: top || null,
    secondDimension: second || null,
    unlockedFullResult: !isRewardedUnlockEnabled()
  }
}

function buildSummary(top, second) {
  if (!top) return "这份结果用于帮助你初步观察职业兴趣方向，不代表固定职业选择。"
  if (!second) return `你的职业兴趣里，${top.name}相对更突出。它可以作为探索工作内容和环境偏好的起点。`
  return `你的职业兴趣里，${top.name}相对更突出，${second.name}也有一定支持。你可以优先关注同时包含这两类元素的工作内容。`
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
  calculateCareerResult
}
