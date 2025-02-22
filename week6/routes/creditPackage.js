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
const { isUndefined, isNotValidString, isNotValidInteger, isNotValidUuid } = require('../utils/validators');

//取得購買方案列表
router.get('/', async (req, res, next) => {
  try {
    const creditPackage = await dataSource.getRepository('CreditPackage').find({
      select: ['id', 'name', 'credit_amount', 'price']
    })
    res.status(200).json({
      status: 'success',
      data: creditPackage
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

//新增購買方案
router.post('/', async (req, res, next) => {
  try {
    const { name, credit_amount: creditAmount, price } = req.body
    if (isUndefined(name) || isNotValidString(name) ||
      isUndefined(creditAmount) || isNotValidInteger(creditAmount) ||
            isUndefined(price) || isNotValidInteger(price)) {
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }
    const creditPackageRepo = dataSource.getRepository('CreditPackage')
    const existCreditPackage = await creditPackageRepo.find({
      where: {
        name
      }
    })
    if (existCreditPackage.length > 0) {
      res.status(409).json({
        status: 'failed',
        message: '資料重複'
      })
      return
    }
    const newCreditPurchase = await creditPackageRepo.create({
      name,
      credit_amount: creditAmount,
      price
    })
    const result = await creditPackageRepo.save(newCreditPurchase)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

//使用者購買方案
router.post('/:creditPackageId', auth, async (req, res, next) => {
  try {
    const { id } = req.user
    const { creditPackageId } = req.params
    if (isNotValidUuid(creditPackageId) || isUndefined(creditPackageId) || isNotValidString(creditPackageId)) {
        logger.warn('欄位未填寫正確')
        res.status(400).json({
          status: 'failed',
          message: 'ID錯誤'
        })
        return
    }
    const creditPackageRepo = dataSource.getRepository('CreditPackage')
    const creditPackage = await creditPackageRepo.findOne({
      where: {
        id: creditPackageId
      }
    })
    if (!creditPackage) {
      res.status(400).json({
        status: 'failed',
        message: 'ID錯誤'
      })
      return
    }
    const creditPurchaseRepo = dataSource.getRepository('CreditPurchase')
    const newPurchase = await creditPurchaseRepo.create({
      user_id: id,
      credit_package_id: creditPackageId,
      purchased_credits: creditPackage.credit_amount,
      price_paid: creditPackage.price,
      purchaseAt: new Date().toISOString()
    })
    await creditPurchaseRepo.save(newPurchase)
    res.status(200).json({
      status: 'success',
      data: null
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

//刪除購買方案
router.delete('/:creditPackageId', async (req, res, next) => {
  try {
    const { creditPackageId } = req.params
    if (isUndefined(creditPackageId) || isNotValidString(creditPackageId)) {
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      })
      return
    }
    const result = await dataSource.getRepository('CreditPackage').delete(creditPackageId)
    if (result.affected === 0) {
      res.status(400).json({
        status: 'failed',
        message: 'ID錯誤'
      })
      return
    }
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

module.exports = router