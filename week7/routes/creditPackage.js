const express = require('express')
const config = require('../config/index')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('CreditPackage')
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository('User'),
  logger
})
const creditPackageController = require('../controllers/creditPackage')

//取得購買方案列表
router.get('/', creditPackageController.getCreditPackageList)

//新增購買方案
router.post('/', creditPackageController.postCreditPackage)

//使用者購買方案
router.post('/:creditPackageId', auth, creditPackageController.postBuyCreditPackage)

//刪除購買方案
router.delete('/:creditPackageId', creditPackageController.deleteCreditPackage)

module.exports = router