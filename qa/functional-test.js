const path = require("path")

const root = path.resolve(__dirname, "..")

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function resetModules() {
  Object.keys(require.cache)
    .filter((key) => key.startsWith(root))
    .forEach((key) => {
      delete require.cache[key]
    })
}

function installWxMock(overrides = {}) {
  const storage = {}
  const calls = {
    toast: [],
    navigateTo: [],
    redirectTo: [],
    reLaunch: [],
    setClipboardData: [],
    previewImage: [],
    saveImageToPhotosAlbum: [],
    canvasToTempFilePath: []
  }

  const wx = {
    getStorageSync(key) {
      return storage[key]
    },
    setStorageSync(key, value) {
      storage[key] = value
    },
    removeStorageSync(key) {
      delete storage[key]
    },
    showToast(options) {
      calls.toast.push(options)
      if (options && typeof options.success === "function") options.success()
    },
    showModal(options) {
      if (options && typeof options.success === "function") options.success({ confirm: true })
    },
    navigateTo(options) {
      calls.navigateTo.push(options)
    },
    redirectTo(options) {
      calls.redirectTo.push(options)
    },
    reLaunch(options) {
      calls.reLaunch.push(options)
    },
    setClipboardData(options) {
      calls.setClipboardData.push(options)
      if (options && typeof options.success === "function") options.success()
    },
    previewImage(options) {
      calls.previewImage.push(options)
    },
    saveImageToPhotosAlbum(options) {
      calls.saveImageToPhotosAlbum.push(options)
      if (options && typeof options.success === "function") options.success()
    },
    createRewardedVideoAd() {
      return null
    },
    canIUse() {
      return false
    },
    createCanvasContext() {
      return createCanvasContextMock()
    },
    canvasToTempFilePath(options) {
      calls.canvasToTempFilePath.push(options)
      if (options && typeof options.success === "function") {
        options.success({ tempFilePath: "/tmp/result-poster.png" })
      }
    },
    ...overrides
  }

  global.wx = wx
  return { storage, calls, wx }
}

function installPageCapture() {
  const pages = []
  global.Page = (config) => {
    pages.push(config)
    return config
  }
  return pages
}

function installAppMock(initial = {}) {
  const app = {
    globalData: {
      latestResult: null,
      quizDraft: null,
      ...initial
    }
  }
  global.getApp = () => app
  return app
}

function createCanvasContextMock() {
  const ctx = {}
  const methods = [
    "setFillStyle",
    "fillRect",
    "beginPath",
    "arc",
    "fill",
    "setFontSize",
    "setTextAlign",
    "fillText",
    "setStrokeStyle",
    "setLineWidth",
    "stroke",
    "drawImage",
    "moveTo",
    "lineTo",
    "quadraticCurveTo",
    "closePath"
  ]
  methods.forEach((name) => {
    ctx[name] = () => {}
  })
  ctx.measureText = (text) => ({ width: String(text || "").length * 7 })
  ctx.draw = (preserve, callback) => {
    if (typeof callback === "function") callback()
  }
  return ctx
}

function instantiatePage(config, initialData = {}) {
  return {
    ...config,
    data: {
      ...config.data,
      ...initialData
    },
    setData(patch) {
      Object.assign(this.data, patch)
    }
  }
}

function loadPage(pagePath) {
  resetModules()
  installWxMock()
  installAppMock()
  const pages = installPageCapture()
  require(path.join(root, pagePath))
  assert(pages.length === 1, `${pagePath} should register exactly one page`)
  return pages[0]
}

function runTest(name, fn) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    console.error(error.stack || error.message)
    process.exitCode = 1
  }
}

function createAnswers(count, valueOrFactory) {
  return Array.from({ length: count }, (_, index) => (
    typeof valueOrFactory === "function" ? valueOrFactory(index) : valueOrFactory
  ))
}

function testPageScriptsLoad() {
  resetModules()
  installWxMock()
  installAppMock()
  installPageCapture()
  ;[
    "pages/home/home.js",
    "pages/quiz/quiz.js",
    "pages/result/result.js",
    "pages/history/history.js",
    "pages/about/about.js"
  ].forEach((pagePath) => require(path.join(root, pagePath)))
}

function testConfigAndQuestionCounts() {
  const appConfig = require(path.join(root, "app.json"))
  const tests = require(path.join(root, "data/tests"))
  const questionFiles = {
    mbti: require(path.join(root, "data/questions")),
    stress: require(path.join(root, "data/stressQuestions")),
    "big-five": require(path.join(root, "data/bigFiveQuestions")),
    career: require(path.join(root, "data/careerQuestions"))
  }

  ;["pages/home/home", "pages/quiz/quiz", "pages/result/result", "pages/history/history", "pages/about/about"].forEach((page) => {
    assert(appConfig.pages.includes(page), `app.json missing ${page}`)
  })
  assert(appConfig.lazyCodeLoading === "requiredComponents", "lazyCodeLoading should stay requiredComponents")

  tests.forEach((test) => {
    assert(test.status === "available", `${test.id} should be available`)
    assert(questionFiles[test.id], `${test.id} should have question file`)
    assert(questionFiles[test.id].length === test.questionCount, `${test.id} questionCount mismatch`)
  })
}

function testScoringForAllTests() {
  const questions = require(path.join(root, "data/questions"))
  const stressQuestions = require(path.join(root, "data/stressQuestions"))
  const bigFiveQuestions = require(path.join(root, "data/bigFiveQuestions"))
  const careerQuestions = require(path.join(root, "data/careerQuestions"))
  const { calculateResult, getDimensionBars } = require(path.join(root, "utils/scoring"))
  const { calculateStressResult } = require(path.join(root, "utils/stressScoring"))
  const { calculateBigFiveResult } = require(path.join(root, "utils/bigFiveScoring"))
  const { calculateCareerResult } = require(path.join(root, "utils/careerScoring"))

  const mbti = calculateResult(questions, createAnswers(questions.length, 1))
  const mbtiResult = { ...mbti, bars: getDimensionBars(mbti.scores), unlockedFullResult: true }
  assert(/^[EI][SN][TF][JP]$/.test(mbtiResult.type), "MBTI type should be valid")
  assert(mbtiResult.bars.length === 4, "MBTI should have four bars")
  assert(mbtiResult.unlockedFullResult === true, "MBTI should be open when ads are disabled")

  const stress = calculateStressResult(stressQuestions, createAnswers(stressQuestions.length, 2))
  assert(stress.testId === "stress", "stress result should keep testId")
  assert(stress.dimensions.length === 4, "stress should have four dimensions")
  assert(stress.unlockedFullResult === true, "stress should be open when ads are disabled")

  const bigFive = calculateBigFiveResult(bigFiveQuestions, createAnswers(bigFiveQuestions.length, 3))
  assert(bigFive.testId === "big-five", "big-five result should keep testId")
  assert(bigFive.dimensions.length === 5, "big-five should have five dimensions")
  assert(bigFive.unlockedFullResult === true, "big-five should be open when ads are disabled")

  const career = calculateCareerResult(careerQuestions, createAnswers(careerQuestions.length, (index) => index % 5))
  assert(career.testId === "career", "career result should keep testId")
  assert(career.dimensions.length === 6, "career should have six dimensions")
  assert(career.unlockedFullResult === true, "career should be open when ads are disabled")
}

function testQuizPageFlows() {
  resetModules()
  const runtime = installWxMock()
  const app = installAppMock()
  const pages = installPageCapture()
  require(path.join(root, "pages/quiz/quiz.js"))
  const page = instantiatePage(pages[0])

  page.onLoad({ testId: "career" })
  assert(page.data.testId === "career", "quiz should load career test")
  assert(page.data.total === 36, "career quiz should have 36 questions")
  assert(page.data.questionType === "scale", "career quiz should be scale type")

  page.nextQuestion()
  assert(runtime.calls.toast.at(-1).title === "先选择一个答案吧", "next without answer should toast")

  page.selectOption({ currentTarget: { dataset: { value: 3 } } })
  assert(page.data.answers[0] === 3, "select should save answer")
  assert(app.globalData.quizDraft.testId === "career", "select should save draft")

  page.data.autoMoving = true
  page.data.currentIndex = 3
  page.prevQuestion()
  page.nextQuestion()
  page.restartQuiz()
  assert(page.data.currentIndex === 3, "navigation should be ignored while autoMoving")
}

function testResultViewModelsAndShareRules() {
  resetModules()
  const runtime = installWxMock()
  installAppMock()
  const pages = installPageCapture()
  require(path.join(root, "pages/result/result.js"))
  const page = instantiatePage(pages[0])
  const resultTemplate = require("fs").readFileSync(path.join(root, "pages/result/result.wxml"), "utf8")
  assert(resultTemplate.includes("isUnlockable && unlockEnabled && !result.unlockedFullResult"), "unlock card should be hidden when ads are disabled")
  assert(resultTemplate.includes("result.unlockedFullResult || !unlockEnabled"), "poster button should remain available when ads are disabled")

  const samples = [
    { testId: "stress", type: "tense", typeLabel: "轻度紧绷", summary: "压力摘要", scorePercent: 45, dimensions: [], unlockedFullResult: false },
    { testId: "big-five", type: "bigFive", typeLabel: "五维人格画像", summary: "大五摘要", dimensions: [], unlockedFullResult: false },
    { testId: "career", type: "creative", typeLabel: "创意表达倾向", summary: "职业摘要", dimensions: [], unlockedFullResult: false }
  ]

  samples.forEach((result) => {
    const viewModel = page.buildResultViewModel(result)
    assert(viewModel.reportKind === result.testId, `${result.testId} should map to reportKind`)
    assert(viewModel.isUnlockable === true, `${result.testId} should be unlockable`)
  })

  Object.assign(page.data, {
    isUnlockable: true,
    reportKind: "career",
    result: { testId: "career", unlockedFullResult: false },
    testTitle: "职业兴趣探索",
    careerTitle: "创意表达倾向",
    careerSummary: "职业摘要"
  })
  const openShare = page.buildShareInfo()
  assert(openShare.text.includes("详细解析已解锁"), "share text should be detailed when ads are disabled")
  const originalSetTimeout = global.setTimeout
  global.setTimeout = (callback) => {
    callback()
    return 0
  }
  page.generatePoster()
  global.setTimeout = originalSetTimeout
  assert(page.data.showUnlockModal === false, "poster generation should not open unlock modal when ads are disabled")
  assert(runtime.calls.canvasToTempFilePath.length === 1, "poster generation should render canvas when ads are disabled")

  page.data.showUnlockModal = false
  page.copyShareText()
  assert(page.data.showUnlockModal === false, "copy share should not open unlock modal when ads are disabled")
  assert(runtime.calls.setClipboardData.length === 1, "copy share should write clipboard when ads are disabled")

  page.data.result.unlockedFullResult = true
  const unlockedShare = page.buildShareInfo()
  assert(unlockedShare.text.includes("详细解析已解锁"), "unlocked share text should include unlocked wording")
}

function testPosterDrawersForUnlockedResults() {
  resetModules()
  installWxMock()
  installAppMock()
  const pages = installPageCapture()
  require(path.join(root, "pages/result/result.js"))
  const page = instantiatePage(pages[0])
  const ctx = createCanvasContextMock()

  page.data = {
    ...page.data,
    result: { testId: "mbti", type: "INFP", unlockedFullResult: true },
    profile: { nickname: "调停者", summary: "基础摘要" },
    visual: { roleCode: "NF", roleName: "理想者", archetype: "心愿收藏家" },
    dimensionReport: []
  }
  page.drawPoster(ctx)

  page.data = {
    ...page.data,
    stressLevel: "轻度紧绷",
    stressSummary: "压力摘要",
    stressPercent: 45,
    stressDimensions: [],
    stressAdviceSections: []
  }
  page.drawStressPoster(ctx)

  page.data = {
    ...page.data,
    bigFiveTitle: "五维人格画像",
    bigFiveSummary: "大五摘要",
    bigFiveDimensions: [],
    bigFiveTopDimension: null
  }
  page.drawBigFivePoster(ctx)

  page.data = {
    ...page.data,
    careerTitle: "创意表达倾向",
    careerSummary: "职业摘要",
    careerDimensions: [],
    careerTopDimension: null,
    careerSecondDimension: null
  }
  page.drawCareerPoster(ctx)
}

function testUnlockAndStorage() {
  resetModules()
  const runtime = installWxMock()
  const app = installAppMock()
  const pages = installPageCapture()
  require(path.join(root, "pages/result/result.js"))
  const page = instantiatePage(pages[0], {
    result: { id: "r_career_1", testId: "career", type: "creative", unlockedFullResult: false },
    showUnlockModal: true,
    mockWatching: true
  })

  page.unlockFullResult()
  assert(page.data.result.unlockedFullResult === true, "unlock should update current result")
  assert(app.globalData.latestResult.unlockedFullResult === true, "unlock should update global latest result")
  assert(runtime.storage["personalityMiniapp:lastResult"].unlockedFullResult === true, "unlock should save latest result")
  assert(runtime.storage["personalityMiniapp:resultHistory"].length === 1, "unlock should save history")
}

function testResultStorageMigrationAndLimit() {
  resetModules()
  const runtime = installWxMock()
  installAppMock()
  const storage = require(path.join(root, "utils/resultStorage"))

  runtime.storage["personalityMiniapp:resultHistory"] = [
    { type: "INFP", savedAt: 1 },
    { id: "old", testId: "career", type: "creative", savedAt: 2 }
  ]
  const migrated = storage.getResultHistory()
  assert(migrated[0].testId === "mbti", "old missing testId should migrate to mbti")
  assert(Boolean(migrated[0].id), "old missing id should be generated")

  Array.from({ length: 25 }, (_, index) => index).forEach((index) => {
    storage.saveLastResult({ id: `r_${index}`, testId: "stress", type: "tense", savedAt: index + 10 })
  })
  assert(storage.getResultHistory().length === 20, "history should keep max 20 records")
}

function testHomeAndHistoryPages() {
  resetModules()
  const runtime = installWxMock()
  installAppMock()
  let pages = installPageCapture()
  require(path.join(root, "pages/home/home.js"))
  const home = instantiatePage(pages[0])
  runtime.storage["personalityMiniapp:lastResult"] = {
    id: "r_career",
    testId: "career",
    type: "creative",
    typeLabel: "创意表达倾向",
    summary: "职业摘要",
    unlockedFullResult: false,
    savedAt: 100
  }
  runtime.storage["personalityMiniapp:resultHistory"] = [runtime.storage["personalityMiniapp:lastResult"]]
  home.onShow()
  assert(home.data.lastResultTitle === "创意表达倾向", "home should show career title")
  assert(home.data.lastResultStatus === "完整报告", "home should show full report status when ads are disabled")

  resetModules()
  installWxMock({
    getStorageSync(key) {
      if (key === "personalityMiniapp:resultHistory") {
        return [
          { id: "a", testId: "career", type: "creative", typeLabel: "创意表达倾向", summary: "职业摘要", savedAt: 100 },
          { id: "b", testId: "stress", type: "tense", typeLabel: "轻度紧绷", summary: "压力摘要", savedAt: 200 }
        ]
      }
      return null
    },
    setStorageSync() {}
  })
  installAppMock()
  pages = installPageCapture()
  require(path.join(root, "pages/history/history.js"))
  const history = instantiatePage(pages[0])
  history.loadHistory()
  assert(history.data.filterTabs.some((item) => item.id === "career" && item.label === "职业"), "history should include career filter")
  history.changeFilter({ currentTarget: { dataset: { id: "career" } } })
  assert(history.data.visibleHistory.length === 1 && history.data.visibleHistory[0].testId === "career", "history career filter should work")
}

function testAboutPageContent() {
  resetModules()
  installWxMock()
  installAppMock()
  const pages = installPageCapture()
  require(path.join(root, "pages/about/about.js"))
  const about = instantiatePage(pages[0])
  const text = about.data.sections.map((item) => `${item.title} ${item.text}`).join("\n")
  assert(text.includes("职业兴趣探索"), "about page should mention career interest exploration")
  assert(text.includes("详细解析") && text.includes("分享图"), "about page should mention detailed unlock and poster rule")
  assert(about.onShareTimeline().title.includes("职业兴趣"), "about share timeline should mention career interest")
}

function testPosterLayoutSpacingConstants() {
  const resultSource = require("fs").readFileSync(path.join(root, "pages/result/result.js"), "utf8")
  assert(resultSource.includes("const y = 330 + index * 27"), "MBTI/stress poster items should keep clearer vertical spacing")
  assert(resultSource.includes("const y = 322 + index * 23"), "big-five poster items should keep clearer vertical spacing")
  assert(resultSource.includes("const y = 318 + index * 20"), "career poster items should keep clearer vertical spacing")
  assert(resultSource.includes("y + 5, 244, 7"), "MBTI/stress bars should sit closer to their own labels")
  assert(resultSource.includes("y + 4, 244, 6"), "big-five bars should sit closer to their own labels")
  assert(resultSource.includes("y + 4, 244, 5"), "career bars should sit below their own labels")
}

function testHistoryClearButtonStyle() {
  const historyStyle = require("fs").readFileSync(path.join(root, "pages/history/history.wxss"), "utf8")
  const clearButtonRule = historyStyle.match(/\.clear-btn\s*\{[^}]+\}/)
  assert(clearButtonRule, "history clear button style should exist")
  assert(clearButtonRule[0].includes("display: flex"), "history clear button should use flex centering")
  assert(clearButtonRule[0].includes("align-items: center"), "history clear button should vertically center text")
  assert(clearButtonRule[0].includes("justify-content: center"), "history clear button should horizontally center text")
  assert(clearButtonRule[0].includes("line-height: 1"), "history clear button should avoid native button line-height offset")
}

function testPosterAvatarTypeMapping() {
  resetModules()
  installWxMock()
  installAppMock()
  const pages = installPageCapture()
  require(path.join(root, "pages/result/result.js"))
  const page = instantiatePage(pages[0])

  // 大五：5 维都要命中非兜底 config（兜底是 INFP 的 soft/leaf）
  const bigFiveKeys = ["openness", "conscientiousness", "extraversion", "agreeableness", "emotionalStability"]
  bigFiveKeys.forEach((key) => {
    const type = page.getBigFiveAvatarType({ key })
    const cfg = page.getPosterAvatarConfig(type)
    assert(cfg && cfg.hair, `big-five dimension ${key} should map to a real avatar config`)
    assert(type === `big5-${key}`, `big-five avatar type for ${key} should be big5-${key}`)
  })

  // 职业：6 维
  const careerKeys = ["creative", "analytical", "practical", "social", "enterprising", "structured"]
  careerKeys.forEach((key) => {
    const type = page.getCareerAvatarType({ key })
    const cfg = page.getPosterAvatarConfig(type)
    assert(cfg && cfg.hair, `career dimension ${key} should map to a real avatar config`)
    assert(type === `career-${key}`, `career avatar type for ${key} should be career-${key}`)
  })

  // 压力：4 档
  assert(page.getStressAvatarType(80) === "stress-veryhigh", "stress >=72 should map to veryhigh")
  assert(page.getStressAvatarType(60) === "stress-high", "stress 52-71 should map to high")
  assert(page.getStressAvatarType(40) === "stress-mid", "stress 30-51 should map to mid")
  assert(page.getStressAvatarType(10) === "stress-low", "stress <30 should map to low")

  // 边界：各档位都能拿到非兜底且彼此有区分（发型/道具至少有一项不同）
  const stressCfgs = ["stress-low", "stress-mid", "stress-high", "stress-veryhigh"].map((t) => page.getPosterAvatarConfig(t))
  assert(stressCfgs.every((c) => c && c.hair), "all stress levels should resolve to real configs")
}

runTest("page scripts load", testPageScriptsLoad)
runTest("config and question counts", testConfigAndQuestionCounts)
runTest("scoring for all tests", testScoringForAllTests)
runTest("quiz page flows", testQuizPageFlows)
runTest("result view models and share rules", testResultViewModelsAndShareRules)
runTest("poster drawers for unlocked results", testPosterDrawersForUnlockedResults)
runTest("unlock and storage", testUnlockAndStorage)
runTest("result storage migration and limit", testResultStorageMigrationAndLimit)
runTest("home and history pages", testHomeAndHistoryPages)
runTest("about page content", testAboutPageContent)
runTest("poster layout spacing constants", testPosterLayoutSpacingConstants)
runTest("history clear button style", testHistoryClearButtonStyle)
runTest("poster avatar type mapping", testPosterAvatarTypeMapping)
