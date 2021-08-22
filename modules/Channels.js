import express from 'express';
import { Config } from "../config.js";

export default function createRouter(sql) {
  const router = express.Router();

  //Get all categories
  router.get('/api/categories', function (req, res, next) {
    var session;

    sql.getSession()
    .then(s => { session = s; return session.getSchema(Config.MYSQL_ARCHIVESDB) })
    .then(s => {
        return session.sql("SELECT DISTINCT category FROM " + Config.MYSQL_ARCHIVESDB + ".channels ORDER BY category ASC").execute().catch(err => {
            res.status(500).json({status: err});
        })
    })
    .then(r => {
        if (r) {
            var output = r.fetchAll();
            res.status(200).json(output);
        }
    })
  });

  //Get all channels for a category
  router.get('/api/channels/category/:category', function (req, res, next) {
    var session;

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

            fetched.forEach(f => {
                let d = f[2].split('_');

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
                        discordId: f[3]
                    })
                } catch (error) {
                    output.push({
                        id: f[0],
                        category: f[1],
                        channel: f[2]
                    })
                }
            });

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
        }
    })
  });

  //Get all channels
  router.get('/api/channels', function (req, res, next) {
    var session;

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
            var output = r.fetchAll();

            res.status(200).json(output);
        }
    })
  });

  //Get all messages for a channel
  router.get('/api/messages/channel/:channelId', function (req, res, next) {
    var session;

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
            var output = r.fetchAll();

            res.status(200).json(output);
        }
    })
  });

  return router;
}