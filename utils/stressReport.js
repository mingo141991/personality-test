const stressResults = require("../data/stressResults")

function buildStressReport(result) {
  const profile = stressResults[result.type]

  return {
    stressLevel: result.typeLabel || (profile ? profile.label : "压力状态"),
    stressSummary: result.summary || (profile ? profile.summary : "这条结果用于帮助你温和觉察近期压力状态。"),
    stressPercent: result.scorePercent || 0,
    stressDimensions: Array.isArray(result.dimensions) ? result.dimensions : [],
    stressAdvice: Array.isArray(result.advice) ? result.advice : profile ? profile.advice : [],
    stressAdviceSections: buildStressAdviceSections(result.advicePlan || (profile ? profile.plan : null))
  }
}

function buildStressAdviceSections(plan = {}) {
  return [
    { title: "现在可以做", items: plan.now || [] },
    { title: "接下来 24 小时", items: plan.day || [] },
    { title: "接下来一周", items: plan.week || [] },
    { title: "何时寻求支持", items: plan.support || [] }
  ].filter((item) => item.items.length > 0)
}

module.exports = {
  buildStressReport,
  buildStressAdviceSections
}
