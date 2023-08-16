const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const helper = require('./test_helper')

const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})

  for (let blog of helper.initialBlogs) {
    let blogObject = new Blog(blog)
    await blogObject.save()
  }
  //console.log('done')
})

// supertest takes care that the application being tested is started at the port that it uses internally.
test('blogs are returned as json', async () => {
  //console.log('entered test')
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
}, 200000)

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')
  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('a specific blog is within the returned blogs', async () => {
  const response = await api.get('/api/blogs')
  const titles = response.body.map(r => r.title)
  expect(titles).toContain(
    'React patterns'
  )
},200000)

test('the unique identifier property of the blog posts is named id', async () => {
  const blogsAtEnd = await helper.blogsInDb()
  const id = blogsAtEnd.map((r) => {
    expect(r.id).toBeDefined()
    return r.title})

  expect(new Set(id).size).toBe(id.length)
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

test('a blog can be deleted by iD', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

  const blogsAtEndMap = blogsAtEnd.map((r) => {
    return ({
      'title':r.title,
      'author':r.author,
      'url':r.url,
      'likes':r.likes
    })
  })

  expect(blogsAtEndMap).not.toContainEqual(
    {
      'title':blogToDelete.title,
      'author':blogToDelete.author,
      'url':blogToDelete.url,
      'likes':blogToDelete.likes
    }
  )
},200000)

afterAll(async () => {
  await mongoose.connection.close()
})