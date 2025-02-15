const express = require('express')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('CreditPackage')
const { isUndefined, isNotValidString, isNotValidInteger, isNotValidUuid } = require('../utils/validators');

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
    const creditPurchaseRepo = await dataSource.getRepository('CreditPackage')
    const existCreditPurchase = await creditPurchaseRepo.find({
      where: {
        name
      }
    })
    if (existCreditPurchase.length > 0) {
      res.status(409).json({
        status: 'failed',
        message: '資料重複'
      })
      return
    }
    const newCreditPurchase = await creditPurchaseRepo.create({
      name,
      credit_amount: creditAmount,
      price
    })
    const result = await creditPurchaseRepo.save(newCreditPurchase)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

router.delete('/:creditPackageId', async (req, res, next) => {
  try {
    const { creditPackageId } = req.params
    if (isUndefined(creditPackageId) || isNotValidString(creditPackageId) || isNotValidUuid(creditPackageId)) {
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