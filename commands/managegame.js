const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const coasterGame = require('../models/coasterGame');

function generateCoasterID() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName('managegame')
    .setDescription('coaster game config')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand => 
        subcommand
        .setName('add')
        .setDescription('add a coaster to the game')
        .addStringOption(option =>
            option.setName('rollercoaster')
            .setDescription('the coaster name')
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('park')
            .setDescription('the coaster\'s home park')
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('imagelink')
            .setDescription('an image for the coaster')
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('credits')
            .setDescription('the amount of credits this coaster should award')
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('rarity')
            .setDescription('the coaster rarity')
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('manufacturer')
            .setDescription('the coaster manufacturer')
            .setRequired(true)
        )
        
    )
    
    .addSubcommand(subcommand =>
        subcommand
        .setName('remove')
        .setDescription('remove a coaster from the game (why?????)')
        .addStringOption(option =>
            option.setName('coasterid')
            .setDescription('the coaster id (still...why??)')
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
            .setDescription('WHY ARE YOU REMOVING THIS HELLO?!?!?!?!')
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand =>
        subcommand
        .setName('list')
        .setDescription('view the list')
    )

    .addSubcommand(subcommand=>
        subcommand
        .setName('search')
        .setDescription('search for a coaster')
        .addStringOption(option =>
            option.setName('coasterid')
            .setDescription('search for a coaster by id')
            .setRequired(true)
        )
    ),

async execute(interaction) {
    const ownerID = process.env.OwnerID;
    const guildID = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    try {
        if (subcommand === 'add') {
            const coasterName = interaction.options.getString('rollercoaster');
            const homePark = interaction.options.getString('park');
            const coasterImageLink = interaction.options.getString('imagelink');
            const coasterCredits = interaction.options.getString('credits');
            const coasterRarity = interaction.options.getString('rarity');
            const coasterManufacturer = interaction.options.getString('manufacturer')
            const coasterID = generateCoasterID();

            const newEntry = new coasterGame({
                coasterName,
                homePark,
                coasterCredits,
                coasterRarity,
                coasterManufacturer,
                coasterImageLink,
                coasterID,
                guildID
            });

            await newEntry.save();
            return interaction.reply({
                content: `This roller coaster has been added to the game! Coaster ID: **${coasterID}**`,
                ephemeral: true
            })
        }

        if (subcommand === 'remove') {

            const reason = interaction.options.getString('reason');
            const failedCoasterID = interaction.options.getString('coasterid')
            const owner = await interaction.client.users.fetch(ownerID);

            await owner.send({
                content: `${interaction.user.tag} tried to remove a roller coaster for ${reason}. Coaster ID: **${failedCoasterID}**`
            });

            return interaction.reply({
                content: `no.`,
                ephemeral: true
            });
        } 

        if (subcommand === 'list') {
            const coasteridlist = await coasterGame.find({ guildID })
            if (!coasteridlist.length)
                return interaction.reply({
            content: `There aren\'t any coasters in the game database.`,
            ephemeral: true
            })

            const gameList = coasteridlist.map(entry => `**__Coaster ID__** - ${entry.coasterID}`).join('\n');
            return interaction.reply({
                content: `# __Coaster IDs in Game__ \n${gameList}`,
                ephemeral: true
            });
        }

        if (subcommand === 'search') {
            const coasterID = interaction.options.getString('coasterid');
            const query = await coasterGame.find({ guildID, coasterID });

            if (!query.length) 
                return interaction.reply({
            content: `There is no coaster with this ID.`,
            ephemeral: true
            });
        

            const result = query.map(entry => new EmbedBuilder()
            .setAuthor({ name: entry.coasterID })
            .setTitle(`${entry.coasterName} at ${entry.homePark}`)
            .addFields(
                { name: "Rarity", value: entry.coasterRarity, inline: true },
                { name: "Credits", value: entry.coasterCredits, inline: true },
                { name: "Manufacturer", value: entry.coasterManufacturer, inline: true }
            )
            .setImage(entry.coasterImageLink)
            .setColor('#89F336')
            .setTimestamp());

            return interaction.reply({
                embeds: result,
                ephemeral: true
            })
        }

    } catch (err) {
            console.error('unfortunately there was an error.', err);
            return interaction.reply({
                content: `There was a coasterror.`,
                ephemeral: true
            })
        }
}
}