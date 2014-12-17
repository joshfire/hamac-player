var exec = require('child_process').exec;
var loopCb;
var timeoutId;

function readADC(callback) {
  exec('python ./readADC.py', function (err, stdout) {
    if (err) {
      callback(err);
      return;
    }
    var level = parseInt(stdout, 10);
    if (isNaN(level)) {
      level = 0;
    }
    callback(null, level);
  });
}

function readADCLoop() {
  readADC(function (err, level) {
    loopCb(err, level);
    timeoutId = setTimeout(readADCLoop, 200);
  });
}

module.exports = {
  run : function (cb) {
    loopCb = cb;
    readADCLoop();
  },
  stop : function () {
    clearTimeout(timeoutId);
  }
};
