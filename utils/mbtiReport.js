const results = require("../data/results")
const typeVisuals = require("../data/typeVisuals")
const dimensionInsights = require("../data/dimensionInsights")
const typeAdvice = require("../data/typeAdvice")

function buildMbtiReport(result) {
  const profile = results[result.type]
  if (!profile) return null

  const visual = typeVisuals[result.type]
  const advice = typeAdvice[result.type]

  return {
    profile,
    visual,
    dimensionReport: buildDimensionReport(result.bars),
    advice,
    adviceSections: buildAdviceSections(advice),
    details: buildDetails(profile)
  }
}

function buildDetails(profile) {
  return [
    { title: "核心特征", items: profile.traits },
    { title: "优势", items: profile.strengths },
    { title: "可能盲点", items: profile.blindSpots },
    { title: "成长建议", items: profile.growth },
    { title: "相处建议", items: profile.relating }
  ]
}

function buildAdviceSections(advice) {
  if (!advice) return []

  return [
    { title: "适合的环境", items: advice.environment },
    { title: "协作建议", items: advice.collaboration },
    { title: "压力信号", items: advice.stress },
    { title: "成长练习", items: advice.practice }
  ]
}

function buildDimensionReport(bars) {
  if (!Array.isArray(bars)) return []

  return bars.map((bar) => {
    const insight = dimensionInsights[bar.key]
    const winnerPercent = bar.winner === bar.left ? bar.leftPercent : bar.rightPercent
    return {
      ...bar,
      title: insight.title,
      leftName: insight.leftName,
      rightName: insight.rightName,
      leftMeaning: insight.leftMeaning,
      rightMeaning: insight.rightMeaning,
      winnerPercent,
      strength: getStrengthText(winnerPercent),
      insight: insight[bar.winner]
    }
  })
}

function getStrengthText(percent) {
  if (percent >= 75) return "非常明显"
  if (percent >= 62) return "比较明显"
  if (percent >= 55) return "略微偏向"
  return "接近平衡"
}

module.exports = {
  buildMbtiReport,
  buildDetails,
  buildAdviceSections,
  buildDimensionReport,
  getStrengthText
}
