const express = require('express')
const router = express.Router()
const skillController = require('../controllers/skill')

//取得教練專長列表
router.get('/', skillController.getSkillList)

//新增教練專長
router.post('/', skillController.postSkill)

//刪除教練專長
router.delete('/:skillId', skillController.deleteSkill)

module.exports = router