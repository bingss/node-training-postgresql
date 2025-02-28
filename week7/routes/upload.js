const express = require('express')
const router = express.Router()
const config = require('../config/index')
const uploadController = require('../controllers/upload')
const logger = require('../utils/logger')('Upload')
const { dataSource } = require('../db/data-source')
const auth = require('../middlewares/auth')({
    secret: config.get('secret').jwtSecret,
    userRepository: dataSource.getRepository('User'),
    logger
})

//上傳圖片
router.post('/', auth, uploadController.postImage)

module.exports = router