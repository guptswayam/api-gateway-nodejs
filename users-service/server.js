// console.clear()
const express = require("express")
const axios = require("axios")
const { requireApiAccessKey } = require("./common/middleware/require-auth")
const PORT = Number(process.argv[2]) || 5003
const apiGatewayConfig = require("./config/api-gateway.json").development

const SERVICE_CONFIG = {
  serviceName: "users-service",
  protocol: "http",
  host: "localhost",
  port: PORT,
}

const USERS = {
  1: {
    id: 1,
    name: "Swayam Gupta",
    email: "swayam@gmail.com",
  }
}

const app = express()

app.use(express.json())

app.get("/health-check", (req, res) => {
  res.send("User-Service Server is UP...");
})

app.post("/users/signup", (req, res) => {
  console.log(req.body)
  res.send(req.body)
})

app.get("/users/:id", requireApiAccessKey, (req, res) => {
  res.send(USERS[req.params.id])
})

async function registerServiceToGateway() {
  try {
    const response = await axios({
      method: "POST",
      url: `${apiGatewayConfig.BASE_URL}${apiGatewayConfig.REGISTER_SERVICE}`,
      data: SERVICE_CONFIG,
      headers: {
        "api-key": apiGatewayConfig.API_GATEWAY_ACCESS_TOKEN
      }
    })
  
    console.log(response.data)
  } catch (error) {
    if(error.response) {
      console.log(error.response.data)
    } else {
      console.log(error.message)
    }
  }
}

async function unregisterServiceToGateway() {
  try {
    const response = await axios({
      method: "POST",
      url: `${apiGatewayConfig.BASE_URL}${apiGatewayConfig.UNREGISTER_SERVICE}`,
      data: SERVICE_CONFIG,
      headers: {
        "api-key": apiGatewayConfig.API_GATEWAY_ACCESS_TOKEN
      }
    })
  
    console.log(response.data)
  } catch (error) {
    if(error.response) {
      console.log(error.response.data)
    } else {
      console.log(error.message)
    }
  }
}

process.on("SIGINT", async () => {
  await unregisterServiceToGateway()
  process.exit()
})

process.on("SIGTERM", async () => {
  await unregisterServiceToGateway()
  process.exit()
})

process.on("uncaughtException", async (error) => {
  await unregisterServiceToGateway()
  console.log(error)
  process.exit()
})

process.on("unhandledRejection", async (error) => {
  await unregisterServiceToGateway()
  console.log(error)
  process.exit()
})

app.listen(PORT, () => {
  console.log(`server started at port ${PORT}...`);
  registerServiceToGateway()
})