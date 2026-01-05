const express = require('express')
const Data = require('../models/Data')

const router = express.Router()

router.get('/tags', async (req, res) => {
  try {
    const tags = await Data.distinct('tag')
    res.json({ tags: tags.filter(Boolean) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ tags: [] })
  }
})

module.exports = router
