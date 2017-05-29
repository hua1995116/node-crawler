/**
 * Created by Administrator on 2017/5/28.
 */
var fs = require('fs');
var request = require("request");
var cheerio = require("cheerio");
var async = require('async');

//目标网址
var url = 'http://www.ivsky.com/tupian/ziranfengguang/';

//本地存储目录
var dir = './images';

var setting = require('./setting');

var timeout = 100;
// 封装了一层函数
function fetchre(url) {
  requestall(url);
}
//发送请求
function requestall(url) {
  request({
    uri: url,
    headers: setting.header
  }, function (error, response, body) {
    if (error) {
      console.log(error);
    } else {
      console.log(response.statusCode);
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(body);
        var photos = [];
        $('img').each(function () {
          // 判断地址是否存在
          if ($(this).attr('src')) {
            var src = $(this).attr('src');
            var end = src.substr(-4, 4).toLowerCase();
            if (end == '.jpg' || end == '.gif' || end == '.png' || end == '.jpeg') {
              if (IsURL(src)) {
                photos.push(src);
              }
            }
          }
        });
        downloadImg(photos, dir, setting.download_v);
        // 递归爬虫
        $('a').each(function () {
          var murl = $(this).attr('href');
          if (IsURL(murl)) {
            setTimeout(function () {
              fetchre(murl);
            }, timeout);
            timeout += setting.ajax_timeout;
          } else {
            setTimeout(function () {
              fetchre("http://www.ivsky.com/" + murl);
            }, timeout);
            timeout += setting.ajax_timeout;
          }
        })
      }
    }
  });
}

// 下载图片
function downloadImg(photos, dir, asyncNum) {
  console.log("即将异步并发下载图片，当前并发数为:" + asyncNum);
  async.mapLimit(photos, asyncNum, function (photo, callback) {
    var filename = (new Date().getTime()) + photo.substr(-4, 4);
    if (filename) {
      console.log('正在下载' + photo);
      // 默认
      // fs.createWriteStream(dir + "/" + filename)
      // 防止pipe错误
      request(photo)
        .on('error', function (err) {
          console.log(err);
        })
        .pipe(fs.createWriteStream(dir + "/" + filename));
      console.log('下载完成');
      callback(null, filename);
    }
  }, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      console.log(" all right ! ");
      console.log(result);
    }
  })
}
// 判断是否为完整地址
function IsURL(str_url) {
  var strRegex = '^((https|http|ftp|rtsp|mms)?://)';
  var re = new RegExp(strRegex);
  if (re.test(str_url)) {
    return (true);
  } else {
    return (false);
  }
}

requestall(url);