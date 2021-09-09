import express from 'express';
import { Config } from "../../config.js";

export default function createRouter(sql) {
    const router = express.Router();

    //Get all fics
    router.get('/', function (req, res, next) {
      let session;
      let result = [];
      let results = [];

      sql.getSession()
      .then(s => { session = s; return session.getSchema(Config.MYSQL_FICDB) })
      .then(s => { return s.getTable("Fics") })
      .then(t =>
          t.select()
          .orderBy(['year asc', 'month asc', 'day asc'])
          .execute(
              row => {
                  row.forEach((value, i) => {
                      result[i] = Object.assign({}, result[i], { value });
                  });

                  let resultCopy = [...result];
                  results.push(resultCopy);
              },
              columns => {
                  columns.forEach((key, i) => { result[i] = Object.assign({}, result[i], { key: key.getColumnName() }) });
              }
          )
          .catch(err => {
              res.status(500).json({status: err});
          }))
      .then(() => {
          let output = [];

          for (const r of results) {
              let npc = r.reduce((res, pair) => Object.assign(res, { [pair.key]: pair.value }), {});
              output.push(npc);
          }

          res.status(200).json(output);
          session.close();
      })
      .catch(e => {
          res.status(503).json("API Error");
      });
    });

    return router;
}