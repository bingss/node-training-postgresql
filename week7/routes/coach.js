const express = require('express')
const router = express.Router()
const coachController = require('../controllers/coach')

//取得教練列表 : /api/coaches/?per=?&page=?
router.get('/',  coachController.getCoachQueryList)

//取得教練詳細資訊 : /api/coaches/:coachId
router.get('/:coachId', coachController.getCoachProfile)

//取得指定教練課程列表 /api/coaches/:coachId/courses
router.get('/:coachId/courses', coachController.getCoachCourseList)

module.exports = router