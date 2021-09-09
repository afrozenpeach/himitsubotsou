import express from 'express';
import { Config } from "../../config.js";
import joi from 'joi';

export default function createRouter(sql) {
    const router = express.Router();

    //Get all NPCs
    router.get('/', function (req, res, next) {
      let session;
      let result = [];
      let results = [];

      sql.getSession()
      .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
      .then(s => { return s.getTable("npcMainTable") })
      .then(t =>
          t.select()
          .orderBy("npcName ASC")
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

    //Get a specific NPC
    router.get('/:id', function (req, res, next) {
      let session;
      let result = [];

      const validation = intIdSchema.validate(req.params.id);

      if (validation.error !== undefined) {
          return res.status(500).json(result.error);
      }

      sql.getSession()
      .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
      .then(s => { return s.getTable("npcMainTable") })
      .then(t =>
          t.select()
          .where("id = :id")
          .bind("id", req.params.id)
          .execute(
              row => {
                  row.forEach((value, i) => { result[i] = Object.assign({}, result[i], { value }) });
              },
              columns => {
                  columns.forEach((key, i) => { result[i] = Object.assign({}, result[i], { key: key.getColumnName() }) });
              }
          )
      )
      .then(() => {
          session.close();

          let npc = result.reduce((res, pair) => Object.assign(res, { [pair.key]: pair.value }), {});

          let relationships = [];
          let connections = [];

          sql.getSession()
          .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
          .then(() => {
              return Promise.all([
                  session.sql("USE " + Config.MYSQL_CHARDB).execute(),
                  session.sql("select c.name, r.reltype, 'pc' as chartype, c.id from Relationships r join Characters c on r.char1 = c.id where r.npcID = ?;").bind([npc.ID]).execute(row => { relationships.push(row) }),
                  session.sql("select c.name as name, cn.connectionType, 'pc' as chartype, c.id from npcConnections cn join Characters c on c.id = cn.pcid where cn.npcid = ?").bind([npc.ID]).execute(row => { connections.push(row); })
              ]);
          })
          .then(() => {
              session.close();

              if (relationships.length > 0) {
                  npc.relationships = [];

                  relationships.forEach(r => {
                      npc.relationships.push({
                          Name: r[0],
                          Relationship: r[1],
                          CharType: r[2],
                          CharID: r[3]
                      })
                  });
              }

              if (connections.length > 0) {
                  npc.connections = [];

                  connections.forEach(c => {
                      npc.connections.push({
                          Name: c[0],
                          Relationship: c[1],
                          CharType: c[2],
                          CharID: c[3]
                      });
                  });
              }

              res.status(200).json(npc);
          });
      })
      .catch(e => {
          res.status(503).json("API Error");
      });
    });

    return router;
}

const intIdSchema = joi.number();