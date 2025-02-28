const express = require('express')
const config = require('../config/index')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Admin')
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository('User'),
  logger
})
const isCoach = require('../middlewares/isCoach')
const adminController = require('../controllers/admin')

//新增教練課程資料
router.post('/coaches/courses', auth, isCoach, adminController.postCourse)

//將使用者新增為教練
router.post('/coaches/:userId', adminController.postCoach)

//編輯教練課程資料
router.put('/coaches/courses/:courseId', auth, isCoach, adminController.putCoachCourseDetail)

//取得教練自己的課程列表/api/admin/coaches/courses
router.get('/coaches/courses', auth, isCoach, adminController.getCoachCourses)

//取得教練自己的課程詳細資料 /api/admin/coaches/courses/:courseId
router.get('/coaches/courses/:courseId', auth, isCoach, adminController.getCoachCourseDetail)

//變更教練資料
router.put('/coaches', auth, isCoach, adminController.putCoachProfile)

//取得教練自己的詳細資料
router.get('/coaches', auth, isCoach, adminController.getCoachProfile)

//取得教練自己的月營收資料 /api/admin/coaches/revenue?month=
router.get('/coaches/revenue', auth, isCoach, adminController.getCoachRevenue)

module.exports = router