import { Client, Intents } from "discord.js";
import { Config } from "./config.js";
import express from 'express';
import cors from 'cors';
import mysqlx from "@mysql/xdevapi";
import BotCommands from "./modules/BotCommands/BotCommands.js";
import bodyParser from 'body-parser';
import categoriesRouter from './modules/API/categories.js';
import channelsRouter from './modules/API/channels.js';
import charactersRouter from './modules/API/characters.js';
import ficsRouter from './modules/API/fics.js';
import messagesRouter from './modules/API/messages.js';
import npcsRouter from './modules/API/npcs.js';

//SQL connection
const sql = mysqlx.getClient(
    { host: Config.MYSQL_HOST, user: Config.MYSQL_USER, password: Config.MYSQL_PASSWORD },
    { pooling: { enabled: true, maxIdleTime: 30000, maxSize: 25, queueTimeout: 0 } }
)

//Discord Bot - only load if a BOT_TOKEN is set
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

    //If VERSION is set, the bot will announce itself when it connects
    client.on("ready", () => {
        if (Config.VERSION) {
            client.channels.cache.find(channel => channel.name === "botspam").send("Bot loaded. Version: " + Config.VERSION);
        }

        console.log('Bot listening');
    });

    //When a channel is moved, verify the channel and then if verified archive it
    client.on("channelUpdate", (oldChannel, newChannel) => {
        if (newChannel.parent.name.toLowerCase().startsWith("archive") && oldChannel.parent.name.toLowerCase().startsWith("current")) {
            let sessions = [];

            let d = newChannel.name.split('_');

            try {
                //Foramt should be location_characters_date: ex: floran-city_inara-anton-daisy_july-10th-0633-AR
                if (d.length != 3) {
                    throw 'invalid format for channel name';
                }

                //verify location
                d[0].replaceAll('-', ' ').split(' ').map(function(word) {
                    return (word.charAt(0).toUpperCase() + word.slice(1));
                }).join(' ');

                //verify characters
                d[1].split('-').map(function(word) {
                    return (word.charAt(0).toUpperCase() + word.slice(1));
                });

                //verify date
                let date = new Date(d[2].toLowerCase().replace('-ar', '').replace('ar', ''));

                if (date.getFullYear > 650) {
                    throw 'invalid  year';
                }
            } catch (error) {
                newChannel.send('Archive failed - Channel name must be in the format location_characters_date and characters should be a hyphen separated list');

                newChannel.setParent(oldChannel.parent)

                return;
            }

            newChannel.send("Starting archive...");

            sql.getSession()
            .then(s => { sessions[0] = s; return sessions[0].getSchema(Config.MYSQL_ARCHIVESDB) })
            .then(s => { return s.getTable("channels") })
            .then(t => {
                //Insert the channel header
                t.insert(['category', 'channel', 'discordid'])
                .values(newChannel.parent.name, newChannel.name, newChannel.id)
                .execute()
                .then(async r => {
                    let channelId = r.getAutoIncrementValue();
                    let promises = [];
                    let allMessagesRaw = [];
                    let last_id;

                    //Get all the messages as quickly as possible
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
                        //Save each message as long as a bot didn't send it
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

    //When a slash command is run
    client.on('interactionCreate', async interaction => {
        try {
            if (!interaction.isCommand()) return;

            const { commandName } = interaction;

            let prefix = interaction.options.getString('prefix');

            if (prefix != null && prefix != Config.PREFIX) {
                return;
            }

            let publicCommand = interaction.options.getBoolean('public');

            if (publicCommand === null) {
                publicCommand = false;
            }

            //With a few exceptions (see the #getAllMethods function) public functions are eligable slash commands
            const botCommands = new BotCommands(interaction, sql, !publicCommand);

            //Each slash command should have a matching Help function named commandHelp
            let mh = commandName + 'Help';
            let md = botCommands[mh]();
            let args = {};

            //Load required arguments
            if (md.requiredArguments) {
                md.requiredArguments.forEach(a => {
                    args[a.argument] = interaction.options.getString(a.argument);
                });
            }

            //Load optional arguments
            if (md.optionalArguments) {
                md.optionalArguments.forEach(a => {
                    let interactionArgument = null;

                    if (a.type === 'bool') {
                        interactionArgument = interaction.options.getBoolean(a.argument);
                    } else {
                        interactionArgument = interaction.options.getString(a.argument);
                    }

                    if (interactionArgument != null) {
                        args[a.argument] = interactionArgument;
                    }
                });
            }

            //As long as the command is a function, run it and pass in the arguments
            if (typeof botCommands[commandName] === "function") {
                botCommands[commandName](args);
            } else {
                interaction.reply('Error: invalid command.').catch();
            }
        } catch (error) {
            interaction.reply('Error: ' + error.message).catch();
        }
    });

    client.login(Config.BOT_TOKEN);
}

//Web API - Only loads if an EXPRESS_PORT is set
//All the magic happens in modules/Channels.js
//This is required for the Himitsu Frontend
if (Config.EXPRESS_PORT) {
    const app = express()
        .use(cors())
        .use(express.json())
        .use(bodyParser.json())
        .use('/api/categories', categoriesRouter(sql))
        .use('/api/channels', channelsRouter(sql))
        .use('/api/characters', charactersRouter(sql))
        .use('/api/fics', ficsRouter(sql))
        .use('/api/messages', messagesRouter(sql))
        .use('/api/npcs', npcsRouter(sql));

    app.listen(Config.EXPRESS_PORT, () => {
        console.log(`Express server listening on port ${Config.EXPRESS_PORT}`);
    });
}