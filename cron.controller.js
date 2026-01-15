const { getRedis } = require("./config");
const axios = require("axios");
const {removeUsedPort,removeUserPort,pushPort} = require('./redis.controller')

async function getAllUserLastRuns() {
  const redis = getRedis();
  const data = await redis.hGetAll("user:lastRun");
  return data;
}




async function cronCleanup() {
  const users = await getAllUserLastRuns();
  const now = Date.now();

  const images = [];

  for (const [userId, lastRun] of Object.entries(users)) {
    if (now - Number(lastRun) > 10 * 60 * 1000) {

      console.log("Inactive user:", userId);
      let p = await removeUserPort(userId)
      await pushPort(userId)
      images.push("sandbox" + userId);
    }
  }

  if (images.length === 0) return;

  await axios.post("http://13.60.85.247:5000/cleanup-images", {
    images: images,
  });

  console.log("Sent cleanup request for:", images);
}


module.exports = { getAllUserLastRuns,cronCleanup};
