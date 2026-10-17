const adConfig = require("../config/ad")

let rewardedVideoAd = null
let activeAdUnitId = ""

function isRealRewardedVideoReady() {
  return Boolean(
    adConfig.rewardedVideo.enabled &&
    adConfig.rewardedVideo.adUnitId &&
    wx.createRewardedVideoAd
  )
}

function isRewardedUnlockEnabled() {
  return Boolean(adConfig.rewardedVideo.enabled)
}

function getRewardedVideoAd() {
  const adUnitId = adConfig.rewardedVideo.adUnitId
  if (!rewardedVideoAd || activeAdUnitId !== adUnitId) {
    rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId })
    activeAdUnitId = adUnitId
  }
  return rewardedVideoAd
}

function showRewardedVideo() {
  if (!isRealRewardedVideoReady()) {
    return Promise.resolve({ mode: "mock", completed: true })
  }

  const ad = getRewardedVideoAd()
  return new Promise((resolve, reject) => {
    const handleClose = (res) => {
      ad.offClose(handleClose)
      if (res && res.isEnded) {
        resolve({ mode: "real", completed: true })
        return
      }
      resolve({ mode: "real", completed: false })
    }

    ad.onClose(handleClose)
    ad.show().catch(() => {
      ad.load()
        .then(() => ad.show())
        .catch((error) => {
          ad.offClose(handleClose)
          reject(error)
        })
    })
  })
}

function getMockDuration() {
  return adConfig.rewardedVideo.mockDuration || 3
}

module.exports = {
  isRewardedUnlockEnabled,
  isRealRewardedVideoReady,
  showRewardedVideo,
  getMockDuration
}
