import { Client, Intents } from "discord.js";
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
if (Config.BOT_TOKEN) {
    const client = new Client({
        fetchAllMembers: true,
        presence: {activities: [{name: "Himitsu no Sensou", type: "PLAYING"}], status: 'online'},
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_MEMBERS,
            Intents.FLAGS.GUILD_PRESENCES
        ]
    });

    client.on("ready", () => {
        if (Config.VERSION) {
            client.channels.cache.find(channel => channel.name === "botspam").send("Bot loaded. Version: " + Config.VERSION);
        }

        console.log('Bot listening');
    });

    client.on("channelUpdate", (oldChannel, newChannel) => {
        if (newChannel.parent.name.toLowerCase().startsWith("archive") && oldChannel.parent.name.toLowerCase().startsWith("current")) {
            let sessions = [];

            let d = newChannel.name.split('_');

            try {
                if (d.length != 3) {
                    throw 'invalid format for channel name';
                }

                d[0].replaceAll('-', ' ').split(' ').map(function(word) {
                    return (word.charAt(0).toUpperCase() + word.slice(1));
                }).join(' ');

                d[1].split('-').map(function(word) {
                    return (word.charAt(0).toUpperCase() + word.slice(1));
                });

                let date = new Date(d[2].replace('-ar', '').replace('ar', ''));

                if (date.getFullYear > 650) {
                    throw 'invalid  year';
                }
            } catch (error) {
                newChannel.send('Archive failed - Channel name must be in the format location_characters_date');

                newChannel.setParent(oldChannel.parent)

                return;
            }

            newChannel.send("Starting archive...");

            sql.getSession()
            .then(s => { sessions[0] = s; return sessions[0].getSchema(Config.MYSQL_ARCHIVESDB) })
            .then(s => { return s.getTable("channels") })
            .then(t => {
                t.insert(['category', 'channel', 'discordid'])
                .values(newChannel.parent.name, newChannel.name, newChannel.id)
                .execute()
                .then(async r => {
                    let channelId = r.getAutoIncrementValue();
                    let promises = [];
                    let allMessagesRaw = [];
                    let last_id;

                    while (true) {
                        const options = { limit: 100 };
                        if (last_id) {
                            options.before = last_id;
                        }

                        const messages = await newChannel.messages.fetch(options);
                        allMessagesRaw.push(...messages.values());
                        last_id = messages.last().id;

                        if (messages.size != 100) {
                            break;
                        }
                    }

                    allMessagesRaw.forEach(m => {
                        if (!m.author.bot) {
                            promises.push(
                                sql.getSession()
                                .then(s => { sessions[m.id] = s; return sessions[m.id].getSchema(Config.MYSQL_ARCHIVESDB) })
                                .then(s => { return s.getTable("messages") })
                                .then(t => {
                                    t.insert(['channelId', 'content', 'poster', 'timestamp', 'discordid'])
                                    .values(channelId, m.content, (m.member ? m.member.displayName : m.author.username), m.createdTimestamp, m.id)
                                    .execute()
                                    .then(() => sessions[m.id].close())
                                })
                            );
                        }
                    });

                    await Promise.all(promises);
                    newChannel.send("Archive complete. Found: " + allMessagesRaw.length + " messages.");
                });
            })
            .then(() => sessions[0].close())
        }
    })

    client.on("messageCreate", message => {
        try {
            //Ignore this and other bots' messages
            if (message.author.bot) return;

            //Ignore anything without the prefix
            if (!message.content.startsWith(Config.PREFIX)) return;

            const commandBody = message.content.slice(Config.PREFIX.length);
            const args = commandBody.split(' ');
            const command = args.shift().toLowerCase();

            const botCommands = new BotCommands(message, sql, false);

            //If the command is a public function of botCommands, do the thing
            if (typeof botCommands[command] === "function") {
                botCommands[command](args);
            } else {
                args.push(command);
                botCommands.profile(args, false);
            }
        } catch (error) {
            message.channel.send("Error: " + error.message);
        }
    });

    client.on('interactionCreate', async interaction => {
        try {
            if (!interaction.isCommand()) return;

            const { commandName } = interaction;

            const botCommands = new BotCommands(interaction, sql, true);

            botCommands[commandName]([interaction.options.getString('arg') ?? undefined]);
        } catch (error) {
            interaction.message.reply('Error: ' + error.message);
        }
    });

    client.login(Config.BOT_TOKEN);
}

if (Config.EXPRESS_PORT) {
    //Web API
    const app = express()
    .use(cors())
    .use(bodyParser.json())
    .use(Channels(sql));

    app.listen(Config.EXPRESS_PORT, () => {
    console.log(`Express server listening on port ${Config.EXPRESS_PORT}`);
    });
}