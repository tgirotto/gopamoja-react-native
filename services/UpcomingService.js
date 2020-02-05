const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const UpcomingService = {
  findByCompanyId: async(companyId) => {
    if(isNaN(companyId)) {
      throw "invalid companyId"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      //not very smart, since we are loading all of them to memory before processing. not sustainable
      let q0 = `select \
        route_stops.id as id, \
        routes.id as route_id, \
        route_stops.position as position, \
        trips.id as trip_id, \
        companies.name as company_name, \
        route_stops.departure_day as departure_day, \
        route_stops.departure_hour as departure_hour, \
        route_stops.departure_minute as departure_minute, \
        trips.days_of_the_week as days_of_the_week, \
        stops.name as stop_name \
        from route_stops \
        left join routes on routes.id = route_stops.route_id \
        left join trips on trips.route_id = routes.id \
        left join stops on stops.id = route_stops.stop_id \
        left join companies on companies.id = routes.company_id \
        where routes.deleted = $1 and companies.id = $2`;

      result = await client.query(q0, [false, companyId]);

      if(result == null || result.rows == null) {
        throw "Route stops get did not return any result";
      }

      let routeStops = result.rows
      let upcoming = [], route;

      //start and end of the journey
      for(let rs of routeStops) {
        route = upcoming.find(x => x.id === rs.route_id);

        if(route == null) {
          route = {
            id: rs.route_id,
            trip_id: rs.trip_id,
            origin_name: rs.stop_name,
            company_name: rs.company_name,
            departure_day: rs.departure_day,
            departure_hour: rs.departure_hour,
            departure_minute: rs.departure_minute,
            stops: []
          }

          upcoming.push(route);
        }

        route['destination_name'] = rs.stop_name;
        route['arrival_day'] = rs.departure_day;
        route['arrival_hour'] = rs.departure_hour;
        route['arrival_minute'] = rs.departure_minute;
        route['days_of_the_week'] = rs.days_of_the_week;
      }

      //add stops field to every route
      upcoming = upcoming.map((x) => {
        x['stops'] = routeStops.filter((y) => {
          return y['route_id'] === x['id']
        })

        return x;
      })

      let now = moment().add(1, 'days')
      let i = 0;
      let MAX_DAYS = 7;

      let schedule = [], t, d;
      while(i < MAX_DAYS) {
        t = {
          date: moment(now).startOf('day'),
          formatted_date: moment(now).startOf('day').format("dddd, MMMM Do YYYY"),
          items: []
        }

        for(let j = 0; j < upcoming.length; j++) {
          if(upcoming[j]['days_of_the_week'] == null) {
            continue
          }

          if(upcoming[j]['days_of_the_week'].includes(now.day())) {
            t['items'].push(upcoming[j]);
          }
        }

        schedule.push(t)
        i++;
        now.add(1, 'days')
      }

      await client.query('COMMIT')

      return new Promise((resolve, reject) => {
        resolve(schedule);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e;
    } finally {
      client.release()
    }
  }
}

module.exports = UpcomingService;
