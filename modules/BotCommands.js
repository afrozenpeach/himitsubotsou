import { MessageEmbed, Options } from "discord.js";
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

                let cmd = new SlashCommandBuilder()
                    .setName(md.title.toLocaleLowerCase())
                    .setDescription(md.description);

                if (md.requiredArguments) {
                    md.requiredArguments.forEach(a => {
                        cmd.addStringOption(o => o.setName(a.argument).setDescription(a.description).setRequired(true));
                    });
                }

                if (md.optionalArguments) {
                    md.optionalArguments.forEach(a => {
                        if (a.type === 'bool') {
                            cmd.addBooleanOption(o => o.setName(a.argument).setDescription(a.description));
                        } else {
                            cmd.addStringOption(o => o.setName(a.argument).setDescription(a.description));
                        }
                    });
                }

                cmd.addBooleanOption(o => o.setName('public').setDescription('Show response publicly'))

                commands.push(cmd);
            } catch (error) {
                console.log('error loading slashcommand: ' + m + ' - ' + error);
            }
        }, this);

        return commands.map(c => c.toJSON());
    }

    help({command} = {}) {
        if (command !== undefined) {
            let argHelp = command + "Help";

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
            description: 'Get help for various commands',
            optionalArguments: [{
                argument: 'command',
                description: 'the command to get help on'
            }]
        };
    }

    franelcrew({player} = {}) {
        let franelcrew = [
            { player: "Rosa", characters: ["Aileen", "Celeste", "Crionna", "Eabhan (Eabh)", "Korvin", "Maeryn/\"Ethniu\"", "Nessa", "Suaimeas"] },
            { player: "Elzie", characters: ["Amalea", "Elliot", "Gaibrial (Gabe)", "Jace", "Lauren", "Patience", "Sawyer"] },
            { player: "Dots", characters: ["Faith", "Jonathan", "Kail", "Prudence"] },
            { player: "Nin", characters: ["Keagan", "Labhri"] },
            { player: "Meg", characters: ["Lawrence"] }
        ];

        this.sendCharacterEmbed(franelcrew, "#fcba03", "Current Franelcrew members", player);
    }

    franelcrewHelp() {
        return {
            title: 'Franelcrew',
            description: 'Lists characters in the Franelcrew plotline.',
            optionalArguments: [{
                argument: 'player',
                description: 'player name to filter by'
            }]
        };
    }

    hanalan({player} = {}) {
        let hanalanCommons = [
            { player: "Frozen", characters: ["Lenore", "Inara", "Kimberly"] },
            { player: "Dots", characters: ["Mark", "Eri"] },
            { player: "Elzie", characters: ["Demi", "Daisy"] },
            { player: "Rosa", characters: ["Annie", "Anton", "Nathan"] }
        ];

        this.sendCharacterEmbed(hanalanCommons, "#90ee90", "Current Hanalan commons members", player);
    }

    hanalanHelp() {
        return {
            title: 'Hanalan',
            description: 'Lists characters in the Hanalan Commons plotline',
            optionalArguments: [{
                argument: 'player',
                description: 'player name to filter by'
            }]
        };
    }

    eina({player} = {}) {
        let eina = [
            { player: "Frozen", characters: ["Gebann", "Rae"] },
            { player: "Nin", characters: ["Dagda"] },
            { player: "Rosa", characters: ["April"] },
            { player: "Dots", characters: ["ebony"] }
        ];

        this.sendCharacterEmbed(eina, "#bcf5f3", "Current Eina members", player);
    }

    einaHelp() {
        return {
            title: 'Eina',
            description: 'Lists characters in the Eina plotline',
            optionalArguments: [{
                argument: 'player',
                description: 'player name to filter by'
            }]
        };
    }

    charactersHelp() {
        return {
            title: 'Characters',
            description: 'Lists characters played by the current user.',
            optionalArguments: [
                {
                    argument: 'player',
                    description: 'player name to filter by'
                },
                {
                    type: 'bool',
                    argument: 'all',
                    description: 'Include inactive characters in list',
                    trueValue: 'all',
                    falseValue: 'notall'
                }
            ]
        };
    }

    profileHelp() {
        return {
            title: 'Profile',
            description: 'Displays a profile for the specified character.',
            requiredArguments: [{
                argument: 'character',
                description: 'The characater name whose profile to show'
            }]
        };
    }

    weaponsHelp() {
        return this.#weaponsMagicProficienciesHelp();
    }

    magicHelp() {
        let magicHelp = this.#weaponsMagicProficienciesHelp();
        magicHelp.title = "magic";

        return magicHelp;
    }

    languagesHelp() {
        return {
            title: 'Languages',
            description: 'Displays the language proficiencies for the specified character.',
            requiredArguments: [{
                argument: 'character',
                description: 'The characater name whose languages to show'
            }]
        };
    }

    langHelp({character} = {}) {
        let langHelp = this.languagesHelp(character);
        langHelp.title = "lang";

        return langHelp;
    }

    npcHelp() {
        return {
            title: 'NPC',
            description: 'Displays a profile for the specified npc.',
            requiredArguments: [{
                argument: 'npc',
                description: 'The characater name whose profile to show'
            }]
        };
    }

    birthmonthHelp() {
        return {
            title: 'Birthmonth',
            description: 'Lists characters that have a birthday in the designated month.',
            requiredArguments: [{
                argument: 'month',
                description: 'The month to list birthdays from'
            }]
        };
    }

    searchHelp() {
        return {
            title: 'search',
            description: 'Returns a list of characters and their players for a given where clause.',
            requiredArguments: [{
                argument: 'where',
                description: 'The where clause to search with. Ex: name like \'%fayre%\''
            }]
        };
    }

    day({date} = {}) {
        if (date) {
            let parsedDate = Date.parse(date);
            let dateTime = new Date(parsedDate);
            dateTime.setFullYear(dateTime.getFullYear() + 1382);

            this.message.reply({ content: "Day of the week: " + dateTime.toLocaleString('en-us', {  weekday: 'long' }), ephemeral: this.ephemeral });
        } else {
            this.message.reply({ content: "No date specified.", ephemeral: this.ephemeral });
        }
    }

    dayHelp() {
        return {
            title: 'Day',
            description: 'Converts the specified in-game date to a day of the week.',
            requiredArguments: [{
                argument: 'date',
                description: 'The eire date to convert to a day of the week'
            }]
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
            title: 'weapons',
            description: 'Displays the weapon and magic proficiencies for the specified character.',
            requiredArguments: [{
                argument: 'character',
                description: 'The characater name whose weapons or magic to show'
            }]
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