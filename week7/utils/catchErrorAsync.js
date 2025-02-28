//補充：將try catch拆掉：

// 參數 func 傳入 async 函式
const catchErrorAsync = (logger,func) => {
    // 回傳 middleware 格式的新函式 
    return (req, res, next) => {
        // 執行傳入的 async 函式，使用 catch 統一捕捉
      req.log = logger;
      func(req, res, next).catch((error) => next(error));
    };
  };
  
  module.exports = catchErrorAsync;


//router中使用：
// const catchErrorAsync = require('../utils/catchErrorAsync');

// router.post('/login', catchErrorAsync(async (req, res, next) => {
//   const user = await User.findOne({ email: req.body.email });
//   if (!user) {
//     return next(appError(401, '使用者不存在'));
//   }
//   res.status(200).json({ status: 'success', data: user });
// }));
