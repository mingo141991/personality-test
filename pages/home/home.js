const results = require("../../data/results")
const stressResults = require("../../data/stressResults")
const tests = require("../../data/tests")
const { getLastResult, getResultHistory } = require("../../utils/resultStorage")
const { isRewardedUnlockEnabled } = require("../../services/ad")

function getTestTitle(testId) {
  const test = tests.find((item) => item.id === testId)
  return test ? test.title : "人格测试"
}

function getResultTitle(result) {
  if (!result) return ""
  if (result.testId === "big-five") return result.typeLabel || "五维人格画像"
  if (result.testId === "career") return result.typeLabel || "职业兴趣画像"
  if (result.testId === "stress") {
    const profile = stressResults[result.type]
    return result.typeLabel || (profile ? profile.label : "压力状态")
  }
  const profile = results[result.type]
  return profile ? `${result.type} · ${profile.nickname}` : result.type
}

function getResultSummary(result) {
  if (!result) return ""
  if (result.testId === "big-five") return result.summary || ""
  if (result.testId === "career") return result.summary || ""
  if (result.testId === "stress") {
    const profile = stressResults[result.type]
    return result.summary || (profile ? profile.summary : "")
  }
  const profile = results[result.type]
  return profile ? profile.summary : ""
}

function getResultStatus(result) {
  if (!result) return ""
  if (!isRewardedUnlockEnabled()) return "完整报告"
  if (["big-five", "stress", "career"].includes(result.testId)) {
    return result.unlockedFullResult ? "已解锁" : "基础版"
  }
  return result.unlockedFullResult ? "已解锁" : "基础版"
}

function getRecommendedTest(tests) {
  return tests.find((item) => item.status === "available" && item.tag === "推荐") ||
    tests.find((item) => item.status === "available") ||
    null
}

Page({
  data: {
    lastResult: null,
    lastProfile: null,
    lastTestTitle: "",
    lastResultTitle: "",
    lastResultSummary: "",
    lastResultStatus: "",
    historyCount: 0,
    tests
  },

  onShow() {
    const lastResult = getLastResult()
    const history = getResultHistory()
    this.setData({
      lastResult,
      lastProfile: lastResult ? results[lastResult.type] : null,
      lastTestTitle: lastResult ? getTestTitle(lastResult.testId) : "",
      lastResultTitle: getResultTitle(lastResult),
      lastResultSummary: getResultSummary(lastResult),
      lastResultStatus: getResultStatus(lastResult),
      historyCount: history.length
    })
  },

  startQuiz() {
    const test = getRecommendedTest(this.data.tests)
    if (!test) {
      wx.showToast({
        title: "暂无可用测试",
        icon: "none"
      })
      return
    }

    wx.navigateTo({
      url: `/pages/quiz/quiz?testId=${test.id}`
    })
  },

  openTest(event) {
    const id = event.currentTarget.dataset.id
    const test = this.data.tests.find((item) => item.id === id)
    if (!test) return

    if (test.status !== "available") {
      wx.showToast({
        title: "这个测试还在准备中",
        icon: "none"
      })
      return
    }

    wx.navigateTo({
      url: `/pages/quiz/quiz?testId=${id}`
    })
  },

  viewLastResult() {
    if (!this.data.lastResult) {
      wx.showToast({
        title: "还没有上次结果",
        icon: "none"
      })
      return
    }

    const app = getApp()
    app.globalData.latestResult = this.data.lastResult
    wx.navigateTo({
      url: "/pages/result/result"
    })
  },

  goAbout() {
    wx.navigateTo({
      url: "/pages/about/about"
    })
  },

  goHistory() {
    wx.navigateTo({
      url: "/pages/history/history"
    })
  },

  onShareAppMessage() {
    return {
      title: "来做一次温柔的人格小测",
      path: "/pages/home/home"
    }
  },

  onShareTimeline() {
    return {
      title: "人格小测：温柔探索人格、状态与职业兴趣"
    }
  }
})
