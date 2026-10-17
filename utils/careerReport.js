function buildCareerReport(result) {
  const dimensions = Array.isArray(result.dimensions) ? result.dimensions : []
  const topDimension = result.topDimension || dimensions.slice().sort((a, b) => b.percent - a.percent)[0] || null
  const secondDimension = result.secondDimension || dimensions.slice().sort((a, b) => b.percent - a.percent)[1] || null

  return {
    careerTitle: result.typeLabel || (topDimension ? `${topDimension.name}倾向` : "职业兴趣画像"),
    careerSummary: result.summary || "这份结果用于帮助你初步观察职业兴趣方向，不代表固定职业选择。",
    careerDimensions: dimensions,
    careerTopDimension: topDimension,
    careerSecondDimension: secondDimension,
    careerAdviceSections: buildCareerAdviceSections(topDimension, secondDimension, dimensions)
  }
}

function buildCareerAdviceSections(topDimension, secondDimension, dimensions) {
  const lowDimensions = dimensions.filter((item) => item.percent < 38).slice(0, 2)
  const combo = topDimension && secondDimension
    ? `可以优先尝试同时包含“${topDimension.name}”和“${secondDimension.name}”的任务，例如项目、社群、课程、实习或副业中的小实验。`
    : "可以从一个低风险的小项目开始，观察哪些任务让你更愿意投入。"

  return [
    {
      title: "适合优先探索",
      items: topDimension ? [
        `${topDimension.name}较突出，说明这类任务更可能带来自然兴趣和投入感。`,
        combo
      ] : []
    },
    {
      title: "选择环境时",
      items: [
        "不要只看职业名称，更要看每天实际在做什么、和谁协作、如何被评价。",
        "兴趣不是唯一标准，也需要和能力、生活阶段、机会成本一起看。"
      ]
    },
    {
      title: "温和试错",
      items: lowDimensions.length
        ? lowDimensions.map((item) => `${item.name}较低，不代表不能做，只是可能需要更多外部支持或更清楚的边界。`)
        : ["选择一个你愿意了解的方向，先做一次访谈、体验或小作品，而不是马上做重大决定。"]
    }
  ].filter((item) => item.items.length > 0)
}

module.exports = {
  buildCareerReport
}
