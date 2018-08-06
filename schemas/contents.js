
var mongoose = require('mongoose')

module.exports = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  title: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  addTime: {
    type: Date,
    default: new Date()
  },
  views: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  //内容
  content: {
    type: String,
    default: ''
  },

  //评论
  comments: {
    type: Array,
    default: []
  }
})