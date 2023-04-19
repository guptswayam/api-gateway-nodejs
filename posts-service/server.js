// console.clear()
const express = require("express")
const axios = require("axios")
const { requireAuth } = require("./common/middleware/require-auth")
const PORT = Number(process.argv[2]) || 5001
const apiGatewayConfig = require("./config/api-gateway.json").development

const SERVICE_CONFIG = {
  serviceName: "posts-service",
  protocol: "http",
  host: "localhost",
  port: PORT,
}

const app = express()

app.use(express.json())

app.get("/health-check", (req, res) => {
  res.send("Post-Service Server is UP...");
})

app.post("/create", requireAuth, (req, res) => {
  console.log(req.body)
  res.send(req.body)
})

app.put("/update/:id", requireAuth, (req, res) => {
  console.log(req.body)
  res.send({
    ...req.body,
    id: req.params.id
  })
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

app.listen(PORT, () => {
  console.log(`server started at port ${PORT}...`);
  registerServiceToGateway()
})