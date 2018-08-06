var express = require('express')
var app = express()
var swig = require('swig')
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
var Cookies = require('cookies');
var User = require('./models/User')
app.use(bodyParser.urlencoded({ extended: true }))
app.use( '/public', express.static('public') )

app.set('view engine','html')
app.engine('html', swig.renderFile)
app.set('views', './views')
swig.setDefaults({cache: false})

app.use(function (req, res, next) {
  req.cookies = new Cookies(req, res)
  req.userInfo = {};
  if (req.cookies.get('userinfo')) {
    try {
      req.userInfo = JSON.parse(req.cookies.get('userinfo'));
      User.findOne({ _id: req.userInfo._id })
        .then(function (userinfo) {
          req.userInfo.isAdmin = Boolean(userinfo.isAdmin);
          next();
        })
    }
    catch (e) {
      next()
    }
  } else {
    next()
  }
})

app.use('/admin', require('./routers/admin'));
app.use('/api', require('./routers/api'));
app.use('/', require('./routers/main'));

mongoose.connect('mongodb://localhost:27018/blog', function (err) {
  if (err) {
    console.log('数据库连接失败');
  } else {
    console.log('数据库连接成功');
    app.listen(8081);
  }
})
// app.listen(3000)
