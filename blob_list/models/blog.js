const mongoose = require('mongoose')
const blogSchema = new mongoose.Schema({
  title: String,
  author: String,
  url: String,
  likes: Number
})

//If you define a model with the name Person, mongoose will automatically name the associated collection as people.
module.exports = mongoose.model('Blog', blogSchema)