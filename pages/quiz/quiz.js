const questions = require("../../data/questions")
const stressQuestions = require("../../data/stressQuestions")
const bigFiveQuestions = require("../../data/bigFiveQuestions")
const careerQuestions = require("../../data/careerQuestions")
const { calculateResult, getDimensionBars } = require("../../utils/scoring")
const { calculateStressResult } = require("../../utils/stressScoring")
const { calculateBigFiveResult } = require("../../utils/bigFiveScoring")
const { calculateCareerResult } = require("../../utils/careerScoring")
const { saveLastResult } = require("../../utils/resultStorage")
const { isRewardedUnlockEnabled } = require("../../services/ad")

const testMap = {
  mbti: {
    id: "mbti",
    questionType: "choicePair",
    questions,
    options: [
      { label: "非常偏向 A", value: -2 },
      { label: "比较偏向 A", value: -1 },
      { label: "中立 / 不确定", value: 0 },
      { label: "比较偏向 B", value: 1 },
      { label: "非常偏向 B", value: 2 }
    ]
  },
  stress: {
    id: "stress",
    questionType: "scale",
    questions: stressQuestions,
    options: [
      { label: "几乎没有", value: 0 },
      { label: "偶尔如此", value: 1 },
      { label: "有时如此", value: 2 },
      { label: "经常如此", value: 3 },
      { label: "几乎总是", value: 4 }
    ]
  },
  "big-five": {
    id: "big-five",
    questionType: "scale",
    scalePrompt: "请根据更常见的自己作答",
    questions: bigFiveQuestions,
    options: [
      { label: "非常不同意", value: 0 },
      { label: "比较不同意", value: 1 },
      { label: "不确定", value: 2 },
      { label: "比较同意", value: 3 },
      { label: "非常同意", value: 4 }
    ]
  },
  career: {
    id: "career",
    questionType: "scale",
    scalePrompt: "请根据你更自然的兴趣和偏好作答",
    questions: careerQuestions,
    options: [
      { label: "完全不符合", value: 0 },
      { label: "不太符合", value: 1 },
      { label: "说不清", value: 2 },
      { label: "比较符合", value: 3 },
      { label: "非常符合", value: 4 }
    ]
  }
}

Page({
  data: {
    testId: "mbti",
    questionType: "choicePair",
    scalePrompt: "",
    questions,
    currentIndex: 0,
    total: questions.length,
    progress: 0,
    question: questions[0],
    selected: null,
    autoMoving: false,
    answers: [],
    isLast: false,
    options: testMap.mbti.options
  },

  onLoad(options = {}) {
    const testId = testMap[options.testId] ? options.testId : "mbti"
    const test = testMap[testId]
    this.setData({
      testId,
      questionType: test.questionType,
      scalePrompt: test.scalePrompt || "请根据最近一周的真实感受作答",
      questions: test.questions,
      total: test.questions.length,
      question: test.questions[0],
      options: test.options,
      answers: []
    })

    const app = getApp()
    const draft = app.globalData.quizDraft
    if (draft && draft.testId === testId && Array.isArray(draft.answers)) {
      this.setData({
        answers: draft.answers
      })
      this.syncQuestion(draft.currentIndex || 0)
      return
    }

    this.syncQuestion(0)
  },

  selectOption(event) {
    if (this.data.autoMoving) return

    const value = Number(event.currentTarget.dataset.value)
    const answers = this.data.answers.slice()
    answers[this.data.currentIndex] = value
    this.setData({ selected: value, answers })
    this.saveDraft()

    if (!this.data.isLast) {
      this.setData({ autoMoving: true })
      setTimeout(() => {
        this.syncQuestion(this.data.currentIndex + 1)
        this.setData({ autoMoving: false })
      }, 260)
    }
  },

  prevQuestion() {
    if (this.data.autoMoving) return
    if (this.data.currentIndex === 0) return
    this.syncQuestion(this.data.currentIndex - 1)
  },

  nextQuestion() {
    if (this.data.autoMoving) return
    const { currentIndex, answers, isLast } = this.data
    if (answers[currentIndex] === undefined || answers[currentIndex] === null) {
      wx.showToast({
        title: "先选择一个答案吧",
        icon: "none"
      })
      return
    }

    if (isLast) {
      const result = this.calculateCurrentResult(answers)
      const app = getApp()
      const latestResult = {
        ...result,
        testId: this.data.testId
      }
      app.globalData.quizDraft = null
      app.globalData.latestResult = latestResult
      saveLastResult(latestResult)
      wx.redirectTo({
        url: "/pages/result/result"
      })
      return
    }

    this.syncQuestion(currentIndex + 1)
  },

  syncQuestion(index) {
    const selected = this.data.answers[index]
    const questions = this.data.questions
    this.setData({
      currentIndex: index,
      question: questions[index],
      selected: selected === undefined ? null : selected,
      autoMoving: false,
      progress: Math.round(((index + 1) / questions.length) * 100),
      isLast: index === questions.length - 1
    })
    this.saveDraft()
  },

  saveDraft() {
    const app = getApp()
    app.globalData.quizDraft = {
      testId: this.data.testId,
      currentIndex: this.data.currentIndex,
      answers: this.data.answers.slice(),
      updatedAt: Date.now()
    }
  },

  restartQuiz() {
    if (this.data.autoMoving) return
    const app = getApp()
    app.globalData.quizDraft = null
    this.setData({
      answers: []
    })
    this.syncQuestion(0)
  },

  calculateCurrentResult(answers) {
    if (this.data.testId === "stress") {
      return calculateStressResult(this.data.questions, answers)
    }

    if (this.data.testId === "big-five") {
      return calculateBigFiveResult(this.data.questions, answers)
    }

    if (this.data.testId === "career") {
      return calculateCareerResult(this.data.questions, answers)
    }

    const result = calculateResult(this.data.questions, answers)
    return {
      ...result,
      bars: getDimensionBars(result.scores),
      unlockedFullResult: !isRewardedUnlockEnabled()
    }
  }
})
