import { Client } from "discord.js";
import { Config } from "./config.js";
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysqlx from "@mysql/xdevapi";
import Channels from './modules/Channels.js';
import BotCommands from "./modules/BotCommands.js";

//SQL
const sql = mysqlx.getClient(
    { host: Config.MYSQL_HOST, user: Config.MYSQL_USER, password: Config.MYSQL_PASSWORD },
    { pooling: { enabled: true, maxIdleTime: 30000, maxSize: 25, queueTimeout: 0 } }
)

//Discord Bot
const client = new Client({
    fetchAllMembers: true,
    presence: {activity: {name: "Himitsu no Sensou", type: "PLAYING"}, status: 'online'}
});

client.on("ready", () => {
    if (Config.VERSION) {
        client.channels.cache.find(channel => channel.name === "botspam").send("Bot loaded. Version: " + Config.VERSION);
    }
});

client.on("message", message => {
    try {
        //Ignore this and other bots' messages
        if (message.author.bot) return;

        //Ignore anything without the prefix
        if (!message.content.startsWith(Config.PREFIX)) return;
        
        const commandBody = message.content.slice(Config.PREFIX.length);
        const args = commandBody.split(' ');
        const command = args.shift().toLowerCase();

        const botCommands = new BotCommands(message, sql);

        //If the command is a public function of botCommands, do the thing
        if (typeof botCommands[command] === "function") {
            botCommands[command](args);
        }
    } catch (error) {
        message.channel.send("Error: " + error.message)
    }
});

client.login(Config.BOT_TOKEN);

//Web API
const app = express()
  .use(cors())
  .use(bodyParser.json())
  .use(Channels(sql));

app.listen(Config.EXPRESS_PORT, () => {
  console.log(`Express server listening on port ${Config.EXPRESS_PORT}`);
});