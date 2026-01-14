
const { getRedis } = require("./config");

const FREE_KEY = "ports:free";
const USED_KEY = "ports:used";


async function initPorts() {
  const redis = getRedis();

  const freeExists = await redis.exists(FREE_KEY);
  const usedExists = await redis.exists(USED_KEY);
  console.log(freeExists,usedExists)
  if (freeExists && usedExists) {
    console.log("Ports already initialized");
    return;
  }
  if (!freeExists) {
    for (let p = 3000; p <= 3100; p++) {
      await redis.rPush(FREE_KEY, p.toString());
    }
  }
  if (!usedExists) {
    await redis.del(USED_KEY); 
  }
  console.log("Ports initialized safely");
}


async function popPort() {
  const redis = getRedis();
  const port = await redis.lPop(FREE_KEY);
  if (!port) return null;
  await redis.sAdd(USED_KEY, port);
  return port;
}

async function pushPort(port) {
  const redis = getRedis();
  const p = port.toString();
  const removed = await redis.sRem(USED_KEY, p);
  if (removed === 0) {
    return false; 
  }
  await redis.rPush(FREE_KEY, p);
  return true;
}


async function addUsedPort(port) {
  const redis = getRedis();
  await redis.sAdd(USED_KEY, port.toString());
}


async function removeUsedPort(port) {
  const redis = getRedis();
  await redis.sRem(USED_KEY, port.toString());
}


async function getFreePorts() {
  const redis = getRedis();
  return await redis.lRange(FREE_KEY, 0, -1);
}


async function getUsedPorts() {
  const redis = getRedis();
  return await redis.sMembers(USED_KEY);
}


async function assignPortToUser(userId, port) {
  const redis = getRedis();
  const existingPort = await redis.hGet("user:port", userId.toString());
  if (existingPort) {
    return existingPort;
  }
  await redis.hSet("user:port", userId.toString(), port.toString());
  return port;
}


async function removeUserPort(userId) {
  const redis = getRedis();
  const port = await redis.hGet("user:port", userId.toString());
  if (port !== null) {
    await redis.hDel("user:port", userId.toString());
  }
  return port; 
}


async function getPortByUser(userId) {
  const redis = getRedis();
  return await redis.hGet("user:port", userId.toString());
}
async function updateUserLastRun(userId) {
  const redis = getRedis();
  const now = Date.now(); 

  await redis.hSet(
    "user:lastRun",
    userId.toString(),
    now.toString()
  );
}

module.exports = {
  initPorts,
  popPort,
  pushPort,
  addUsedPort,
  removeUsedPort,
  getFreePorts,
  getUsedPorts,
  assignPortToUser,
  removeUsedPort,
  getPortByUser,
  updateUserLastRun,
  removeUserPort
};
