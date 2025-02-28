const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Admin')
const { isUndefined, isNotValidString, isNotValidInteger,isNotValidUuid } = require('../utils/validators');
const appError = require('../utils/appError')
const catchErrorAsync = require('../utils/catchErrorAsync');
const Coach = require('../entities/Coach');

const getCoachQueryList = catchErrorAsync(logger, async (req, res, next) => {
  const per = parseInt(req.query.per);
  const page = parseInt(req.query.page);
  if (isNaN(per) || isUndefined(per) || isNotValidInteger(per) || 
    isNaN(page) || isUndefined(page) || isNotValidInteger(page)) {
        next(appError(400, '欄位未填寫正確'))
        return
    }

  const skip = page * per;  // 計算要跳過的記錄數
  const take = per;  // 每頁要返回的記錄數
  if (per === 0) {
    res.status(200).json({
      status: 'success',
      data:[]
    })
  }
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
  return
})

const getCoachProfile = catchErrorAsync(logger, async (req, res, next) => {
  // const coachId = req.url.split('/').pop()
  const {coachId} = req.params
  
  if (isUndefined(coachId) || isNotValidString(coachId) || isNotValidUuid(coachId)) {
        next(appError(400, '欄位未填寫正確'))
        return
    }

  const existingCoach = await dataSource.getRepository('Coach')
                          .createQueryBuilder('coach')
                          .where('coach.id = :id', { id: coachId })
                          .leftJoinAndSelect('coach.User', 'user')  // 連接 User 表
                          .select(['coach', 'user.name', 'user.role'])
                          .getOne();

  if (!existingCoach) {
    next(appError(400, '找不到該教練'))
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
  return
})

const getCoachCourseList = catchErrorAsync(logger, async (req, res, next) => {
    const { coachId } = req.params

    if (isUndefined(coachId) || isNotValidString(coachId) || isNotValidUuid(coachId)) {
      next(appError(400, '欄位未填寫正確'))
      return
    }
    const coachCourses = await dataSource.getRepository('Course')
        .createQueryBuilder('course')
        .leftJoinAndSelect('course.User', 'user')
        .leftJoinAndSelect(Coach, 'coach', 'coach.user_id = user.id')  // user表 連接 Coach 表拿 教練名(user.name)
        .leftJoinAndSelect('course.Skill', 'skill')
        .select([
            'course.id AS id',
            'user.name AS coach_name', 
            'skill.name AS skill_name',
            'course.description AS description',
            'course.start_at AS start_at',
            'course.end_at AS end_at',
            'course.max_participants AS max_participants'
        ])
        .where('coach.id = :coachId', { coachId })
        .getRawMany();

    if (coachCourses.length === 0) {
      next(appError(400, '找不到該教練'))
      return
    }
    res.status(200).json({
      status: 'success',
      data: coachCourses
    })
    return
})

module.exports = {
    getCoachQueryList,
    getCoachProfile,
    getCoachCourseList
}