const { getLastResult } = require("./utils/resultStorage")

App({
  onLaunch() {
    this.globalData.latestResult = getLastResult()
  },

  globalData: {
    quizDraft: null,
    latestResult: null
  }
})
