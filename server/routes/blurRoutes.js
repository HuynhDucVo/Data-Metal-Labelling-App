const express = require('express')
const multer = require('multer')
const path = require('path')
const { blurImageBackground } = require('../utils/blurImage')

const router = express.Router()

// Configure multer for temporary file storage
const storage = multer.memoryStorage() // Use memory storage for processing
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

/**
 * POST /api/blur-background
 * Upload an image and blur its background while keeping the main object sharp
 * 
 * Body: multipart/form-data
 * - file: Image file to process
 * - blurRadius: (optional) Blur radius (default: 10)
 * 
 * Returns: Processed image as buffer with appropriate content-type
 */
router.post('/blur-background', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const blurRadius = parseInt(req.body.blurRadius) || 10
    
    // Use the shared blur function
    const finalImage = await blurImageBackground(req.file.buffer, blurRadius)

    // Set appropriate headers and send the image
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': finalImage.length
    })
    
    res.send(finalImage)

  } catch (error) {
    console.error('Error processing image:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      error: 'Failed to process image', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

/**
 * POST /api/blur-background-base64
 * Alternative endpoint that returns base64 encoded image
 * Useful for frontend integration
 */
router.post('/blur-background-base64', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const blurRadius = parseInt(req.body.blurRadius) || 10
    
    // Use the shared blur function
    const finalImage = await blurImageBackground(req.file.buffer, blurRadius)

    // Convert to base64
    const base64Image = finalImage.toString('base64')
    const dataUrl = `data:image/png;base64,${base64Image}`

    res.json({
      success: true,
      image: dataUrl,
      size: finalImage.length
    })

  } catch (error) {
    console.error('Error processing image:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      error: 'Failed to process image', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

module.exports = router
