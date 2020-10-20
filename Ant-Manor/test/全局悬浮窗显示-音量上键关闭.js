let { config: _config } = require('../config.js')(runtime, this)
var window = floaty.rawWindow(
  <canvas id="canvas" layout_weight="1" />
);

window.setSize(1080, 2160);
window.setTouchable(false)
// 刘海高度偏移量，刘海屏以及挖空屏 悬浮窗无法正常显示，需要施加一个偏移量
let bangOffset = _config.bang_offset
let config = {

  CHECK_APP_COLOR: '#f1381a',         // 校验蚂蚁庄园是否打开成功的颜色
  CHECK_FRIENDS_COLOR: '#429beb',     // 校验是否成功进入好友首页的颜色
  THIEF_COLOR: '#000000',             // 校验小偷鸡眼罩的颜色 黑色
  PUNCH_COLOR: '#f35458',             // 校验拳头的颜色
  OUT_COLOR: '#c37a3e',               // 校验小鸡是否出门，牌子的颜色
  OUT_IN_FRIENDS_COLOR: '#e9ca02',    // 校验自家小鸡外出所在的颜色，ID的颜色 黄色
  DISMISS_COLOR: '#f9622f',           // 校验关闭按钮的颜色
  FOOD_COLOR: '#ffcf00',              // 校验正在进食盆里饲料的颜色
  SPEED_CHECK_COLOR: '#ffd000',       // 校验是否成功使用加速卡，小鸡右手上饲料的颜色

  reco: [200, 100, 750, 1900],        // 星星球的判断区域

  OFFSET: 0,  // 默认配置为支持2160*1080分辨率，其他异形屏一般可以尝试仅仅修改该偏移量, 如果不行就修改具体区域的配置吧
  CHECK_APP_REGION: [310, 250, 20, 20],             // 校验是否成功打开蚂蚁庄园的区域，左上角❤️的区域
  CHECK_FRIENDS_REGION: [120, 490, 10, 10],         // 校验是否在好友首页的区域  左上角 发消息蓝色的区域
  OUT_REGION: [400, 1200, 50, 50],                  // 校验小鸡是否出门，牌子的区域
  OUT_IN_FRIENDS_REGION_RIGHT: [800, 1305, 50, 50], // 校验小鸡在好友家，左边的区域
  OUT_IN_FRIENDS_REGION_LEFT: [340, 1305, 50, 50],  // 校验小鸡在好友家，右边的区域
  LEFT_THIEF_REGION: [310, 1465, 10, 10],           // 校验来自家偷吃的小鸡，左边的区域
  LEFT_PUNCH_REGION: [500, 1305, 100, 100],         // 校验左边拳头的区域
  RIGHT_THIEF_REGION: [930, 1465, 10, 10],          // 校验来自家偷吃的小鸡，右边的区域
  RIGHT_PUNCH_REGION: [980, 1305, 100, 100],        // 校验右边拳头的区域
  DISMISS_REGION: [450, 1845, 10, 10],              // 校验关闭按钮的区域
  FOOD_REGION: [850, 1655, 10, 10],                 // 校验食盆的区域，主要校验是否存在饲料
  SPEED_CHECK_REGION: [464, 1445, 10, 10],          // 校验是否成功使用加速卡的区域，小鸡右手拿饲料的位置
  COUNT_DOWN_REGION: [810, 1600, 160, 55],          // 倒计时区域
  // 喂饲料按钮的位置
  FEED_POSITION: {
    x: 930,
    y: 1960
  },
  // 道具包按钮的位置
  TOOL_POSITION: {
    x: 960,
    y: 645
  },
  // 道具包中加速卡按钮的位置
  SPEED_CARD_POSITION: {
    x: 190,
    y: 1450
  },
  // 确认按钮的位置
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


const getRealMainScriptPath = function (parentDirOnly) {
  let currentPath = files.cwd()
  if (files.exists(currentPath + '/main.js')) {
    return currentPath + (parentDirOnly ? '' : '/main.js')
  }
  let paths = currentPath.split('/')

  do {
    paths = paths.slice(0, paths.length - 1)
    currentPath = paths.reduce((a, b) => a += '/' + b)
  } while (!files.exists(currentPath + '/main.js') && paths.length > 0);
  if (paths.length > 0) {
    return currentPath + (parentDirOnly ? '' : '/main.js')
  }
}

/**
 * 获取当前脚本的运行工作路径，main.js所在的文件夹
 */
const getCurrentWorkPath = function () {
  return getRealMainScriptPath(true)
}

function reloadConfigs () {
  let custom_config_path = getCurrentWorkPath() + '/extends/CustomConfig.js'
  delete require.cache[require.resolve(custom_config_path)]
  let custom_config = files.exists(custom_config_path)
    ? require(custom_config_path + '?' + (new Date().getTime() % 100000))
    // ? require(custom_config_path)
    : config
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
  return chick_config
}
// config = reloadConfigs()

let config_load_thread = threads.start(function () {
  while (true) {
    config = reloadConfigs()
    log('重新加载config:' + JSON.stringify(config))
    // 两秒钟加载一次
    sleep(2000)
  }
})


function convertArrayToRect (a) {
  // origin array left top width height
  // left top right bottom
  return new android.graphics.Rect(a[0], a[1] + bangOffset, (a[0] + a[2]), (a[1] + bangOffset + a[3]))
}

function getPositionDesc (position) {
  return position[0] + ', ' + position[1] + ' w:' + position[2] + ',h:' + position[3]
}

function getRectCenter (position) {
  return {
    x: parseInt(position[0] + position[2] / 2),
    y: parseInt(position[1] + position[3] / 2)
  }
}

function drawRectAndText (desc, position, colorStr, canvas, paint) {
  let color = colors.parseColor(colorStr)

  paint.setStrokeWidth(1)
  paint.setStyle(Paint.Style.STROKE)
  // 反色
  paint.setARGB(255, 255 - (color >> 16 & 0xff), 255 - (color >> 8 & 0xff), 255 - (color & 0xff))
  canvas.drawRect(convertArrayToRect(position), paint)
  paint.setARGB(255, color >> 16 & 0xff, color >> 8 & 0xff, color & 0xff)
  paint.setStrokeWidth(1)
  paint.setTextSize(20)
  paint.setStyle(Paint.Style.FILL)
  canvas.drawText(desc, position[0], position[1] + bangOffset, paint)
  paint.setTextSize(10)
  paint.setStrokeWidth(1)
  paint.setARGB(255, 0, 0, 0)
  let center = getRectCenter(position)
  canvas.drawText(getPositionDesc(position), center.x, center.y + bangOffset, paint)
}

function drawText (text, position, canvas, paint) {
  paint.setStrokeWidth(1)
  paint.setStyle(Paint.Style.FILL)
  canvas.drawText(text, position.x, position.y + bangOffset, paint)
}

function drawCoordinateAxis (canvas, paint) {
  let width = canvas.width
  let height = canvas.height
  paint.setStyle(Paint.Style.FILL)
  paint.setTextSize(10)
  let colorVal = colors.parseColor('#65f4fb')
  paint.setARGB(255, colorVal >> 16 & 0xFF, colorVal >> 8 & 0xFF, colorVal & 0xFF)
  for (let x = 50; x < width; x += 50) {
    paint.setStrokeWidth(0)
    canvas.drawText(x, x, 10, paint)
    paint.setStrokeWidth(0.2)
    canvas.drawLine(x, 0, x, height, paint)
  }

  for (let y = 50; y < height; y += 50) {
    paint.setStrokeWidth(0)
    canvas.drawText(y, 0, y + bangOffset, paint)
    paint.setStrokeWidth(0.2)
    canvas.drawLine(0, y + bangOffset, width, y + bangOffset, paint)
  }
}

function exitAndClean () {
  config_load_thread.interrupt()
  if (window !== null) {
    window.canvas.removeAllListeners()
    toastLog('close in 1 seconds')
    sleep(1000)
    window.close()
  }
  exit()
}
let converted = false
// 两分钟后自动关闭
let targetEndTime = new Date().getTime() + 120000

window.canvas.on("draw", function (canvas) {
  try {
    // 清空内容
    canvas.drawColor(0xFFFFFF, android.graphics.PorterDuff.Mode.CLEAR);
    var width = canvas.getWidth()
    var height = canvas.getHeight()
    if (!converted) {
      toastLog('画布大小：' + width + ', ' + height)
    }

    // let canvas = new com.stardust.autojs.core.graphics.ScriptCanvas(width, height)
    let Typeface = android.graphics.Typeface
    var paint = new Paint()
    paint.setStrokeWidth(1)
    paint.setTypeface(Typeface.DEFAULT_BOLD)
    paint.setTextAlign(Paint.Align.LEFT)
    paint.setAntiAlias(true)
    paint.setStrokeJoin(Paint.Join.ROUND)
    paint.setDither(true)
    drawRectAndText('判断是否打开APP', config.CHECK_APP_REGION, config.CHECK_APP_COLOR, canvas, paint)
    drawRectAndText('判断是否打开好友页面', config.CHECK_FRIENDS_REGION, config.CHECK_FRIENDS_COLOR, canvas, paint)
    drawRectAndText('判断小鸡是否出门，牌子的区域', config.OUT_REGION, config.OUT_COLOR, canvas, paint)
    drawRectAndText('判断小鸡在好友家，右边的区域', config.OUT_IN_FRIENDS_REGION_RIGHT, config.OUT_IN_FRIENDS_COLOR, canvas, paint)
    drawRectAndText('判断小鸡在好友家，左边的区域', config.OUT_IN_FRIENDS_REGION_LEFT, config.OUT_IN_FRIENDS_COLOR, canvas, paint)
    drawRectAndText('判断偷吃的小鸡，左边的区域', config.LEFT_THIEF_REGION, config.THIEF_COLOR, canvas, paint)
    drawRectAndText('判断左边拳头的区域', config.LEFT_PUNCH_REGION, config.PUNCH_COLOR, canvas, paint)
    drawRectAndText('判断偷吃的小鸡，右边的区域', config.RIGHT_THIEF_REGION, config.THIEF_COLOR, canvas, paint)
    drawRectAndText('判断右边拳头的区域', config.RIGHT_PUNCH_REGION, config.PUNCH_COLOR, canvas, paint)
    drawRectAndText('判断关闭按钮的区域', config.DISMISS_REGION, config.DISMISS_COLOR, canvas, paint)
    drawRectAndText('判断食盆的区域，主要校验是否存在饲料', config.FOOD_REGION, config.FOOD_COLOR, canvas, paint)
    drawRectAndText('判断是否成功使用加速卡的区域', config.SPEED_CHECK_REGION, config.SPEED_CHECK_COLOR, canvas, paint)
    drawRectAndText('星星球的判断区域', config.reco, '#000000', canvas, paint)
    drawRectAndText('判断屎的区域', config.SHIT_CHECK_REGION, config.PICK_SHIT_GRAY_COLOR, canvas, paint)
    drawRectAndText('判断收集屎的区域', config.COLLECT_SHIT_CHECK_REGION, config.COLLECT_SHIT_GRAY_COLOR, canvas, paint)
    drawRectAndText('倒计时识别区域', config.COUNT_DOWN_REGION, '#00FF00', canvas, paint)

    paint.setARGB(255, 0, 0, 255)
    drawText('喂饲料按钮', config.FEED_POSITION, canvas, paint)
    drawText('背包按钮', config.TOOL_POSITION, canvas, paint)
    drawText('加速卡位置', config.SPEED_CARD_POSITION, canvas, paint)
    drawText('确认按钮位置', config.CONFIRM_POSITON, canvas, paint)


    let countdown = (targetEndTime - new Date().getTime()) / 1000
    paint.setTextSize(25)
    paint.setARGB(255, 255, 0, 0)
    drawText('关闭倒计时：' + countdown.toFixed(0) + 's', { x: 100, y: 100 }, canvas, paint)
    drawCoordinateAxis(canvas, paint)
    converted = true

  } catch (e) {
    toastLog(e)
    exitAndClean()
  }
});

threads.start(function () {
  toastLog('按音量上键关闭')
  events.removeAllKeyDownListeners('volume_down')
  events.observeKey()
  events.on("key_down", function (keyCode, event) {
    if (keyCode === 24) {
      exitAndClean()
    }
  })
})

setTimeout(function () {
  exitAndClean()
}, 120000)