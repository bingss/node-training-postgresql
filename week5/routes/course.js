const express = require('express')
const { IsNull } = require('typeorm')

const router = express.Router()
const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Course')


router.get('/', async (req, res, next) => {
  try {
    const courses = await dataSource.getRepository('Course').find({
      select: {
        id: true,
        name: true,
        description: true,
        start_at: true,
        end_at: true,
        max_participants: true,
        User: {
          name: true
        },
        Skill: {
          name: true
        }
      },
      relations: {
        User: true,
        Skill: true
      }
    })
    res.status(200).json({
      status: 'success',
      data: courses.map((course) => {
        return {
          id: course.id,
          name: course.name,
          description: course.description,
          start_at: course.start_at,
          end_at: course.end_at,
          max_participants: course.max_participants,
          coach_name: course.User.name,
          skill_name: course.Skill.name
        }
      })
    })
  } catch (error) {
    logger.error(error)
    next(error)
  }
})

module.exports = router