import { MessageEmbed } from "discord.js";
import { Config } from "../config.js";

export default class BotCommands {
    constructor(message, sql) {
        this.message = message;
        this.sql = sql;
    }

    help(args) {
        if (args[0] !== undefined) {
            let argHelp = args[0] + "Help";

            if (typeof this[argHelp] === 'function') {
                this[argHelp]();
            } else {
                this.message.channel.send("No additional help.");
            }

            return;
        }

        //Thanks for the snippet https://stackoverflow.com/a/35033472
        const getAllMethods = (obj) => {
            let props = [];

            do {
                const l = Object.getOwnPropertyNames(obj)
                    .concat(Object.getOwnPropertySymbols(obj).map(s => s.toString()))
                    .sort()
                    .filter((p, i, arr) =>
                        typeof obj[p] === 'function' &&  //only the methods
                        p !== 'constructor' &&           //not the constructor
                        (i == 0 || p !== arr[i - 1]) &&  //not overriding in this prototype
                        props.indexOf(p) === -1 &&       //not overridden in a child
                        !p.endsWith("Help")              //not a help function
                    );
                props = props.concat(l);
            }
            while (
                (obj = Object.getPrototypeOf(obj)) &&   //walk-up the prototype chain
                Object.getPrototypeOf(obj)              //not the the Object prototype methods (hasOwnProperty, etc...)
            )

            return props;
        }

        let embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Available commands")
            .setDescription(getAllMethods(this).join(", "));

        this.message.channel.send(embed);
    }

    franelcrew(args) {
        let franelcrew = [
            { player: "Rosa", characters: ["Aileen", "Celeste", "Crionna", "Eabhan (Eabh)", "Korvin", "Maeryn/\"Ethniu\"", "Nessa", "Suaimeas"] },
            { player: "Elzie", characters: ["Amalea", "Elliot", "Gaibrial (Gabe)", "Jace", "Lauren", "Patience", "Sawyer"] },
            { player: "Dots", characters: ["Faith", "Jonathan", "Kail", "Prudence"] },
            { player: "Nin", characters: ["Keagan", "Labhri"] },
            { player: "Meg", characters: ["Lawrence"] }
        ];

        this.#sendCharacterEmbed(franelcrew, "#fcba03", "Current Franelcrew members", args[0]);
    }

    franelcrewHelp() {
        let embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Franelcrew")
            .setDescription("Lists characters in the Franelcrew plotline.\n\nOptional Parameters: player name to filter by");

        this.message.channel.send(embed);
    }

    hanalan(args) {
        let hanalanCommons = [
            { player: "Frozen", characters: ["Lenore", "Inara", "Kimberly"] },
            { player: "Dots", characters: ["Mark", "Eri"] },
            { player: "Elzie", characters: ["Demi", "Daisy"] },
            { player: "Rosa", characters: ["Annie", "Anton", "Nathan"] }
        ];

        this.#sendCharacterEmbed(hanalanCommons, "#90ee90", "Current Hanalan commons members", args[0]);
    }

    hanalanHelp() {
        let embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Franelcrew")
            .setDescription("Lists characters in the Hanalan Commons plotline.\n\nOptional Parameters: player name to filter by");

        this.message.channel.send(embed);
    }

    eina(args) {
        let eina = [
            { player: "Frozen", characters: ["Gebann", "Rae"] },
            { player: "Nin", characters: ["Dagda"] },
            { player: "Rosa", characters: ["April"] },
            { player: "Dots", characters: ["ebony"] }
        ];

        this.#sendCharacterEmbed(eina, "#bcf5f3", "Current Eina members", args[0]);
    }

    einaHelp() {
        let embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Franelcrew")
            .setDescription("Lists characters in the Eina plotline.\n\nOptional Parameters: player name to filter by");

        this.message.channel.send(embed);
    }

    characters(args) {
        let player = "";
        let characters = [];
        let color = "";
        let user = undefined;
        let finalMessage = "";

        //If there is an arg find the characters for that player
        //Otherwise find the characters for the player that activated the command
        if (args.length > 0 && args[0].length > 0) {
            player = args[0].toLocaleLowerCase();
        } else {
            switch (this.message.author.username.toLocaleLowerCase()) {
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
                this.message.channel.send("Player not found.");
                return;
        }

        let activeOnly = " && status = 'Normal'";

        if (args[1] === "all") {
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
                finalMessage += this.#getCharacterName(character);

                let emoji = this.#getCharacterEmoji(character[0], character[1], character[2]);

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

            this.message.channel.send(embed);
        })
        .then(() => session.close())
        .catch(e => {
            this.message.channel.send(e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/));
        });
    }

    charactersHelp() {
        let embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Franelcrew")
            .setDescription("Lists characters played by the current user.\n\nOptional Parameters:\n\n0: alternative player name to filter by\n\n1: 'all'0 to include inactive characters");

        this.message.channel.send(embed);
    }

    profile(args, error = true) {
        let session;
        let result = [];

        this.sql.getSession()
        .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
        .then(s => { return s.getTable("Characters") })
        .then(t =>
            t.select()
            .where("name like :name OR nickname1 like :nickname1 OR nickname2 like :nickname2")
            .orderBy("name")
            .bind("name", args[0])
            .bind("nickname1", args[0])
            .bind("nickname2", args[0])
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
                    this.message.channel.send("Character profile not found.");
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
                let embed = new MessageEmbed();

                if (character.journal) {
                    embed.setURL("https://himitsu-sensou.dreamwidth.org/?poster=" + character.journal);
                }

                let nameLine = "";

                let emoji = this.#getCharacterEmoji(character.name, character.nickname1, character.nickname2);

                if (emoji != undefined) {
                    nameLine += `${emoji} `;
                }

                nameLine += this.#getCharacterName(character);

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

                embed.addFields(
                    { name: "Player", value: character.player , inline: true },
                    { name: "Status", value: character.status, inline: true },
                    { name: "Sect", value: character.sect, inline: true }
                );

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

                embed.addFields(
                    { name: "Hair Color", value: character.haircolor, inline: true },
                    { name: "Eye Color", value: character.eyecolor, inline: true },
                    { name: "Height", value: character.heightfeet + "'" + character.heightinches + " (" + character.heightcms + " cm)", inline: true },
                    { name: "Build", value: character.build, inline: true }
                );

                if (character.skintone) {
                    embed.addFields(
                    { name: "Skin Tone", value: character.skintone, inline: true }
                );
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

                if (character.hometownLine) {
                    embed.addFields(
                        { name: "Hometown/Country", value: hometownLine, inline: true }
                    );
                }

                if (character.house) {
                    embed.addFields(
                        { name: "House", value: character.house, inline: true }
                    )
                }

                embed.addFields(
                    { name: "Social Class", value: character.socialclass, inline: true },
                    { name: "Jobs", value: character.jobs, inline: true }
                )

                if (character.subjobs) {
                    embed.addFields(
                        { name: "Sub Jobs", value: character.subjobs, inline: true }
                    )
                }

                embed.addFields(
                    { name: "Class", value: character.class, inline: true }
                );

                if (character.pastclasses) {
                    embed.addFields(
                        { name: "Pass Classes", value: character.pastclasses ?? '', inline: true },
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

                this.message.channel.send(embed);
            })
            .then(() => session.close())
            .catch(e => {
                this.message.channel.send(e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/));
            });
        })
        .then(() => session.close())
        .catch(e => {
            this.message.channel.send(e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/));
        });
    }

    profileHelp() {
        let embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Profile")
            .setDescription("Displays a profile for the specified character.");

        this.message.channel.send(embed);
    }

    weapons(args) {
        this.#weaponsMagicProficiencies(args);
    }

    weaponsHelp() {
        this.#weaponsMagicProficienciesHelp();
    }

    magic(args) {
        this.#weaponsMagicProficiencies(args);
    }

    magicHelp() {
        this.#weaponsMagicProficienciesHelp();
    }

    languages(args) {
        let session;
        let result = [];

        this.sql.getSession()
        .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
        .then(s =>
            session.sql("SELECT c.ID, c.name, c.nickname1, c.nickname2, c.sect, c.journal, l.Tr, l.TrNotes, l.De, l.ODe, l.HDe, l.OHDe, l.DeNotes, l.Me, l.AMe, l.MeNotes, l.At, l.Az, l.NoAt, l.AtNotes, l.Ki, l.RuKi, l.Da, l.KiNotes, l.Ro, l.RoNotes FROM " + Config.MYSQL_CHARDB + ".Languages as l JOIN " + Config.MYSQL_CHARDB + ".Characters as c on c.id = l.charid WHERE c.name like CONCAT('%', ?, '%') or c.nickname1 like CONCAT('%', ?, '%') or c.nickname2 like CONCAT('%', ?, '%');")
            .bind([args[0], args[0], args[0]])
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
                this.message.channel.send("Character proficiencies not found.");
                return;
            }

            let embed = new MessageEmbed();

            if (character.journal) {
                embed.setURL("https://himitsu-sensou.dreamwidth.org/?poster=" + character.journal);
            }

            let nameLine = "";

            let emoji = this.#getCharacterEmoji(character.name, character.nickname1, character.nickname2);

            if (emoji != undefined) {
                nameLine += `${emoji} `;
            }

            nameLine += this.#getCharacterName(character);

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

            this.message.channel.send(embed);
        })
        .catch(e => {
            this.message.channel.send(e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/));
        });
    }

    languagesHelp() {
        let embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Language Proficiencies")
            .setDescription("Displays the language proficiencies for the specified character. Aliases: !languages or !lang");

        this.message.channel.send(embed);
    }

    lang(args) {
        this.languages(args);
    }

    langHelp(args) {
        this.languagesHelp(args);
    }

    npc(args) {
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
            .bind("name", args[0])
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
                this.message.channel.send("No NPCs found.")
            } else {
                for (const r of results) {
                    let npc = r.reduce((res, pair) => Object.assign(res, { [pair.key]: pair.value }), {});

                    if (npc.ID === undefined) {
                        this.message.channel.send("NPC profile not found.");
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

                            if (npcBirthDate) {
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

                        this.message.channel.send(embed);
                    })
                    .catch(e => {
                        this.message.channel.send(e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/));
                    });
                }
            }
        })
        .then(() => session.close())
        .catch(e => {
            this.message.channel.send(e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/));
        });
    }

    npcHelp() {
        let embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - NPC")
            .setDescription("Displays a profile for the specified npc.");

        this.message.channel.send(embed);
    }

    birthmonth(args) {
        let session;

        this.sql.getSession()
        .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
        .then(s => { return s.getTable("Characters") })
        .then(t =>
            t.select("name", "nickname1", "nickname2", "birthmonth", "birthdate", "year")
            .where("birthmonth like :month")
            .orderBy("birthdate")
            .bind("month", args[0])
            .execute()
        )
        .then(r => {
            let characters = r.fetchAll();

            let embed = new MessageEmbed().setTitle("Birthdays for " + characters[0][3]);

            let finalMessage = "";

            characters.forEach(character => {
                finalMessage += character[3] + " " + character[4] + ", " + character[5] + " AR - ";

                finalMessage += this.#getCharacterName(character);

                finalMessage += "\n";
            }, this)

            embed.setDescription(finalMessage.slice(0, -1));

            this.message.channel.send(embed);
        })
        .then(() => session.close())
    }

    birthmonthHelp() {
        let embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Birth Month")
            .setDescription("Lists characters that have a birthday in the designated month.");

        this.message.channel.send(embed);
    }

    search(args) {
        let session;

        this.sql.getSession()
        .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
        .then(s => { return s.getTable("Characters") })
        .then(t =>
            t.select("name", "nickname1", "nickname2", "player")
            .where(args.join(' '))
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

            this.#sendCharacterEmbed(characters, "#ffffff", "Search where " + args.join(' '));
        })
        .then(() => session.close())
        .catch(e => {
            this.message.channel.send(e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/));
        });
    }

    searchHelp() {
        let embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - SQL Search")
            .setDescription("Returns a list of characters and their players for a given where clause.\n\nAvailable Fields:\nID, picture, name, nickname1, nickname2, journal, jobs, subjobs, socialclass, country, hometown, house, birthmonth, birthdate, year, zodiac, bloodtype, sect, status, player, queued, adoptable, haircolor, eyecolor, heightfeet, heightinches, heightcms, build, skintone, cupsize, domhand, identifiers, class, pastclasses, mountcombat, orientation, noncombat, gender, Special\n\nExamples:\nname = 'Fayre' -> Just 'Fayre'\nname like 'ra%' -> Starts with 'ra'\nyear < 600 -> Born before 600 AR");

        this.message.channel.send(embed);
    }

    day(args) {
        if (args.length > 0) {
            let date = Date.parse(args.join(' '));
            let dateTime = new Date(date);
            dateTime.setFullYear(dateTime.getFullYear() + 1382);

            this.message.channel.send("Day of the week: " + dateTime.toLocaleString('en-us', {  weekday: 'long' }));
        } else {
            this.message.channel.send("No date specified.");
        }
    }

    dayHelp() {
        let embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Day")
            .setDescription("Converts the specified in-game date to a day of the week. Parameters: Date");

        this.message.channel.send(embed);
    }

    #weaponsMagicProficiencies(args) {
        let session;
        let result = [];

        this.sql.getSession()
        .then(s => { session = s; return session.getSchema(Config.MYSQL_CHARDB) })
        .then(s =>
            session.sql("SELECT c.ID, c.name, c.nickname1, c.nickname2, c.sect, w.Axes, w.Swords, w.Daggers, w.Lances, w.Maces, w.QStaves, w.Whips, w.Unarmed, w.LBows, w.SBows, w.CBows, w.Thrown, w.Fire, w.Wind, w.Thunder, w.Light, w.Dark, w.Staves, w.MagicType, w.Civilian FROM " + Config.MYSQL_CHARDB + ".Weapons as w JOIN " + Config.MYSQL_CHARDB + ".Characters as c on c.id = w.charid WHERE c.name like CONCAT('%', ?, '%') or c.nickname1 like CONCAT('%', ?, '%') or c.nickname2 like CONCAT('%', ?, '%');")
            .bind([args[0], args[0], args[0]])
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
                this.message.channel.send("Character proficiencies not found.");
                return;
            }

            let embed = new MessageEmbed();

            if (character.journal) {
                embed.setURL("https://himitsu-sensou.dreamwidth.org/?poster=" + character.journal);
            }

            let nameLine = "";

            let emoji = this.#getCharacterEmoji(character.name, character.nickname1, character.nickname2);

            if (emoji != undefined) {
                nameLine += `${emoji} `;
            }

            nameLine += this.#getCharacterName(character);

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

            this.message.channel.send(embed);
        })
        .catch(e => {
            this.message.channel.send(e.message + ' - ' + e.stack.match(/BotCommands.js:[0-9]{1,}:[0-9]{1,}/));
        });
    }

    #weaponsMagicProficienciesHelp() {
        let embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Weapon and Magic Proficiencies")
            .setDescription("Displays the weapon and magic proficiencies for the specified character. Aliases: !weapons or !magic");

        this.message.channel.send(embed);
    }

    //Takes a list of players/characters, a color, and a title, and creates a custom embed
    #sendCharacterEmbed(playerCharacters, color, title, filterPlayer = undefined) {
        if (filterPlayer !== undefined) {
            playerCharacters = playerCharacters.filter(row => row.player.toLocaleLowerCase() === filterPlayer.toLocaleLowerCase())
        }

        let embed =  new MessageEmbed()
            .setColor(color)
            .setTitle(title);

        playerCharacters.sort(function(a, b) {
            if (a.player < b.player) {
                return -1;
            } else if (a.player > b.player) {
                return 1;
            } else {
                return 0;
            }
        });

        playerCharacters.forEach(function(pc) {
            let characterString = "";

            if (Array.isArray(pc.characters[0])) {
                pc.characters.sort();
            }

            //For each character find a matching emoji if possible - must be the character's proper name
            pc.characters.forEach(function(character) {
                let characterName = this.#getCharacterName(character);

                if (characterString.length + characterName.length > 1024) {
                    embed.addField(pc.player, characterString.slice(0, -2))
                    characterString = "";
                }

                characterString += characterName;

                let emoji = this.#getCharacterEmoji(character);

                if (emoji != undefined) {
                    characterString +=  ` ${emoji}`;
                }

                characterString += ", ";
            }, this);

            embed.addField(pc.player, characterString.slice(0, -2))
        }, this);

        this.message.channel.send(embed);
    }

    //Gets the emoji based on a character name
    #getCharacterEmoji(character, nickname1 = undefined, nickname2 = undefined) {
        let emoji;

        if (typeof character === 'object') {
            //proper name
            emoji = this.message.client.emojis.cache.find(emoji => emoji.name === character.name.toLocaleLowerCase());

            //nickname1
            if (emoji == undefined && nickname1 != undefined) {
                emoji = this.message.client.emojis.cache.find(emoji => emoji.name === character.nickname1.toLocaleLowerCase());
            }

            //nickname2
            if (emoji == undefined && nickname2 != undefined) {
                emoji = this.message.client.emojis.cache.find(emoji => emoji.name === character.nickname2.toLocaleLowerCase());
            }
        } else {
            //proper name
            emoji = this.message.client.emojis.cache.find(emoji => emoji.name === character.toLocaleLowerCase());

            //nickname1
            if (emoji == undefined && nickname1 != undefined) {
                emoji = this.message.client.emojis.cache.find(emoji => emoji.name === nickname1.toLocaleLowerCase());
            }

            //nickname2
            if (emoji == undefined && nickname2 != undefined) {
                emoji = this.message.client.emojis.cache.find(emoji => emoji.name === nickname2.toLocaleLowerCase());
            }

            if (emoji == undefined) {
                //proper name
                emoji = this.message.client.emojis.cache.find(emoji => emoji.name === character.toLocaleLowerCase().split("/")[0].split(" ")[0]);

                //secondary name
                if (emoji == undefined && character.includes("/")) {
                    emoji = this.message.client.emojis.cache.find(emoji => emoji.name === character.toLocaleLowerCase().split("/\"")[1].slice(0, -1));
                }

                //nickname
                if (emoji == undefined && character.includes("(")) {
                    emoji = this.message.client.emojis.cache.find(emoji => emoji.name === character.toLocaleLowerCase().split("(")[1].slice(0, -1));
                }
            }
        }

        return emoji;
    }

    #getCharacterName(character) {
        let nameLine = "";

        if (Array.isArray(character)) {
            nameLine += character[0];

            if (character[1] || character[2]) {
                nameLine += " (";
            }

            if (character[1]) {
                nameLine += character[1]
            }

            if (character[1] && character[2]) {
                nameLine += "/";
            }

            if (character[2]) {
                nameLine += character[2];
            }

            if (character[1] || character[2]) {
                nameLine += ")";
            }
        } else if (typeof character === 'string') {
            nameLine += character;
        } else {
            nameLine += character.name;

            if (character.nickname1 || character.nickname2) {
                nameLine += " (";
            }

            if (character.nickname1) {
                nameLine += character.nickname1;
            }

            if (character.nickname1 && character.nickname2) {
                nameLine += "/";
            }

            if (character.nickname2) {
                nameLine += character.nickname2;
            }

            if (character.nickname1 || character.nickname2) {
                nameLine += ")";
            }
        }

        return nameLine;
    }
}