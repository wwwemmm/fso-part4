const mongoose = require('mongoose')
const blogSchema = new mongoose.Schema({
  title: {
    type:String,
    minLength:1,
    required:true
  },
  author: String,
  url: {
    type:String,
    minLength:1,
    required:true
  },
  likes: Number
})

//If you define a model with the name Person, mongoose will automatically name the associated collection as people.
module.exports = mongoose.model('Blog', blogSchema)