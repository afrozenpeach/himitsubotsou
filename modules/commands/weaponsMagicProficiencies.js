import { MessageEmbed } from "discord.js";
import { Config } from "../../config.js";

export default function({character} = {}) {
    let session;
    let result = [];

    this.sql.getSession()
    .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
    .then(s =>
        session.sql("SELECT c.ID, c.name, c.nickname1, c.nickname2, c.sect, w.Axes, w.Swords, w.Daggers, w.Lances, w.Maces, w.QStaves, w.Whips, w.Unarmed, w.LBows, w.SBows, w.CBows, w.Thrown, w.Fire, w.Wind, w.Thunder, w.Light, w.Dark, w.Staves, w.MagicType, w.Civilian FROM " + Config.MYSQL_CHARDB + ".Weapons as w JOIN " + Config.MYSQL_CHARDB + ".Characters as c on c.id = w.charid WHERE c.name like CONCAT('%', ?, '%') or c.nickname1 like CONCAT('%', ?, '%') or c.nickname2 like CONCAT('%', ?, '%');")
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
            this.message.reply({ content: "Character proficiencies not found.", ephemeral: this.ephemeral });
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

        if (character.Axes && character.Axes.trim()) {
            embed.addField('Axes', character.Axes, true);
        }

        if (character.Swords && character.Swords.trim()) {
            embed.addField('Swords', character.Swords, true);
        }

        if (character.Daggers && character.Daggers.trim()) {
            embed.addField('Daggers', character.Daggers, true);
        }

        if (character.Lances && character.Lances.trim()) {
            embed.addField('Lances', character.Lances, true);
        }

        if (character.Maces && character.Maces.trim()) {
            embed.addField('Maces', character.Maces, true);
        }

        if (character.QStaves && character.QStaves.trim()) {
            embed.addField('Quarterstaves', character.QStaves, true);
        }

        if (character.Whips && character.Whips.trim()) {
            embed.addField('Whips', character.Whips, true);
        }

        if (character.Unarmed && character.Unarmed.trim()) {
            embed.addField('Unarmed', character.Unarmed, true);
        }

        if (character.LBows && character.LBows.trim()) {
            embed.addField('Long Bows', character.LBows, true);
        }

        if (character.SBows && character.SBows.trim()) {
            embed.addField('Short Bows', character.SBows, true);
        }

        if (character.CBows && character.CBows.trim()) {
            embed.addField('Crossbows', character.CBows, true);
        }

        if (character.Thrown && character.Thrown.trim()) {
            embed.addField('Thrown', character.Thrown, true);
        }

        if (character.Fire && character.Fire.trim()) {
            embed.addField('Fire', character.Fire, true);
        }

        if (character.Wind && character.Wind.trim()) {
            embed.addField('Wind', character.Wind, true);
        }

        if (character.Thunder && character.Thunder.trim()) {
            embed.addField('Thunder', character.Thunder, true);
        }

        if (character.Light && character.Light.trim()) {
            embed.addField('Light', character.Light, true);
        }

        if (character.Dark && character.Dark.trim()) {
            embed.addField('Dark', character.Dark, true);
        }

        if (character.Staves && character.Staves.trim()) {
            embed.addField('Staves', character.Staves, true);
        }

        if (character.MagicType) {
            let textMagicType = "None";

            switch (character.MagicType) {
                case 0:
                    textMagicType = "None";
                    break;
                case 1:
                    textMagicType = "Combat";
                    break;
                case 2:
                    textMagicType = "Practical";
                    break;
                case 3:
                    textMagicType = "Combat & Practical";
                    break;
            }

            embed.addField('Magic Type', textMagicType, true);
        }

        if (character.Civilian) {
            embed.addField('Civilian', "Civilian", true);
        }

        this.message.reply({ embeds: [embed], ephemeral: this.ephemeral  });
    })
    .catch(e => {
        this.message.reply({ content: e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/), ephemeral: this.ephemeral });
    });
}