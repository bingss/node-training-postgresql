const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Admin')
const { isUndefined, isNotValidString,isNotValidInteger, isNotValidUuid } = require('../utils/validators');
const appError = require('../utils/appError')
const catchErrorAsync = require('../utils/catchErrorAsync');

const getCreditPackageList = catchErrorAsync(logger, async (req, res, next) => {
    const creditPackage = await dataSource.getRepository('CreditPackage').find({
        select: ['id', 'name', 'credit_amount', 'price']
    })
    res.status(200).json({
        status: 'success',
        data: creditPackage
    })
    return
})

const postCreditPackage = catchErrorAsync(logger, async (req, res, next) => {
    const { name, credit_amount: creditAmount, price } = req.body
    if (isUndefined(name) || isNotValidString(name) ||
        isUndefined(creditAmount) || isNotValidInteger(creditAmount) ||
        isUndefined(price) || isNotValidInteger(price)) {
            next(appError(400, '欄位未填寫正確'))
            return
    }
    const creditPackageRepo = dataSource.getRepository('CreditPackage')
    const existCreditPackage = await creditPackageRepo.find({
        where: {
            name
        }
    })
    if (existCreditPackage.length > 0) {
        next(appError(400, '資料重複'))
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
    return
})

const postBuyCreditPackage = catchErrorAsync(logger, async (req, res, next) => {
    const { id } = req.user
    const { creditPackageId } = req.params
    if (isNotValidUuid(creditPackageId) || isUndefined(creditPackageId) || isNotValidString(creditPackageId)) {
        next(appError(400, 'ID錯誤'))
        return
    }
    const creditPackageRepo = dataSource.getRepository('CreditPackage')
    const creditPackage = await creditPackageRepo.findOne({
        where: {
            id: creditPackageId
        }
    })
    if (!creditPackage) {
        next(appError(400, 'ID錯誤'))
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
    return
})

const deleteCreditPackage = catchErrorAsync(logger, async (req, res, next) => {
    const { creditPackageId } = req.params
    if (isUndefined(creditPackageId) || isNotValidString(creditPackageId)) {
        next(appError(400, '欄位未填寫正確'))
        return
    }
    const result = await dataSource.getRepository('CreditPackage').delete(creditPackageId)
    if (result.affected === 0) {
        next(appError(400, 'ID錯誤'))
        return
    }
    res.status(200).json({
        status: 'success',
        data: result
    })
    return
})

module.exports = {
    getCreditPackageList,
    postCreditPackage,
    postBuyCreditPackage,
    deleteCreditPackage
    
}