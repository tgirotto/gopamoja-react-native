const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const BookingService = {
  findByString: async (string) => {
    if(typeof string !== 'string') {
      throw "String is not a string"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let likeString = '%' + string.trim().toLowerCase() + '%';

      let q0 = "select \
        bookings.id as id, \
        ticket_requests.id as ticket_request_id, \
        ticket_requests.first_name as first_name, \
        ticket_requests.last_name as last_name, \
        ticket_requests.phone as phone, \
        ticket_requests.row as row, \
        ticket_requests.column as column, \
        origins.name as origin_name, \
        origins.id as origin_id, \
        destinations.id as destination_id, \
        destinations.name as destination_name, \
        companies.id as company_id, \
        companies.name as company_name \
        from bookings \
        left join ticket_requests on bookings.ticket_request_id = ticket_requests.id \
        left join segments on segments.id = ticket_requests.segment_id \
        left join stops as origins on origins.id = segments.origin_id \
        left join stops as destinations on destinations.id = segments.destination_id \
        left join routes on segments.route_id = routes.id \
        left join companies on companies.id = routes.company_id \
        where lower(ticket_requests.first_name) LIKE $1 \
        or lower(ticket_requests.last_name) LIKE $2 \
        or lower(ticket_requests.phone) LIKE $3";

      result = await client.query(q0, [likeString, likeString, likeString]);

      if(result == null || result.rows == null) {
        throw "Stops get did not return any result";
      }

      let bookings = result.rows;

      await client.query('COMMIT')
      return new Promise((resolve, reject) => {
        resolve(bookings);
      });
    } catch(e) {
      console.log(e);
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
}

module.exports = BookingService;
