const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const AgentService = {
  findById: async (id) => {
    if(isNaN(id)) {
      throw "agent id is not a string"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "select * from agents where id = $1";

      result = await client.query(q0, [id]);

      if(result == null || result.rows == null) {
        throw "agent get did not return any result";
      }

      if(result.rows.length < 1) {
        throw "Agent not found"
      }

      let agent = result.rows[0];

      await client.query('COMMIT')
      return new Promise((resolve, reject) => {
        resolve(agent);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
}

module.exports = AgentService;
