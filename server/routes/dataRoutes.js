const express = require('express')
const path = require('path')
const fs = require('fs')
const Data = require('../models/Data')

const router = express.Router()

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')

router.get('/data', async (req, res) => {
  try {
    const q = {}
    if (req.query.tag) q.tag = req.query.tag
    const docs = await Data.find(q).sort({ created_at: -1 }).lean()
    const data = docs.map(d => ({
      id: d._id,
      filename: d.originalname,
      tag: d.tag,
      file_size: d.file_size,
      created_at: d.created_at
    }))
    res.json({ data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ data: [] })
  }
})

router.get('/data/:id', async (req, res) => {
  try {
    const doc = await Data.findById(req.params.id).lean()
    if (!doc) return res.status(404).send('Not found')
    const filePath = path.join(UPLOAD_DIR, doc.filename)
    if (!fs.existsSync(filePath)) return res.status(404).send('File missing')
    res.sendFile(filePath)
  } catch (err) {
    console.error(err)
    res.status(500).send('Server error')
  }
})

// delete single data item and its file
router.delete('/data/:id', async (req, res) => {
  try {
    const doc = await Data.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    const filePath = path.join(UPLOAD_DIR, doc.filename)
    // remove file if exists
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch (e) {
      console.error('Failed to remove file', e)
    }
    await Data.deleteOne({ _id: req.params.id })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
