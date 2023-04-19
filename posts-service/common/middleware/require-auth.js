const apiKey = require("./../../config/api-key.json").development

function requireAuth(req, res, next) {
  if(!req.headers["x-decoded-user"]) {
    return res.status(401).send({
      message: "UnAuthorized"
    })
  }
  req.user = JSON.parse(req.headers["x-decoded-user"])

  next()
}

function requireApiAccessKey(req, res, next) {
  if(!req.headers["x-api-key"] || req.headers["x-api-key"] !== apiKey.POSTS_SERVICE_API_ACCESS_KEY) {
    return res.status(403).send({
      message: "Forbidden"
    })
  }

  next()
}


module.exports = {
  requireAuth,
  requireApiAccessKey
}