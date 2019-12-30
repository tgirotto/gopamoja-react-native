const pg = require('../config/pg');
const Router = require('express-promise-router');
const router = new Router()
const path = require('path');
let moment = require('moment');

let ENVIRONMENT = process.env.ENVIRONMENT || 'development';

const AgentService = require('../services/AgentService');
const BookingService = require('../services/BookingService');
const ConfirmationService = require('../services/ConfirmationService');

router.get('/bookings', async function(req, res, next) {
  try {
    let token = req.headers.token;
    let string = req.query.string;

    if(typeof token !== 'string') {
      throw "token id is not provided"
    }

    if(typeof string !== 'string') {
      throw "Invalid string"
    }

    const agent = await AgentService.findByToken(token);

    if(agent == null) {
      throw "Agent not found"
    }

    const bookings = await BookingService.findByString(string);
    res.json({bookings: bookings});
  } catch(e) {
    console.log(e);
    res.status(500).json({err: e.toString()});
  }
});

router.post('/confirmations', async function(req, res, next) {
  try {
    let agentId = parseInt(req.body.agentId);
    let bookingId = parseInt(req.body.bookingId);

    if(isNaN(agentId)) {
      throw "Agent id is not provided"
    }

    if(isNaN(bookingId)) {
      throw "Booking id is not provided"
    }

    const agent = await AgentService.findById(agentId);

    if(agent == null) {
      throw "Agent not found"
    }

    const confirmation = await ConfirmationService.insertOne(agentId, bookingId);
    res.json({confirmation: confirmation});
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

module.exports = router;
