const mongoose = require('mongoose')

const DataSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalname: { type: String },
  tag: { type: String },
  file_size: { type: Number },
  created_at: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Data', DataSchema)
