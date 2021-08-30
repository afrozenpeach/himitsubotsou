import { MessageEmbed } from "discord.js";
import { Config } from "../../config.js";

export default function({month} = {}) {
    let session;

    this.sql.getSession()
    .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
    .then(s => { return s.getTable("Characters") })
    .then(t =>
        t.select("name", "nickname1", "nickname2", "birthmonth", "birthdate", "year")
        .where("birthmonth like :month")
        .orderBy("birthdate")
        .bind("month", month)
        .execute()
    )
    .then(r => {
        let characters = r.fetchAll();

        let embed = new MessageEmbed().setTitle("Birthdays for " + characters[0][3]);

        let finalMessage = "";

        characters.forEach(character => {
            finalMessage += character[3] + " " + character[4] + ", " + character[5] + " AR - ";

            finalMessage += this.getCharacterName(character);

            finalMessage += "\n";
        }, this)

        embed.setDescription(finalMessage.slice(0, -1));

        this.message.reply({ embeds: [embed], ephemeral: this.ephemeral  }).catch();;
    })
    .then(() => session.close())
}