import { Client } from "discord.js";
import { Config } from "./config.js";
import BotCommands from "./modules/BotCommands.js";

const client = new Client();

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

        const botCommands = new BotCommands(message);

        //If the command is a public function of botCommands, do the thing
        if (typeof botCommands[command] === "function") {
            botCommands[command](args);
        }
    } catch (error) {
        message.channel.send("Error: " + error.message)
    }
});

client.login(Config.BOT_TOKEN);