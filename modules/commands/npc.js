import { MessageEmbed } from "discord.js";
import { Config } from "../../config.js";

export default function({npc} = {}) {
    let session;
    let result = [];
    let results = [];

    this.sql.getSession()
    .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
    .then(s => { return s.getTable("npcMainTable") })
    .then(t =>
        t.select()
        .where("npcName like :name")
        .orderBy("npcName")
        .bind("name", npc)
        .execute(
            row => {
                row.forEach((value, i) => {
                    result[i] = Object.assign({}, result[i], { value });
                });

                let resultCopy = [...result];
                results.push(resultCopy);
            },
            columns => {
                columns.forEach((key, i) => { result[i] = Object.assign({}, result[i], { key: key.getColumnName() }) });
            }
        )
    )
    .then(() => {
        if (!results.length) {
            this.message.reply({ content: "No NPCs found.", ephemeral: this.ephemeral })
        } else {
            for (const r of results) {
                let npc = r.reduce((res, pair) => Object.assign(res, { [pair.key]: pair.value }), {});

                if (npc.ID === undefined) {
                    this.message.reply({ content: "NPC profile not found.", ephemeral: this.ephemeral });
                    return;
                }

                let relationships = [];
                let connections = [];

                this.sql.getSession()
                .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
                .then(() => {
                    return Promise.all([
                        session.sql("USE " + Config.MYSQL_CHARDB).execute(),
                        session.sql("select c.name, r.reltype from Relationships r join Characters c on r.char1 = c.id where r.npcID = ?;").bind([npc.ID]).execute(row => { relationships.push(row) }),
                        session.sql("select c.name as name, cn.connectionType from npcConnections cn join Characters c on c.id = cn.pcid where cn.npcid = ?").bind([npc.ID]).execute(row => { connections.push(row); })
                    ]);
                })
                .then(() => {
                    let embed = new MessageEmbed();

                    embed.setTitle(npc.npcName);

                    switch(npc.npcSect.toLocaleLowerCase()) {
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

                    if (npc.npcNotes) {
                        embed.addFields(
                            { name: "Notes", value: npc.npcNotes.split('<br>').join('\n') }
                        );
                    }

                    embed.addFields(
                        { name: "Player", value: npc.Player, inline: true },
                        { name: "Status", value: npc.npcStatus, inline: true },
                        { name: "Sect", value: npc.npcSect, inline: true }
                    )

                    let birthdateLine = "";

                    if (npc.npcBirthMonth && npc.npcBirthMonth != 'Unspecified') {
                        birthdateLine += npc.npcBirthMonth;

                        if (npc.npcBirthDate) {
                            birthdateLine += " " + npc.npcBirthDate
                        }

                        birthdateLine += ", ";
                    }

                    if (npc.npcBirthYear) {
                        birthdateLine += npc.npcBirthYear;
                    }

                    if (birthdateLine) {
                        embed.addFields(
                            { name: "Birthday", value: birthdateLine, inline: true }
                        );
                    }

                    embed.addFields(
                        { name: "Gender", value: npc.npcGender, inline: true },
                        { name: "Orientation", value: npc.npcOrientation, inline: true }
                    );

                    if (npc.npcHairColor) {
                        embed.addFields(
                            { name: "Hair Color", value: npc.npcHairColor, inline: true }
                        );
                    }

                    if (npc.npcEyeColor) {
                        embed.addFields(
                            { name: "Eye Color", value: npc.npcEyeColor, inline: true }
                        );
                    }

                    if (npc.npcHeightImperial || npc.npcHeightMetric) {
                        embed.addFields(
                            { name: "Height", value: npc.npcHeightImperial + " (" + npc.npcHeightMetric + "cm)", inline: true }
                        );
                    }

                    if (npc.npcBuild) {
                        embed.addFields(
                            { name: "Build", value: npc.npcBuild, inline: true }
                        );
                    }

                    let hometownLine = "";

                    if (npc.npcCity) {
                        hometownLine += npc.npcCity + ", ";
                    }

                    hometownLine += npc.npcCountry;

                    if (hometownLine) {
                        embed.addFields(
                            { name: "Hometown/Country", value: hometownLine, inline: true }
                        )
                    }

                    if (npc.npcClass) {
                        embed.addFields(
                            { name: "Class", value: npc.npcClass, inline: true }
                        );
                    }

                    if (npc.npcProfession) {
                        embed.addFields(
                            { name: "Profession", value: npc.npcProfession, inline: true }
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

                    this.message.reply({ embeds: [embed], ephemeral: this.ephemeral  });
                })
                .catch(e => {
                    this.message.reply({ content: e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/), ephemeral: this.ephemeral });
                });
            }
        }
    })
    .then(() => session.close())
    .catch(e => {
        this.message.reply({ content: e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/), ephemeral: this.ephemeral });
    });
}