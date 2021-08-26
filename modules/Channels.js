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
            output.push(['Archive - All Channels']);
            res.status(200).json(output);
            session.close();
        }
    });
  });

  //Get all channels for a category
  router.get('/api/channels/category/:category', function (req, res, next) {
    var session;

    if (req.params.category === 'Archive - All Channels') {
        req.params.category = '%';
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

            session.close();
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
            session.close();
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
            session.close();
        }
    })
  });

  //Get all characters
  router.get('/api/characters', function (req, res, next) {
    var session;
    let result = [];
    let results = [];

    sql.getSession()
    .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
    .then(s => { return s.getTable("Characters") })
    .then(t =>
        t.select()
        .orderBy("name ASC")
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
  });

  router.get('/api/characters/:id', function (req, res, next) {
    let session;
    let result = [];

    sql.getSession()
    .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
    .then(s => { return s.getTable("Characters") })
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
        let character = result.reduce((res, pair) => Object.assign(res, { [pair.key]: pair.value }), {});

        res.status(200).json(character);

        session.close();
    });
  });

  return router;
}