const exec = require("child_process").exec;


let cmd =`cd F:/myGithub/batchJs2Dex/jsList && dx --dex --output =aaa.dex  aaa.class && dx --dex --output =bbb.dex  bbb.class && dx --dex --output =ccc.dex  ccc.class`
exec(cmd, function (err){
  console.log(err)
});
