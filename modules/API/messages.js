import express from 'express';
import { Config } from "../../config.js";
import joi from 'joi';

export default function createRouter(sql) {
    const router = express.Router();

    //Get all messages for a channel
    router.get('/channel/:channelId', function (req, res, next) {
      let session;

      const validation = intIdSchema.validate(req.params.id);

      if (validation.error !== undefined) {
          return res.status(500).json(result.error);
      }

      sql.getSession()
      .then(s => { session = s; return session.getSchema(Config.MYSQL_ARCHIVESDB) })
      .then(s => { return s.getTable("messages") })
      .then(t =>
          t.select()
          .where("channelId like :channelId")
          .orderBy("timestamp ASC")
          .bind("channelId", req.params.channelId)
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

const intIdSchema = joi.number();