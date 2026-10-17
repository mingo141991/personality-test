const LAST_RESULT_KEY = "personalityMiniapp:lastResult"
const RESULT_HISTORY_KEY = "personalityMiniapp:resultHistory"
const MAX_HISTORY_COUNT = 20
const DEFAULT_TEST_ID = "mbti"

function getLastResult() {
  try {
    const result = wx.getStorageSync(LAST_RESULT_KEY) || null
    return normalizeResult(result)
  } catch (error) {
    return null
  }
}

function saveLastResult(result) {
  if (!result) return

  try {
    const record = normalizeResult(result)
    wx.setStorageSync(LAST_RESULT_KEY, record)
    saveHistoryRecord(record)
  } catch (error) {
    wx.showToast({
      title: "结果暂时保存失败",
      icon: "none"
    })
  }
}

function getResultHistory() {
  try {
    const history = wx.getStorageSync(RESULT_HISTORY_KEY)
    if (!Array.isArray(history)) return []

    const normalizedHistory = history
      .map((item, index) => normalizeResult(item, index))
      .filter(Boolean)

    if (needsHistoryMigration(history, normalizedHistory)) {
      wx.setStorageSync(RESULT_HISTORY_KEY, normalizedHistory)
    }

    return normalizedHistory
  } catch (error) {
    return []
  }
}

function getHistoryRecord(id) {
  return getResultHistory().find((item) => item.id === id) || null
}

function saveHistoryRecord(result) {
  const history = getResultHistory()
  const record = normalizeResult(result)
  if (!record) return

  const nextHistory = [
    record,
    ...history.filter((item) => item.id !== record.id)
  ].slice(0, MAX_HISTORY_COUNT)

  wx.setStorageSync(RESULT_HISTORY_KEY, nextHistory)
}

function clearResultHistory() {
  try {
    wx.removeStorageSync(RESULT_HISTORY_KEY)
    wx.removeStorageSync(LAST_RESULT_KEY)
  } catch (error) {
    wx.showToast({
      title: "清空失败，请稍后再试",
      icon: "none"
    })
  }
}

function createResultId() {
  return `r_${Date.now()}_${Math.floor(Math.random() * 100000)}`
}

function normalizeResult(result, index = 0) {
  if (!result) return null
  const testId = result.testId || DEFAULT_TEST_ID
  const savedAt = result.savedAt || 0

  return {
    ...result,
    testId,
    id: result.id || `r_${testId}_${result.type || "unknown"}_${savedAt || index}`,
    savedAt: savedAt || Date.now()
  }
}

function needsHistoryMigration(originalHistory, normalizedHistory) {
  if (originalHistory.length !== normalizedHistory.length) return true
  return originalHistory.some((item, index) => {
    const normalized = normalizedHistory[index]
    return !item || !item.id || !item.testId || !item.savedAt || item.id !== normalized.id
  })
}

module.exports = {
  getLastResult,
  saveLastResult,
  getResultHistory,
  getHistoryRecord,
  clearResultHistory
}
