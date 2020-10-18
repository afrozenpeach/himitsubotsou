import { MessageEmbed } from "discord.js";
import { Config } from "../config.js";
import mysqlx from "@mysql/xdevapi";

export default class BotCommands {
    constructor(message) {
        this.message = message;

        this.sql = mysqlx.getClient(
            { host: Config.MYSQL_HOST, user: Config.MYSQL_USER, password: Config.MYSQL_PASSWORD },
            { pooling: { enabled: true, maxIdleTime: 30000, maxSize: 25, queueTimeout: 10000 } }
        )
    }

    help(args) {
        if (args[0] !== undefined) {
            var argHelp = args[0] + "Help";

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

        var embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Available commands")
            .setDescription(getAllMethods(this).join(", "));

        this.message.channel.send(embed);
    }

    franelcrew(args) {
        var franelcrew = [
            { player: "Rosa", characters: ["Aileen", "Celeste", "Crionna", "Eabhan (Eabh)", "Korvin", "Maeryn/\"Ethniu\"", "Nessa", "Suaimeas"] },
            { player: "Elzie", characters: ["Amalea", "Elliot", "Gaibrial (Gabe)", "Jace", "Lauren", "Patience", "Sawyer"] },
            { player: "Dots", characters: ["Faith", "Jonathan", "Kail", "Prudence"] },
            { player: "Nin", characters: ["Keagan", "Labhri"] },
            { player: "Meg", characters: ["Lawrence"] }
        ];

        this.#sendCharacterEmbed(franelcrew, "#fcba03", "Current Franelcrew members", args[0]);
    }

    franelcrewHelp() {
        var embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Franelcrew")
            .setDescription("Lists characters in the Franelcrew plotline.\n\nOptional Parameters: player name to filter by");

        this.message.channel.send(embed);
    }

    hanalan(args) {
        var hanalanCommons = [
            { player: "Frozen", characters: ["Lenore", "Inara", "Kimberly"] },
            { player: "Dots", characters: ["Mark", "Eri"] },
            { player: "Elzie", characters: ["Demi", "Daisy"] },
            { player: "Rosa", characters: ["Annie", "Anton", "Nathan"] }
        ];

        this.#sendCharacterEmbed(hanalanCommons, "#90ee90", "Current Hanalan commons members", args[0]);
    }

    hanalanHelp() {
        var embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Franelcrew")
            .setDescription("Lists characters in the Hanalan Commons plotline.\n\nOptional Parameters: player name to filter by");

        this.message.channel.send(embed);
    }

    eina(args) {
        var eina = [
            { player: "Frozen", characters: ["Gebann", "Rae"] },
            { player: "Nin", characters: ["Dagda"] },
            { player: "Rosa", characters: ["April"] },
            { player: "Dots", characters: ["ebony"] }
        ];

        this.#sendCharacterEmbed(eina, "#bcf5f3", "Current Eina members", args[0]);
    }

    einaHelp() {
        var embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Franelcrew")
            .setDescription("Lists characters in the Eina plotline.\n\nOptional Parameters: player name to filter by");

        this.message.channel.send(embed);
    }

    characters(args) {
        var player = "";
        var characters = [];
        var color = "";
        var user = undefined;
        var finalMessage = "";

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
            default:
                this.message.channel.send("Player not found.");
                return;
        }

        var activeOnly = " && status = 'Normal'";

        if (args[1] === "all") {
            activeOnly = "";
        }

        var vm = this;
        var session;
        var characters = [];

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
            characters = r.fetchAll();

            //Find emojis for each character - emoji must be a custom emoji upload with the character's proper name
            characters.forEach(function(character) {
                finalMessage += character[0];

                if (character[1] || character[2]) {
                    finalMessage += " (";
                }

                if (character[1]) {
                    finalMessage += character[1]
                }

                if (character[1] && character[2]) {
                    finalMessage += "/";
                }

                if (character[2]) {
                    finalMessage += character[2];
                }

                if (character[1] || character[2]) {
                    finalMessage += ")";
                }
    
                var emoji = this.#getCharacterEmoji(character[0], character[1], character[2]);
    
                if (emoji != undefined) {
                    finalMessage += ` ${emoji}`;
                }
    
                finalMessage += ", ";
            }, this)
    
            var embed = new MessageEmbed()
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
    }

    charactersHelp() {
        var embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Franelcrew")
            .setDescription("Lists characters played by the current user.\n\nOptional Parameters:\n\n0: alternative player name to filter by\n\n1: all to include deceased characters");

        this.message.channel.send(embed);
    }

    profile(args) {
        var vm = this;
        var session;
        var result = [];

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
                    row.forEach((value, i) => { result[i] = Object.assign({}, result[i], { value }) })
                }, 
                columns => {
                    columns.forEach((key, i) => { result[i] = Object.assign({}, result[i], { key: key.getColumnName() }) })
                }
            )
        )
        .then(() => {
            var character = result.reduce((res, pair) => Object.assign(res, { [pair.key]: pair.value }), {})            

            var embed = new MessageEmbed()

            if (character.journal) {
                embed.setURL("https://himitsu-sensou.dreamwidth.org/?poster=" + character.journal);
            }
    
            var nameLine = "";

            var emoji = this.#getCharacterEmoji(character.name, character.nickname1, character.nickname2);

            if (emoji != undefined) {
                nameLine += `${emoji} `;
            }
            
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

            embed.setTitle(nameLine);

            switch(character.sect.toLocaleLowerCase()) {
                case "pillar of light":
                    embed.setColor("#fcba03");
                    break;
                case "messenger of darkness":
                    embed.setColor("#4a1a7d");
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

            if (character.identifiers) {                
                embed.addFields(
                    { name: "Identifiers", value: character.identifiers }
                )
            }

            if (character.noncombat) {                
                embed.addFields(
                    { name: "Noncombat", value: character.noncombat.split('<br>').join('\n') }
                )
            }

            embed.addFields(
                { name: "Player", value: character.player , inline: true },
                { name: "Status", value: character.status, inline: true },
                { name: "Sect", value: character.sect, inline: true },
                { name: "Birthday", value: character.birthmonth + " " + character.birthdate + ", " + character.year + " AR", inline: true },
                { name: "Zodiac", value: character.zodiac, inline: true },
                { name: "Blood Type", value: character.bloodtype, inline: true },
                { name: "Gender", value: character.gender, inline: true },
                { name: "Orientation", value: character.orientation, inline: true },
                { name: "Hair Color", value: character.haircolor, inline: true },
                { name: "Eye Color", value: character.eyecolor, inline: true },
                { name: "Height", value: character.heightfeet + "'" + character.heightinches + '"' + "(" + character.heightcms + " cm)", inline: true },
                { name: "Build", value: character.build, inline: true },
                { name: "Skin Tone", value: character.skintone, inline: true }
            );
            
            if (character.cupsize) {
                embed.addFields(
                    { name: "Cup Size", value: character.cupsize, inline: true }
                )
            }

            embed.addFields(
                { name: "Dominant Hand", value: character.domhand, inline: true },
                { name: "Country", value: character.country, inline: true },
                { name: "Hometown", value: character.hometown, inline: true },
            );

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

            vm.message.channel.send(embed);
        })
        .then(() => session.close())
    }

    profileHelp() {
        var embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Profile")
            .setDescription("Displays a profile for the specified character.");

        this.message.channel.send(embed);
    }

    birthmonth(args) {
        var vm = this;
        var session;

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
            var characters = r.fetchAll();

            var embed = new MessageEmbed().setTitle("Birthdays for " + characters[0][3]);

            var finalMessage = "";

            characters.forEach(character => {
                finalMessage += character[3] + " " + character[4] + ", " + character[5] + " AR - ";

                finalMessage += character[0];

                if (character[1] || character[2]) {
                    finalMessage += " (";
                }

                if (character[1]) {
                    finalMessage += character[1]
                }

                if (character[1] && character[2]) {
                    finalMessage += "/";
                }

                if (character[2]) {
                    finalMessage += character[2];
                }

                if (character[1] || character[2]) {
                    finalMessage += ")";
                }

                finalMessage += "\n";
            })

            embed.setDescription(finalMessage.slice(0, -1));

            vm.message.channel.send(embed);
        })
        .then(() => session.close())
    }

    birthmonthHelp() {
        var embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Help - Birth Month")
            .setDescription("Lists characters that have a birthday in the designated month.");

        this.message.channel.send(embed);
    }

    //Takes a list of players/characters, a color, and a title, and creates a custom embed
    #sendCharacterEmbed(playerCharacters, color, title, filterPlayer = undefined) {
        if (filterPlayer !== undefined) {
            playerCharacters = playerCharacters.filter(row => row.player.toLocaleLowerCase() === filterPlayer.toLocaleLowerCase())
        }

        var embed =  new MessageEmbed()
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
            var characterString = "";

            pc.characters.sort();

            //For each character find a matching emoji if possible - must be the character's proper name
            pc.characters.forEach(function(character) {
                characterString += character;

                var emoji = this.#getCharacterEmoji(character);

                if (emoji != undefined) {
                    characterString += ` ${emoji}`;
                }

                characterString += ", ";
            }, this);

            embed.addField(pc.player, characterString.slice(0, -2))
        }, this);

        this.message.channel.send(embed);
    }

    //Gets the emoji based on a character name
    #getCharacterEmoji(character, nickname1 = undefined, nickname2 = undefined) {
        //proper name
        var emoji = this.message.client.emojis.cache.find(emoji => emoji.name === character.toLocaleLowerCase());

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

        return emoji;
    }
}