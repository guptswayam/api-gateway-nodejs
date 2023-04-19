console.clear()
const express = require("express")
const ejs = require("ejs")
const router = require("./routes")
const axios = require("axios")
const { LeakyBucketRateLimiter } = require("./utils/leakyBucketRateLimiter")
const usersServiceConfig = require("./config/users-service.json").development
const PORT = 5000


const app = express()

app.set("trust proxy", true)
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.set("view engine", ejs)

async function checkUserAuth(token, host, protocol) {
  const decoded = "1"     // decoded data from token

  const res = await axios.get(protocol + "://" + host + usersServiceConfig.GET_USER_API_URL.replace(":id", decoded), {
    headers: {
      "x-api-key": usersServiceConfig.USERS_SERVICE_ACCESS_SECRET_KEY
    }
  })

  return res.data

}

// We do request authorization generally in gateway service, so we don't need to this every service
// Only Gateway-Service is accessible from outside world
// we add new header in Gateway Service before proxying request to microservices. And based on that we can tell that request is authorised in our microservices
async function authMiddleware(req, res, next) {

  delete req.headers["x-decoded-user"]

  if(req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1]

    const user = await checkUserAuth(token, req.headers.host, req.protocol)

    req.headers["x-decoded-user"] = user ? JSON.stringify(user) : null
  }

  if(req.headers["api-key"])
    req.headers["x-api-key"] = req.headers["api-key"]

  next()
}

function rateLimiter(limit) {

  const leakyBucketRateLimiter = new LeakyBucketRateLimiter(limit);

  return (req, res, next) => {

    // In nginx config, we add the x-forwarded-for header before the request is proxied to upstream server with value as client ip(proxy_set_header x-forwarded-for $remote_addr)
    // if x-forwarded-forward is null, then request came from a microservice service inside our vpn and we don't apply rate limiting on them
    // To test load balancer locally, run: seq 1 5 | xargs -n1 -P 5 curl --request GET "http://localhost:5000/posts-service/health-check" --header 'x-forwarded-for: 127.0.0.1'

    const ip = req.headers["x-forwarded-for"]

    if(!ip) {
      return next()
    }

    if(leakyBucketRateLimiter.grantAccess(ip)) {
      req.on("close", () => {
        // console.log("Request Closed!", ip)
        leakyBucketRateLimiter.removeRequest(ip)
      })
      next()
    } else {
      res.send({
        message: "Too many requests, please try after some time"
      })
    }
  }
}

app.use(rateLimiter(3))

app.use(authMiddleware)

app.use(express.static("./public"))

app.use("/", router)


app.listen(PORT, () => {
  console.log(`server started at port ${PORT}..`)
})
