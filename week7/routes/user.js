const express = require('express')
const config = require('../config/index')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Users')

const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository('User'),
  logger
})
const userController = require('../controllers/user')

// 新增使用者
router.post('/signup', userController.signupUser)

// 使用者登入
router.post('/login', userController.login)

//取得個人資料
router.get('/profile', auth, userController.getUserProfile)

//更新個人資料
router.put('/profile', auth, userController.updateUserProfile)

//使用者更新密碼
router.put('/password', auth, userController.updateUserPassword)

//取得使用者已購買的方案列表
router.get('/credit-package', auth, userController.getUserCreditPackage)

//取得已預約的課程列表
router.get('/courses', auth, userController.getUserCourse)

module.exports = router