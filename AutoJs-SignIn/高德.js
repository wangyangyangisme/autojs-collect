// home()
launchApp("高德地图")
waitForPackage("com.autonavi.minimap")
sleep(6000)
click(894,2288)
sleep(2000)
var temp = desc('签到').findOne().bounds()
click(temp.centerX(), temp.centerY())
sleep(2000)
click(580,738)
sleep(5000)
// home()
