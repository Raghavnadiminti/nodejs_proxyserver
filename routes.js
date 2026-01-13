const express = require("express");
const router = express.Router();

const {
  initPorts,
  popPort,
  pushPort,
  assignPortToUser,
  removeUsedPort,
  getPortByUser
} = require("./redis.controller");


router.get("/ports/allocate", async (req, res) => {
  try {
    const port = await popPort();
    if (!port) {
      return res.status(404).json({ message: "No free ports available" });
    }
    res.json({ allocatedPort: port });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/ports/release", async (req, res) => {
  try {
    const { port } = req.body;
    if (!port) {
      return res.status(400).json({ message: "port is required" });
    }
  let k =   await pushPort(port);
  if(k){ return res.json({ message: `Port ${port} released` });}
  else{return res.json({"port not in use"})}
   
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = {router};
