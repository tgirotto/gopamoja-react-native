const pg = require('../config/pg');
const Router = require('express-promise-router');
const router = new Router()
const path = require('path');
let moment = require('moment');

let ENVIRONMENT = process.env.ENVIRONMENT || 'development';

const AgentService = require('../services/AgentService');
const BookingService = require('../services/BookingService');

router.get('/bookings', async function(req, res, next) {
  try {
    let agentId = parseInt(req.query.agent_id);
    let string = req.query.string;

    if(isNaN(agentId)) {
      throw "Agent id is not provided"
    }

    if(typeof string !== 'string') {
      throw "Invalid string"
    }

    const agent = await AgentService.findById(agentId);

    if(agent == null) {
      throw "Agent not found"
    }

    const bookings = await BookingService.findByString(string);
    res.json({bookings: bookings});
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

module.exports = router;
