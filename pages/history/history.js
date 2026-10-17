const results = require("../../data/results")
const stressResults = require("../../data/stressResults")
const tests = require("../../data/tests")
const { getResultHistory, getHistoryRecord, clearResultHistory } = require("../../utils/resultStorage")
const { isRewardedUnlockEnabled } = require("../../services/ad")

function getTestTitle(testId) {
  const test = tests.find((item) => item.id === testId)
  return test ? test.title : "人格测试"
}

function getTestShortTitle(testId) {
  if (testId === "mbti") return "MBTI"
  if (testId === "big-five") return "大五"
  if (testId === "stress") return "压力"
  if (testId === "career") return "职业"

  const test = tests.find((item) => item.id === testId)
  return test ? test.title.replace("测试", "").replace("小测", "") : "其他"
}

function getResultTitle(result) {
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
  if (!isRewardedUnlockEnabled()) return "完整报告"
  if (["big-five", "stress", "career"].includes(result.testId)) {
    return result.unlockedFullResult ? "已解锁" : "基础版"
  }
  return result.unlockedFullResult ? "已解锁" : "基础版"
}

Page({
  data: {
    history: [],
    visibleHistory: [],
    filterTabs: [],
    activeFilter: "all"
  },

  onShow() {
    this.loadHistory()
  },

  loadHistory() {
    const history = getResultHistory().map((item) => ({
      ...item,
      testTitle: getTestTitle(item.testId),
      testShortTitle: getTestShortTitle(item.testId),
      resultTitle: getResultTitle(item),
      resultSummary: getResultSummary(item),
      resultStatus: getResultStatus(item),
      nickname: results[item.type] ? results[item.type].nickname : "",
      summary: results[item.type] ? results[item.type].summary : "",
      savedTimeText: this.formatTime(item.savedAt)
    }))
    const filterTabs = this.createFilterTabs(history)
    const activeFilter = filterTabs.some((item) => item.id === this.data.activeFilter)
      ? this.data.activeFilter
      : "all"
    this.setData({
      history,
      filterTabs: this.markActiveFilter(filterTabs, activeFilter),
      activeFilter,
      visibleHistory: this.filterHistory(history, activeFilter)
    })
  },

  createFilterTabs(history) {
    const counts = history.reduce((map, item) => {
      const testId = item.testId || "mbti"
      map[testId] = (map[testId] || 0) + 1
      return map
    }, {})

    const tabs = Object.keys(counts).map((testId) => ({
      id: testId,
      label: getTestShortTitle(testId),
      count: counts[testId]
    }))

    return [
      {
        id: "all",
        label: "全部",
        count: history.length
      },
      ...tabs
    ]
  },

  markActiveFilter(filterTabs, activeFilter) {
    return filterTabs.map((item) => ({
      ...item,
      active: item.id === activeFilter
    }))
  },

  filterHistory(history, activeFilter) {
    if (activeFilter === "all") return history
    return history.filter((item) => item.testId === activeFilter)
  },

  changeFilter(event) {
    const activeFilter = event.currentTarget.dataset.id || "all"
    this.setData({
      activeFilter,
      filterTabs: this.markActiveFilter(this.data.filterTabs, activeFilter),
      visibleHistory: this.filterHistory(this.data.history, activeFilter)
    })
  },

  formatTime(timestamp) {
    if (!timestamp) return ""

    const date = new Date(timestamp)
    const month = this.pad(date.getMonth() + 1)
    const day = this.pad(date.getDate())
    const hour = this.pad(date.getHours())
    const minute = this.pad(date.getMinutes())
    return `${month}-${day} ${hour}:${minute}`
  },

  pad(value) {
    return String(value).padStart(2, "0")
  },

  openRecord(event) {
    const id = event.currentTarget.dataset.id
    const record = getHistoryRecord(id)
    if (!record) {
      wx.showToast({
        title: "记录不存在",
        icon: "none"
      })
      this.loadHistory()
      return
    }

    const app = getApp()
    app.globalData.latestResult = record
    wx.navigateTo({
      url: "/pages/result/result"
    })
  },

  clearHistory() {
    wx.showModal({
      title: "清空历史记录",
      content: "清空后将无法在本机回看之前的结果。",
      confirmText: "清空",
      confirmColor: "#c68873",
      success: (res) => {
        if (!res.confirm) return
        const app = getApp()
        app.globalData.latestResult = null
        clearResultHistory()
        this.setData({
          history: [],
          visibleHistory: [],
          filterTabs: [],
          activeFilter: "all"
        })
      }
    })
  },

  goQuiz() {
    wx.navigateTo({
      url: "/pages/quiz/quiz"
    })
  },

  onShareAppMessage() {
    return {
      title: "来做一次温柔的人格小测",
      path: "/pages/home/home"
    }
  }
})
