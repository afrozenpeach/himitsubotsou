import express from 'express';
import { Config } from "../../config.js";

export default function createRouter(sql) {
    const router = express.Router();

    //Get all categories
    router.get('/', function (req, res, next) {
        let session;

        sql.getSession()
        .then(s => { session = s; return session.getSchema(Config.MYSQL_ARCHIVESDB) })
        .then(s => {
            return session.sql("SELECT DISTINCT category FROM " + Config.MYSQL_ARCHIVESDB + ".channels ORDER BY category ASC").execute().catch(err => {
                res.status(500).json({status: err});
            })
        })
        .then(r => {
            if (r) {
                let output = r.fetchAll();
                output.push(['Archive - All Channels']);
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