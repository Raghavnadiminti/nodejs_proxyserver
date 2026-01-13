
const { createClient } = require("redis");

let redisClient;

async function connectRedis() {
  if (redisClient && redisClient.isOpen) {
    console.log("Redis already connected");
    return redisClient;
  }

  redisClient = createClient({
    url: "redis://127.0.0.1:6379", 
  });

  redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
  });

  await redisClient.connect();
  console.log("Redis Connected");

  return redisClient;
}

function getRedis() {
  if (!redisClient) {
    throw new Error("Redis not connected yet. Call connectRedis() first.");
  }
  return redisClient;
}

module.exports = {
  connectRedis,
  getRedis,
};
