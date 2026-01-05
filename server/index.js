const express = require('express')
const cors = require('cors')

// connect to mongoose
require('./db')

const api = require('./routes/api')

const app = express()
app.use(cors())
app.use(express.json())

// mount API routes
app.use('/', api)

const PORT = process.env.PORT || 8000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
const mongoose = require('mongoose')
// const MONGO_URI = 'mongodb://127.0.0.1:27017/data_labeling'
require('dotenv').config()
const MONGO_URI = process.env.MONGO_URI

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err))

module.exports = mongoose
