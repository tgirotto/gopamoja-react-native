const pg = require('../config/pg');
const Router = require('express-promise-router');
const router = new Router()
const path = require('path');
let moment = require('moment');

let ENVIRONMENT = process.env.ENVIRONMENT || 'development';

const AgentService = require('../services/AgentService');
const BookingService = require('../services/BookingService');
const CompanyService = require('../services/CompanyService');
const UpcomingService = require('../services/UpcomingService');
const ConfirmationService = require('../services/ConfirmationService');
const TicketRequestService = require('../services/TicketRequestService');

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

router.get('/companies', async function(req, res, next) {
  try {
    let token = req.headers.token;

    if(typeof token !== 'string') {
      throw "token id is not provided"
    }

    const agent = await AgentService.findByToken(token);

    if(agent == null) {
      throw "Agent not found"
    }

    const companies = await CompanyService.findByAgentPhone(agent['phone']);
    res.json({companies: companies});
  } catch(e) {
    console.log(e);
    res.status(500).json({err: e.toString()});
  }
});

router.get('/upcoming', async function(req, res, next) {
  try {
    let token = req.headers.token;
    let companyId = parseInt(req.query.companyId);

    if(typeof token !== 'string') {
      throw "token id is not provided"
    }

    const agent = await AgentService.findByToken(token);

    if(agent == null) {
      throw "Agent not found"
    }

    const schedule = await UpcomingService.findByCompanyId(companyId);
    res.json({upcoming: schedule});
  } catch(e) {
    console.log(e);
    res.status(500).json({err: e.toString()});
  }
});

router.get('/trips/:id/layout', async function(req, res, next) {
  try {
    let token = req.headers.token;
    let tripId = parseInt(req.params.id);
    let stopId = parseInt(req.query.stopId);
    let date = req.query.date;

    if(typeof token !== 'string') {
      throw "token id is not provided"
    }

    if(isNaN(tripId)) {
      throw "trip id invalid"
    }

    if(isNaN(stopId)) {
      throw "stop id invalid"
    }

    date = moment(date)

    const agent = await AgentService.findByToken(token);

    if(agent == null) {
      throw "Agent not found"
    }

    const schedule = await BookingService.findLayoutByTripIdAndDateAndStopId(tripId, date, stopId);
    res.json({upcoming: schedule});
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

router.post('/confirmations', async function(req, res, next) {
  try {
    let token = req.headers.token;
    let bookingId = parseInt(req.body.bookingId);

    if(typeof token !== 'string') {
      throw "token id is not provided"
    }

    if(isNaN(bookingId)) {
      throw "Booking id is not provided"
    }

    const agent = await AgentService.findByToken(token);

    if(agent == null) {
      throw "Agent not found"
    }

    const confirmation = await ConfirmationService.insertOne(agent['id'], bookingId);
    res.json({confirmation: confirmation});
  } catch(e) {
    res.status(500).json({err: e.toString()});
  }
});

module.exports = router;
