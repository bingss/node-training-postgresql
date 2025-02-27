//補充：將try catch拆掉：

// 參數 func 傳入 async 函式
const handleErrorAsync = (func) => {
    // 回傳 middleware 格式的新函式 
    return (req, res, next) => {
        // 執行傳入的 async 函式，使用 catch 統一捕捉
      func(req, res, next).catch((error) => next(error));
    };
  };
  
  module.exports = handleErrorAsync;


//router中使用：
// const handleErrorAsync = require('../utils/handleErrorAsync');

// router.post('/login', handleErrorAsync(async (req, res, next) => {
//   const user = await User.findOne({ email: req.body.email });
//   if (!user) {
//     return next(appError(401, '使用者不存在'));
//   }
//   res.status(200).json({ status: 'success', data: user });
// }));
