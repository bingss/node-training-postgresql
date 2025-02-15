function isUndefined (value) {
  return value === undefined
}

function isNotValidString (value) {
  return typeof value !== "string" || decodeURIComponent(value).trim().length === 0
}

function isNotValidInteger (value) {
  return typeof value !== "number" || value < 0 || value % 1 !== 0
}

function isNotValidUuid(value){
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  return !uuidRegex.test(value)
}

// 將函式導出
module.exports = {
  isUndefined,
  isNotValidString,
  isNotValidInteger,
  isNotValidUuid
};