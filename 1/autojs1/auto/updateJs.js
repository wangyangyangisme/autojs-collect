"auto"
var MyUrl = require("./MyUrl.js");
var myUrl = new MyUrl();

var storage = storages.create(myUrl.nongshang);

var url = myUrl.baseUrl + "sysSetting/version";

r = http.get(url);
var str = r.body.json();
var newVer = str.data

var ver = storage.get(myUrl.nsvertion)

if (newVer == ver) {
    log("freestar 相同")
} else {
    log("不同")
    var url = myUrl.baseUrl + "sysSetting/content";
    r = http.get(url);
    var str = r.body.json();
    // log(str.status)
    if (str.status == '200') {
        str.data.forEach(element => {

            var path = "/sdcard/脚本/" + element.name;
            files.createWithDirs(path);
            files.write(path, element.content)

        });

        storage.put(myUrl.nsvertion, newVer)

    }

}


// var file = "/sdcard/AutoFile/version.txt";

// files.read("/sdcard/AutoFile/version.txt")

// files.createWithDirs(file)
// files.write(file, "2020-04-25 12:23:58");