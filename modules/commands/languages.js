import { MessageEmbed } from "discord.js";
import { Config } from "../../config.js";

export default function({character} = {}) {
    let session;
    let result = [];

    this.sql.getSession()
    .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
    .then(s =>
        session.sql("SELECT c.ID, c.name, c.nickname1, c.nickname2, c.sect, c.journal, l.Tr, l.TrNotes, l.De, l.ODe, l.HDe, l.OHDe, l.DeNotes, l.Me, l.AMe, l.MeNotes, l.At, l.Az, l.NoAt, l.AtNotes, l.Ki, l.RuKi, l.Da, l.KiNotes, l.Ro, l.RoNotes FROM " + Config.MYSQL_CHARDB + ".Languages as l JOIN " + Config.MYSQL_CHARDB + ".Characters as c on c.id = l.charid WHERE c.name like CONCAT('%', ?, '%') or c.nickname1 like CONCAT('%', ?, '%') or c.nickname2 like CONCAT('%', ?, '%');")
        .bind([character, character, character])
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

        if (character.ID === undefined) {
            this.message.reply("Character languages not found.", this.ephemeral);
            return;
        }

        let embed = new MessageEmbed();

        if (character.journal) {
            embed.setURL("https://himitsu-sensou.dreamwidth.org/?poster=" + character.journal);
        }

        let nameLine = "";

        let emoji = this.getCharacterEmoji(character.name, character.nickname1, character.nickname2);

        if (emoji != undefined) {
            nameLine += `${emoji} `;
        }

        nameLine += this.getCharacterName(character);

        embed.setTitle(nameLine);

        switch(character.sect.toLocaleLowerCase()) {
            case "pillar of light":
                embed.setColor("#fcba03");
                break;
            case "messenger of darkness":
                embed.setColor("#4a1a7d");
                break;
            case "silent one":
                embed.setColor("#f8f8ff");
                break;
            case "neutral":
                embed.setColor("#343aeb");
                break;
            default:
                embed.setColor("#919191");
                break;
        }

        if (character.picture) {
            embed.setThumbnail("https://host.lgbt/pics/" + character.picture);
        }

        if (character.Tr && character.Tr.trim()) {
            embed.addField('Trade', character.Tr, true);
        }

        if (character.TrNotes && character.TrNotes.trim()) {
            embed.addField('Trade Notes', character.TrNotes);
        }

        if (character.De && character.De.trim()) {
            embed.addField('Dentorian', character.De, true);
        }

        if (character.ODe && character.ODe.trim()) {
            embed.addField('Old Dentorian', character.ODe, true);
        }

        if (character.HDe && character.HDe.trim()) {
            embed.addField('High Dentorian', character.HDe, true);
        }

        if (character.OHDe && character.OHDe.trim()) {
            embed.addField('Old High Dentorian', character.OHDe, true);
        }

        if (character.DeNotes && character.DeNotes.trim()) {
            embed.addField('Dentorian Notes', character.DeNotes);
        }

        if (character.Me && character.Me.trim()) {
            embed.addField('Megami', character.Me, true);
        }

        if (character.AMe && character.AMe.trim()) {
            embed.addField('Ancient Megami', character.AMe, true);
        }

        if (character.MeNotes && character.MeNotes.trim()) {
            embed.addField('Megami Notes', character.MeNotes);
        }

        if (character.At && character.At.trim()) {
            embed.addField('Atsirian', character.At, true);
        }

        if (character.Az && character.Az.trim()) {
            embed.addField('Azsharan', character.Az, true);
        }

        if (character.NoAt && character.NoAt.trim()) {
            embed.addField('Nomadic Atsirian', character.NoAt, true);
        }

        if (character.AtNotes && character.AtNotes.trim()) {
            embed.addField('Atsirian Notes', character.AtNotes);
        }

        if (character.Ki && character.Ki.trim()) {
            embed.addField('Kilian', character.Ki, true);
        }

        if (character.RuKi && character.RuKi.trim()) {
            embed.addField('Runic Kilian', character.RuKi, true);
        }

        if (character.Da && character.Da.trim()) {
            embed.addField('Danaan', character.Da, true);
        }

        if (character.KiNotes && character.KiNotes.trim()) {
            embed.addField('Kilian Notes', character.KiNotes);
        }

        if (character.Ro && character.Ro.trim()) {
            embed.addField('Romani', character.Da, true);
        }

        if (character.RoNotes && character.RoNotes.trim()) {
            embed.addField('Romani Notes', character.RoNotes);
        }

        this.message.reply({ embeds: [embed], ephemeral: this.ephemeral  });
    })
    .catch(e => {
        this.message.reply({ content: e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/), ephemeral: this.ephemeral });
    });
}