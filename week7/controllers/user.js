const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Admin')
const config = require('../config/index')
const { isUndefined, isNotValidString } = require('../utils/validators');
const bcrypt = require('bcrypt')
const generateJWT = require('../utils/generateJWT')
const appError = require('../utils/appError')
const catchErrorAsync = require('../utils/catchErrorAsync');

const signupUser = catchErrorAsync(logger, async (req, res, next) => {
    const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/
    const { name, email, password } = req.body
    if (isUndefined(name) || isNotValidString(name) || isUndefined(email) || isNotValidString(email) || isUndefined(password) || isNotValidString(password)) {
        next(appError(400, '欄位未填寫正確'))
        return
    }
    if (!passwordPattern.test(password)) {
        next(appError(400, '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'))
        return
    }
    const userRepository = dataSource.getRepository('User')
    const existingUser = await userRepository.findOne({
        where: { email }
    })

    if (existingUser) {
        next(appError(409, 'Email 已被使用'))
        return
    }
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(password, salt)
    const newUser = userRepository.create({
        name,
        email,
        role: 'USER',
        password: hashPassword
    })

    const savedUser = await userRepository.save(newUser)
    logger.info('新建立的使用者ID:', savedUser.id)

    res.status(201).json({
        status: 'success',
        data: {
            user: {
            id: savedUser.id,
            name: savedUser.name
            }
        }
    })
})

const login = catchErrorAsync(logger, async (req, res, next) => {
    const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}$/
    const { email, password } = req.body
    if (isUndefined(email) || isNotValidString(email) || isUndefined(password) || isNotValidString(password)) {
        next(appError(400, '欄位未填寫正確'))
        return
    }

    if (!passwordPattern.test(password)) {
        next(appError(400, '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'))
        return
    }
    const userRepository = dataSource.getRepository('User')
    const existingUser = await userRepository.findOne({
        select: ['id', 'name', 'password'],
        where: { email }
    })

    if (!existingUser) {
        next(appError(400, '使用者不存在或密碼輸入錯誤'))
        return
    }
    const isMatch = await bcrypt.compare(password, existingUser.password)
    if (!isMatch) {
        next(appError(400, '使用者不存在或密碼輸入錯誤'))
        return
    }
    const token = await generateJWT(
        {
            id: existingUser.id
        },
        config.get('secret.jwtSecret'),
        {
            expiresIn: `${config.get('secret.jwtExpiresDay')}`
        }
    )

    res.status(201).json({
        status: 'success',
        data: {
            token,
            user: {
            name: existingUser.name
            }
        }
    })
    return
})

const getUserProfile = catchErrorAsync(logger, async (req, res, next) => {
    const { id } = req.user
    const userRepository = dataSource.getRepository('User')
    const user = await userRepository.findOne({
        select: ['name', 'email'],
        where: { id }
    })
    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    })
    return
})

const updateUserProfile = catchErrorAsync(logger, async (req, res, next) => {
    const { id } = req.user
    const { name } = req.body 
    const namePattern = /^[\u4e00-\u9fffa-zA-Z0-9]{2,10}$/ //最少2個字，最多10個字，不可包含任何特殊符號與空白
    if (isUndefined(name) || isNotValidString(name) || !namePattern.test(name)) {
        next(appError(400, '欄位未填寫正確'))
        return
    }
    const userRepository = dataSource.getRepository('User')
    const user = await userRepository.findOne({
        select: ['name'],
        where: {
            id
        }
    })
    if (user.name === name) {
        next(appError(400, '使用者名稱未變更'))
        return
    }
    const updatedResult = await userRepository.update(
        {
            id,
            name: user.name
        },
        {
            name
        }
    )
    if (updatedResult.affected === 0) {
        next(appError(400, '更新使用者失敗'))
        return
    }
    // const result = await userRepository.findOne({
    //   select: ['name'],
    //   where: {
    //     id
    //   }
    // })
    res.status(200).json({
        status: 'success'
    })
    return
})

const updateUserPassword = catchErrorAsync(logger, async (req, res, next) => {
    const { id } = req.user
    const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}$/
    const { password,new_password: newPassword,confirm_new_password: confirmNewPassword } = req.body 
    if (isUndefined(password) || isNotValidString(password) ||
        isUndefined(newPassword) || isNotValidString(newPassword) ||
        isUndefined(confirmNewPassword) || isNotValidString(confirmNewPassword)) {
            next(appError(400, '欄位未填寫正確'))
            return
    }
    if (newPassword !== confirmNewPassword) {
        next(appError(400, '新密碼與驗證新密碼不一致'))
        return
    }
    if (password === newPassword) {
        next(appError(400, '新密碼不能與舊密碼相同'))
        return
    }
    if (!passwordPattern.test(password) || !passwordPattern.test(newPassword)) {
        next(appError(400, '密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字'))
        return
    }

    const userRepository = dataSource.getRepository('User')
    const existingUser = await userRepository.findOne({
        select: ['password'],
        where: { id }
    })

    if (!existingUser) {
        next(appError(400, '密碼輸入錯誤'))
        return
    }
    const isMatch = await bcrypt.compare(password, existingUser.password)
    if (!isMatch) {
        next(appError(400, '密碼輸入錯誤'))
        return
    }

    const salt = await bcrypt.genSalt(10)
    const hashNewPassword = await bcrypt.hash(newPassword, salt)
    const updatedUser = await userRepository.update({
            id: id
        }, {
            password: hashNewPassword
    })
    if (updatedUser.affected === 0) {
        next(appError(400, '更新密碼失敗'))
        return
    }
    res.status(200).json({
        status: 'success',
        data: null
    })

})

const getUserCreditPackage = catchErrorAsync(logger, async (req, res, next) => {
    const { id } = req.user

    const creditPurchases = await dataSource.getRepository('CreditPurchase').find({
        where: {
            user_id: id
        },
        select: {
            purchased_credits: true,
            price_paid: true,
            purchaseAt: true,
            CreditPackage: {
                name: true
            }
        },
        relations: {
            CreditPackage: true
        }
    })
    res.status(200).json({
        status: 'success',
        data: creditPurchases.map((creditPurchase) => {
            return {
                purchased_credits: creditPurchase.purchased_credits,
                price_paid: creditPurchase.price_paid,
                purchase_at: creditPurchase.purchaseAt,
                name: creditPurchase.CreditPackage.name
            }
          })
    })
    return
})

const getUserCourse = catchErrorAsync(logger, async (req, res, next) => {
    const { id } = req.user
    const creditPurchaseRepo = dataSource.getRepository('CreditPurchase')
    const courseBookingRepo = dataSource.getRepository('CourseBooking')

    const creditPurchased = await creditPurchaseRepo.sum('purchased_credits', {
        user_id: id
    })
    // const creditUsed = await courseBookingRepo.count({
    //     where: {
    //         user_id: id,
    //         cancelledAt: IsNull()
    //     }
    // })
    const courseBookings = await courseBookingRepo
        .createQueryBuilder('courseBooking')
        .leftJoinAndSelect('courseBooking.Course', 'course')  // CourseBooking 連接 Course 表
        .leftJoinAndSelect('course.User', 'courseUser') // Course連接 User 表
        .select([
                'course.name AS name',
                'courseBooking.course_id AS course_id',
                'courseUser.name AS coach_name', 
                'course.start_at AS start_at',
                'course.end_at AS end_at',
                'course.meeting_url AS meeting_url'
        ])
        .addSelect(`  
            CASE
                WHEN course.start_at > NOW() THEN 'PENDING'
                WHEN course.start_at <= NOW() AND course.end_at >= NOW() THEN 'PROGRESS'
                ELSE 'COMPLETED'
            END`, 'status'
        )  //根據開始結束時間判斷課程狀態
        .where('courseBooking.user_id = :id', { id }) 
        .andWhere('courseBooking.cancelledAt IS NULL') //不顯示已取消課程?
        .getRawMany();

    res.status(200).json({
        status: 'success',
        data: {
            credit_remain: creditPurchased - courseBookings.length,
            credit_usage: courseBookings.length,
            course_booking: courseBookings
        }
    })
    return
})

module.exports = {
    signupUser,
    login,
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
    getUserCreditPackage,
    getUserCourse
}