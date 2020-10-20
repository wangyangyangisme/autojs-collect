importClass(android.content.Context)
importClass(android.provider.Settings)


let { config } = require('../config.js')(runtime, this)
let singletonRequire = require('../lib/SingletonRequirer.js')(runtime, this)

let _runningQueueDispatcher = singletonRequire('RunningQueueDispatcher')
let _commonFunctions = singletonRequire('CommonFunction')
let alipayUnlocker = singletonRequire('AlipayUnlocker')
let { logInfo: _logInfo, errorInfo: _errorInfo, warnInfo: _warnInfo, debugInfo: _debugInfo, infoLog: _infoLog } = singletonRequire('LogUtils')
let _FloatyInstance = singletonRequire('FloatyUtil')
let FileUtils = singletonRequire('FileUtils')
let BaiduOcrUtil = require('../lib/BaiduOcrUtil.js')

const default_chick_config = {
  CHECK_APP_COLOR: '#f1381a',
  CHECK_FRIENDS_COLOR: '#429beb',
  THIEF_COLOR: '#000000',
  PUNCH_COLOR: '#f35458',
  OUT_COLOR: '#c37a3e',
  OUT_IN_FRIENDS_COLOR: '#e9ca02',
  DISMISS_COLOR: '#f9622f',
  FOOD_COLOR: '#ffcf00',
  SPEED_CHECK_COLOR: '#ffd000',

  CHECK_APP_REGION: [310, 250, 20, 20],
  CHECK_FRIENDS_REGION: [120, 490, 10, 10],
  OUT_REGION: [530, 1300, 25, 25],
  OUT_IN_FRIENDS_REGION_RIGHT: [800, 1305, 50, 50],
  OUT_IN_FRIENDS_REGION_LEFT: [340, 1305, 50, 50],
  LEFT_THIEF_REGION: [385, 1465, 50, 50],
  LEFT_PUNCH_REGION: [500, 1305, 100, 100],
  RIGHT_THIEF_REGION: [825, 1465, 50, 50],
  RIGHT_PUNCH_REGION: [980, 1305, 100, 100],
  DISMISS_REGION: [450, 1845, 10, 10],
  FOOD_REGION: [850, 1655, 10, 10],
  SPEED_CHECK_REGION: [464, 1445, 10, 10],
  COUNT_DOWN_REGION: [810, 1600, 160, 55],          // 倒计时区域
  FEED_POSITION: {
    x: 930,
    y: 1960
  },
  TOOL_POSITION: {
    x: 960,
    y: 645
  },
  SPEED_CARD_POSITION: {
    x: 190,
    y: 1450
  },
  CONFIRM_POSITON: {
    x: 720,
    y: 1320
  },
  // 捡屎
  SHIT_CHECK_REGION: [435, 1925, 40, 40],
  COLLECT_SHIT_CHECK_REGION: [220, 2000, 80, 40],
  PICK_SHIT_GRAY_COLOR: '#A6A6A6',
  COLLECT_SHIT_GRAY_COLOR: '#838383'
}

let custom_config = files.exists(FileUtils.getCurrentWorkPath() + '/extends/CustomConfig.js') ? require('../extends/CustomConfig.js') : default_chick_config
let offset = typeof custom_config.OFFSET === 'number' ? custom_config.OFFSET : 0
let chick_config = {}
Object.keys(custom_config).forEach(key => {
  let val = custom_config[key]
  if (typeof val === 'undefined') {
    return
  }
  if (typeof val === 'string') {
    chick_config[key] = val
  } else if (Object.prototype.toString.call(val) === '[object Array]') {
    let newArrayConfig = [
      parseInt(val[0]),
      parseInt(val[1] + offset),
      parseInt(val[2]),
      parseInt(val[3] + offset)
    ]
    chick_config[key] = newArrayConfig
  } else if (val.x) {
    chick_config[key] = {
      x: parseInt(val.x),
      y: parseInt(val.y + offset)
    }
  } else {
    chick_config[key] = val
  }
})
console.verbose('转换后配置：' + JSON.stringify(chick_config))
function getRegionCenter (region) {
  _debugInfo(['转换region位置:{}', JSON.stringify(region)])
  return {
    x: region[0] + parseInt(region[2] / 2),
    y: region[1] + parseInt(region[3] / 2)
  }
}
function AntManorRunner () {

  this.setFloatyTextColor = function (colorStr) {
    _FloatyInstance.setFloatyTextColor(colorStr)
  }

  this.setFloatyInfo = function (position, text) {
    _debugInfo(['设置悬浮窗位置: {} 内容: {}', JSON.stringify(position), text])
    _FloatyInstance.setFloatyInfo(position, text)
  }

  this.launchApp = function () {
    app.launchPackage('com.eg.android.AlipayGphone')
    if (config.is_alipay_locked) {
      alipayUnlocker.unlockAlipay()
    }
    app.startActivity({
      action: 'VIEW',
      data: 'alipays://platformapi/startapp?appId=66666674',
      packageName: 'com.eg.android.AlipayGphone'
    })
    sleep(1000)
    this.waitForOwn()
  }

  this.waitFor = function (color, region, threshold) {
    let img = null
    let findColor = null
    let timeoutCount = 20
    do {
      sleep(400)
      img = _commonFunctions.checkCaptureScreenPermission()
      findColor = images.findColor(img, color, {
        region: region,
        threshold: threshold || config.color_offset || 4
      })
    } while (!findColor && timeoutCount-- > 0)
    return findColor
  }

  this.killAndRestart = function () {
    _commonFunctions.killCurrentApp()
    _commonFunctions.setUpAutoStart(1)
    _runningQueueDispatcher.removeRunningTask()
    exit()
  }

  this.waitForOwn = function () {
    let findColor = this.waitFor(chick_config.CHECK_APP_COLOR, chick_config.CHECK_APP_REGION)
    if (findColor) {
      this.setFloatyInfo(null, '进入个人鸡鸡页面成功')
      return true
    } else {
      this.setFloatyTextColor('#ff0000')
      this.setFloatyInfo(getRegionCenter(chick_config.CHECK_APP_REGION), '进入个人鸡鸡页面失败，检测超时')
      this.killAndRestart()
    }
  }


  this.waitForFriends = function () {
    let findColor = this.waitFor(chick_config.CHECK_FRIENDS_COLOR, chick_config.CHECK_FRIENDS_REGION)
    if (findColor) {
      this.setFloatyInfo(null, '进入好友鸡鸡页面成功')
      return true
    } else {
      this.setFloatyTextColor('#ff0000')
      this.setFloatyInfo(null, '进入好友鸡鸡页面失败，检测超时')
      this.killAndRestart()
    }
  }

  this.waitForDismiss = function () {
    let findColor = this.waitFor(chick_config.DISMISS_COLOR, chick_config.DISMISS_REGION)
    if (findColor) {
      this.setFloatyInfo(findColor, '找到了关闭按钮')
      click(findColor.x, findColor.y)
    } else {
      this.setFloatyInfo(null, '没找到关闭按钮，奇了怪了')
    }
  }

  this.checkIsOut = function () {
    let img = _commonFunctions.checkCaptureScreenPermission()
    let findColor = images.findColor(img, chick_config.OUT_COLOR, {
      region: chick_config.OUT_REGION,
      threshold: config.color_offset
    })
    if (findColor) {
      this.setFloatyInfo(findColor, '小鸡出去找吃的了')
      sleep(1000)
      this.setFloatyInfo(null, '点击去找小鸡')
      click(findColor.x, findColor.y)
      sleep(1000)
      this.waitForFriends()
      sleep(1000)
      img = _commonFunctions.checkCaptureScreenPermission()
      findColor = images.findColor(img, chick_config.OUT_IN_FRIENDS_COLOR, {
        region: chick_config.OUT_IN_FRIENDS_REGION_LEFT,
        threshold: config.color_offset
      })
      if (!findColor) {
        findColor = images.findColor(img, chick_config.OUT_IN_FRIENDS_COLOR, {
          region: chick_config.OUT_IN_FRIENDS_REGION_RIGHT,
          threshold: config.color_offset
        })
      }
      if (findColor) {
        this.setFloatyInfo(findColor, '找到了我的小鸡')
        sleep(1000)
        let heightRate = config.device_height / 2160
        this.setFloatyInfo({ x: findColor.x, y: findColor.y + 200 * heightRate }, '点击叫回小鸡')
        click(findColor.x, parseInt(findColor.y + 200 * heightRate))
        sleep(1000)
        this.waitForOwn()
      } else {
        this.setFloatyTextColor('#ff0000')
        this.setFloatyInfo(getRegionCenter(chick_config.OUT_IN_FRIENDS_REGION_LEFT), '没有找到小鸡，奇了怪了！')
        return false
      }
    }
  }

  this.checkThiefLeft = function () {
    sleep(500)
    let img = _commonFunctions.checkCaptureScreenPermission()
    let findColor = images.findColor(img, chick_config.THIEF_COLOR, {
      region: chick_config.LEFT_THIEF_REGION,
      threshold: config.color_offset
    })
    if (findColor) {
      this.setFloatyInfo(findColor, '找到了左边的小透鸡')
      sleep(1000)
      this.setFloatyTextColor('#f35458')
      this.setFloatyInfo(null, '点击小透鸡')

      let punch = null
      let count = 3
      do {
        click(findColor.x, findColor.y)
        sleep(1500)
        img = _commonFunctions.checkCaptureScreenPermission()
        punch = images.findColor(img, chick_config.PUNCH_COLOR, {
          region: chick_config.LEFT_PUNCH_REGION,
          threshold: config.color_offset
        })
      } while (!punch && count-- > 0)

      if (punch) {
        this.setFloatyTextColor(chick_config.PUNCH_COLOR)
        this.setFloatyInfo(punch, '找到了左边的小拳拳')
        sleep(2000)
        this.setFloatyInfo(null, '点击揍小鸡')
        click(punch.x, punch.y)
        sleep(1000)
        this.waitForDismiss()
        this.waitForOwn()
        sleep(1000)
        return true
      }
    } else {
      this.setFloatyInfo(getRegionCenter(chick_config.LEFT_THIEF_REGION), '左边没野鸡')
    }
  }

  this.checkThiefRight = function () {
    sleep(500)
    let img = _commonFunctions.checkCaptureScreenPermission()
    let findColor = images.findColor(img, chick_config.THIEF_COLOR, {
      region: chick_config.RIGHT_THIEF_REGION,
      threshold: config.color_offset
    })
    if (findColor) {
      this.setFloatyInfo(findColor, '找到了右边的小透鸡')
      sleep(1000)
      this.setFloatyTextColor('#f35458')
      this.setFloatyInfo(null, '点击小透鸡')

      let punch = null
      let count = 3
      do {
        click(findColor.x, findColor.y)
        sleep(1500)
        img = _commonFunctions.checkCaptureScreenPermission()
        punch = images.findColor(img, chick_config.PUNCH_COLOR, {
          region: chick_config.RIGHT_PUNCH_REGION,
          threshold: config.color_offset
        })
      } while (!punch && count-- > 0)

      if (punch) {
        this.setFloatyTextColor(chick_config.PUNCH_COLOR)
        this.setFloatyInfo(punch, '找到了右边的小拳拳')
        sleep(2000)
        this.setFloatyInfo(null, '点击揍小鸡')
        click(punch.x, punch.y)
        sleep(1000)
        this.waitForDismiss()
        this.waitForOwn()
        sleep(1000)
        return true
      }
    } else {
      this.setFloatyInfo(getRegionCenter(chick_config.RIGHT_THIEF_REGION), '右边没野鸡')
    }
  }

  this.checkAndFeed = function () {
    sleep(500)
    let img = _commonFunctions.checkCaptureScreenPermission()
    if (img) {
      let findColor = images.findColor(img, chick_config.FOOD_COLOR, {
        region: chick_config.FOOD_REGION,
        threshold: config.color_offset || 4
      })
      if (findColor) {
        this.setFloatyInfo(findColor, '小鸡有饭吃哦')
      } else {
        this.setFloatyTextColor('#ff0000')
        this.setFloatyInfo({ x: chick_config.FOOD_REGION[0], y: chick_config.FOOD_REGION[1] }, '小鸡没饭吃呢')
        click(chick_config.FEED_POSITION.x, chick_config.FEED_POSITION.y)
        _commonFunctions.updateSleepTime(20, true)
        if (config.useSpeedCard) {
          this.useSpeedCard()
        }
      }
      if (config.useSpeedCard && this.checkSpeedSuccess()) {
        _commonFunctions.setSpeeded()
      } else {
        _commonFunctions.setSpeedFail()
      }
      sleep(1500)
      let ocrRestTime = this.recognizeCountdownByOcr()
      let sleepTime = _commonFunctions.getSleepTimeByOcr(ocrRestTime)
      this.setFloatyInfo(null, sleepTime + '分钟后来检查状况')
      _commonFunctions.setUpAutoStart(sleepTime)
    } else {
      this.setFloatyTextColor('#ff0000')
      this.setFloatyInfo(null, '截图失败了！')
    }
  }

  /**
   * 使用加速卡
   */
  this.useSpeedCard = function () {
    sleep(1000)
    click(chick_config.TOOL_POSITION.x, chick_config.TOOL_POSITION.y)
    sleep(1000)
    click(chick_config.SPEED_CARD_POSITION.x, chick_config.SPEED_CARD_POSITION.y)
    sleep(1000)
    click(chick_config.CONFIRM_POSITON.x, chick_config.CONFIRM_POSITON.y)
    this.waitForOwn()
  }

  this.checkSpeedSuccess = function () {
    sleep(1000)
    let img = null
    let checkSpeedup = false
    // 校验三次
    let checkCount = 3
    do {
      // 延迟一秒半
      sleep(1500)
      img = _commonFunctions.checkCaptureScreenPermission()
      checkSpeedup = images.findColor(img, chick_config.SPEED_CHECK_COLOR, {
        region: chick_config.SPEED_CHECK_REGION,
        threshold: config.color_offset || 4
      })
    } while (!checkSpeedup && --checkCount > 0)
    if (checkSpeedup) {
      this.setFloatyInfo(checkSpeedup, "加速卡使用成功")
      return true
    } else {
      this.setFloatyTextColor('#ff0000')
      this.setFloatyInfo({ x: chick_config.SPEED_CHECK_REGION[0], y: chick_config.SPEED_CHECK_REGION[1] }, "加速卡使用失败")
      return false
    }
  }

  this.checkAndPickShit = function () {
    let img = _commonFunctions.checkCaptureScreenPermission()
    let pickRegion = chick_config.SHIT_CHECK_REGION || [435, 1925, 40, 40]
    let collectRegion = chick_config.COLLECT_SHIT_CHECK_REGION || [220, 2000, 80, 40]
    let pickShitColor = chick_config.PICK_SHIT_GRAY_COLOR || '#A6A6A6'
    let collectShitColor = chick_config.COLLECT_SHIT_GRAY_COLOR || '#838383'
    img = images.grayscale(img)
    let point = images.findColor(img, pickShitColor, { region: pickRegion })
    if (point) {
      this.setFloatyInfo({ x: pickRegion[0], y: pickRegion[1] }, "有屎可以捡")
      click(point.x, point.y)
      debugInfo(['find point：{},{}', point.x, point.y])
      sleep(1000)
      img = _commonFunctions.checkCaptureScreenPermission()
      img = images.grayscale(img)
      point = images.findColor(img, collectShitColor, { region: collectRegion })
      if (point) {
        click(point.x, point.y)
        debugInfo(['find point：{},{}', point.x, point.y])
      }
    } else {
      this.setFloatyInfo({ x: pickRegion[0], y: pickRegion[1] }, "没有屎可以捡")
    }
  }

  this.recognizeCountdownByOcr = function () {
    if (config.useOcr) {
      let img = _commonFunctions.checkCaptureScreenPermission()
      let region = chick_config.COUNT_DOWN_REGION
      debugInfo(['region:{}', JSON.stringify(chick_config.COUNT_DOWN_REGION)])
      img = images.clip(img, region[0], region[1], region[2], region[3])
      img = images.interval(images.grayscale(img), '#FFFFFF', 50)
      let base64Str = images.toBase64(img)
      debugForDev(['image base64 [data:image/png;base64,{}]', base64Str])
      let result = BaiduOcrUtil.recognizeGeneralText(base64Str)
      let hourMinutes = /(\d+)小时(\d+)分/
      let minuteSeconds = /(\d+)分(\d+)秒/
      debugInfo(['识别倒计时时间文本为：{}', JSON.stringify(result)])
      let restTime = -1
      if (hourMinutes.test(result)) {
        let regexResult = hourMinutes.exec(result)
        restTime = parseInt(regexResult[1]) * 60 + parseInt(regexResult[2])
      } else if (minuteSeconds.test(result)) {
        restTime = parseInt(regexResult[1])
      }
      debugInfo('计算得到剩余时间：' + restTime + '分')
      return restTime
    }
    return -1
  }

  this.setTimeoutExit = function () {
    let _this = this
    setTimeout(function () {
      _this.setFloatyTextColor('#ff0000')
      _this.setFloatyInfo(null, '再见')
      sleep(2000)
      exit()
    }, 30000)
  }

  this.start = function () {
    this.launchApp()
    this.setFloatyInfo(null, '打开APP成功！')
    sleep(1000)
    this.checkIsOut()
    let punchedLeft = this.checkThiefLeft()
    let punchedRight = this.checkThiefRight()
    if (punchedLeft || punchedRight) {
      // 揍过�直接设置300
      _commonFunctions.updateSleepTime(300)
    }

    sleep(1000)
    this.setFloatyInfo(null, '没有野鸡哦')
    this.checkAndFeed()
    sleep(1000)
    if (config.pick_shit) {
      this.checkAndPickShit()
    }
    sleep(2000)
    _commonFunctions.killCurrentApp()
    resourceMonitor.releaseAll()
  }

}

module.exports = new AntManorRunner()