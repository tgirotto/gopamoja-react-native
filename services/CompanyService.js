const pg = require('../config/pg');
const Cursor = require('pg-cursor');
const { promisify } = require("util");
const format = require('pg-format');
const moment = require('moment');

const CompanyService = {
  findByAgentPhone: async (agentPhone) => {
    if(isNaN(agentPhone)) {
      throw "agent phone is not a string"
    }

    const client = await pg.connect()
    let result;

    try {
      await client.query('BEGIN')

      let q0 = "select * \
        from agents \
        left join companies on agents.company_id = companies.id \
        where agents.phone = $1";

      result = await client.query(q0, [agentPhone]);

      if(result == null || result.rows == null) {
        throw "agent get did not return any result";
      }

      let companies = result.rows;

      await client.query('COMMIT')
      return new Promise((resolve, reject) => {
        resolve(companies);
      });
    } catch(e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
}

module.exports = CompanyService;
