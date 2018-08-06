var express = require('express')
var router = express.Router()

var Category = require('../models/Category')
var Content = require('../models/Content')
var data
router.use(function (req, res, next) {
  data = {
    userInfo: req.userInfo,
    categories: []
  }

  Category.find().then(function(categories) {
    data.categories = categories;
    next();
  });
});

router.get('/', function (req, res, next) {

  data.page = Number(req.query.page || 1)
  data.limit = 3
  data.pages = 0
  data.count = 0
  data.category = req.query.category || ''

  var where = {};
  if (data.category) {
    where.category = data.category
  }

  Category.find()
    .then(function (rs) {
      data.categories = rs
      return Content.where(where).count()
    })
    .then(function (count) {
      data.count = count
      data.pages= Math.ceil(count / data.limit)
      data.page = Math.min( data.page, data.pages );
      data.page = Math.max( data.page, 1 );
      var skip = (data.page - 1) * data.limit
      return Content.where(where).find().sort({ addTime: -1 }).skip(skip).limit(data.limit).populate(['category', 'user'])
    })
    .then(function (contents) {
      data.contents = contents
      res.render('main/index', data)
    })
})

router.get('/view', function (req, res, next) {
  data.content = {}
  var contentid = req.query.contentid || ''
  Content.findOne({ _id: contentid }).populate(['category', 'user'])
    .then(function (content) {
      data.content = content
      content.views++;
      content.save();
      res.render('main/view', data)
    })
})


module.exports = router