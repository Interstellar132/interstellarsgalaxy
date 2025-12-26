const fs = require('fs');
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const clientId = process.env.clientID;      // Your bot's application ID
const guildId = process.env.guildID;        // Optional: use for testing in one server
const token = process.env.DISCORD_TOKEN;

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Load commands
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && typeof command.data.toJSON === 'function') {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`Command ${file} does not have valid SlashCommandBuilder data.`);
  }
}

// Deploy commands
(async () => {
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // Use this for guild (testing) commands
    if (guildId) {
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`Successfully reloaded commands for guild ${guildId}.`);
    } else {
      // Use this for global commands
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log('Successfully reloaded global commands.');
    }
  } catch (error) {
    console.error(error);
  }
})();
