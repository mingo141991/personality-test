const tests = require("../../data/tests")
const { buildMbtiReport } = require("../../utils/mbtiReport")
const { buildStressReport } = require("../../utils/stressReport")
const { buildBigFiveReport } = require("../../utils/bigFiveReport")
const { buildCareerReport } = require("../../utils/careerReport")
const { isRewardedUnlockEnabled, isRealRewardedVideoReady, showRewardedVideo, getMockDuration } = require("../../services/ad")
const { getLastResult, saveLastResult } = require("../../utils/resultStorage")
const posterConfig = require("../../config/poster")

Page({
  data: {
    result: null,
    reportKind: "mbti",
    isUnlockable: true,
    unlockEnabled: isRewardedUnlockEnabled(),
    testTitle: "",
    profile: null,
    visual: null,
    dimensionReport: [],
    advice: null,
    adviceSections: [],
    details: [],
    stressLevel: "",
    stressSummary: "",
    stressPercent: 0,
    stressDimensions: [],
    stressAdvice: [],
    stressAdviceSections: [],
    bigFiveTitle: "",
    bigFiveSummary: "",
    bigFiveDimensions: [],
    bigFiveTopDimension: null,
    bigFiveAdviceSections: [],
    careerTitle: "",
    careerSummary: "",
    careerDimensions: [],
    careerTopDimension: null,
    careerSecondDimension: null,
    careerAdviceSections: [],
    showUnlockModal: false,
    mockWatching: false,
    countdown: getMockDuration(),
    unlockMode: "mock",
    unlockLoading: false,
    posterPath: "",
    posterGenerating: false
  },

  countdownTimer: null,

  onLoad() {
    const app = getApp()
    const result = this.normalizeResultUnlockState(app.globalData.latestResult || getLastResult())
    if (!result) return
    app.globalData.latestResult = result

    const viewModel = this.buildResultViewModel(result)
    this.setData({
      result,
      unlockEnabled: isRewardedUnlockEnabled(),
      ...viewModel
    })
  },

  normalizeResultUnlockState(result) {
    if (!result || isRewardedUnlockEnabled()) return result
    return {
      ...result,
      unlockedFullResult: true
    }
  },

  onUnload() {
    this.clearCountdown()
  },

  onShareAppMessage() {
    const share = this.buildShareInfo()
    return {
      title: share.title,
      path: "/pages/home/home"
    }
  },

  onShareTimeline() {
    const share = this.buildShareInfo()
    return {
      title: share.title
    }
  },

  buildResultViewModel(result) {
    const test = tests.find((item) => item.id === result.testId)
    const reportKind = ["mbti", "stress", "big-five", "career"].includes(result.testId) ? result.testId : "generic"
    const base = {
      reportKind,
      isUnlockable: reportKind !== "generic",
      testTitle: test ? test.title : "人格测试",
      profile: null,
      visual: null,
      dimensionReport: [],
      advice: null,
      adviceSections: [],
      details: [],
      stressLevel: "",
      stressSummary: "",
      stressPercent: 0,
      stressDimensions: [],
      stressAdvice: [],
      stressAdviceSections: [],
      bigFiveTitle: "",
      bigFiveSummary: "",
      bigFiveDimensions: [],
      bigFiveTopDimension: null,
      bigFiveAdviceSections: [],
      careerTitle: "",
      careerSummary: "",
      careerDimensions: [],
      careerTopDimension: null,
      careerSecondDimension: null,
      careerAdviceSections: []
    }

    if (result.testId === "stress") {
      return {
        ...base,
        ...buildStressReport(result)
      }
    }

    if (result.testId === "big-five") {
      return {
        ...base,
        ...buildBigFiveReport(result)
      }
    }

    if (result.testId === "career") {
      return {
        ...base,
        ...buildCareerReport(result)
      }
    }

    if (result.testId !== "mbti") return base

    const mbtiReport = buildMbtiReport(result)
    if (!mbtiReport) return { ...base, reportKind: "generic" }

    return {
      ...base,
      ...mbtiReport
    }
  },

  buildShareInfo() {
    const { result, profile, visual, testTitle, reportKind, stressLevel, stressSummary, bigFiveTitle, bigFiveSummary, careerTitle, careerSummary } = this.data
    const unlocked = !isRewardedUnlockEnabled() || (result && result.unlockedFullResult)
    if (reportKind === "stress" && result) {
      return {
        title: `我的情绪压力小测结果是 ${stressLevel}`,
        text: unlocked
          ? `我的「${testTitle}」结果是：${stressLevel}。${stressSummary} 详细解析已解锁，包含压力维度和恢复建议。结果仅供自我了解和状态觉察参考，不构成心理诊断。`
          : `我的「${testTitle}」基础结果是：${stressLevel}。${stressSummary} 详细解析需要解锁后查看。`
      }
    }

    if (reportKind === "big-five" && result) {
      return {
        title: `我的大五人格测试结果是 ${bigFiveTitle}`,
        text: unlocked
          ? `我的「${testTitle}」结果是：${bigFiveTitle}。${bigFiveSummary} 详细解析已解锁，包含五维画像和理解建议。结果仅供自我了解参考。`
          : `我的「${testTitle}」基础结果是：${bigFiveTitle}。${bigFiveSummary} 详细解析需要解锁后查看。`
      }
    }

    if (reportKind === "career" && result) {
      return {
        title: `我的职业兴趣探索结果是 ${careerTitle}`,
        text: unlocked
          ? `我的「${testTitle}」结果是：${careerTitle}。${careerSummary} 详细解析已解锁，包含兴趣维度和探索建议。结果仅供职业兴趣探索参考，不代表固定选择。`
          : `我的「${testTitle}」基础结果是：${careerTitle}。${careerSummary} 详细解析需要解锁后查看。`
      }
    }

    if (!result || !profile) {
      return {
        title: "来做一次温柔的人格小测",
        text: `我在「人格小测」完成了${testTitle || "一次人格测试"}，来看看你的结果吧。`
      }
    }

    const roleText = visual ? `${visual.roleCode} · ${visual.roleName}` : "四维人格倾向"
    return {
      title: `我的人格小测结果是 ${result.type} · ${profile.nickname}`,
      text: unlocked
        ? `我的人格小测结果是 ${result.type} · ${profile.nickname}（${roleText}）。${profile.summary} 详细解析已解锁，包含四维报告和个性化建议。测试结果仅供自我了解和娱乐参考。`
        : `我的人格小测基础结果是 ${result.type} · ${profile.nickname}（${roleText}）。${profile.summary} 详细解析需要解锁后查看。`
    }
  },

  copyShareText() {
    if (this.needsUnlockForDetailedShare()) {
      this.promptUnlockForShare()
      return
    }

    const share = this.buildShareInfo()
    wx.setClipboardData({
      data: share.text,
      success() {
        wx.showToast({
          title: "结果文案已复制",
          icon: "none"
        })
      }
    })
  },

  generatePoster() {
    if (this.data.posterGenerating || !this.data.result) return
    if (this.needsUnlockForDetailedShare()) {
      this.promptUnlockForShare()
      return
    }

    this.setData({ posterGenerating: true })
    const ctx = wx.createCanvasContext("resultPoster", this)
    if (this.data.reportKind === "stress") {
      this.drawStressPoster(ctx)
    } else if (this.data.reportKind === "big-five") {
      this.drawBigFivePoster(ctx)
    } else if (this.data.reportKind === "career") {
      this.drawCareerPoster(ctx)
    } else {
      if (!this.data.profile) {
        this.setData({ posterGenerating: false })
        return
      }
      this.drawPoster(ctx)
    }
    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: "resultPoster",
          width: 375,
          height: 500,
          destWidth: 750,
          destHeight: 1000,
          success: (res) => {
            this.setData({
              posterPath: res.tempFilePath,
              posterGenerating: false
            })
          },
          fail: () => {
            this.setData({ posterGenerating: false })
            wx.showToast({
              title: "生成失败，请稍后再试",
              icon: "none"
            })
          }
        }, this)
      }, 160)
    })
  },

  needsUnlockForDetailedShare() {
    return Boolean(isRewardedUnlockEnabled() && this.data.isUnlockable && this.data.result && !this.data.result.unlockedFullResult)
  },

  promptUnlockForShare() {
    wx.showToast({
      title: "先解锁详细解析",
      icon: "none"
    })
    this.openUnlockModal()
  },

  drawPoster(ctx) {
    const { result, profile, visual, dimensionReport } = this.data
    const theme = this.getPosterTheme(visual ? visual.roleCode : "")

    ctx.setFillStyle("#fbf7f0")
    ctx.fillRect(0, 0, 375, 500)

    this.drawRoundRect(ctx, 18, 18, 339, 464, 22, "#fffaf2")
    this.drawRoundRect(ctx, 34, 36, 307, 158, 18, theme.soft)

    ctx.setFillStyle(theme.main)
    ctx.setFontSize(13)
    ctx.setTextAlign("left")
    ctx.fillText("人格小测 · MBTI 风格人格倾向", 48, 62)

    ctx.setFillStyle("#2f3430")
    ctx.setFontSize(44)
    ctx.fillText(result.type, 48, 112)

    ctx.setFillStyle("#2f3430")
    ctx.setFontSize(20)
    ctx.fillText(profile.nickname, 48, 145)

    ctx.setFillStyle(theme.main)
    ctx.setFontSize(12)
    ctx.fillText(`${visual.roleCode} · ${visual.roleName} · ${visual.archetype}`, 48, 170)

    this.drawPosterAvatar(ctx, 252, 66, theme, result.type)

    ctx.setFillStyle("#667066")
    ctx.setFontSize(14)
    this.wrapPosterText(ctx, profile.summary, 42, 226, 292, 24, 3)

    ctx.setFillStyle("#5f7d66")
    ctx.setFontSize(17)
    ctx.fillText("四维倾向", 42, 310)

    const bars = Array.isArray(dimensionReport) ? dimensionReport : []
    bars.forEach((item, index) => {
      const y = 330 + index * 27
      const winnerPercent = item.winner === item.left ? item.leftPercent : item.rightPercent
      ctx.setFillStyle("#6b746b")
      ctx.setFontSize(12)
      ctx.fillText(`${item.title} ${item.winner} · ${item.strength}`, 42, y)

      this.drawRoundRect(ctx, 42, y + 5, 244, 7, 4, "#efe5da")
      const barWidth = Math.max(8, Math.round(244 * winnerPercent / 100))
      const barX = item.winner === item.left ? 42 : 42 + 244 - barWidth
      this.drawRoundRect(ctx, barX, y + 5, barWidth, 7, 4, theme.main)

      ctx.setFillStyle("#9b8f86")
      ctx.setFontSize(11)
      ctx.setTextAlign("right")
      ctx.fillText(`${winnerPercent}%`, 322, y + 1)
      ctx.setTextAlign("left")
    })

    this.drawPosterFooter(ctx, theme, "结果仅供自我了解和娱乐参考，不构成心理诊断。")
  },

  drawStressPoster(ctx) {
    const { stressLevel, stressSummary, stressPercent, stressDimensions } = this.data
    const theme = this.getStressPosterTheme(stressPercent)

    ctx.setFillStyle("#fbf7f0")
    ctx.fillRect(0, 0, 375, 500)

    this.drawRoundRect(ctx, 18, 18, 339, 464, 22, "#fffaf2")
    this.drawRoundRect(ctx, 34, 36, 307, 160, 18, theme.soft)

    ctx.setFillStyle(theme.main)
    ctx.setFontSize(13)
    ctx.setTextAlign("left")
    ctx.fillText("人格小测 · 情绪压力小测", 48, 62)

    ctx.setFillStyle(theme.main)
    ctx.setFontSize(58)
    ctx.fillText(String(stressPercent), 48, 124)

    ctx.setFillStyle("#9b8f86")
    ctx.setFontSize(13)
    ctx.fillText("压力指数", 122, 121)

    ctx.setFillStyle("#2f3430")
    ctx.setFontSize(22)
    ctx.fillText(stressLevel, 48, 158)

    this.drawStressPosterSymbol(ctx, 260, 70, theme)

    ctx.setFillStyle("#667066")
    ctx.setFontSize(14)
    this.wrapPosterText(ctx, stressSummary, 42, 226, 292, 24, 3)

    ctx.setFillStyle("#5f7d66")
    ctx.setFontSize(17)
    ctx.fillText("压力维度", 42, 310)

    const dimensions = Array.isArray(stressDimensions) ? stressDimensions : []
    dimensions.forEach((item, index) => {
      const y = 330 + index * 27
      ctx.setFillStyle("#6b746b")
      ctx.setFontSize(12)
      ctx.fillText(`${item.name} · ${item.level}`, 42, y)

      this.drawRoundRect(ctx, 42, y + 5, 244, 7, 4, "#efe5da")
      this.drawRoundRect(ctx, 42, y + 5, Math.max(8, Math.round(244 * item.percent / 100)), 7, 4, theme.main)

      ctx.setFillStyle("#9b8f86")
      ctx.setFontSize(11)
      ctx.setTextAlign("right")
      ctx.fillText(`${item.percent}%`, 322, y + 1)
      ctx.setTextAlign("left")
    })

    this.drawPosterFooter(ctx, theme, "结果仅供自我了解和状态觉察参考，不构成心理诊断。")
  },

  drawBigFivePoster(ctx) {
    const { bigFiveTitle, bigFiveSummary, bigFiveDimensions, bigFiveTopDimension } = this.data
    const theme = { main: "#7a9ab0", deep: "#5c7f96", soft: "#e6f0f5" }

    ctx.setFillStyle("#fbf7f0")
    ctx.fillRect(0, 0, 375, 500)

    this.drawRoundRect(ctx, 18, 18, 339, 464, 22, "#fffaf2")
    this.drawRoundRect(ctx, 34, 36, 307, 150, 18, theme.soft)

    ctx.setFillStyle(theme.main)
    ctx.setFontSize(13)
    ctx.setTextAlign("left")
    ctx.fillText("人格小测 · 大五人格测试", 48, 62)

    ctx.setFillStyle("#2f3430")
    ctx.setFontSize(24)
    ctx.fillText(bigFiveTitle || "五维人格画像", 48, 108)

    ctx.setFillStyle(theme.main)
    ctx.setFontSize(13)
    const topText = bigFiveTopDimension ? `突出维度：${bigFiveTopDimension.name} ${bigFiveTopDimension.percent}%` : "五维特质倾向"
    ctx.fillText(topText, 48, 142)

    this.drawRoundRect(ctx, 270, 72, 42, 82, 20, theme.main)
    this.drawRoundRect(ctx, 250, 96, 42, 58, 20, "#6f9a7b")
    this.drawRoundRect(ctx, 290, 108, 42, 46, 20, "#c99a58")

    ctx.setFillStyle("#667066")
    ctx.setFontSize(14)
    this.wrapPosterText(ctx, bigFiveSummary, 42, 220, 292, 24, 3)

    ctx.setFillStyle("#5f7d66")
    ctx.setFontSize(17)
    ctx.fillText("五维得分", 42, 304)

    const dimensions = Array.isArray(bigFiveDimensions) ? bigFiveDimensions : []
    dimensions.forEach((item, index) => {
      const y = 322 + index * 23
      ctx.setFillStyle("#6b746b")
      ctx.setFontSize(12)
      ctx.fillText(`${item.name} · ${item.level}`, 42, y)

      this.drawRoundRect(ctx, 42, y + 4, 244, 6, 4, "#efe5da")
      this.drawRoundRect(ctx, 42, y + 4, Math.max(8, Math.round(244 * item.percent / 100)), 6, 4, theme.main)

      ctx.setFillStyle("#9b8f86")
      ctx.setFontSize(11)
      ctx.setTextAlign("right")
      ctx.fillText(`${item.percent}%`, 322, y + 1)
      ctx.setTextAlign("left")
    })

    this.drawPosterFooter(ctx, theme, "结果仅供自我了解参考，不构成心理诊断。")
  },

  drawCareerPoster(ctx) {
    const { careerTitle, careerSummary, careerDimensions, careerTopDimension, careerSecondDimension } = this.data
    const theme = { main: "#c99a58", deep: "#9b7440", soft: "#f6ead8" }

    ctx.setFillStyle("#fbf7f0")
    ctx.fillRect(0, 0, 375, 500)

    this.drawRoundRect(ctx, 18, 18, 339, 464, 22, "#fffaf2")
    this.drawRoundRect(ctx, 34, 36, 307, 150, 18, theme.soft)

    ctx.setFillStyle(theme.main)
    ctx.setFontSize(13)
    ctx.setTextAlign("left")
    ctx.fillText("人格小测 · 职业兴趣探索", 48, 62)

    ctx.setFillStyle("#2f3430")
    ctx.setFontSize(24)
    ctx.fillText(careerTitle || "职业兴趣画像", 48, 108)

    ctx.setFillStyle(theme.main)
    ctx.setFontSize(13)
    const secondText = careerSecondDimension ? `辅助线索：${careerSecondDimension.name}` : "兴趣方向观察"
    ctx.fillText(secondText, 48, 142)

    this.drawCareerPosterSymbol(ctx, 258, 72, theme)

    ctx.setFillStyle("#667066")
    ctx.setFontSize(14)
    this.wrapPosterText(ctx, careerSummary, 42, 220, 292, 24, 3)

    ctx.setFillStyle("#5f7d66")
    ctx.setFontSize(17)
    ctx.fillText("兴趣维度", 42, 304)

    const dimensions = Array.isArray(careerDimensions) ? careerDimensions : []
    dimensions.forEach((item, index) => {
      const y = 318 + index * 20
      ctx.setFillStyle(item.key === (careerTopDimension && careerTopDimension.key) ? theme.deep : "#6b746b")
      ctx.setFontSize(11)
      ctx.fillText(`${item.shortName || item.name} · ${item.level}`, 42, y)

      this.drawRoundRect(ctx, 42, y + 4, 244, 5, 3, "#efe5da")
      this.drawRoundRect(ctx, 42, y + 4, Math.max(8, Math.round(244 * item.percent / 100)), 5, 3, item.color || theme.main)

      ctx.setFillStyle("#9b8f86")
      ctx.setFontSize(10)
      ctx.setTextAlign("right")
      ctx.fillText(`${item.percent}%`, 322, y + 1)
      ctx.setTextAlign("left")
    })

    this.drawPosterFooter(ctx, theme, "结果仅供职业兴趣探索参考，不代表固定选择。")
  },

  drawPosterFooter(ctx, theme, disclaimer) {
    const codeX = 42
    const codeY = 430
    const codeSize = 48

    this.drawRoundRect(ctx, codeX, codeY, codeSize, codeSize, 12, "#ffffff")
    const hasMiniProgramCode = posterConfig.miniProgramCode.enabled && posterConfig.miniProgramCode.imagePath
    if (hasMiniProgramCode) {
      ctx.drawImage(posterConfig.miniProgramCode.imagePath, codeX, codeY, codeSize, codeSize)
    } else {
      this.drawPlaceholderMiniCode(ctx, codeX, codeY, codeSize, theme)
    }

    ctx.setTextAlign("left")
    ctx.setFillStyle(theme.deep || theme.main)
    ctx.setFontSize(11)
    ctx.fillText(hasMiniProgramCode ? "长按识别小程序" : "小程序码待配置", 102, 446)

    ctx.setFillStyle("#9b8f86")
    ctx.setFontSize(9)
    this.wrapPosterText(ctx, disclaimer, 102, 464, 224, 13, 2)
  },

  drawPlaceholderMiniCode(ctx, x, y, size, theme) {
    this.drawRoundRect(ctx, x + 6, y + 6, 16, 16, 4, theme.main)
    this.drawRoundRect(ctx, x + size - 22, y + 6, 16, 16, 4, theme.deep || theme.main)
    this.drawRoundRect(ctx, x + 6, y + size - 22, 16, 16, 4, theme.deep || theme.main)
    this.drawRoundRect(ctx, x + 27, y + 27, 14, 14, 4, theme.main)
    this.drawRoundRect(ctx, x + 28, y + 8, 6, 18, 3, "#efe5da")
    this.drawRoundRect(ctx, x + 34, y + 34, 10, 6, 3, "#efe5da")
  },

  drawCareerPosterSymbol(ctx, x, y, theme) {
    this.drawRoundRect(ctx, x - 20, y - 4, 76, 86, 24, "#fffaf2")
    this.drawRoundRect(ctx, x, y + 32, 38, 42, 12, theme.main)
    this.drawRoundRect(ctx, x - 10, y + 44, 58, 12, 6, theme.deep)
    this.drawRoundRect(ctx, x + 8, y + 12, 22, 22, 11, "#f3cbb5")
    ctx.setFillStyle(theme.deep)
    ctx.beginPath()
    ctx.arc(x + 19, y + 20, 18, Math.PI, Math.PI * 2)
    ctx.fill()
    this.drawRoundRect(ctx, x + 18, y - 2, 30, 8, 4, "#7a9ab0")
    this.drawRoundRect(ctx, x + 42, y + 2, 8, 30, 4, "#7a9ab0")
  },

  getStressPosterTheme(percent) {
    if (percent >= 72) return { main: "#c68873", deep: "#9b6f63", soft: "#f7e8df" }
    if (percent >= 52) return { main: "#c99a58", deep: "#9b7440", soft: "#f6ead8" }
    if (percent >= 30) return { main: "#7a9ab0", deep: "#5c7f96", soft: "#e6f0f5" }
    return { main: "#6f9a7b", deep: "#52785c", soft: "#e7f3ea" }
  },

  drawStressPosterSymbol(ctx, x, y, theme) {
    this.drawRoundRect(ctx, x - 24, y - 8, 82, 92, 28, "#fffaf2")
    ctx.setFillStyle(theme.main)
    ctx.beginPath()
    ctx.arc(x + 17, y + 34, 28, 0, Math.PI * 2)
    ctx.fill()

    ctx.setFillStyle("#ffffff")
    ctx.beginPath()
    ctx.arc(x + 7, y + 28, 4, 0, Math.PI * 2)
    ctx.arc(x + 27, y + 28, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.setStrokeStyle("#ffffff")
    ctx.setLineWidth(3)
    ctx.beginPath()
    ctx.arc(x + 17, y + 40, 12, 0.15 * Math.PI, 0.85 * Math.PI)
    ctx.stroke()

    this.drawRoundRect(ctx, x - 8, y + 69, 50, 10, 5, theme.deep)
  },

  getPosterTheme(roleCode) {
    const themes = {
      NT: { main: "#7b72a8", deep: "#5a5188", soft: "#ebe7f7" },
      NF: { main: "#6f9a7b", deep: "#52785c", soft: "#e7f3ea" },
      SJ: { main: "#7a9ab0", deep: "#5c7f96", soft: "#e6f0f5" },
      SP: { main: "#c99a58", deep: "#9b7440", soft: "#f6ead8" }
    }
    return themes[roleCode] || themes.NF
  },

  drawPosterAvatar(ctx, x, y, theme, type) {
    const config = this.getPosterAvatarConfig(type)

    this.drawRoundRect(ctx, x - 20, y + 5, 96, 102, 30, "#fffaf2")

    ctx.setFillStyle(theme.soft)
    ctx.beginPath()
    ctx.arc(x + 28, y + 53, 47, 0, Math.PI * 2)
    ctx.fill()

    this.drawPosterAvatarAura(ctx, x, y, theme, config)
    if (config.cape) {
      this.drawRoundRect(ctx, x + 4, y + 78, 56, 36, 16, theme.deep)
    }
    this.drawRoundRect(ctx, x + 5, y + 64, 50, 54, 18, theme.main)
    this.drawRoundRect(ctx, x - 3, y + 74, 18, 38, 9, theme.deep)
    this.drawRoundRect(ctx, x + 43, y + 74, 18, 38, 9, theme.deep)
    this.drawRoundRect(ctx, x + 18, y + 93, 24, 9, 5, config.accent)
    this.drawRoundRect(ctx, x, y + 20, 54, 44, 20, "#f3cbb5")
    this.drawPosterAvatarHair(ctx, x, y, config)

    ctx.setFillStyle("#4d4642")
    ctx.beginPath()
    ctx.arc(x + 17, y + 45, 2, 0, Math.PI * 2)
    ctx.arc(x + 37, y + 45, 2, 0, Math.PI * 2)
    ctx.fill()

    this.drawPosterAvatarProp(ctx, x, y, theme, config)
  },

  getPosterAvatarConfig(type) {
    const configs = {
      INTJ: { hair: "sharp", prop: "orbit", accent: "#d7cfef", cape: true },
      INTP: { hair: "soft", prop: "lens", accent: "#d7cfef" },
      ENTJ: { hair: "crest", prop: "flag", accent: "#d7cfef", cape: true },
      ENTP: { hair: "messy", prop: "spark", accent: "#d7cfef" },
      INFJ: { hair: "veil", prop: "moon", accent: "#cde8d3", cape: true },
      INFP: { hair: "soft", prop: "leaf", accent: "#cde8d3" },
      ENFJ: { hair: "crest", prop: "torch", accent: "#cde8d3", cape: true },
      ENFP: { hair: "wave", prop: "spark", accent: "#cde8d3" },
      ISTJ: { hair: "neat", prop: "book", accent: "#d5e5ed" },
      ISFJ: { hair: "veil", prop: "shield", accent: "#d5e5ed" },
      ESTJ: { hair: "crest", prop: "flag", accent: "#d5e5ed", cape: true },
      ESFJ: { hair: "wave", prop: "leaf", accent: "#d5e5ed" },
      ISTP: { hair: "short", prop: "tool", accent: "#f1dfbf" },
      ISFP: { hair: "soft", prop: "brush", accent: "#f1dfbf" },
      ESTP: { hair: "short", prop: "bolt", accent: "#f1dfbf", cape: true },
      ESFP: { hair: "wave", prop: "spark", accent: "#f1dfbf" }
    }
    return configs[type] || configs.INFP
  },

  drawPosterAvatarAura(ctx, x, y, theme, config) {
    ctx.setFillStyle(config.accent)
    ctx.beginPath()
    ctx.arc(x + 2, y + 26, 5, 0, Math.PI * 2)
    ctx.arc(x + 68, y + 35, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.setStrokeStyle(theme.main)
    ctx.setLineWidth(2)
    ctx.beginPath()
    ctx.arc(x + 28, y + 54, 38, -0.15 * Math.PI, 0.82 * Math.PI)
    ctx.stroke()
  },

  drawPosterAvatarHair(ctx, x, y, config) {
    const hairColor = ["wave", "soft", "veil"].includes(config.hair) ? "#74594f" : "#514845"
    ctx.setFillStyle(hairColor)

    if (config.hair === "sharp") {
      this.drawRoundRect(ctx, x - 4, y + 12, 62, 24, 9, hairColor)
      this.drawRoundRect(ctx, x - 8, y + 26, 20, 26, 9, hairColor)
      return
    }

    if (config.hair === "crest") {
      this.drawRoundRect(ctx, x - 2, y + 11, 58, 22, 11, hairColor)
      this.drawRoundRect(ctx, x + 30, y + 5, 20, 20, 9, hairColor)
      return
    }

    if (config.hair === "messy") {
      this.drawRoundRect(ctx, x - 5, y + 13, 60, 23, 11, hairColor)
      this.drawRoundRect(ctx, x + 8, y + 4, 16, 22, 8, hairColor)
      this.drawRoundRect(ctx, x + 36, y + 8, 14, 20, 7, hairColor)
      return
    }

    if (config.hair === "wave") {
      this.drawRoundRect(ctx, x - 6, y + 12, 64, 28, 14, hairColor)
      this.drawRoundRect(ctx, x - 7, y + 35, 18, 26, 9, hairColor)
      this.drawRoundRect(ctx, x + 43, y + 34, 18, 24, 9, hairColor)
      return
    }

    if (config.hair === "veil") {
      this.drawRoundRect(ctx, x - 8, y + 12, 66, 56, 22, hairColor)
      this.drawRoundRect(ctx, x + 0, y + 20, 54, 42, 18, "#f3cbb5")
      return
    }

    if (config.hair === "short") {
      this.drawRoundRect(ctx, x - 2, y + 14, 58, 20, 10, hairColor)
      this.drawRoundRect(ctx, x + 42, y + 26, 12, 20, 6, hairColor)
      return
    }

    if (config.hair === "neat") {
      this.drawRoundRect(ctx, x - 3, y + 13, 60, 22, 10, hairColor)
      this.drawRoundRect(ctx, x - 5, y + 28, 13, 20, 6, hairColor)
      return
    }

    this.drawRoundRect(ctx, x - 5, y + 12, 62, 26, 13, hairColor)
    this.drawRoundRect(ctx, x - 6, y + 32, 16, 22, 8, hairColor)
  },

  drawPosterAvatarProp(ctx, x, y, theme, config) {
    const px = x + 65
    const py = y + 36
    ctx.setStrokeStyle(theme.deep)
    ctx.setLineWidth(3)
    ctx.setFillStyle(theme.main)

    if (config.prop === "orbit") {
      ctx.beginPath()
      ctx.arc(px - 10, py + 12, 17, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(px + 7, py + 5, 4, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    if (config.prop === "lens") {
      ctx.beginPath()
      ctx.arc(px - 8, py + 12, 12, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(px + 1, py + 22)
      ctx.lineTo(px + 16, py + 36)
      ctx.stroke()
      return
    }

    if (config.prop === "flag") {
      this.drawRoundRect(ctx, px - 14, py - 2, 8, 44, 4, theme.deep)
      this.drawRoundRect(ctx, px - 6, py + 2, 34, 20, 5, theme.main)
      return
    }

    if (config.prop === "spark") {
      ctx.beginPath()
      ctx.arc(px, py + 14, 6, 0, Math.PI * 2)
      ctx.arc(px + 18, py + 28, 4, 0, Math.PI * 2)
      ctx.arc(px - 18, py + 30, 3, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    if (config.prop === "moon") {
      ctx.beginPath()
      ctx.arc(px, py + 15, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.setFillStyle("#fffaf2")
      ctx.beginPath()
      ctx.arc(px + 7, py + 11, 15, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    if (config.prop === "leaf") {
      this.drawRoundRect(ctx, px - 18, py + 12, 34, 16, 8, theme.main)
      this.drawRoundRect(ctx, px + 2, py, 26, 13, 7, config.accent)
      return
    }

    if (config.prop === "torch") {
      this.drawRoundRect(ctx, px - 4, py + 18, 8, 28, 4, theme.deep)
      ctx.beginPath()
      ctx.arc(px, py + 12, 12, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    if (config.prop === "book") {
      this.drawRoundRect(ctx, px - 24, py + 18, 42, 24, 5, theme.main)
      this.drawRoundRect(ctx, px - 3, py + 20, 3, 20, 2, theme.deep)
      return
    }

    if (config.prop === "shield") {
      this.drawRoundRect(ctx, px - 18, py + 10, 32, 36, 10, theme.main)
      this.drawRoundRect(ctx, px - 10, py + 18, 16, 16, 8, config.accent)
      return
    }

    if (config.prop === "tool") {
      ctx.beginPath()
      ctx.moveTo(px - 18, py + 38)
      ctx.lineTo(px + 18, py + 2)
      ctx.stroke()
      this.drawRoundRect(ctx, px + 10, py - 2, 18, 8, 4, theme.main)
      return
    }

    if (config.prop === "brush") {
      ctx.beginPath()
      ctx.moveTo(px - 14, py + 38)
      ctx.lineTo(px + 12, py + 6)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(px + 16, py + 3, 8, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    if (config.prop === "bolt") {
      ctx.beginPath()
      ctx.moveTo(px + 2, py)
      ctx.lineTo(px - 14, py + 24)
      ctx.lineTo(px, py + 22)
      ctx.lineTo(px - 8, py + 44)
      ctx.lineTo(px + 18, py + 14)
      ctx.lineTo(px + 4, py + 16)
      ctx.closePath()
      ctx.fill()
    }
  },

  drawRoundRect(ctx, x, y, width, height, radius, color) {
    ctx.setFillStyle(color)
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.fill()
  },

  wrapPosterText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const chars = String(text || "").split("")
    let line = ""
    let lineCount = 0

    for (let index = 0; index < chars.length; index += 1) {
      const testLine = line + chars[index]
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lineCount += 1
        if (lineCount >= maxLines) {
          ctx.fillText(`${line.slice(0, Math.max(0, line.length - 1))}...`, x, y)
          return
        }
        ctx.fillText(line, x, y)
        line = chars[index]
        y += lineHeight
      } else {
        line = testLine
      }
    }

    if (line) ctx.fillText(line, x, y)
  },

  previewPoster() {
    if (!this.data.posterPath) return
    wx.previewImage({
      urls: [this.data.posterPath],
      current: this.data.posterPath
    })
  },

  savePoster() {
    if (!this.data.posterPath) return
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterPath,
      success() {
        wx.showToast({
          title: "已保存到相册",
          icon: "none"
        })
      },
      fail() {
        wx.showToast({
          title: "保存失败，请检查相册权限",
          icon: "none"
        })
      }
    })
  },

  closePoster() {
    this.setData({ posterPath: "" })
  },

  openUnlockModal() {
    this.setData({
      showUnlockModal: true,
      mockWatching: false,
      countdown: getMockDuration(),
      unlockMode: isRealRewardedVideoReady() ? "real" : "mock",
      unlockLoading: false
    })
  },

  closeUnlockModal() {
    this.clearCountdown()
    this.setData({
      showUnlockModal: false,
      mockWatching: false,
      countdown: getMockDuration(),
      unlockLoading: false
    })
  },

  startUnlockAd() {
    if (this.data.unlockLoading) return

    if (!isRealRewardedVideoReady()) {
      this.setData({ mockWatching: true, countdown: getMockDuration(), unlockLoading: true })
      this.tickCountdown()
      return
    }

    this.setData({ unlockLoading: true })
    showRewardedVideo()
      .then((res) => {
        this.setData({ unlockLoading: false })
        if (res.completed) {
          this.unlockFullResult()
          return
        }
        wx.showToast({
          title: "完整观看后才可解锁",
          icon: "none"
        })
      })
      .catch(() => {
        this.setData({ unlockLoading: false })
        wx.showToast({
          title: "广告暂时不可用，请稍后再试",
          icon: "none"
        })
      })
  },

  watchMockAd() {
    this.startUnlockAd()
  },

  unlockFullResult() {
    const app = getApp()
    const result = { ...this.data.result, unlockedFullResult: true }
    app.globalData.latestResult = result
    saveLastResult(result)
    this.clearCountdown()
    this.setData({
      result,
      showUnlockModal: false,
      mockWatching: false,
      countdown: getMockDuration(),
      unlockLoading: false
    })
    wx.showToast({
      title: "已解锁完整解析",
      icon: "none"
    })
  },

  tickCountdown() {
    if (this.data.countdown <= 1) {
      this.unlockFullResult()
      return
    }

    this.countdownTimer = setTimeout(() => {
      this.setData({ countdown: this.data.countdown - 1 })
      this.tickCountdown()
    }, 1000)
  },

  clearCountdown() {
    if (!this.countdownTimer) return
    clearTimeout(this.countdownTimer)
    this.countdownTimer = null
  },

  restart() {
    const app = getApp()
    const testId = this.data.result && this.data.result.testId ? this.data.result.testId : "mbti"
    app.globalData.latestResult = null
    app.globalData.quizDraft = null
    wx.redirectTo({
      url: `/pages/quiz/quiz?testId=${testId}`
    })
  },

  goHome() {
    wx.reLaunch({
      url: "/pages/home/home"
    })
  },

  goHistory() {
    wx.navigateTo({
      url: "/pages/history/history"
    })
  }
})
