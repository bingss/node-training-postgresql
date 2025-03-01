const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Admin')
const { isUndefined, isNotValidString, isNotValidInteger,isNotValidUuid } = require('../utils/validators');
const appError = require('../utils/appError')
const catchErrorAsync = require('../utils/catchErrorAsync');
const CourseBooking = require('../entities/CourseBooking');
const monthMap = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12
}


const postCourse = catchErrorAsync(logger, async (req, res, next) => {
    const {
      user_id: userId, skill_id: skillId, name, description, start_at: startAt, end_at: endAt,
      max_participants: maxParticipants, meeting_url: meetingUrl
    } = req.body

    if (isUndefined(userId) || isNotValidString(userId) || isNotValidUuid(userId) ||
      isUndefined(skillId) || isNotValidString(skillId) || isNotValidUuid(skillId) || 
      isUndefined(name) || isNotValidString(name) ||
      isUndefined(description) || isNotValidString(description) ||
      isUndefined(startAt) || isNotValidString(startAt) ||
      isUndefined(endAt) || isNotValidString(endAt) ||
      isUndefined(maxParticipants) || isNotValidInteger(maxParticipants) ||
      isUndefined(meetingUrl) || isNotValidString(meetingUrl) || !meetingUrl.startsWith('https')) {
        next(appError(400, '欄位未填寫正確'))
        return
    }
    const userRepository = dataSource.getRepository('User')
    const existingUser = await userRepository.findOne({
      select: ['role'],
      where: { id: userId }
    })
    logger.warn(existingUser)
    if (!existingUser) {
      next(appError(400, '使用者不存在'))
      return
    } else if (existingUser.role !== 'COACH') {
      next(appError(400, '使用者尚未成為教練'))
      return
    }
    const courseRepo = dataSource.getRepository('Course')
    const newCourse = courseRepo.create({
      user_id: userId,
      skill_id: skillId,
      name,
      description,
      start_at: startAt,
      end_at: endAt,
      max_participants: maxParticipants,
      meeting_url: meetingUrl
    })
    const savedCourse = await courseRepo.save(newCourse)
    const course = await courseRepo.findOne({
      where: { id: savedCourse.id }
    })
    res.status(201).json({
      status: 'success',
      data: {
        course
      }
    })
    return
})

const putCoachCourseDetail = catchErrorAsync(logger, async (req, res, next) => {
  const { userId } = req.params
  const { experience_years: experienceYears, description, profile_image_url: profileImageUrl = null } = req.body
  if (isNotValidUuid(userId) || 
    isUndefined(experienceYears) || isNotValidInteger(experienceYears) || 
    isUndefined(description) || isNotValidString(description)) {
      next(appError(400, '欄位未填寫正確'))
      return
  }
  if (profileImageUrl && !isNotValidString(profileImageUrl) && !profileImageUrl.startsWith('https')) {
    next(appError(400, '欄位未填寫正確'))
    return
  }
  const userRepository = dataSource.getRepository('User')
  const existingUser = await userRepository.findOne({
    select: ['role'],
    where: { id: userId }
  })
  if (!existingUser) {
    next(appError(400, '使用者不存在'))
    return
  } else if (existingUser.role === 'COACH') {
    next(appError(400, '使用者已經是教練'))
    return
  }
  const coachRepo = dataSource.getRepository('Coach')
  const newCoach = coachRepo.create({
    user_id: userId,
    experience_years: experienceYears,
    description,
    profile_image_url: profileImageUrl
  })
  const updatedUser = await userRepository.update({
    id: userId,
    role: 'USER'
  }, {
    role: 'COACH'
  })
  if (updatedUser.affected === 0) {
    next(appError(400, '更新使用者失敗'))
    return
  }
  const savedCoach = await coachRepo.save(newCoach)
  const savedUser = await userRepository.findOne({
    select: ['name', 'role'],
    where: { id: userId }
  })
  res.status(201).json({
    status: 'success',
    data: {
      user: savedUser,
      coach: savedCoach
    }
  })
  return
})

const postCoach = catchErrorAsync(logger, async (req, res, next) => {
    const { userId } = req.params
    const { experience_years: experienceYears, description, profile_image_url: profileImageUrl = null } = req.body
    if (isNotValidUuid(userId) || 
      isUndefined(experienceYears) || isNotValidInteger(experienceYears) || 
      isUndefined(description) || isNotValidString(description)) {
        next(appError(400, '欄位未填寫正確'))
        return
    }
    if (profileImageUrl && !isNotValidString(profileImageUrl) && !profileImageUrl.startsWith('https')) {
      next(appError(400, '欄位未填寫正確'))
      return
    }
    const userRepository = dataSource.getRepository('User')
    const existingUser = await userRepository.findOne({
      select: ['role'],
      where: { id: userId }
    })
    if (!existingUser) {
      next(appError(400, '使用者不存在'))
      return
    } else if (existingUser.role === 'COACH') {
      next(appError(400, '使用者已經是教練'))
      return
    }
    const coachRepo = dataSource.getRepository('Coach')
    const newCoach = coachRepo.create({
      user_id: userId,
      experience_years: experienceYears,
      description,
      profile_image_url: profileImageUrl
    })
    const updatedUser = await userRepository.update({
      id: userId,
      role: 'USER'
    }, {
      role: 'COACH'
    })
    logger.info(updatedUser)
    if (updatedUser.affected === 0) {
      next(appError(400, '更新使用者失敗'))
      return
    }
    const savedCoach = await coachRepo.save(newCoach)
    const savedUser = await userRepository.findOne({
      select: ['name', 'role'],
      where: { id: userId }
    })
    res.status(201).json({
      status: 'success',
      data: {
        user: savedUser,
        coach: savedCoach
      }
    })
})

const getCoachCourses = catchErrorAsync(logger, async (req, res, next) => {
  const { id } = req.user

  const coachCourses = await dataSource.getRepository('Course')
    .createQueryBuilder('course')
    .leftJoin(CourseBooking, 'courseBooking', 'courseBooking.course_id = course.id') 
    .select([
        'course.id AS id',
        'course.name AS name',
        'course.start_at AT TIME ZONE \'UTC\' AS start_at',
        'course.end_at AT TIME ZONE \'UTC\' AS end_at',
        'course.max_participants AS max_participants'
    ])
    .addSelect('COUNT(courseBooking.id) FILTER (WHERE courseBooking.cancelledAt IS NULL)', 'participants')
    .where('course.user_id = :id', { id })
    .groupBy('course.id')
    .getRawMany();

    //根據開始結束時間判斷課程狀態，改為用js判斷
    // .addSelect(`  
    //   CASE
    //       WHEN (NOW() AT TIME ZONE 'GMT+8') < ((course.start_at AT TIME ZONE 'GMT+8') - INTERVAL '10 days') THEN '報名中'
    //       WHEN (NOW() AT TIME ZONE 'GMT+8') >= ((course.start_at AT TIME ZONE 'GMT+8') - INTERVAL '10 days') AND (NOW() AT TIME ZONE 'GMT+8') < (course.start_at AT TIME ZONE 'GMT+8') THEN '尚未開始'
    //       WHEN (NOW() AT TIME ZONE 'GMT+8') >= (course.start_at AT TIME ZONE 'GMT+8') AND (NOW() AT TIME ZONE 'GMT+8') <= (course.end_at AT TIME ZONE 'GMT+8') THEN '進行中'
    //       ELSE '已結束'
    //   END`, 'status'
    // )  

  if (coachCourses.length === 0) {
    next(appError(400, '找不到教練'))
    return
  }

  //暫時規則為10日前"報名中"，10日前到開始"尚未開始"，開始到結束"進行中"，結束後"已結束"
  coachCourses.forEach(course => {
    course.status = getCourseStatus(course)
  })

  res.status(200).json({
    status: 'success',
    data: coachCourses
  })
})

const getCoachCourseDetail = catchErrorAsync(logger, async (req, res, next) => {
  const { id } = req.user
  const { courseId } = req.params
  if (isNotValidUuid(courseId) || isUndefined(courseId) || isNotValidString(courseId)) {
      next(appError(400, '欄位未填寫正確'))
      return
  }

  const coachCourse = await dataSource.getRepository('Course')
    .createQueryBuilder('course')
    .leftJoinAndSelect('course.Skill', 'skill') 
    .select([
        'course.id AS id',
        'skill.name AS skill_name',
        'course.name AS name',
        'course.description AS description',
        'course.start_at AT TIME ZONE \'UTC\' AS start_at',
        'course.end_at AT TIME ZONE \'UTC\' AS end_at',
        'course.max_participants AS max_participants'
    ])
    .where('course.user_id = :id', { id })
    .andWhere('course.id = :courseId', { courseId })
    .getRawOne();

  if ( !coachCourse ) {
    next(appError(400, '找不到教練'))
    return
  }
  res.status(200).json({
    status: 'success',
    data: coachCourse
  })
})

const putCoachProfile = catchErrorAsync(logger, async (req, res, next) => {
  const { id: userId } = req.user
  const { experience_years: experienceYears, description, profile_image_url: profileImageUrl = null,skill_ids: skillIds } = req.body
  if (isUndefined(experienceYears) || isNotValidInteger(experienceYears) || 
    isUndefined(description) || isNotValidString(description) ||
    !profileImageUrl || isNotValidString(profileImageUrl) || !profileImageUrl.startsWith('https') ||
    isUndefined(skillIds) || !Array.isArray(skillIds) ) {
      next(appError(400, '欄位未填寫正確'))
      return
  }
  if(skillIds.length === 0 || skillIds.some(skillId => isUndefined(skillId) || isNotValidString(skillId) ||  isNotValidUuid(skillId) )){
    next(appError(400, '欄位未填寫正確'))
    return
  }

  const coachRepo = dataSource.getRepository('Coach')
  const existingCoach = await coachRepo.findOne({
    select: ['id'],
    where: { user_id: userId }
  })
  if (!existingCoach) {
    next(appError(400, '找不到教練'))
    return
  }

  const updatedCoach = await coachRepo.update({
    id: existingCoach.id,
  }, {
    experience_years: experienceYears,
    description,
    profile_image_url: profileImageUrl
  })

  const coachLinkSkillRepo = dataSource.getRepository('CoachLinkSkill')
  const newCoachLinkSkill = skillIds.map(skill => ({
    coach_id: existingCoach.id,
    skill_id: skill
  }))
  const deleteLink = await coachLinkSkillRepo.delete({ coach_id: existingCoach.id })
  const insertLink = await coachLinkSkillRepo.insert(newCoachLinkSkill)

  //有空改使用transaction
  if (updatedCoach.affected === 0 && insertLink.affected === 0 && deleteLink.affected === 0) {
    next(appError(400, '更新教練失敗'))
    return
  }

  const savedCoach = await coachRepo.findOne({
    select: ['profile_image_url'],
    where: { user_id: userId }
  })

  res.status(200).json({
    status: 'success',
    data: {
      image_url: savedCoach.profile_image_url
    }
  })
  return
})

const getCoachProfile = catchErrorAsync(logger, async (req, res, next) => {
  const { id: userId } = req.user
  // const { coachId } = req.params
  // if (isNotValidUuid(coachId) || isUndefined(coachId) || isNotValidString(coachId)) {
  //   next(appError(400, '欄位未填寫正確'))
  //   return
  // }

  const coachRepo = dataSource.getRepository('Coach')

  // 1.COALESCE 函數會返回第一個非 null 的值，所以如果 ARRAY_AGG 返回 null，則會使用 '{}'（PostgreSQL 中的空陣列）
  // 2.FILTER (WHERE coachLinkSkill.skill_id IS NOT NULL) 確保僅聚合非 null 的技能 ID，
  // 如果 coach 沒有關聯的 CoachLinkSkill記錄，或skill_id 為 null，可確保 null 值不會被包含在最終的陣列中。
  // 3.空陣列表示為 '{}'
  const existingCoach = await coachRepo
      .createQueryBuilder('coach')
      .leftJoinAndSelect('coach.CoachLinkSkill', 'coachLinkSkill')
      .select([
          'coach.id AS id',
          'coach.experience_years AS experience_years',
          'coach.description AS description',
          'coach.profile_image_url AS profile_image_url',
          'COALESCE(ARRAY_AGG(coachLinkSkill.skill_id) FILTER (WHERE coachLinkSkill.skill_id IS NOT NULL), \'{}\') AS skill_ids' //將skill_id整合成array，若無skill_id則預設為空陣列
      ])
      .where('coach.user_id = :userId', { userId })
      .groupBy('coach.id, coach.experience_years, coach.description, coach.profile_image_url')
      .getRawOne();

  if ( !existingCoach) {
    next(appError(400, '找不到教練'))
    return
  }

  res.status(200).json({
    status: 'success',
    data: existingCoach
  })

})

const getCoachRevenue = catchErrorAsync(logger, async (req, res, next) => {
  const { id: userId } = req.user
  const month = req.query.month
  const monthNumber = monthMap[month.toLowerCase()] || null

  if (isUndefined(month) || isNotValidString(month) || monthNumber === null) {
    next(appError(400, '欄位未填寫正確'))
    return
  }

  const courseBookingRepo = dataSource.getRepository('CourseBooking')
  const { course_count } = await courseBookingRepo
    .createQueryBuilder('courseBooking')
    .leftJoinAndSelect('courseBooking.Course', 'course')
    .select('COUNT(DISTINCT course.id)', 'course_count')
    .where('course.user_id = :userId', { userId })
    .andWhere('courseBooking.cancelledAt IS NULL')
    .andWhere('EXTRACT(MONTH FROM courseBooking.createdAt) = :month', { month: monthNumber })
    .getRawOne()

  if (course_count === '0') {
    res.status(200).json({
      status: 'success',
      data: {
        total: {
          participants: 0,
          revenue: 0,
          course_count: 0
        }
      }
    })
    return
  }

  const { participants } = await courseBookingRepo
    .createQueryBuilder('courseBooking')
    .leftJoinAndSelect('courseBooking.Course', 'course')
    .select('COUNT(courseBooking.id)', 'participants')
    .where('course.user_id = :userId', { userId })
    .andWhere('courseBooking.cancelledAt IS NULL')
    .andWhere('EXTRACT(MONTH FROM courseBooking.createdAt) = :month', { month: monthNumber })
    .getRawOne()
  const { revenue } = await dataSource.getRepository('CreditPackage')
    .createQueryBuilder('credit_package')
    .select([
      'SUM(credit_package.price) / SUM(credit_package.credit_amount) * :courseCount AS revenue'
    ])
    .setParameter('courseCount', course_count)
    .getRawOne()

    
  res.status(200).json({
    status: 'success',
    data:{
      total: {
        participants: parseInt( participants ,10),
        revenue: Math.floor( revenue ),
        course_count: parseInt( course_count ,10)
      }
    }
  })


})



module.exports = {
    postCourse,
    putCoachCourseDetail,
    postCoach,
    getCoachCourses,
    getCoachCourseDetail,
    putCoachProfile,
    getCoachProfile,
    getCoachRevenue
}

function getCourseStatus(course) {
  const now = new Date()
  const nowGmt8 = new Date( now.getTime() + 8 * 60 * 60 * 1000 );
  const startAt = new Date(course.start_at)
  const endAt = new Date(course.end_at)
  
  const tenDaysBeforeStart = new Date(startAt)
  tenDaysBeforeStart.setDate(startAt.getDate() - 10)
  if (nowGmt8 < tenDaysBeforeStart) {
    return '報名中'
  } else if (nowGmt8 >= tenDaysBeforeStart && nowGmt8 < startAt) {
    return '尚未開始'
  } else if (nowGmt8 >= startAt && nowGmt8 <= endAt) {
    return '進行中'
  } else {
    return '已結束'
  }
}