var express = require('express')
var router = express.Router()
var User = require('../models/User')
var Content = require('../models/Content')

var responseData
router.use(function (req, res, next) {
  responseData = {
    code: 0,
    message: ''
  }
  next()
})

/*
* 注册
* */

router.post('/user/register', function (req, res, next) {
  console.log(req.body)
  var params = req.body
  if (!params.username) {
    responseData.code = 1
    responseData.message = '用户名不能为空'
    res.json(responseData)
    return
  }
  if (!params.password) {
    responseData.code = 2
    responseData.message = '密码不能为空'
    res.json(responseData)
    return
  }
  if (params.password != params.repassword) {
    responseData.code = 3
    responseData.message = '两次输入密码不一致'
    res.json(responseData)
    return
  }

  User.findOne({ username: params.username })
    .then(function (userinfo) {
      if (userinfo) {
        responseData.code = 4
        responseData.message = '用户名已被注册'
        res.json(responseData)
        return
      }
      var user = new User({
        username: params.username,
        password: params.password
      })
      return user.save()
    })
    .then(function (newUserinfo) {
      responseData.message = '注册成功'
      res.json(responseData)
    })
})
/*
* 登入
* */
router.post('/user/login', function (req, res, next) {
  var username = req.body.username
  var password = req.body.password
  if (!username) {
    responseData.code = 1
    responseData.message = '用户名不能为空'
    res.json(responseData)
    return
  }
  if (!password) {
    responseData.code = 2
    responseData.message = '密码不能为空'
    res.json(responseData)
    return
  }
  User.findOne({ username: username, password: password })
    .then(function (value) {
      if (!value) {
        responseData.code = 3
        responseData.message = '用户名或密码错误'
        res.json(responseData)
        return
      }
      responseData.message = '登入成功'
      responseData.userInfo = {
        _id: value._id,
        username: value.username
      }
      req.cookies.set('userinfo', JSON.stringify({
        _id: value._id,
        username: value.username
      }))
      res.json(responseData)
      return
    })
})
/*
* 退出
* */
router.get('/user/logout', function (req, res) {
  req.cookies.set('userinfo', null)
  res.json(responseData)
})

router.post('/comment/post', function (req, res) {
  var contentId = req.body.contentid || ''
  var postData = {
    username: req.userInfo.username,
    postTime: new Date(),
    content: req.body.content
  }
  if (!postData.content) {
    responseData.code = 1
    responseData.message = '内容不能为空'
    res.json(responseData)
    return
  }
  Content.findOne({ _id: contentId })
    .then(function (content) {
      content.comments.push(postData);
      return content.save();
    })
    .then(function(newContent) {
      responseData.message = '评论成功';
      responseData.data = newContent;
      res.json(responseData);
    });
})

router.get('/comment', function (req, res, next) {
  var contentid = req.query.contentid || ''
  Content.findOne({ _id: contentid })
    .then(function (content) {
      responseData.data = content.comments;
      res.json(responseData);
    })
})

module.exports = router