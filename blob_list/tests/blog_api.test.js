const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const helper = require('./test_helper')

const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})

  let blogObject = new Blog(helper.initialBlogs[0])
  await blogObject.save()

  blogObject = new Blog(helper.initialBlogs[1])
  await blogObject.save()
})

// supertest takes care that the application being tested is started at the port that it uses internally.
test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
}, 200000)

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('a specific blog is within the returned notes', async () => {
  const response = await api.get('/api/blogs')
  const titles = response.body.map(r => r.title)
  expect(titles).toContain(
    'React patterns'
  )
},200000)

test('a valid blog can be added', async () => {
  const newBlog = {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const blogsAfterMap = blogsAtEnd.map((r) => {
    return ({
      'title':r.title,
      'author':r.author,
      'url':r.url,
      'likes':r.likes
    })
  })

  expect(blogsAfterMap).toContainEqual(
    newBlog
  )
},200000)

test('if likes property is missing, it will default to the value 0', async () => {
  const newBlog = {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

  const blogsAfterMap = blogsAtEnd.map((r) => {
    return ({
      'title':r.title,
      'author':r.author,
      'url':r.url,
      'likes':r.likes
    })
  })

  expect(blogsAfterMap).toContainEqual(
    {
      ...newBlog,
      'likes':0
    }
  )
},200000)

test('blog without title is not added', async () => {
  const newBlogNoTitle = {
    'author': 'Wen',
    'url':'https://www.wen.com',
    'likes':100
  }

  await api
    .post('/api/blogs')
    .send(newBlogNoTitle)
    .expect(400)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
},200000)

test('blog without url is not added', async () => {
  const newBlogNoTitle = {
    'title':'Study in Helsinki Open University',
    'author': 'Wen',
    'likes':100
  }

  await api
    .post('/api/blogs')
    .send(newBlogNoTitle)
    .expect(400)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
},200000)

afterAll(async () => {
  await mongoose.connection.close()
})