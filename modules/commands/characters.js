import { MessageEmbed } from "discord.js";
import { Config } from "../../config.js";

export default function({ player, all } = {}) {

    let characters = [];
    let color = "";
    let user = undefined;
    let finalMessage = "";

    //If there is an arg find the characters for that player
    //Otherwise find the characters for the player that activated the command
    if (!player) {
        user = this.message.author;

        if (user === undefined) {
            user = this.message.user;
        }

        switch (user.username.toLocaleLowerCase()) {
            case "frozenpeach":
                player = "Frozen";
                break;
            case "belix":
                player = "Elzie";
                break;
            case "stormbourne":
                player = "Dots";
                break;
            case "rosa":
                player = "Rosa";
                break;
            case "meg":
                player = "Meg";
                break;
            case "wheelfor":
                player = "Nin";
                break;
        }
    }

    //Player preferences - TO DO: Pull from database
    switch (player.toLocaleLowerCase()) {
        case "frozen":
            user = this.message.client.users.cache.find(user => user.username == "FrozenPeach");
            color = "#32a8a4";
            break;
        case "dots":
            user = this.message.client.users.cache.find(user => user.username == "stormbourne");
            color = "#a70058";
            break;
        case "elzie":
            user = this.message.client.users.cache.find(user => user.username == "belix");
            color = "#008000";
            break;
        case "meg":
            user = this.message.client.users.cache.find(user => user.username == "Meg");
            color = "#800080";
            break;
        case "nineveh":
        case "nin":
            user = this.message.client.users.cache.find(user => user.username == "wheelfor");
            color = "#800080";
            player = "nineveh";
            break;
        case "rosa":
            user = this.message.client.users.cache.find(user => user.username == "ROSA");
            color = "#800080";
            break;
        case "playerless":
        case "unplayed":
            user = undefined;
            color = "#000000";
            player = "playerless";
            break;
        default:
            this.message.reply({ content: "Player not found.", ephemeral: this.ephemeral });
            return;
    }

    let activeOnly = " && status = 'Normal'";

    if (all) {
        activeOnly = "";
    }

    let session;
    let chars = [];

    this.sql.getSession()
    .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
    .then(s => { return s.getTable("Characters") })
    .then(t =>
        t.select("name", "nickname1", "nickname2")
        .where("player like :player" + activeOnly)
        .orderBy("name")
        .bind("player", player)
        .execute())
    .then(r => {
        chars = r.fetchAll();

        //Find emojis for each character
        //emoji must be a custom emoji uploaded with the character's proper name or a defined nickname
        chars.forEach(character => {
            finalMessage += this.getCharacterName(character);

            let emoji = this.getCharacterEmoji(character[0], character[1], character[2]);

            if (emoji != undefined) {
                finalMessage += ` ${emoji}`;
            }

            finalMessage += ", ";
        }, this)

        let embed = new MessageEmbed()
            .setTitle(player.slice(0, 1).toLocaleUpperCase() + player.slice(1).toLocaleLowerCase() + (player.slice(-1) == "s" ? "'" : "'s") + " characters")
            .setDescription(finalMessage.slice(0, -2));

        if (color != "") {
            embed.setColor(color);
        }

        if (user != undefined) {
            embed.setThumbnail(user.displayAvatarURL("webp", true, "64"));
        }

        this.message.reply({ embeds: [embed], ephemeral: this.ephemeral  }).catch();;
    })
    .then(() => session.close())
    .catch(e => {
        this.message.reply({ content: e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/), ephemeral: this.ephemeral }).catch();;
    });
};