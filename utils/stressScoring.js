const stressResults = require("../data/stressResults")
const { isRewardedUnlockEnabled } = require("../services/ad")

const dimensions = [
  { key: "load", name: "压力负荷", lowText: "任务和责任相对可控", highText: "任务、责任或期待有累积感" },
  { key: "emotion", name: "情绪波动", lowText: "情绪整体较容易回稳", highText: "情绪更容易被牵动或消耗" },
  { key: "recovery", name: "恢复缺口", lowText: "仍有可用的恢复资源", highText: "休息、支持和缓冲空间不足" },
  { key: "body", name: "身体信号", lowText: "身体提醒相对温和", highText: "疲惫、紧绷或睡眠专注受影响" }
]

function calculateStressResult(questions, answers) {
  const scores = dimensions.reduce((acc, item) => {
    acc[item.key] = { raw: 0, max: 0 }
    return acc
  }, {})

  questions.forEach((question, index) => {
    const selected = answers[index]
    if (selected === undefined || selected === null) return

    const value = question.reverse ? 4 - selected : selected
    scores[question.dimension].raw += value
    scores[question.dimension].max += 4
  })

  const total = Object.values(scores).reduce((sum, item) => sum + item.raw, 0)
  const maxTotal = Object.values(scores).reduce((sum, item) => sum + item.max, 0)
  const percent = maxTotal === 0 ? 0 : Math.round((total / maxTotal) * 100)
  const type = getStressType(percent)
  const profile = stressResults[type]

  return {
    testId: "stress",
    type,
    typeLabel: profile.label,
    summary: profile.summary,
    scores,
    scorePercent: percent,
    dimensions: getStressDimensions(scores),
    advice: profile.advice,
    advicePlan: profile.plan,
    unlockedFullResult: !isRewardedUnlockEnabled()
  }
}

function getStressType(percent) {
  if (percent >= 72) return "rest"
  if (percent >= 52) return "drained"
  if (percent >= 30) return "tense"
  return "steady"
}

function getStressDimensions(scores) {
  return dimensions.map((item) => {
    const score = scores[item.key] || { raw: 0, max: 0 }
    const percent = score.max === 0 ? 0 : Math.round((score.raw / score.max) * 100)
    return {
      ...item,
      percent,
      level: getDimensionLevel(percent)
    }
  })
}

function getDimensionLevel(percent) {
  if (percent >= 72) return "明显"
  if (percent >= 52) return "偏高"
  if (percent >= 30) return "轻微"
  return "较低"
}

module.exports = {
  calculateStressResult,
  getStressDimensions
}
