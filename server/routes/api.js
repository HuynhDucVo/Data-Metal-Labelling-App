const express = require('express')

const uploadRoutes = require('./uploadRoutes')
const getRoutes = require('./getRoutes')
const dataRoutes = require('./dataRoutes')
const blurRoutes = require('./blurRoutes')

const router = express.Router()

router.use('/', uploadRoutes)
router.use('/', getRoutes)
router.use('/', dataRoutes)
router.use('/api', blurRoutes)

module.exports = router
