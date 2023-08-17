const Blog = require('../models/blog')
const User = require('../models/user')

const initialUsers = [
  {
    username:'root',
    password:'sekret',
  },
  {
    username: 'mluukkai',
    name: 'Matti Luukkainen',
    password: 'salainen',
    blogs: [
      {
        title: 'React patterns',
        author: 'Michael Chan',
        url: 'https://reactpatterns.com/',
        likes: 7,
      },
      {
        title: 'Go To Statement Considered Harmful',
        author: 'Edsger W. Dijkstra',
        url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
        likes: 5,
      }
    ]
  }
]

const initialBlogs = [
  {
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
    user:{
      username: 'mluukkai',
      name: 'Matti Luukkainen'
    }
  },
  {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
    user:{
      username: 'mluukkai',
      name: 'Matti Luukkainen'
    }
  }
]

const nonExistingId = async () => {
  const blog = new Blog({ author: 'willremovethissoon' })
  await blog.save()
  await blog.deleteOne()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

module.exports = {
  initialUsers,
  initialBlogs,
  nonExistingId,
  blogsInDb,
  usersInDb
}