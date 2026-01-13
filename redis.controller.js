
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
  await redis.sRem(USED_KEY, p);
  await redis.rPush(FREE_KEY, p);
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
  await redis.hSet("user:port", userId.toString(), port.toString());
}

async function removeUserPort(userId) {
  const redis = getRedis();
  await redis.hDel("user:port", userId.toString());
}

async function getPortByUser(userId) {
  const redis = getRedis();
  return await redis.hGet("user:port", userId.toString());
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
  getPortByUser
};
