import { MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from '@discordjs/builders';

import characters from './commands/characters.js';
import profile from './commands/profile.js';
import languages from './commands/languages.js';
import npc from './commands/npc.js';
import birthmonth from './commands/birthmonth.js';
import search from './commands/search.js';
import weapons from './commands/weaponsMagicProficiencies.js';

export default class BotCommands {
    constructor(message, sql, ephemeral) {
        this.message = message;
        this.sql = sql;
        this.ephemeral = ephemeral;
    }

    buildSlashCommands() {
        let commands = [];

        this.#getAllMethods(this).forEach(m => {
            try {
                let mh = m + 'Help';
                let md = this[mh]();

                commands.push(new SlashCommandBuilder().setName(m).setDescription(md.description.split('\n')[0]).addStringOption(o => o.setName('arg').setDescription('arg')));
            } catch (error) {
                console.log('error loading slashcommand: ' + m + ' - ' + error);
            }
        }, this);

        return commands.map(c => c.toJSON());
    }

    help(args) {
        if (args[0] !== undefined) {
            let argHelp = args[0] + "Help";

            if (typeof this[argHelp] === 'function') {
                let helpHelp = this[argHelp]();

                let messageEmbed = new MessageEmbed()
                    .setColor("#ff0000")
                    .setTitle("Help - " + helpHelp.title)
                    .setDescription(helpHelp.description);

                this.message.reply({ embeds: [messageEmbed], ephemeral: this.ephemeral  });
            } else {
                this.message.reply({ content: "No additional help.", ephemeral: this.ephemeral });
            }

            return;
        }

        let embed = new MessageEmbed()
            .setColor("#ff0000")
            .setTitle("Available commands")
            .setDescription(this.#getAllMethods(this).join(", "));

        this.message.reply({ embeds: [embed], ephemeral: this.ephemeral  });
    }

    helpHelp() {
        return {
            title: 'Help',
            description: 'Get help for various commands'
        };
    }

    franelcrew(args) {
        let franelcrew = [
            { player: "Rosa", characters: ["Aileen", "Celeste", "Crionna", "Eabhan (Eabh)", "Korvin", "Maeryn/\"Ethniu\"", "Nessa", "Suaimeas"] },
            { player: "Elzie", characters: ["Amalea", "Elliot", "Gaibrial (Gabe)", "Jace", "Lauren", "Patience", "Sawyer"] },
            { player: "Dots", characters: ["Faith", "Jonathan", "Kail", "Prudence"] },
            { player: "Nin", characters: ["Keagan", "Labhri"] },
            { player: "Meg", characters: ["Lawrence"] }
        ];

        this.sendCharacterEmbed(franelcrew, "#fcba03", "Current Franelcrew members", args[0]);
    }

    franelcrewHelp() {
        return {
            title: 'Franelcrew',
            description: 'Lists characters in the Franelcrew plotline.\n\nOptional Parameters: player name to filter by'
        };
    }

    hanalan(args) {
        let hanalanCommons = [
            { player: "Frozen", characters: ["Lenore", "Inara", "Kimberly"] },
            { player: "Dots", characters: ["Mark", "Eri"] },
            { player: "Elzie", characters: ["Demi", "Daisy"] },
            { player: "Rosa", characters: ["Annie", "Anton", "Nathan"] }
        ];

        this.sendCharacterEmbed(hanalanCommons, "#90ee90", "Current Hanalan commons members", args[0]);
    }

    hanalanHelp() {
        return {
            title: 'Hanalan',
            description: 'Lists characters in the Hanalan Commons plotline.\n\nOptional Parameters: player name to filter by'
        };
    }

    eina(args) {
        let eina = [
            { player: "Frozen", characters: ["Gebann", "Rae"] },
            { player: "Nin", characters: ["Dagda"] },
            { player: "Rosa", characters: ["April"] },
            { player: "Dots", characters: ["ebony"] }
        ];

        this.sendCharacterEmbed(eina, "#bcf5f3", "Current Eina members", args[0]);
    }

    einaHelp() {
        return {
            title: 'Eina',
            description: 'Lists characters in the Eina plotline.\n\nOptional Parameters: player name to filter by'
        };
    }

    charactersHelp() {
        return {
            title: 'Characters',
            description: 'Lists characters played by the current user.\n\nOptional Parameters:\n\n0: alternative player name to filter by\n\n1: \'all\'0 to include inactive characters'
        };
    }

    profileHelp() {
        return {
            title: 'Profile',
            description: 'Displays a profile for the specified character.'
        };
    }

    weaponsHelp() {
        return this.#weaponsMagicProficienciesHelp();
    }

    magicHelp() {
        return this.#weaponsMagicProficienciesHelp();
    }

    languagesHelp() {
        return {
            title: 'Languages',
            description: 'Displays the language proficiencies for the specified character. Aliases: !languages or !lang'
        };
    }

    langHelp(args) {
        return this.languagesHelp(args);
    }

    npcHelp() {
        return {
            title: 'NPC',
            description: 'Displays a profile for the specified npc.'
        };
    }

    birthmonthHelp() {
        return {
            title: 'Birthmonth',
            description: 'Lists characters that have a birthday in the designated month.'
        };
    }

    searchHelp() {
        return {
            title: 'SQL Search',
            description: 'Returns a list of characters and their players for a given where clause.\n\nAvailable Fields:\nID, picture, name, nickname1, nickname2, journal, jobs, subjobs, socialclass, country, hometown, house, birthmonth, birthdate, year, zodiac, bloodtype, sect, status, player, queued, adoptable, haircolor, eyecolor, heightfeet, heightinches, heightcms, build, skintone, cupsize, domhand, identifiers, class, pastclasses, mountcombat, orientation, noncombat, gender, Special\n\nExamples:\nname = \'Fayre\' -> Just \'Fayre\'\nname like \'ra%\' -> Starts with \'ra\'\nyear < 600 -> Born before 600 AR'
        };
    }

    day(args) {
        if (args.length > 0) {
            let date = Date.parse(args.join(' '));
            let dateTime = new Date(date);
            dateTime.setFullYear(dateTime.getFullYear() + 1382);

            this.message.reply({ content: "Day of the week: " + dateTime.toLocaleString('en-us', {  weekday: 'long' }), ephemeral: this.ephemeral });
        } else {
            this.message.reply({ content: "No date specified.", ephemeral: this.ephemeral });
        }
    }

    dayHelp() {
        return {
            title: 'Day',
            description: 'Converts the specified in-game date to a day of the week. Parameters: Date'
        };
    }

    //Takes a list of players/characters, a color, and a title, and creates a custom embed
    sendCharacterEmbed(playerCharacters, color, title, filterPlayer = undefined) {
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
                let characterName = this.getCharacterName(character);

                if (characterString.length + characterName.length > 1024) {
                    embed.addField(pc.player, characterString.slice(0, -2))
                    characterString = "";
                }

                characterString += characterName;

                let emoji = this.getCharacterEmoji(character);

                if (emoji != undefined) {
                    characterString +=  ` ${emoji}`;
                }

                characterString += ", ";
            }, this);

            embed.addField(pc.player, characterString.slice(0, -2))
        }, this);

        this.message.reply({ embeds: [embed], ephemeral: this.ephemeral  });
    }

    //Gets the emoji based on a character name
    getCharacterEmoji(character, nickname1 = undefined, nickname2 = undefined) {
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

    getCharacterName(character) {
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

    #weaponsMagicProficienciesHelp() {
        return {
            title: 'Weapons/Magic',
            description: 'Displays the weapon and magic proficiencies for the specified character. Aliases: !weapons or !magic'
        };
    }

    //Thanks for the snippet https://stackoverflow.com/a/35033472
    #getAllMethods = (obj) => {
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
                    !p.endsWith("Help") &&           //not a help function
                    !p.endsWith("buildSlashCommands") &&
                    !p.endsWith("getAllMethods") &&
                    !p.endsWith("getCharacterName") &&
                    !p.endsWith("getCharacterEmoji") &&
                    !p.endsWith("sendCharacterEmbed")
                );
            props = props.concat(l);
        }
        while (
            (obj = Object.getPrototypeOf(obj)) &&   //walk-up the prototype chain
            Object.getPrototypeOf(obj)              //not the the Object prototype methods (hasOwnProperty, etc...)
        )

        return props;
    }
}

BotCommands.prototype.characters = characters;
BotCommands.prototype.profile = profile;
BotCommands.prototype.languages = languages;
BotCommands.prototype.lang = languages;
BotCommands.prototype.npc = npc;
BotCommands.prototype.birthmonth = birthmonth;
BotCommands.prototype.search = search;
BotCommands.prototype.weapons = weapons;
BotCommands.prototype.magic = weapons;