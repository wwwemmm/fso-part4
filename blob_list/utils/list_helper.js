const _ = require('lodash')
const dummy = (blogs) => {
  //console.log(blogs)
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (sum, blog) => {
    return sum + blog.likes
  }
  return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  let max_likes = 0
  let faveriteblog = null
  blogs.forEach(blog => {
    if(blog.likes > max_likes){
      max_likes = blog.likes
      faveriteblog = blog}
  })
  return faveriteblog
}

const mostBlogs = (blogs) => {
  const groupedByAuthor =_.groupBy(blogs, 'author')
  //console.log(groupedByAuthor)
  let max_blogs = 0
  let authorsMaxBlogs = null
  _.forEach(groupedByAuthor, (value,key) => {
    if (value.length > max_blogs){
      max_blogs = value.length
      authorsMaxBlogs = key
    }
  })

  return {
    'author':authorsMaxBlogs,
    'blogs':max_blogs
  }
}

const mostLikes = (blogs) => {
  const groupedByAuthor =_.groupBy(blogs, 'author')
  let result = []
  _.forEach(groupedByAuthor, (value, key) => {
    const likes = _.reduce(value, (acc, blog) => acc+blog.likes, 0)
    result.push({ 'author':key, 'likes':likes })
  })
  //console.log(result)
  return _.orderBy(result,['likes'],['desc'])[0]
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}