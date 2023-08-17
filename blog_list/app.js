// config should be imported before the Person model is imported.
const config = require('./utils/config')
const express = require('express')
//introduce 'express-async-errors' before you import your route in app.js
require('express-async-errors')
const app = express()
const cors = require('cors')
const usersRouter = require('./controllers/users')
const blogsRouter = require('./controllers/blogs')
const loginRouter = require('./controllers/login')
const middleware = require('./utils/middleware')
const morgan = require('morgan')
const logger = require('./utils/logger')
const mongoose = require('mongoose')

mongoose.set('strictQuery', false)
logger.info('connecting to', config.MONGODB_URI)
mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connecting to MongoDB:', error.message)
  })

app.use(cors())
app.use(express.json())


app.use(morgan(middleware.morganFormat, { postBody: middleware.customPostBodyToken }))
app.use(middleware.tokenExtractor)
app.use('/api/login', loginRouter)
app.use('/api/users', usersRouter)
app.use('/api/blogs', blogsRouter)


app.use(middleware.unknownEndpoint)
// this has to be the last loaded middleware.
app.use(middleware.errorHandler)

module.exports = app





