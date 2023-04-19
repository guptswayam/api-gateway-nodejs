const apiKey = require("../../config/api-key.json").development

function requireApiAccessKey(req, res, next) {
  if(!req.headers["api-key"] || req.headers["api-key"] !== apiKey.API_GATEWAY_ACCESS_TOKEN) {
    return res.status(403).send({
      message: "Forbidden"
    })
  }

  next()
}

module.exports = {
  requireApiAccessKey
}