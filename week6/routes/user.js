const express = require('express')
const config = require('../config/index')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Users')
const { isUndefined, isNotValidString} = require('../utils/validators')
const bcrypt = require('bcrypt')
const generateJWT = require('../utils/generateJWT')
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository('User'),
  logger
})

// 新增使用者
router.post('/signup', async (req, res, next) => {
  try {
    const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/
    const { name, email, password } = req.body
    if (isUndefined(name) || isNotValidString(name) || isUndefined(email) || isNotValidString(email) || isUndefined(password) || isNotValidString(password)) {
      logger.warn('欄位未填寫正確')
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }
    if (!passwordPattern.test(password)) {
      logger.warn('建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字')
      res.status(400).json({
        status: 'failed',
        message: '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
      })
      return
    }
    const userRepository = dataSource.getRepository('User')
    const existingUser = await userRepository.findOne({
      where: { email }
    })

    if (existingUser) {
      logger.warn('建立使用者錯誤: Email 已被使用')
      res.status(409).json({
        status: 'failed',
        message: 'Email 已被使用'
      })
      return
    }
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(password, salt)
    const newUser = userRepository.create({
      name,
      email,
      role: 'USER',
      password: hashPassword
    })

    const savedUser = await userRepository.save(newUser)
    logger.info('新建立的使用者ID:', savedUser.id)

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: savedUser.id,
          name: savedUser.name
        }
      }
    })
  } catch (error) {
    logger.error('建立使用者錯誤:', error)
    next(error)
  }
})

// 使用者登入
router.post('/login', async (req, res, next) => {
  try {
    const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}$/
    const { email, password } = req.body
    if (isUndefined(email) || isNotValidString(email) || isUndefined(password) || isNotValidString(password)) {
      logger.warn('欄位未填寫正確')
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }
    console.log(password, password.length);
    if (!passwordPattern.test(password)) {
      logger.warn('密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字')
      res.status(400).json({
        status: 'failed',
        message: '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'
      })
      return
    }
    const userRepository = dataSource.getRepository('User')
    const existingUser = await userRepository.findOne({
      select: ['id', 'name', 'password'],
      where: { email }
    })

    if (!existingUser) {
      res.status(400).json({
        status: 'failed',
        message: '使用者不存在或密碼輸入錯誤'
      })
      return
    }
    logger.info(`使用者資料: ${JSON.stringify(existingUser)}`)
    const isMatch = await bcrypt.compare(password, existingUser.password)
    if (!isMatch) {
      res.status(400).json({
        status: 'failed',
        message: '使用者不存在或密碼輸入錯誤'
      })
      return
    }
    const token = await generateJWT({
      id: existingUser.id
    }, config.get('secret.jwtSecret'), {
      expiresIn: `${config.get('secret.jwtExpiresDay')}`
    })

    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: {
          name: existingUser.name
        }
      }
    })
  } catch (error) {
    logger.error('登入錯誤:', error)
    next(error)
  }
})

//取得個人資料
router.get('/profile', auth, async (req, res, next) => {
  try {
    const { id } = req.user
    const userRepository = dataSource.getRepository('User')
    const user = await userRepository.findOne({
      select: ['name', 'email'],
      where: { id }
    })
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    })
  } catch (error) {
    logger.error('取得使用者資料錯誤:', error)
    next(error)
  }
})

//更新個人資料
router.put('/profile', auth, async (req, res, next) => {
  try {
    const { id } = req.user
    const { name } = req.body 
    const namePattern = /^[\u4e00-\u9fffa-zA-Z0-9]{2,10}$/ //最少2個字，最多10個字，不可包含任何特殊符號與空白
    if (isUndefined(name) || isNotValidString(name) || !namePattern.test(name)) {
      logger.warn('欄位未填寫正確')
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }
    const userRepository = dataSource.getRepository('User')
    const user = await userRepository.findOne({
      select: ['name'],
      where: {
        id
      }
    })
    if (user.name === name) {
      res.status(400).json({
        status: 'failed',
        message: '使用者名稱未變更'
      })
      return
    }
    const updatedResult = await userRepository.update({
      id,
      name: user.name
    }, {
      name
    })
    if (updatedResult.affected === 0) {
      res.status(400).json({
        status: 'failed',
        message: '更新使用者失敗'
      })
      return
    }
    // const result = await userRepository.findOne({
    //   select: ['name'],
    //   where: {
    //     id
    //   }
    // })
    res.status(200).json({
      status: 'success'
    })
  } catch (error) {
    logger.error('取得使用者資料錯誤:', error)
    next(error)
  }
})

module.exports = router