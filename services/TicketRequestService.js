const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const TicketRequestService = {
  findByBookingId: async (id) => {
    if(isNaN(id)) {
      throw "booking id is not a string"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "select * \
        from bookings \
        left join ticket_requests on bookings.ticket_request_id = ticket_requests.id \
        where bookings.id = $1";

      result = await client.query(q0, [id]);

      if(result == null || result.rows == null) {
        throw "bookings get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "bookings not found"
      }

      let ticketRequest = result.rows[0];

      await client.query('COMMIT')
      return new Promise((resolve, reject) => {
        resolve(ticketRequest);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
}

module.exports = TicketRequestService;
