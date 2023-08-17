const logger = require('./logger')
const morgan = require('morgan')
const morganFormat = ':method :url :status :res[content-length] - :response-time ms :post-body'
const User = require('../models/user')
const jwt = require('jsonwebtoken')

morgan.token('post-body', (req) => {
  if (req.method === 'POST') {
    return JSON.stringify(req.body)
  }
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
const errorHandler = (error, request, response, next) => {
  logger.error(error.message)
  logger.error(error.name)
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name ===  'JsonWebTokenError') {
    return response.status(401).json({ error: error.message })
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({
      error: 'token expired'
    })
  }
  next(error)
}


const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

const tokenExtractor = (request, response, next) => {
  // code that extracts the token
  const token = getTokenFrom(request)
  request.token = token
  next()
}

const userExtractor = async (request, response, next) => {
  // code that extracts the token
  if (!request.token) {
    return response.status(401).json({ error: 'lack of token' })
  }
  const decodedToken = jwt.verify(request.token, process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }
  request.user = await User.findById(decodedToken.id)

  next()
}


module.exports = {
  morganFormat,
  customPostBodyToken: 'post-body',
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor
}