const roleMap = {
  analyst: {
    roleCode: "NT",
    roleName: "分析者",
    theme: "theme-analyst"
  },
  diplomat: {
    roleCode: "NF",
    roleName: "理想者",
    theme: "theme-diplomat"
  },
  sentinel: {
    roleCode: "SJ",
    roleName: "守护者",
    theme: "theme-sentinel"
  },
  explorer: {
    roleCode: "SP",
    roleName: "探索者",
    theme: "theme-explorer"
  }
}

const typeVisuals = {
  INTJ: {
    ...roleMap.analyst,
    archetype: "星图规划师",
    visualNote: "像在安静处展开一张长远地图，先看结构，再决定路径。"
  },
  INTP: {
    ...roleMap.analyst,
    archetype: "概念研究员",
    visualNote: "习惯把问题拆开重组，在好奇心里寻找更清楚的解释。"
  },
  ENTJ: {
    ...roleMap.analyst,
    archetype: "远航指挥者",
    visualNote: "看见目标后，会自然地整合资源，把想法推向现实。"
  },
  ENTP: {
    ...roleMap.analyst,
    archetype: "灵感辩手",
    visualNote: "喜欢让观点碰撞出新火花，也擅长从缝隙里找到机会。"
  },
  INFJ: {
    ...roleMap.diplomat,
    archetype: "月光洞察者",
    visualNote: "常在安静观察中看见关系深处的线索和没有说出口的感受。"
  },
  INFP: {
    ...roleMap.diplomat,
    archetype: "心愿收藏家",
    visualNote: "把真实、意义和想象力放在心里，慢慢寻找值得投入的方向。"
  },
  ENFJ: {
    ...roleMap.diplomat,
    archetype: "暖光引路人",
    visualNote: "擅长看见人的潜力，也愿意用鼓励把大家带向更好的地方。"
  },
  ENFP: {
    ...roleMap.diplomat,
    archetype: "风中点灯者",
    visualNote: "被可能性点亮，也容易把热情和连接感传递给身边的人。"
  },
  ISTJ: {
    ...roleMap.sentinel,
    archetype: "秩序记录员",
    visualNote: "重视稳定和承诺，像认真整理每一页生活记录的人。"
  },
  ISFJ: {
    ...roleMap.sentinel,
    archetype: "安稳守护人",
    visualNote: "用细致和可靠照顾身边的人，也珍惜熟悉关系里的安心感。"
  },
  ESTJ: {
    ...roleMap.sentinel,
    archetype: "节奏统筹者",
    visualNote: "擅长把混乱变成安排，把目标变成清楚可执行的步骤。"
  },
  ESFJ: {
    ...roleMap.sentinel,
    archetype: "氛围照料者",
    visualNote: "善于照看关系和秩序，让场面更温暖，也让协作更顺畅。"
  },
  ISTP: {
    ...roleMap.explorer,
    archetype: "现场修理师",
    visualNote: "面对真实问题时冷静而灵活，喜欢用行动验证答案。"
  },
  ISFP: {
    ...roleMap.explorer,
    archetype: "自由感受者",
    visualNote: "跟随真实体验和审美直觉，温和地保留自己的节奏。"
  },
  ESTP: {
    ...roleMap.explorer,
    archetype: "即兴行动家",
    visualNote: "在变化现场保持敏锐，常能快速抓住机会并直接行动。"
  },
  ESFP: {
    ...roleMap.explorer,
    archetype: "明亮表演者",
    visualNote: "重视当下的真实和快乐，也容易把轻松气氛带给别人。"
  }
}

module.exports = typeVisuals
