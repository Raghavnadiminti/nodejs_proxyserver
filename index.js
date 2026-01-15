const express = require("express");
const cors = require("cors");
const { createProxyMiddleware, fixRequestBody } = require("http-proxy-middleware");
const { router } = require("./routes");
const { connectRedis } = require("./config");
const { allocatePortForUser, initPorts,updateUserLastRun } = require("./redis.controller");
const { allocatePort,deallocateport } = require("./controller");
const cron = require("node-cron");
const { cronCleanup } = require("./cron.controller");

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

    const port = await allocatePortForUser(userId);    
    console.log("Allocated:", userId, port);
    updateUserLastRun(userId)
    req.body.port = port;  
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


app.use(
  "/runcode",
  createProxyMiddleware({
    target: "http://13.60.85.247:5000/api/getcode",
    changeOrigin: true,
    pathRewrite: {
      "^/runcode": "/api/getcode",
    },
    on: {
    proxyReq(proxyReq, req) {
    fixRequestBody(proxyReq, req); 
    console.log(`Proxying ${req.method} ${req.originalUrl} → ${proxyReq.protocol}//${proxyReq.getHeader('host')}${proxyReq.path}`);
  }, 
      proxyRes(proxyRes) {
        console.log("Proxy response status:", proxyRes.statusCode);
        if (proxyRes.statusCode < 200 || proxyRes.statusCode >= 300) {
          if(req.body.port){ deallocateport(req.body.port)
            console.log("deallocated",req.body.port)
           }
           
  }
      },
      error(err, req, res) {
        console.error("Proxy Error:", err.message);
         if(req.body.port){ deallocateport(req.body.port)
            console.log("deallocated",req.body.port)
           }
        if (!res.headersSent) {
           
          res.status(502).json({
            error: "Proxy failed",
            details: err.message,
          });
        }
      },
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







cron.schedule("*/30 * * * *", async () => {
  try {
    console.log("Running cleanup job...");
    await cronCleanup();
  } catch (err) {
    console.error("Cleanup job failed:", err);
  }
});







app.listen(5000, () => {
  console.log("Server running on port 5000");
});
