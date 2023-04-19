const axios = require("axios");
const express = require("express");
const fs = require("fs");
const { requireApiAccessKey } = require("../common/middleware/require-auth");
const loadBalancing = require("../utils/loadBalancing");
const registry = require("./registry.json")

const router = express.Router()


async function proxyHandler(req, res) {
  if(!registry.services[req.params.serviceName] || !registry.services[req.params.serviceName].instances.length) {
    return res.send("Service is down or doesn't exist")
  }

  const headers = {
    ...req.headers
  }
  delete headers["content-length"]    // content-length is headers is automatically generated when the request is sent, we can't pass it explicitly

  try {
    const roundRobinIndex = loadBalancing[registry.services[req.params.serviceName].loadBalancingStrategy](registry.services[req.params.serviceName])
    let url = `${registry.services[req.params.serviceName].instances[roundRobinIndex].url}/${req.params.path1}`

    if(req.params.path2) {
      url += `/${req.params.path2}`
    }

    const response = await axios({
      method: req.method,
      url,
      headers,
      data: req.body
    })


    res.send(response.data)
  } catch (error) {
      if(error.response)
        return res.status(error.response.status).send(error.response.data)
      
      console.log(error)
      res.status(500).send({
        message: "Server Error!"
      })
  }
}

router.get("/", (req, res) => {
  res.render("index.ejs", {
    services: registry.services
  })
})

router.all("/:serviceName/:path1", proxyHandler)
router.all("/:serviceName/:path1/:path2", proxyHandler)

// Registering an Instance
router.post("/register", requireApiAccessKey, async (req, res) => {
  const registrationInfo = req.body;
  registrationInfo.url = `${registrationInfo.protocol}://${registrationInfo.host}:${registrationInfo.port}`

  if(isServerAlreadyRegistered(registrationInfo)) {
    return res.send({
      message: `Configuration already exists for ${registrationInfo.url}`
    })
  }

  if(!registry.services[registrationInfo.serviceName]) {
    return res.send({
      message: "Service Configuration not exists in API Gateway"
    })
  }

  registry.services[registrationInfo.serviceName].instances.push(registrationInfo);
  
  fs.writeFileSync(__dirname + "/registry.json", JSON.stringify(registry, null, 2))

  res.send({
    message: `Configuration successfully registered for ${registrationInfo.url}`
  })

})

function isServerAlreadyRegistered(regInfo) {
  if(!registry.services[regInfo.serviceName]) return false
  return registry.services[regInfo.serviceName].instances.find(el => el.url === regInfo.url)
}

/* 
1. For unregistering, we should always use health check routes of every instance because in some case SIGINT and SIGTERM won't be fired(like device reboot/shutdown)
2. In every 5 or 10 seconds, we call the health-check route for every instance and if it doesn't return with success status(200-399), we remove the instance config from gateway service
3. Thats's how Nginx performs health checks on upstream servers: https://docs.nginx.com/nginx/admin-guide/load-balancer/http-health-check
*/
router.post("/unregister", requireApiAccessKey, async (req, res) => {
  const registrationInfo = req.body;
  registrationInfo.url = `${registrationInfo.protocol}://${registrationInfo.host}:${registrationInfo.port}`

  if(!registry.services[registrationInfo.serviceName]) {
    return res.send({
      message: "Service Configuration doesn't exists in API Gateway"
    })
  }
  
  const index = registry.services[registrationInfo.serviceName].instances.findIndex(el => el.url === registrationInfo.url)

  if(index === -1)
    return res.send({
      message: "Instance not found"
    })
  
  if(index > -1) {
    registry.services[registrationInfo.serviceName].instances.splice(index, 1);
  }

  fs.writeFileSync(__dirname + "/registry.json", JSON.stringify(registry, null, 2))

  return res.send({
    message: "Instances successfully unregistered!"
  })

})


module.exports = router

