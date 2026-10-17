function buildBigFiveReport(result) {
  const dimensions = Array.isArray(result.dimensions) ? result.dimensions : []
  const topDimension = result.topDimension || dimensions.slice().sort((a, b) => b.percent - a.percent)[0]

  return {
    bigFiveTitle: result.typeLabel || "五维人格画像",
    bigFiveSummary: result.summary || "这份结果用于帮助你理解五个常见人格维度上的倾向。",
    bigFiveDimensions: dimensions,
    bigFiveTopDimension: topDimension || null,
    bigFiveAdviceSections: buildAdviceSections(dimensions, topDimension)
  }
}

function buildAdviceSections(dimensions, topDimension) {
  const lowItems = dimensions
    .filter((item) => item.percent < 38)
    .map((item) => `${item.name}较低时，可以用更适合自己的节奏来管理期待，不必强行变成相反的样子。`)

  return [
    {
      title: "理解优势",
      items: topDimension ? [`${topDimension.name}相对突出，说明这部分可能是你更自然的资源。`, "把优势用在合适场景里，会比单纯追求均衡更有效。"] : []
    },
    {
      title: "保持弹性",
      items: ["五维结果不是固定标签，同一个人在不同阶段也会变化。", "你可以把分数看作近期自我观察的起点，而不是结论。"]
    },
    {
      title: "温和练习",
      items: lowItems.length ? lowItems.slice(0, 2) : ["选择一个你想调整的维度，先做一个很小的行为练习。", "记录一周后自己的感受，再决定是否继续。"]
    }
  ]
}

module.exports = {
  buildBigFiveReport
}
