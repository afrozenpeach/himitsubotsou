import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { Config } from "./config.js";
import BotCommands from "./modules/BotCommands.js";

const commands = new BotCommands(undefined, undefined, undefined).buildSlashCommands();

const rest = new REST({ version: '9' }).setToken(Config.BOT_TOKEN);

(async () => {
	try {
		await rest.put(
			Routes.applicationGuildCommands('752723826881855568', '737344328581513268'),
			{ body: commands },
		);

		console.log('Successfully registered application commands.');
	} catch (error) {
		console.error(error);
	}
})();
