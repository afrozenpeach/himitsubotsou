import express from 'express';
import { Config } from "../../config.js";
import joi from 'joi';

export default function createRouter(sql) {
    const router = express.Router();

    //Get all channels for a category
    router.get('/category/:category', function (req, res, next) {
      let session;
      let sessions = [];

      if (req.params.category === 'Archive - All Channels') {
          req.params.category = '%';
      }

      const validation = stringSchema.validate(req.params.category);

      if (validation.error !== undefined) {
          return res.status(500).json(result.error);
      }

      sql.getSession()
      .then(s => { session = s; return session.getSchema(Config.MYSQL_ARCHIVESDB) })
      .then(s => { return s.getTable("channels") })
      .then(t =>
          t.select()
          .where("category like :category")
          .orderBy("channel")
          .bind("category", req.params.category)
          .execute()
          .catch(err => {
              res.status(500).json({status: err});
          }))
      .then(r => {
          if (r) {
              let fetched = r.fetchAll();
              let output = [];
              let promises = [];

              for (const f of fetched) {
                  promises.push(
                      sql.getSession()
                      .then(s2 => { sessions[f[0]] = s2; return sessions[f[0]].getSchema(Config.MYSQL_ARCHIVESDB)})
                      .then(() => {
                          return sessions[f[0]].sql("SET SESSION group_concat_max_len = 1000000;").execute().catch();
                      })
                      .then(() => {
                          return sessions[f[0]].sql("SELECT GROUP_CONCAT(content SEPARATOR ', ') FROM " + Config.MYSQL_ARCHIVESDB + ".messages WHERE channelId = " + f[0] + " GROUP BY channelId").execute().catch(err => {
                              res.status(500).json({status: err});
                          })
                      })
                      .then(r2 => {
                          let d = f[2].split('_');
                          let m = [];

                          if (r2) {
                              m = r2.fetchAll();
                          }

                          try {
                              output.push({
                                  id: f[0],
                                  category: f[1],
                                  channel: f[2],
                                  location: d[0].replaceAll('-', ' ').split(' ').map(function(word) {
                                      return (word.charAt(0).toUpperCase() + word.slice(1));
                                  }).join(' '),
                                  characters: d[1].split('-').map(function(word) {
                                      return (word.charAt(0).toUpperCase() + word.slice(1));
                                  }),
                                  date: new Date(d[2].replace('-ar', '').replace('ar', '')),
                                  discordId: f[3],
                                  messages: m[0][0]
                              })
                          } catch (error) {
                              output.push({
                                  id: f[0],
                                  category: f[1],
                                  channel: f[2]
                              })
                          }

                          sessions[f[0]].close();
                      })
                  );
              }

              Promise.all(promises).then(() => {
                  res.status(200).json(output.sort((a, b) => {
                      if (a.date > b.date) {
                          return 1;
                      } else if (a.date === b.date) {
                          if (a.id > b.id) {
                              return 1;
                          } else {
                              return -1;
                          }
                      } else {
                          return -1;
                      }
                  }));

                  session.close();
              })
          }
      })
      .catch(e => {
          res.status(503).json("API Error");
      });
    });

    //Get all channels
    router.get('/', function (req, res, next) {
      let session;

      sql.getSession()
      .then(s => { session = s; return session.getSchema(Config.MYSQL_ARCHIVESDB) })
      .then(s => { return s.getTable("channels") })
      .then(t =>
          t.select()
          .orderBy("channel")
          .bind("category", req.params.category)
          .execute()
          .catch(err => {
              res.status(500).json({status: err});
          }))
      .then(r => {
          if (r) {
              let output = r.fetchAll();

              res.status(200).json(output);
              session.close();
          }
      })
      .catch(e => {
          res.status(503).json("API Error");
      });
    });

    return router;
}

const stringSchema = joi.string();