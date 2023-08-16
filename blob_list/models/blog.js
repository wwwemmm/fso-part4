const mongoose = require('mongoose')
const blogSchema = new mongoose.Schema({
  title: {
    type:String,
    //minLength:1,
    required:true
  },
  author: String,
  url: {
    type:String,
    //minLength:1,
    required:true
  },
  likes: Number,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

blogSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    // Even though the _id property of Mongoose objects looks like a string, it is in fact an object.
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

//If you define a model with the name Person, mongoose will automatically name the associated collection as people.
module.exports = mongoose.model('Blog', blogSchema)