const express = require('express')

const router = express.Router()
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Coach')
const { isUndefined ,isNotValidInteger, isNotValidString,isNotValidUuid } = require('../utils/validators');

//取得教練列表 : /api/coaches/?per=?&page=?
router.get('/', async (req, res, next) => {
  try {
    const per = parseInt(req.query.per);
    const page = parseInt(req.query.page);
    if (isNaN(per) || isUndefined(per) || isNotValidInteger(per) || 
      isNaN(page) || isUndefined(page) || isNotValidInteger(page)) {
          logger.warn('欄位未填寫正確')
          res.status(400).json({
            status: 'failed',
            message: '欄位未填寫正確'
          })
          return
      }

    const skip = page * per;  // 計算要跳過的記錄數
    const take = per;  // 每頁要返回的記錄數
    const coaches = await dataSource.getRepository('Coach')
                            .createQueryBuilder('coach')
                            .leftJoinAndSelect('coach.User', 'user')  // 連接 User 表
                            .select(['coach.id AS id', 'user.name AS name'])
                            .offset(skip)  // 跳過前面的記錄
                            .limit(take)  // 返回指定數量的記錄
                            .getRawMany();
    res.status(200).json({
      status: 'success',
      data: coaches
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
})


//取得教練詳細資訊 : /api/coaches/:coachId
router.get('/:coachId', async (req, res, next) => {
  try {
    // const coachId = req.url.split('/').pop()
    const {coachId} = req.params
    
    if (isUndefined(coachId) || isNotValidString(coachId) || isNotValidUuid(coachId)) {
          logger.warn('欄位未填寫正確')
          res.status(400).json({
            status: 'failed',
            message: '欄位未填寫正確'
          })
          return
      }

    const existingCoach = await dataSource.getRepository('Coach')
                            .createQueryBuilder('coach')
                            .where('coach.id = :id', { id: coachId })
                            .leftJoinAndSelect('coach.User', 'user')  // 連接 User 表
                            .select(['coach', 'user.name', 'user.role'])
                            .getOne();

    if (!existingCoach) {
      logger.warn('找不到該教練')
      res.status(400).json({
        status: 'failed',
        message: '找不到該教練'
      })
      return
    }

    const formattedCoach = {
      user: {
        name: existingCoach.User.name,
        role: existingCoach.User.role
      },
      coach: {
        id: existingCoach.id,
        user_id: existingCoach.user_id,
        experience_years: existingCoach.experience_years,
        description: existingCoach.description,
        profile_image_url: existingCoach.profile_image_url,
        created_at: existingCoach.created_at,
        updated_at: existingCoach.updated_at
      }
    };

    res.status(200).json({
      status: 'success',
      data: formattedCoach
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

module.exports = router