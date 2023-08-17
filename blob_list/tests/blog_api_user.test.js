const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const helper = require('./test_helper')

const bcrypt = require('bcrypt')
const User = require('../models/user')
const Blog = require('../models/blog')
//...

beforeEach(async () => {
  await User.deleteMany({})
  await Blog.deleteMany({})
  for (let user of helper.initialUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10)
    const newUser = new User({
      username:user.username,
      name:user.name,
      passwordHash:passwordHash,
      blogs:[]
    })
    await newUser.save()
  }

  for (let blog of helper.initialBlogs) {
    const user = await User.findOne({ username: 'mluukkai' })
    const newBlog = new Blog({
      title: blog.title,
      author: blog.author,
      url: blog.url,
      likes: blog.likes,
      user: user._id
    })
    const savedBlog = await newBlog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
  }
}, 200000)

describe('having unique id', () => {
  test('the unique identifier property of the blog posts is named id', async () => {
    const blogsAtEnd = await helper.blogsInDb()
    const id = blogsAtEnd.map((r) => {
      expect(r.id).toBeDefined()
      return r.title})

    expect(new Set(id).size).toBe(id.length)
  },200000)
})

describe('two users and two blogs at the start', () => {

  test('two users', async () => {
    const usersAtStart = await helper.usersInDb()
    expect(usersAtStart).toHaveLength(helper.initialUsers.length)
    expect(helper.initialUsers[1].username).toEqual(usersAtStart[1].username)
  },200000)

  test('two blogs', async () => {
    const blogsAtStart = await helper.blogsInDb()
    expect(blogsAtStart).toHaveLength(helper.initialBlogs.length)
    expect(helper.initialBlogs[1].title).toEqual(blogsAtStart[1].title)
  },200000)

  test('the second users have two blogs', async () => {
    const usersAtStart = await helper.usersInDb()
    expect(usersAtStart[1].blogs.length).toEqual(helper.initialUsers[1].blogs.length)
  },200000)

})

describe('blogs and users populate', () => {

  test('blogs  show the users info', async () => {
    const result = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogs = result.body
    expect(blogs[0].user.username).toEqual(helper.initialBlogs[0].user.username)
  },200000)

  test('users show the blogs info', async () => {
    const result = await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const users = result.body
    expect(users[1].blogs[0].title).toEqual(helper.initialUsers[1].blogs[0].title)
  },200000)

})

describe('addition of a new user', () => {
  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'wwwemmm',
      name: 'Meiqi Wen',
      password: 'helloworld',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  },200000)

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('expected `username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  },200000)

  test('creation fails if lacking password property', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'superhero',
      name: 'Superuser',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`password` is required')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  },200000)

  test('creation fails if the length of password is shorter than 3', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'superhero',
      name: 'Superuser',
      password:'he'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('(he) is shorter than the minimum allowed length (3).')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  },200000)

  test('creation fails if lacking username property', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      name: 'Superuser',
      password: 'helloworld'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` is required')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  },200000)

  test('creation fails if the length of usename is shorter than 3', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'su',
      name: 'Superuser',
      password: 'helloworld',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('(`su`) is shorter than the minimum allowed length (3)')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  },200000)

})

describe('user login', () => {

  test('user login with wrong password will fail', async () => {
    const user = {
      'username': 'root',
      'password': 'mypassword'
    }

    const result = await api
      .post('/api/login')
      .send(user)
      .expect(401)

    expect(result.body.error).toContain('invalid username or password')

  },200000)

  test('user login with wrong usename will fail', async () => {
    const user = {
      'username': 'mluukkai_1',
      'password': 'salainen'
    }

    const result = await api
      .post('/api/login')
      .send(user)
      .expect(401)

    expect(result.body.error).toContain('invalid username or password')

  },200000)

  test('user login with right username and password recieve token', async () => {
    const user = {
      'username': 'mluukkai',
      'password': 'salainen'
    }

    const result = await api
      .post('/api/login')
      .send(user)
      .expect(200)

    expect(result.body.username).toEqual('mluukkai')
    expect(result.body.token).toBeDefined()

  },200000)
})

describe('when user have right token and add blogs', () => {
  const getToken = async () => {
    const user = {
      'username': 'mluukkai',
      'password': 'salainen'
    }
    const result = await api
      .post('/api/login')
      .send(user)
    console.log(result.body.token)
    return result.body.token
  }

  test('a valid blog can be added', async () => {
    const token = await getToken()
    const newBlog = {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
      likes: 12,
    }
    await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${token}`)
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
    const token = await getToken()
    const newBlog = {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    }

    await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${token}`)
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
    const token = await getToken()
    const newBlogNoTitle = {
      'author': 'Wen',
      'url':'https://www.wen.com',
      'likes':100
    }

    await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${token}`)
      .send(newBlogNoTitle)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  },200000)

  test('blog without url is not added', async () => {
    const token = await getToken()
    const newBlogNoUrl = {
      'title':'Study in Helsinki Open University',
      'author': 'Wen',
      'likes':100
    }

    await api
      .post('/api/blogs')
      .set('authorization', `Bearer ${token}`)
      .send(newBlogNoUrl)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  },200000)

})

describe('when user have right token then delete or updata a blog', () => {
  const getToken = async () => {
    const user = {
      'username': 'mluukkai',
      'password': 'salainen'
    }
    const result = await api
      .post('/api/login')
      .send(user)
    console.log(result.body.token)
    return result.body.token
  }

  test('a blog can be deleted', async () => {
    const token = await getToken()
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('authorization', `Bearer ${token}`)
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

  test('a blog can be update', async () => {
    const token = await getToken()
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    const blogInUpdate = {
      'title': blogToUpdate.title,
      'author': blogToUpdate.author,
      'url':'Unknown',
      'likes':blogToUpdate.likes + 100
    }

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(blogInUpdate)
      .set('authorization', `Bearer ${token}`)
      .expect(200)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    const blogAfterUpdate = blogsAtEnd[0]

    expect(blogAfterUpdate.id).toBe(blogToUpdate.id)
    expect(blogAfterUpdate.title).toBe(blogToUpdate.title)
    expect(blogAfterUpdate.author).toBe(blogToUpdate.author)
    expect(blogAfterUpdate.url).toBe('Unknown')
    expect(blogAfterUpdate.likes).toBe(blogToUpdate.likes + 100)
  },200000)
})

describe('when user don\'t have token, cann\'t add, delete or update blogs', () => {

  test('a blog can\'t add', async () => {
    //const token = await getToken()
    const blogsAtStart = await helper.blogsInDb()
    const newBlog = {
      title: 'Canonical string reduction',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    }

    const result = await api
      .post('/api/blogs')
      //.set('authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('lack of token')
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toEqual(blogsAtStart)
  },200000)

  test('a blog can not be deleted without token', async () => {
    //const token = await getToken()
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    const result = await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(401)

    expect(result.body.error).toContain('lack of token')
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtStart.length).toEqual(blogsAtEnd.length)

  },200000)

  test('a blog can not be update without token', async () => {
    //const token = await getToken()
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    const blogInUpdate = {
      'title': blogToUpdate.title,
      'author': blogToUpdate.author,
      'url':'Unknown',
      'likes':blogToUpdate.likes + 100
    }

    const result = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(blogInUpdate)
      //.set('authorization', `Bearer ${token}`)
      .expect(401)

    expect(result.body.error).toContain('lack of token')
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtStart.length).toEqual(blogsAtEnd.length)
    expect(blogsAtEnd).toEqual(blogsAtStart)
  },200000)

})

describe('when user have wrong token, cann\'t delete or update blogs', () => {
  const getToken = async () => {
    const user = {
      'username': 'root',
      'password': 'sekret'
    }
    const result = await api
      .post('/api/login')
      .send(user)
    console.log(result.body.token)
    return result.body.token
  }

  test('a blog can not be deleted without token', async () => {
    const token = await getToken()
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    const result = await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('authorization', `Bearer ${token}`)
      .expect(401)

    expect(result.body.error).toContain('token don\'t have right to delete the blog')
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtStart.length).toEqual(blogsAtEnd.length)

  },200000)

  test('a blog can not be update without token', async () => {
    const token = await getToken()
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    const blogInUpdate = {
      'title': blogToUpdate.title,
      'author': blogToUpdate.author,
      'url':'Unknown',
      'likes':blogToUpdate.likes + 100
    }

    const result = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(blogInUpdate)
      .set('authorization', `Bearer ${token}`)
      .expect(401)

    expect(result.body.error).toContain('token don\'t have right to update the blog')
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtStart.length).toEqual(blogsAtEnd.length)
    expect(blogsAtEnd).toEqual(blogsAtStart)
  },200000)

})

afterAll(async () => {
  await mongoose.connection.close()
})