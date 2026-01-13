const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { router } = require("./routes");
const { connectRedis } = require("./config");
const {
  assignPortToUser,initPorts
} = require("./redis.controller");
const { allocatePort } = require("./controller");

const app = express();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

app.use(cors(corsOptions));
app.use(express.json());


app.post("/runcode", async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: "userId required" });

    const port = await allocatePort();
    await assignPortToUser(userId, port);
    console.log(userId,port,"allocated")

    req.allocatedPort = port;
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


app.use(
  "/runcode",
  createProxyMiddleware({
    target: "http://16.170.241.164:5000", 
    changeOrigin: true,
    pathRewrite: {
      "^/runcode": "/api/getcode",
    },
    onProxyReq(proxyReq, req) {
      const body = {
        ...req.body,
        port: req.allocatedPort,
      };

      const bodyStr = JSON.stringify(body);
      proxyReq.setHeader("Content-Type", "application/json");
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyStr));
      proxyReq.write(bodyStr);
      proxyReq.end();
    },
  })
);


app.use("/api", router);


(async () => {
  try {
    await connectRedis();
    await initPorts();
    console.log("Redis ready to use");
  } catch (err) {
    console.error("Redis connection failed", err);
    process.exit(1);
  }
})();

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
