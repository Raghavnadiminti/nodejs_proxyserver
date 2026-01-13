const { getRedis } = require("./config");

const {
  initPorts,
  popPort,
  pushPort,
  addUsedPort,
  removeUsedPort,
  getFreePorts,
  getUsedPorts,
} = require("./redis.controller");




const allocatePort = async () => {
  try {
    const port = await popPort();

    if (!port) {
      throw new Error("No ports available");
    }

    return port;
  } catch (err) {
    console.error("Failed to allocate port:", err.message);
    throw err;
  }
};


const deallocateport = async (port)=>{
     try {
    if (!port) {
      return new Error("port required")
    }
    await pushPort(port);
    return true
  } catch (err) {
    throw err
  }
}

module.exports={allocatePort,deallocateport}