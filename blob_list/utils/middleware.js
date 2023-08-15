const logger = require('./logger')
const morgan = require('morgan')
const morganFormat = ':method :url :status :res[content-length] - :response-time ms :post-body'

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
  }
  next(error)
}

module.exports = {
  morganFormat,
  customPostBodyToken: 'post-body',
  unknownEndpoint,
  errorHandler
}