// 先运行config_main.js加载配置，避免忘记手动运行
try {
  engines.execScriptFile("./config_main.js");
} catch (error) {
  toastLog(error);
  exit();
}

// 检查无障碍服务和截图服务
let ispt = require("./lib/Inspector");
ispt.checkA11yService(true);
ispt.checkScreenCapture(true);
// 加载模块
let atmt = require("./lib/Automator");
let funcs = require("./lib/CommonFuncs");
let unlocker = require("./lib/Unlock");
// 加载资源
let imgs_main = require("./asset/IMAGES_MAIN");
let imgs_mtrl = require("./asset/IMAGES_MATERIAL");
let objs_mtrl = require("./asset/OBJECTS_MATERIAL");
let scls_main = require("./asset/SCALES_MAIN");

//加载配置
let config = storages.create("arkknights_configs");
let configs = {
  developer: undefined,
  aspect_ratio: undefined,
  threshold_count: undefined,
  max_running_times: undefined,
  last_running_time: undefined,
  using_potion: undefined,
  using_originite: undefined,
  using_times: undefined,
  target_material: undefined,
  target_quantity: undefined,
  last_operation: undefined,
};

for (let key in configs) {
  configs[key] = config.get(key);
}

// 全局变量
let tg_mtrl = objs_mtrl[configs.target_material];
let scls_vals = scls_main[configs.aspect_ratio];
let rewards = {}; // 统计最终龙门币和材料数量

/* ========================================================
 * # 工具函数
 * ======================================================== */
// 输出日志信息
function logInfo(msg, is_toast, is_debug, pre, after) {
  let print = is_debug ? console.info : console.log;

  if (is_toast) toast(msg);

  switch (typeof msg) {
    case "string":
      if (pre) print(pre);
      print("%s", msg);
      if (after) print(after);
      break;
    case "object":
      if (pre) print(pre);
      for (let m in msg) {
        print("%s: %s", m, msg[m]);
      }
      if (after) print(after);
      break;
    default:
      print("%s", "不支持输出的数据格式");
      return;
  }
}

// 提取字符串中的数字
function extractNum(str) {
  return str.split("_").filter((word) => word.match(/\d+/));
}

// 格式化日期字符串
function dateFormat(fmt, date) {
  let reg;
  let padStr = (str) => (str.length === 1 ? "0" + str : str);

  const opt = {
    "Y+": date.getFullYear().toString(), // 年
    "m+": (date.getMonth() + 1).toString(), // 月
    "d+": date.getDate().toString(), // 日
    "H+": date.getHours().toString(), // 时
    "M+": date.getMinutes().toString(), // 分
    "S+": date.getSeconds().toString(), // 秒
  };
  for (let k in opt) {
    reg = new RegExp("(" + k + ")").exec(fmt);
    if (reg) {
      fmt = fmt.replace(reg[0], reg[0].length === 1 ? opt[k] : padStr(opt[k]));
    }
  }
  return fmt;
}

// 检查是否当天第一次运行
function checkFisrtRunningToday() {
  let now = new Date();
  let lrt = new Date(configs.last_running_time);
  let base_time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4); // 当天4点

  if (now - base_time > 0 && now - lrt > now - base_time) {
    return true;
  } else {
    return false;
  }
}

// 更新配置
function updateConfig(lrt_only) {
  config.put("last_running_time", new Date());

  if (!lrt_only && tg_mtrl.update) {
    if (configs.last_operation[tg_mtrl.episode]) {
      configs.last_operation[tg_mtrl.episode] = tg_mtrl.operation;
      config.put("last_operation", configs.last_operation);
    }
  }

  logInfo("配置已更新");
}

// 模拟退出应用
function exitGame(msg, update_lrt) {
  if (msg) logInfo(msg, 1);
  if (update_lrt) updateConfig(true);
  home() && exit();
}

// 获取所有的结算奖励（经验除外）
function getRewards(img) {
  let img_gray, img_blur, circles;
  let results = [];

  img_gray = images.grayscale(img);
  img_blur = images.medianBlur(img_gray, 7);

  circles = images.findCircles(img_blur, {
    region: scls_vals.region_rewards,
    minDst: scls_vals.params_hough.minDst,
    param1: 200,
    param2: 30,
    minRadius: scls_vals.params_hough.minRadius,
    maxRadius: scls_vals.params_hough.maxRadius,
  });

  // 对找到的圆按x坐标的大小进行升序排序
  circles.sort((a, b) => a.x - b.x);

  circles.forEach((circle, i) => {
    if (i < 1) return;
    let max_radius = scls_vals.params_hough.maxRadius;
    let radius = circle.radius > max_radius ? max_radius : circle.radius;
    let x = scls_vals.region_rewards[0] + circle.x - radius;
    let y = scls_vals.region_rewards[1] + circle.y - radius;
    results[i - 1] = images.clip(img, x, y, 2 * radius, 2 * radius);
  });

  if (configs.developer) {
    logInfo("共找到" + (Object.keys(results).length - 1) + "种材料", 0, 1);
  }

  return results;
}

// 在材料库中查找给定材料
function findMaterial(img) {
  let binary = (img) => images.threshold(images.grayscale(img), 100, 255);

  for (let name in imgs_mtrl) {
    if (
      images.findImage(binary(imgs_mtrl[name]), binary(img), {
        threshold: configs.threshold_count,
      })
    ) {
      return name;
    }
  }
  return false;
}

// 统计龙门币和材料
function runCount(imgs) {
  let _trimNum = (string) => string.replace(/_\d+/g, "");
  let _getNum = (string) => string.replace(/[^(\d+)]/g, "");
  let name, count;

  if (imgs.length) {
    if (!rewards["龙门币"]) rewards["龙门币"] = 0;
    rewards["龙门币"] += +_getNum(funcs.baiduOCR(imgs.shift()));
  }

  if (imgs.length) {
    imgs.forEach((img, index) => {
      if ((name = findMaterial(img))) {
        count = ~name.indexOf("_") ? +_getNum(name) : 1;
        name = _trimNum(name);
        if (!rewards[name]) rewards[name] = 0;
        rewards[name] += count;
      } else {
        // 保存未识别到的材料图片，然后手动添加到 IMAGES_MATERIAL.js
        if (configs.developer) {
          //let path = files.join(files.getSdcardPath(), "Autojs/Arkknights/tool/images/images_material/");
          let path = files.path("tool/images/images_material/");
          let date = dateFormat("ddHHMM", new Date());
          images.save(img, files.join(path, date + "_" + index + ".png"));
          logInfo("截图已保存", 0, 1);
        }
      }
    });
  }
}

/* ========================================================
 * # 主程序
 * ======================================================== */
let ak = {
  launch: function () {
    let pkg_name = "com.hypergryph.arknights";
    let is_start = false;

    logInfo("即将运行游戏", 1);
    sleep(2e3); // 缓冲时间

    let _thrd = threads.start(function () {
      try {
        is_start = app.launch(pkg_name);
      } catch (error) {
        logInfo(error, 1);
        exit();
      }
    });
    _thrd.join(); // 等待线程结束

    if (!is_start && currentPackage() !== pkg_name) {
      logInfo("运行游戏失败，结束执行", 1);
      exit();
    }

    return this;
  },
  login: function () {
    if (funcs.loopUntilFind(imgs_main.shape_enter, true)) {
      funcs.clickUntilLost(imgs_main.shape_enter, true);
    } else {
      exitGame("加载游戏失败，结束执行");
    }

    if (funcs.loopUntilFind(imgs_main.start_arouse, true)) {
      funcs.findAndClick(imgs_main.start_arouse, true);
    } else {
      exitGame("唤醒账号失败，结束执行");
    }

    return this;
  },
  dismiss: function () {
    // 等待直到进入游戏主界面
    funcs.loopUntilFind(imgs_main.text_lv, true);

    sleep(2e3); // 缓冲时间

    // 当日首次登录领取签到奖励
    if (checkFisrtRunningToday()) {
      logInfo("今日首次运行", 1);

      if (
        funcs.loopUntilFind(imgs_main.ration_today, true, {
          options: {
            extras: [imgs_main.shape_dismiss],
          },
          process: function (result) {
            let close = result.extras[0];
            if (close) atmt.click(close.x, close.y);
            sleep(100);
          },
          interval: 1e3,
        })
      ) {
        funcs.findAndClick(imgs_main.ration_today, true);
      }
    }

    // 关闭公告/签到弹窗
    if (
      funcs.loopUntilFind(imgs_main.text_lv, true, {
        options: {
          extras: [imgs_main.shape_dismiss],
        },
        process: function (result) {
          let close = result.extras[0];
          if (close) atmt.click(close.x, close.y);
          sleep(100);
        },
        interval: 1e3,
      })
    ) {
      logInfo("成功进入游戏主界面", 1);
    } else {
      exitGame("进入游戏主界面失败，结束执行", true);
    }

    return this;
  },
  ready: function () {
    let current_operation = 0;
    let last_operation = 0;

    if (tg_mtrl.update) {
      let get_operation = (digits) => (digits.length > 2 ? +(digits[1] + "." + digits[2]) : +digits[1]);
      current_operation = get_operation(extractNum(tg_mtrl.operation));
      last_operation = get_operation(extractNum(configs.last_operation[tg_mtrl.episode]));
    }

    if (configs.developer) {
      if (tg_mtrl.update) {
        logInfo({
          "当前章节": extractNum(tg_mtrl.episode),
          "当前行动": extractNum(tg_mtrl.episode) + "-" + current_operation,
          "上次行动": extractNum(tg_mtrl.episode) + "-" + last_operation,
        }, 0, 1);
      }
    }

    // 点击作战按钮
    funcs.findAndClick(imgs_main.text_lv, true, {
      coord: scls_vals.coord_battle,
    });

    sleep(2e3); // 缓冲时间

    if (tg_mtrl.top) {
      switch (tg_mtrl.top) {
        case "main":
          break;
        case "supplies":
          atmt.click(scls_vals.coord_supplies.x, scls_vals.coord_supplies.y);
          logInfo("进入物资筹备", 1);
          sleep(1e3);
          break;
        case "chips":
          atmt.click(scls_vals.coord_chips.x, scls_vals.coord_chips.y);
          logInfo("进入芯片搜索", 1);
          sleep(1e3);
          break;
        case "annihilation":
          atmt.click(scls_vals.coord_annihilation.x, scls_vals.coord_annihilation.y);
          logInfo("进入剿灭作战", 1);
          sleep(1e3);
          break;
        case "event_1":
          atmt.click(scls_vals.coord_event_1.x, scls_vals.coord_event_1.y);
          logInfo("进入活动1"), 1;
          sleep(1e3);
          break;
        case "event_2":
          atmt.click(scls_vals.coord_event_2.x, scls_vals.coord_event_2.y);
          logInfo("进入活动2"), 1;
          sleep(1e3);
          break;
        default:
          throw new Error("无法识别的顶级区域");
      }
    }

    if (tg_mtrl.episode) {
      if (
        extractNum(tg_mtrl.episode).length === 0
          ? funcs.swipeUntilFind(imgs_main[tg_mtrl.episode], true, scls_vals.coords_episode)
          : funcs.swipeUntilFind(imgs_main[tg_mtrl.episode], true, scls_vals.coords_episode_r)
      ) {
        funcs.findAndClick(imgs_main[tg_mtrl.episode], true, {
          offset: tg_mtrl.top === "main" ? {y: 200} : {},
          wait: 1e3,
        });
      } else {
        exitGame("进入游戏章节失败，结束执行", true);
      }
    }

    if (tg_mtrl.operation) {
      if (
        current_operation >= last_operation
          ? funcs.swipeUntilFind(imgs_main[tg_mtrl.operation], true, scls_vals.coords_operation)
          : funcs.swipeUntilFind(imgs_main[tg_mtrl.operation], true, scls_vals.coords_operation_r)
      ) {
        funcs.findAndClick(imgs_main[tg_mtrl.operation], true, {
          wait: 1e3,
        });
      } else {
        exitGame("进入游戏关卡失败，结束执行", true);
      }
    }

    return this;
  },
  start: function () {
    let current = 0;    // 当前运行次数
    let rpln_times = 0; // 理智补充次数

    while (configs.max_running_times--) {
      // 判断任务是否完成
      if (tg_mtrl.count && rewards[configs.target_material] >= configs.target_quantity) {
        logInfo(rewards, 0, 0, "-".repeat(36), "-".repeat(36));
        updateConfig();
        exitGame("任务完成，结束游戏");
      }

      // 进入干员确认界面
      if (funcs.loopUntilFind(imgs_main.operation_start_1, true)) {
        funcs.findAndClick(imgs_main.auto_deploy, true); // 代理指挥
        funcs.findAndClick(imgs_main.operation_start_1, true);
      } else {
        exitGame("干员确认失败，结束执行", true);
      }

      // 正式开始游戏
      if (
        funcs.loopUntilFind(imgs_main.operation_start_2, true, {
          options: {
            extras: [imgs_main.using_potion, imgs_main.using_originite],
          },
          process: function (result) {
            let ets = result.extras; // et = extra targets
            if (rpln_times < configs.using_times && (ets[0] || ets[1])) {
              if (
                (ets[0] && configs.using_potion) ||
                (ets[1] && configs.using_originite)
              ) {
                funcs.findAndClick(imgs_main.shape_confirm, true) && logInfo("理智已补充", 1);
                funcs.findAndClick(imgs_main.operation_start_1, true, {wait: 2e3});
                rpln_times++;
              } else {
                logInfo(rewards, 0, 0, "-".repeat(36), "-".repeat(36));
                updateConfig();
                exitGame("理智不足，结束执行");
              }
            }
          },
          interval: 1e3,
        })
      ) {
        logInfo("第" + ++current + "次运行", 1);
        funcs.findAndClick(imgs_main.operation_start_2, true);
      } else {
        exitGame("开始游戏失败，结束执行", true);
      }

      // 结算
      if (
        funcs.loopUntilFind(imgs_main.results, true, {
          options: {
            extras: [imgs_main.shape_report, imgs_main.sanity_recovered],
          },
          process: function (target) {
            let et = target.extras;
            if (et[0]) atmt.click(et[0].x, et[0].y); // 点击剿灭模式报告界面
            if (et[1]) atmt.click(et[1].x, et[1].y); // 点击升级界面
          },
          bound: 1800e3,
          interval: 3e3,
        })
      ) {
        if (tg_mtrl.count) {
          sleep(3e3); // 等待结算动画结束
          runCount(getRewards(captureScreen()));
        }
        funcs.findAndClick(imgs_main.results, true, {wait: 2e3});
      } else {
        updateConfig();
        exitGame("游戏结算失败，结束执行");
      }
    }

    logInfo(rewards, 0, 0, "-".repeat(36), "-".repeat(36));
    updateConfig();
    exitGame("超出最大次数，脚本运行结束");
    return this;
  },
};

if (configs.developer) {
  logInfo("开发者模式已开启", 0, 1);
}

if (!device.isScreenOn()) {
  unlocker.unlock();
  logInfo("手机已解锁");
}

sleep(2e3); // 通过悬浮窗运行需要一点缓冲时间

if (funcs.findOnly(imgs_main.operation_start_1, true)) {
  ak.start(); // 利用悬浮窗手动进入具体关卡后运行
} else if (funcs.findOnly(imgs_main.text_lv, true)) {
  ak.ready().start(); // 利用悬浮窗在游戏主界面运行
} else {
  ak.launch().login().dismiss().ready().start();
}

/* runCount(getRewards(captureScreen()));
logInfo(rewards); */