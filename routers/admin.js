var express = require('express')
var router = express.Router()
var User = require('../models/User')
var Category = require('../models/Category')
var Content = require('../models/Content')
router.use(function (req, res, next) {
  if (!req.userInfo.isAdmin) {
    // 如果当前用户是非管理员
    res.send('对不起，只有管理员才可以进入后台管理')
    return
  }
  next()
})


router.get('/', function(req, res, next) {
  res.render('admin/index', {
    userInfo: req.userInfo
  })
})

router.get('/user', function(req, res, next) {
  var length = 3
  var page = Number(req.query.page || 1)

  User.count().then(function (count) {
    var max= Math.ceil(count / length)
    if (page < 1) {
      page = 1
    } else if (page > max) {
      page = max
    }

    User.find().skip(length*(page-1)).limit(length)
      .then(function (users) {
        res.render('admin/user_index', {
          userInfo: req.userInfo,
          users: users,
          page: page,
          limit: length,
          count: count,
          pages: max
        })
      })
  })
})

router.get('/category', function(req, res, next) {
  var length = 3
  var page = Number(req.query.page || 1)

  Category.count().then(function (count) {
    var pages= Math.ceil(count / length)
    page = Math.min( page, pages );
    page = Math.max( page, 1 );

    Category.find().sort({_id: -1}).skip(length*(page-1)).limit(length)
      .then(function (categories) {
        res.render('admin/category_index', {
          userInfo: req.userInfo,
          categories: categories,
          page: page,
          limit: length,
          count: count,
          pages: pages
        })
      })
  })
})

router.get('/category/add', function(req, res, next) {
  res.render('admin/category_add', {
    userInfo: req.userInfo
  })
})

router.post('/category/add', function(req, res, next) {
  if (!req.body.name) {
    res.render('admin/error', {
      userInfo: req.userInfo,
      message: '名称不能为空'
    });
    return
  }
  Category.findOne({name: req.body.name})
    .then(function (value) {
      if (value) {
        res.render('admin/error', {
          userInfo: req.userInfo,
          message: '分类已经存在了'
        })
        throw 'error: 分类已经存在了'
      } else {
        return new Category({
          name: req.body.name
        }).save();
      }
    })
    .then(function (value) {
      res.render('admin/success', {
        userInfo: req.userInfo,
        message: '分类保存成功',
        url: '/admin/category'
      });
    })
    .catch(function (e) {
      console.log(e)
    })
})

router.get('/category/edit', function (req, res, next) {
  Category.findOne({ _id: req.query.id })
    .then(function (rs) {
      if (!rs) {
        res.render('admin/error', {
          userInfo: req.userinfo,
          message: '分类信息不存在'
        })
      } else {
        res.render('admin/category_edit', {
          userInfo: req.userinfo,
          category: rs
        })
      }
    })
})
router.post('/category/edit', function (req, res, next) {
  var id = req.query.id || '';
  var name = req.body.name || '';
  Category.findOne({ _id: id })
    .then(function (rs) {
      if (!rs) {
        res.render('admin/error', {
          userInfo: req.userinfo,
          message: '分类信息不存在'
        })
        return Promise.reject();
      } else {
        if (name == rs.name) {
          res.render('admin/success', {
            userInfo: req.userInfo,
            message: '修改成功',
            url: '/admin/category'
          });
          return Promise.reject();
        } else {
          return Category.findOne({
            _id: {$ne: id},
            name: name
          });
        }
      }
    })
    .then(function (sameCategory) {
      if (sameCategory) {
        res.render('admin/error', {
          userInfo: req.userInfo,
          message: '数据库中已经存在同名分类'
        });
        return Promise.reject();
      } else {
        return Category.update({
          _id: id
        }, {
          name: name
        });
      }
    })
    .then(function() {
      res.render('admin/success', {
        userInfo: req.userInfo,
        message: '修改成功',
        url: '/admin/category'
      });
    })
})
router.get('/category/delete', function (req, res, next) {
  var id = req.query.id || ''
  Category.findOne({_id: id})
    .then(function (category) {
      if (!category) {
        res.render('admin/error', {
          userInfo: req.userInfo,
          message: '数据库中不存在该数据'
        });
        return Promise.reject();
      } else {
        Category.remove({ _id: id })
          .then(function (value) {
            res.render('admin/success', {
              userInfo: req.userInfo,
              message: '删除成功',
              url: '/admin/category'
            });
          })
      }
    })
    .then(function (value) {
    })
})

router.get('/content', function (req,res,next) {
  var length = 3
  var page = Number(req.query.page || 1)

  Content.count().then(function (count) {
    var pages= Math.ceil(count / length)
    page = Math.min( page, pages );
    page = Math.max( page, 1 );

    Content.find().sort({_id: -1}).skip(length*(page-1)).limit(length).populate(['category', 'user']).populate()
      .then(function (contents) {
        res.render('admin/content_index', {
          userInfo: req.userInfo,
          contents: contents,
          page: page,
          limit: length,
          count: count,
          pages: pages
        })
      })
  })
})

router.get('/content/add', function (req,res,next) {
  Category.find()
    .then(function (categories) {
      res.render('admin/content_add', {
        userInfo: res.userInfo,
        categories: categories
      })
    })
})

router.post('/content/add', function (req,res,next) {
  if (!req.body.category) {
    res.render('admin/error', {
      userInfo: req.userInfo,
      message: '内容分类不能为空'
    })
    return;
  } else if (!req.body.title) {
    res.render('admin/error', {
      userInfo: req.userInfo,
      message: '内容标题不能为空'
    })
    return;
  }

  new Content({
    category: req.body.category,
    title: req.body.title,
    description: req.body.description,
    content: req.body.content,
    user: req.userInfo._id
  }).save().then(function (value) {
    res.render('admin/success', {
      userInfo: req.userInfo,
      message: '保存成功',
      url: '/admin/content'
    })
  })

})

router.get('/content/edit', function (req,res,next) {
  var id = req.query.id || '';
  var categories = []
  Category.find()
    .then(function (rs) {
      categories = rs
      return Content.findOne({_id: id}).populate('category')
    })
    .then(function (content) {
      if (!content) {
        res.render('admin/error', {
          userInfo: req.userInfo,
          message: '内容信息不存在'
        })
        return Promise.reject();
      } else {
        res.render('admin/content_edit', {
          userInfo: res.userInfo,
          content: content,
          categories: categories
        })
        return
      }
    })

})

router.post('/content/edit', function (req,res,next) {
  var id = req.query.id || '';
  Content.findOne({_id:id}).then(function (content) {
    if (!content) {
      res.render('admin/error', {
        userInfo: req.userinfo,
        message: '内容信息不存在'
      })
      return Promise.reject();
    } else {
      if (!req.body.category) {
        res.render('admin/error', {
          userInfo: req.userInfo,
          message: '内容分类不能为空'
        })
        return Promise.reject();
      } else if (!req.body.title) {
        res.render('admin/error', {
          userInfo: req.userInfo,
          message: '内容标题不能为空'
        })
        return Promise.reject();
      } else {
        Content.update({ _id: id }, {
          category: req.body.category,
          title: req.body.title,
          description: req.body.description,
          content: req.body.content
        }).then(function () {
          res.render('admin/success', {
            userInfo: req.userInfo,
            message: '内容保存成功',
            url: '/admin/content/edit?id=' + id
          })
        })
      }
    }
  })
})

router.get('/content/delete', function (req, res, next) {
  var id = req.query.id || ''
  Content.remove({
    _id: id
  }).then(function() {
    res.render('admin/success', {
      userInfo: req.userInfo,
      message: '删除成功',
      url: '/admin/content'
    })
  })
})

module.exports = router