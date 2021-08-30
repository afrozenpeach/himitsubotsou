import { MessageEmbed } from "discord.js";
import { Config } from "../../config.js";

export default function({where} = {}) {
    let session;

    this.sql.getSession()
    .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
    .then(s => { return s.getTable("Characters") })
    .then(t =>
        t.select("name", "nickname1", "nickname2", "player")
        .where(where)
        .orderBy("player", "name")
        .execute()
    )
    .then(r => {
        let results = r.fetchAll();
        let characters = [];

        results.forEach(result => {
            let playerObj = characters.find(c => c.player === result[3])

            if (playerObj === undefined) {
                characters.push({ player: result[3], characters: [] })
                playerObj = characters.find(c => c.player === result[3])
            }

            playerObj.characters.push({ name: result[0], nickname1: result[1], nickname2: result[2] })
        });

        this.sendCharacterEmbed(characters, "#ffffff", "Search where " + args.join(' '));
    })
    .then(() => session.close())
    .catch(e => {
        this.message.reply({ content: e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/), ephemeral: this.ephemeral });
    });
}