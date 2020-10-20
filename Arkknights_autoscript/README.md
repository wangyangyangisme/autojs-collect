# 😃 明日方舟自动化脚本

众所周知明日方舟是个休闲游戏，然而每天反复看录像（代理指挥）也很烦人，因此就用蚂蚁森林脚本的一些组件又写了这个脚本。这个脚本中提供的开发模板和函数功能可以很方便的应用到各种需要找图的脚本。

# 📕 脚本使用方法

首先安装 **Autojs**，我开发时使用的是版本是 **Autojs Pro 8**，免费版的 **Autojs 4.1.1 Alpha 2** 经过测试同样可以运行，因此使用免费版即可。下载好后把整个项目丢到“/sdcard/脚本/”文件夹下面，然后打开软件，运行项目或者`launch.js`即可。

由于目前还没有提供配置的UI界面，因此需要手动去`config_main.js`里面修改相应的配置

```js
config.put("developer", false);
config.put("threshold_all", 0.9);
config.put("threshold_count", 0.96);
config.put("max_running_times", 99);
config.put("using_potion", true);
config.put("using_originite", false);
config.put("using_times", 1);
config.put("target_material", "固源岩");
config.put("target_quantity", 10);
```

## ⭕ 找图相关

当前已支持16:9(1920x1080)和20:9(2400x1080)的设备。对于目前主流的全面屏设备，大部分的像素密度ppi其实都是一样的，只是屏幕高度不同罢了，因此图片的问题不大，但是坐标和区域数值，不同分辨率无法通过按比例缩放直接得到，需要自己获取后添加到`SCALES_MAIN.js`文件里面。

如果发现识图失败，请修改`threshold_all`配置项，从大往小调整，直到识别成功为止。同理，如果结算统计无法得到结果，就调整`threshold_count`配置项。

如果修改找图精确度之后还是无法找到图片，或者需要添加新的识别功能，就需要自己添加图片。方法按步骤：

1. 在`tool/images`下面的两个目录中可以看到脚本需要用到的图片。其中`images_main`中的图片需要在游戏中截取对应部分的图片，然后替换掉上述目录中的图片，注意文件名要一致。而`images_material`中的图片是脚本自动截取的，在配置中设置`developer`为`true`即可（详情见`launch.js`中的`runCount()`）；
2. 运行`generateImageData.js`然后在`tool/images`目录下得到对应的JSON文件。用获得的JSON文件替换掉`asset`目录下的JSON文件，然后在`IMAGES_MAIN.js`或者`IMAGES_MATERIAL.js`中按格式修改或者添加图片。如果只是替换部分图片，则手动计算出`scale_ratio`的值后修改即可；如果是替换了全部图片，则直接去`config_main.js`中修改`sampling_rslt`为你采样设备的分辨率。

注1：之所以要把图片保存为BASE64，是为了避免图片在手机图库中被看到，有可能被误删，同时也满足了强迫症用户的精神洁癖=。=
因此生成JSON文件后，就可以把那两个目录下的图片删掉了；  
注2：手机自带截图功能截取后图片是有损压缩的，尽管用来识别问题不大，但是如果希望识别结果更加准确，建议使用Autojs自带的截图函数截图后保存到本地。 

> 取样设备：HUAWEI P10PLUS 
> - 分辨率：1920*1080 
> - 屏幕尺寸：5.5 inches
> - ppi：400

## ⭕ 添加新的材料

脚本把所有的关卡都抽象成三个部分：

- **top**：顶级区域，比如主线，物资筹备，活动这些；
- **episode**：章节，主线的话就是各个章节，物资筹备的话就是战术演习、货物运送这些；
- **operation**：具体的行动，类似7-15、CE-5这些。

熟悉上面说到的概念之后就可以自己添加自己想要刷的材料了，具体方法步骤：

1. 首先获取目标材料对应的“episode”和“operation”部分的截图（top就那几个基本不会变）；
2. 在`OBJECTS_MATERIAL.js`中按如下格式添加，以作战记录为例：
```js
作战记录: { 
  top: "supplies",             // 顶级区域
  episode: "tactical_drill",   // 章节
  operation: "operation_ls_5", // 行动
  update: false,               // 是否更新区域
  count: false,                // 是否统计材料数量
},
```

注1：目前基本只有主线关卡需要设置`update: true`，以便下次运行时可以正确判断是往左还是往右滑动来寻找关卡；  
注2：如果想要在结算时统计材料获取`count: true`，则需要提供材料截图并添加到`IMAGES_MATERIAL.js`，这一点上面添加图片部分有说；  
注3：对于“S4-1”这种关卡，为了方便比较关卡大小，需要保存为“4_3_1”，代表“4-3”分支下的第一个关卡。

# 🧐 脚本目录结构

```
 ├── /asset
 │   ├── IMAGES_MAIN.js           // 脚本识图需要用到的图片
 │   ├── IMAGES_MAIN.json         // 脚本识图需要用到的图片数据，BASE64值
 │   ├── IMAGES_MATERIAL.js       // 结算材料统计需要用到的图片
 │   ├── IMAGES_MATERIAL.json     // 结算材料统计需要用到的图片数据，BASE64值
 │   ├── OBJECTS_MATERIAL.js      // 材料对应关卡相关信息
 │   └── SCALES_MAIN.js           // 脚本中需要按宽高比缩放的数据
 ├── /lib
 │   ├── Automator.js             // 自动化工厂方法
 │   ├── CommonFuncs.js           // 公用函数
 │   ├── Inspector.js             // 服务检测
 │   └── Unlock.js                // 解锁模块（来自SuperMonster003）
 ├── /tool
 │   ├── generateImageData.js     // 将images_main和images_material中的图片转为BASE64后保存为JSON文件
 │   └── /images
 │       ├── images_main          // 对应IMAGES_MAIN中的图片
 │       └── images_material      // 对应IMAGES_MATERIAL中的图片
 ├── config_main.js               // 主要预设文件
 ├── config_unlock.js             // 解锁预设文件（来自SuperMonster003）
 ├── launch.js                    // 入口程序
 └── project.json                 // 项目信息
```

# ⚡ 功能简介

* 通过ADB自动开启无障碍服务
* 可以定时启动自动解锁并运行脚本
* 根据预设的目标材料对应行动自动进入关卡
* 根据预设的目标材料和目标数量自动循环运行
* 根据预设使用药水或者源石补充理智
* 识别并统计关卡结算的奖励材料：
  * 利用 `BaiduOCR` 识别数字，用来统计龙门币的数量
  * 利用 `HoughCircles` 检测结算界面的材料，用来统计材料获取

# 😶 待完成的功能

* 完善不同分辨率的设备
* 提供一个修改预设的 UI 界面
* 运行主程序弹出一个对话框，询问是否变更预设，5s后直接运行
* 将要刷取的材料组合成任务队列，顺序执行
* 提供一个工具，可以添加新的关卡信息
* 提供一个工具，可以预调整匹配当前的找图精度

# 😥 待解决的问题

* 解决随着识别的材料增多识别效率降低的问题

# 🎨 更新记录

`2020.10.10`:

- 添加控制理智补充次数的配置项：`using_times`
- 材料统计新增：研磨石

`2020.9.21`:

- 材料统计新增：轻锰矿、重装芯片、医疗芯片

`2020.9.13`:

- 材料统计新增：固源岩组、扭转醇、装置、狙击芯片组、术师芯片组

`2020.9.11`:

- 材料统计新增：糖、糖组、全新装置、异铁、异铁组

`2020.9.9`:

- 材料统计改为以二值化的形式进行匹配
- 调整默认配置，使得材料统计可以获得正确的数量
- 材料统计新增：固源岩、酮凝集、酮凝集组

`2020.9.8`:

- 完善日志功能
- 调整默认配置，使得材料统计可以获得正确的数量
- 修改`findMaterial()`的匹配方式为多线程
- 材料刷取新增：炽合金、聚酸酯组、凝胶、糖组、酮凝集组、研磨石

`2020.9.7`:

- 解决了`getRewards()`返回结果和参数不一致的情况
- 增加识别升级界面的跳过功能

`2020.9.5`:

- 图片重新采样
- 图片的BASE64对象从JS中移除，单独用JSON保存
- 添加配置项：`developer`、`aspect_ratio` 和 `scale_ratio`


`2020.9.3`: 

- 添加20:9（2400x1080）设备的坐标/找图范围数据
- 添加找图精度的配置项 `threshold_all` 和 `threshold_count`
