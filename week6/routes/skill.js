const express = require('express')
const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Skill')
const { isUndefined, isNotValidString, isNotValidUuid } = require('../utils/validators');
const appError = require('../utils/appError')
//取得教練專長列表
router.get('/', async (req, res, next) => {
  try {
    const skill = await dataSource.getRepository('Skill').find({
      select: ['id', 'name']
    })
    res.status(200).json({
      status: 'success',
      data: skill
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

//新增教練專長
router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body
    if (isUndefined(name) || isNotValidString(name)) {
      next(appError(400, '欄位未填寫正確'))
      return
    }
    const skillRepo = await dataSource.getRepository('Skill')
    const existSkill = await skillRepo.find({
      where: {
        name
      }
    })
    if (existSkill.length > 0) {
      next(appError(409, '資料重複'))
      return
    }
    const newSkill = await skillRepo.create({
      name
    })
    const result = await skillRepo.save(newSkill)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

//刪除教練專長
router.delete('/:skillId', async (req, res, next) => {
  try {
    // const skillId = req.url.split('/').pop()
    const {skillId} = req.params
    if (isUndefined(skillId) || isNotValidString(skillId) || isNotValidUuid(skillId)) {
      logger.warn('ID錯誤')
      next(appError(400, 'ID錯誤'))
      return
    }
    const result = await dataSource.getRepository('Skill').delete(skillId)
    if (result.affected === 0) {
      logger.warn('ID錯誤')
      next(appError(400, 'ID錯誤'))
      return
    }
    res.status(200).json({
      status: 'success',
      data: result
    })
    res.end()
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

module.exports = router