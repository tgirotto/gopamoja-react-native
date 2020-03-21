const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment-timezone');

const BookingService = {
  insertOne: async (agentId, bookingId) => {
    if(isNaN(bookingId)) {
      throw "Invalid booking id"
    }

    if(isNaN(agentId)) {
      throw "Invalid agent id"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "select * from agents where id = $1";

      result = await client.query(q0, [agentId]);

      if(result == null || result.rows == null) {
        throw "Agent get get did not return any result";
      }

      if(result.rows.length < 1) {
        throw 'agent not found'
      }

      let q1 = "select * \
        from bookings \
        left join ticket_requests on bookings.ticket_request_id = ticket_requests.id \
        where bookings.id = $1";

      result = await client.query(q1, [bookingId]);

      if(result == null || result.rows == null) {
        throw "Bookings get did not return any result";
      }

      if(result.rows.length < 1) {
        throw 'booking not found'
      }

      let booking = result.rows[0];

      let q2 = "insert into confirmations(agent_id, booking_id) values($1, $2) returning *";

      result = await client.query(q2, [agentId, bookingId]);

      if(result == null || result.rows == null) {
        throw "confirmation insert did not return any result";
      }

      if(result.rows.length < 1) {
        throw "confirmation insert did not work"
      }

      let confirmation = result.rows[0];
      confirmation['booking'] = booking;
      await client.query('COMMIT')
      return new Promise((resolve, reject) => {
        resolve(confirmation);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
}

module.exports = BookingService;
