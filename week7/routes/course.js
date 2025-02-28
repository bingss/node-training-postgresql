const express = require('express')
const router = express.Router()
const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Course')
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository('User'),
  logger
})
const courseController = require('../controllers/course')

//取得課程列表
router.get('/', courseController.getCourseList)

//報名課程
router.post('/:courseId', auth, courseController.registerCourse)

//取消課程
router.delete('/:courseId', auth, courseController.cancelCourse)

module.exports = router