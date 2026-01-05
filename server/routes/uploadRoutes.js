const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Data = require('../models/Data')
const { blurImageBackground } = require('../utils/blurImage')

const router = express.Router()

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR)

// Use memory storage so we can process the image before saving
const storage = multer.memoryStorage()
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'))
    }
  }
})

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded')
    
    // Get blur radius from request (optional, default: 10)
    const blurRadius = parseInt(req.body.blurRadius) || 10
    
    console.log('Processing uploaded image with background blur...')
    
    // Process the image: blur the background
    const blurredImageBuffer = await blurImageBackground(req.file.buffer, blurRadius)
    
    // Generate filename for the blurred image based on provided name or original name.
    const ext = path.extname(req.file.originalname) || '.png'
    const provided = (req.body && req.body.filename) ? String(req.body.filename) : ''
    const baseRaw = provided ? path.basename(provided, path.extname(provided) || ext) : path.basename(req.file.originalname, ext)
    // sanitize base: replace spaces with underscore and remove problematic chars
    const base = baseRaw.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '') || 'file'

    const makeCandidate = (n) => n === 0 ? `${base}${ext}` : `${base}_${n}${ext}`
    let counter = 0
    let filename = makeCandidate(counter)
    let filePath = path.join(UPLOAD_DIR, filename)
    while (fs.existsSync(filePath)) {
      counter += 1
      filename = makeCandidate(counter)
      filePath = path.join(UPLOAD_DIR, filename)
    }
    
    // Save the blurred image to disk
    await fs.promises.writeFile(filePath, blurredImageBuffer)
    
    console.log('Blurred image saved:', filename)
    
    // Save metadata to database
    const doc = new Data({
      filename: filename,
      originalname: req.file.originalname,
      tag: req.body.tag,
      file_size: blurredImageBuffer.length // Use processed image size
    })
    await doc.save()
    
    res.json({
      id: doc._id,
      filename: doc.filename,
      originalname: doc.originalname,
      tag: doc.tag,
      file_size: doc.file_size,
      created_at: doc.created_at
    })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ 
      error: 'Upload error', 
      message: err.message 
    })
  }
})

module.exports = router
