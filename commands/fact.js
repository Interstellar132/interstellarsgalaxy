const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const facts = require('../models/facts');

function generateFactId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName('managefacts')
    .setDescription('Manage facts')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand( subcommand =>
        subcommand
        .setName('add')
        .setDescription('adds a fact to the pool')
        .addStringOption( option =>
            option.setName('details')
                  .setDescription('dude please')
                  .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
        subcommand
        .setName('remove')
        .setDescription('removes a fact from the pool')
        .addStringOption(option =>
            option.setName('factid')
            .setDescription('removes the fact by ID')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
        subcommand
        .setName('list')
        .setDescription('lists the current ids')

    )
    .addSubcommand(subcommand =>
        subcommand
        .setName('search')
        .setDescription('searches a fact by id')
        .addStringOption(option =>
            option.setName('searchbyid')
            .setDescription('searches for a fact by id')
            .setRequired(true)
        )
    ),

async execute(interaction) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    try {
        if (subcommand === 'add') {
            const fact = interaction.options.getString('details');
            const factId = generateFactId();

            const newEntry = new facts({
                guildId,
                fact,
                factId
            });

            await newEntry.save();
            return interaction.reply({
                content: `Added this fact to the database! The fact ID is __**${factId}**__.`,
                ephemeral: true
            })
        }

        if (subcommand === 'remove') {
            const factId = interaction.options.getString('factid');

            const deleted = await facts.findOneAndDelete({ guildId, factId });
            if (!deleted)
                return interaction.reply({
                content: `Cannot find this fact ID.`,
                ephemeral: true 
            });
            return interaction.reply({
                content: `Removed ${factId}!`,
                ephemeral: true
            });
        }

        if (subcommand === 'list') {
            const idlist = await facts.find({ guildId });
            if (!idlist.length)
                return interaction.reply({
                content: `You don't have any facts added currently. Do '/managefacts add' to add some!`,
                ephemeral: true 
            });

            const list = idlist.map(entry => `**__Fact ID__** - ${entry.factId}`).join('\n');
            return interaction.reply({
                content: `# __Coaster Fun Facts__ \n${list}`,
                ephemeral: true
            });
        }

        if (subcommand === 'search') {
            const factId = interaction.options.getString('searchbyid');
            const query = await facts.find({ guildId, factId });
            if (!query.length)
                return interaction.reply({
            content: `There is nothing with this ID.`,
            ephemeral: true 
        });

        const result = query.map(entry => `${entry.fact }`)
        return interaction.reply({
            content: `${result}`,
            ephemeral: true
        });
        }

        } catch (err) {
            console.error('NOOOOOOOO coaster fact error! :(', err);
            return interaction.reply({
                content: `There was an error! :(`,
                ephemeral: true
            });
    }

}
}