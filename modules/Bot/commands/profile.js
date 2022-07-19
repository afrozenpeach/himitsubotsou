import { EmbedBuilder } from "discord.js";
import { Config } from "../../../config.js";

export default function({character} = {}, error = true) {
    let session;
    let result = [];

    this.sql.getSession()
    .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
    .then(s => { return s.getTable("Characters") })
    .then(t =>
        t.select()
        .where("name like :name OR nickname1 like :nickname1 OR nickname2 like :nickname2")
        .orderBy("name")
        .bind("name", character)
        .bind("nickname1", character)
        .bind("nickname2", character)
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
            if (error) {
                this.message.reply({ content: "Character profile not found.", ephemeral: this.ephemeral }).catch();;
            }

            return;
        }

        let mounts = [];
        let relationships = [];
        let connections = [];

        this.sql.getSession()
        .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
        .then(() => {
            return Promise.all([
                session.sql("USE " + Config.MYSQL_CHARDB).execute(),
                session.sql("select * from Mounts where charid = ?;").bind([character.ID]).execute(row => { mounts.push(row) }),
                session.sql("select c.name, r.reltype from Relationships r join Characters c on r.pcID = c.id where r.char1 = ?;").bind([character.ID]).execute(row => { relationships.push(row) }),
                session.sql("select c.npcname as name, r.reltype from Relationships r join npcMainTable c on r.npcID = c.id where r.char1 = ?;").bind([character.ID]).execute(row => { relationships.push(row) }),
                session.sql("select c.name, cn.connectionType from pcConnections cn join Characters c on c.id = cn.familypcid where cn.basepcid = ?").bind([character.ID]).execute(row => { connections.push(row); }),
                session.sql("select c.npcname as name, cn.connectionType from npcConnections cn join npcMainTable c on c.id = cn.npcid where cn.pcid = ?").bind([character.ID]).execute(row => { connections.push(row); })
            ]);
        })
        .then(() => {
            let embed = new EmbedBuilder();

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

            //There can only be 25 fields, so we're combining some things so everything fits
            let noncombatLine = "";

            if (character.identifiers) {
                noncombatLine += character.identifiers + "\n";
            }

            if (character.noncombat) {
                noncombatLine += character.noncombat.split('<br>').join('\n').split('<br/>').join('\n');
            }

            if (noncombatLine) {
                embed.addFields(
                    { name: "Notes", value: noncombatLine }
                )
            }

            if (character.player) {
                embed.addFields(
                    { name: "Player", value: character.player , inline: true }
                );
            }

            if (character.status) {
                embed.addFields(
                { name: "Status", value: character.status, inline: true }
                );
            }

            if (character.sect) {
                embed.addFields(
                    { name: "Sect", value: character.sect, inline: true }
                );
            }

            if (character.birthmonth && character.birthdate && character.year && character.zodiac) {
                embed.addFields(
                    { name: "Birthday", value: character.birthmonth + " " + character.birthdate + ", " + character.year + " AR", inline: true },
                    { name: "Zodiac", value: character.zodiac, inline: true }
                );
            }

            if (character.bloodtype) {
                embed.addFields(
                    { name: "Blood Type", value: character.bloodtype, inline: true }
                );
            }

            embed.addFields(
                { name: "Gender", value: character.gender, inline: true }
            );

            if (character.orientation) {
                embed.addFields(
                    { name: "Orientation", value: character.orientation, inline: true }
                );
            }

            if (character.haircolor) {
                embed.addFields(
                    { name: "Hair Color", value: character.haircolor, inline: true }
                );
            }

            if (character.eyecolor) {
                embed.addFields(
                    { name: "Eye Color", value: character.eyecolor, inline: true }
                );
            }

            if (character.heightfeet && character.heightinches && character.heightcms) {
                embed.addFields(
                    { name: "Height", value: character.heightfeet + "'" + character.heightinches + " (" + character.heightcms + " cm)", inline: true }
                );
            }

            if (character.build) {
                embed.addFields(
                    { name: "Build", value: character.build, inline: true }
                );
            }

            if (character.skintone) {
                embed.addFields(
                { name: "Skin Tone", value: character.skintone, inline: true }
            )
            }

            if (character.cupsize) {
                embed.addFields(
                    { name: "Cup Size", value: character.cupsize, inline: true }
                )
            }

            let hometownLine = "";

            if (character.hometown) {
                hometownLine += character.hometown + ", ";
            }

            hometownLine += character.country;

            if (character.domhand) {
                embed.addFields(
                    { name: "Dominant Hand", value: character.domhand, inline: true }
                )
            }

            if (hometownLine) {
                embed.addFields(
                    { name: "Hometown/Country", value: hometownLine, inline: true }
                );
            }

            if (character.house) {
                embed.addFields(
                    { name: "House", value: character.house, inline: true }
                );
            }

            if (character.socialclass) {
                embed.addFields(
                    { name: "Social Class", value: character.socialclass, inline: true }
                );
            }

            if (character.jobs) {
                embed.addFields(
                    { name: "Jobs", value: character.jobs, inline: true }
                );
            }

            if (character.subjobs) {
                embed.addFields(
                    { name: "Sub Jobs", value: character.subjobs, inline: true }
                );
            }

            if (character.class) {
                embed.addFields(
                    { name: "Class", value: character.class, inline: true }
                );
            }

            if (character.pastclasses) {
                embed.addFields(
                    { name: "Past Classes", value: character.pastclasses ?? '', inline: true }
                );
            }

            if (mounts.length > 0) {
                let mountLine = "";

                mounts.forEach(m => {
                    mountLine += m[1] + " - " + m[2] + " " + m[3] + " " + m[4] + " - " + m[6];

                    if (m[7]) {
                        mountLine += " - " + m[7];
                    }

                    mountLine += "\n";
                });

                embed.addFields(
                    { name: "Mounts", value: mountLine }
                );
            }

            let relationshipLine = "";

            relationships.forEach(r => {
                relationshipLine += r[0] + " - " + r[1] + "\n";
            });

            connections.forEach(c => {
                relationshipLine += c[0] + " - " + c[1] + "\n";
            });

            if (relationshipLine) {
                embed.addFields(
                    { name: "Relationships", value: relationshipLine }
                );
            }

            this.message.reply({ embeds: [embed], ephemeral: this.ephemeral  }).catch();;
        })
        .then(() => session.close())
        .catch(e => {
            this.message.reply({ content: e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/), ephemeral: this.ephemeral }).catch();;
        });
    })
    .then(() => session.close())
    .catch(e => {
        this.message.reply({ content: e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/), ephemeral: this.ephemeral }).catch();;
    });
}