
// 保持脚本运行
var ID = setInterval(() => { }, 1000)
// 监听主脚本消息
events.on("prepare", function (i,task_info, mainEngine) {
    log("task_info",task_info);
    log("id=>",task_info.id)
    mian();
    log(info);
    info["state"] = "ok";
    app_info(my_app.name,info);
    home();
    callback_task(task_info.id,"done");

    mainEngine.emit("control", i,task_info);  //向主脚本发送一个事件，该事件可以在它的events模块监听到并在脚本主线程执行事件处理。
    clearInterval(ID);   //取消一个由 setInterval() 创建的循环定时任务。
});


var my_app = {}
my_app.packageName = "com.tencent.mm";
my_app.name = "微信";

var thread = "";
var info = {}

function sendBroadcast(appName, data) {
    sleep(2000)
    var mapObject = {
        appName: appName,
        data: data
    }
    app.sendBroadcast(
        {
            packageName: "com.flow.factory",
            className: "com.flow.factory.trafficfactory.broadcast.TaskBroadCast",
            extras: mapObject
        }
    );
}

function jspost(url,data){
    var res = http.post(url, data);
    var data = res.body.string();
    if(data){
        return data;
    }
}

function app_info(name,data){
    var url = "http://news.wenfree.cn/phalapi/public/";
    var postdata = {};
    postdata["s"]="App.ZllgcAppInfo.App_info";
    postdata["imei"]= device.getIMEI();
    postdata["app_name"]= name;
    postdata["whos"]= "ouwen000";
    postdata["app_info"]= JSON.stringify(data);
    log(jspost(url,postdata));
}

function callback_task(id,state){
    var url = "http://news.wenfree.cn/phalapi/public/";
    var arr = {};
    arr["id"] = id;
    arr["task_state"] = state;
    var postdata = {};
    postdata["s"]="App.Zllgcimeicallback.Callback_task"
    postdata["arr"] = JSON.stringify(arr)
    log(arr,postdata)
    log(jspost(url,postdata));
}

log(currentPackage());
log(currentActivity());
log(device.width,device.height)



function mian(){
    var info_read_key = true

    var time_line = 0
    while (time_line < 20 ) {
        
        var currenapp = currentPackage()
        if( currenapp == my_app.packageName ){
            var UI = currentActivity();
            log('UI',UI,time_line)
            switch(UI){
                case "com.tencent.mm.ui.LauncherUI":
                    log("微信首页面");
                    if( info_read_key && jsclick("text","我",true,2)){
                        if(jsclick("text","设置",false,1)){
                            if(info_read()){
                                info_read_key = false;
                            }
                        }else{
                            jsclick("text","我",true,2);
                        }
                    }else{
                        jsclick("id","ddl",true,2);
                        jsclick("id","o0",true,rd(3,5));
                        if(!jsclick("text","微信",false,2)){
                            back();
                        }
                    }
                    break;
                default:
                    log("可能没有启动设置");
                    back();
                    sleep(2000);
                    home();
                    sleep(2000);
                    break;
            }

        }else{
            active(my_app.packageName,5)
        }

        sleep(1000*2);
        Tips();
        time_line++
    }
}

function Tips(){
    log("查询弹窗");
    var textTips = {}
    textTips["允许"]="text";
    textTips["保存"]="text";
    for(var k in textTips){
        if (jsclick(textTips[k],k,true,2)){
            return false
        }
    }
    log('查询弹窗-end')
    return true
}

function info_read(){
    var d = textMatches(/微信号.*/).findOne(1000)
    if(d){
        var d = d.parent()
        if(d){
            var d= d.children()
            d.forEach(function(child,index){
                log(index,child.text());
            })
            info["nick_name"]=d[0].text();
            info["wechat_code"]=d[1].text();
            log(info);
            return true
        }
    }
}

// Tips()
// clearApp()

/*
    清除app数据，无需root权限
    备注:仅适用小米手机
    @author：飞云
    @packageName：包名
    返回值：Boolean，是否执行成功
*/
function clearApp() {
    var appName = "星巴克"
    var packageName = "com.starbucks.cn"

    let i = 0
    while (i < 10) {
        let activity = currentActivity()
        switch (activity) {
            case "com.miui.appmanager.ApplicationsDetailsActivity":
                if (click("清除数据")) {
                } else if (click("清除全部数据")) {
                } else if (click("确定")) {
                    desc("返回").click();
                    sleep(2000);
                    back();
                    sleep(2000);
                    return true
                }
                break;
            default:
                log("页面:other")
                back()  //返回
                if (!openAppSetting(packageName)) {
                    log("找不到应用，请检查packageName");
                }
                break;
        };
        i++;
        sleep(1000)
    }
    back();
}

//基础函数
function active(pkg,n){
    if(!n){n=5}
    if(  currentPackage() == pkg ){
       log("应用在前端");
       return true;
    }else{
        app.launch(pkg);
        sleep(1000*n);
    }
}
//准备点击
function click_(x,y){
    if(x>0 && x < 720 && y > 0 && y < 1440){
        click(x,y)
    }else{
        log('坐标错误')
    }
}
//点击obj
function click__(obj){
    click_(obj.bounds().centerX(),obj.bounds().centerY())
}
//普通封装
function jsclick(way,txt,clickKey,n){
    if(!n){n=1};//当n没有传值时,设置n=1
    var res = false;
    if(!clickKey){clickKey=false}; //如果没有设置点击项,设置为false
    if (way == "text"){
        res = text(txt).findOne(200);
    }else if(way == "id"){
        res = id(txt).findOne(200);
    }else if(way == "desc"){
        res = desc(txt).findOne(200);
    }
    if(res){
        if ( clickKey ){
            log('准备点击->',txt,"x:",res.bounds().centerX(),"y:",res.bounds().centerY());
            click__(res);
        }else{
            log("找到->",txt);
        }
        sleep(1000*n);
        return true;
    }else{
        // log("没有找到->",txt)
    }
}
//随机数
function rd(min,max){
    if (min<=max){
        return random(min,max)
    }else{
        return random(max,min)
    }
}
//输入密码
function input_pay_password(password){
    var key_xy = {}
    key_xy[1]=[device.width*0.3,device.height*7/10]
    key_xy[2]=[device.width*0.5,device.height*7/10]
    key_xy[3]=[device.width*0.8,device.height*7/10]
    key_xy[4]=[device.width*0.3,device.height*7.5/10]
    key_xy[5]=[device.width*0.5,device.height*7.5/10]
    key_xy[6]=[device.width*0.8,device.height*7.5/10]
    key_xy[7]=[device.width*0.3,device.height*8/10]
    key_xy[8]=[device.width*0.5,device.height*8/10]
    key_xy[9]=[device.width*0.8,device.height*8/10]
    key_xy[0]=[device.width*0.5,device.height*9/10]
    // 清除其它字符
    password = password.replace(/\D/g,"")
    for(var i=0;i<password.length;i++){
        var numbers = password.substring(i,i+1);
        click_(key_xy[numbers][0],key_xy[numbers][1])
        sleep(300)
    }
}

















