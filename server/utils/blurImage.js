const sharp = require('sharp')
const { removeBackground: imglyRemoveBackground } = require('@imgly/background-removal-node')
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const unlink = promisify(fs.unlink)

/**
 * Blur the background of an image while keeping the main object sharp
 * Uses the same algorithm as the blur API endpoint
 * 
 * @param {Buffer} imageBuffer - The input image buffer
 * @param {number} blurRadius - Blur intensity (default: 10)
 * @returns {Promise<Buffer>} - The processed image buffer with blurred background
 */
async function blurImageBackground(imageBuffer, blurRadius = 20) {
  // Convert to PNG with alpha channel for processing
  const inputBuffer = await sharp(imageBuffer)
    .ensureAlpha()
    .png()
    .toBuffer()
  
  // Step 1: Remove background to get foreground mask
  console.log('Removing background...')
  let foregroundMask
  
  // Try with buffer first, fallback to file if needed
  try {
    console.log('Trying imgly with buffer...')
    const result = await imglyRemoveBackground(inputBuffer, {
      output: {
        type: 'foreground',
      },
      model: 'small', // Use small model for faster processing
    })
    
    // Convert Blob to Buffer (imgly returns Blob, Sharp needs Buffer)
    const blob = result.data || result
    if (!blob) {
      throw new Error('Background removal returned empty result')
    }
    
    foregroundMask = Buffer.from(await blob.arrayBuffer())
    console.log('Background removed successfully with buffer, mask size:', foregroundMask.length)
  } catch (bufferError) {
    console.log('Buffer approach failed, trying with file...')
    console.error('Buffer error:', bufferError.message)
    
    // Fallback to file approach
    const tempInputPath = path.resolve(__dirname, '..', 'uploads', `temp_input_${Date.now()}_${Math.random().toString(36).substring(7)}.png`)
    await writeFile(tempInputPath, inputBuffer)
    
    try {
      // Use absolute path and proper file:// URL format
      const absPath = path.resolve(tempInputPath)
      const fileUrl = `file://${absPath.replace(/\\/g, '/')}`
      console.log('Processing with imgly, file URL:', fileUrl)
      
      const result = await imglyRemoveBackground(fileUrl, {
        output: {
          type: 'foreground',
        },
        model: 'small',
      })
      
      // Convert Blob to Buffer (imgly returns Blob, Sharp needs Buffer)
      const blob = result.data || result
      if (!blob) {
        throw new Error('Background removal returned empty result')
      }
      
      foregroundMask = Buffer.from(await blob.arrayBuffer())
      console.log('Background removed successfully with file, mask size:', foregroundMask.length)
    } catch (fileError) {
      console.error('File approach also failed:', fileError.message)
      await unlink(tempInputPath).catch(() => {})
      throw new Error('Background removal failed: ' + bufferError.message)
    } finally {
      await unlink(tempInputPath).catch(() => {})
    }
  }

  // Step 2: Create blurred version of original image
  console.log('Blurring background...')
  const blurredBackground = await sharp(inputBuffer)
    .blur(blurRadius)
    .toBuffer()

  // Step 3: Extract foreground from original (sharp)
  const foreground = await sharp(inputBuffer)
    .composite([
      {
        input: foregroundMask,
        blend: 'dest-in' // Use mask to extract foreground
      }
    ])
    .toBuffer()

  // Step 4: Composite blurred background with sharp foreground
  console.log('Compositing final image...')
  const finalImage = await sharp(blurredBackground)
    .composite([
      {
        input: foreground,
        blend: 'over' // Overlay sharp foreground on blurred background
      }
    ])
    .png() // Output as PNG to preserve transparency if needed
    .toBuffer()

  return finalImage
}

module.exports = { blurImageBackground }
