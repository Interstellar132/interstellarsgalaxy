const fs = require('fs');
const https = require('https');
const { Client, GatewayIntentBits, EmbedBuilder, Collection, ActivityType, AuditLogEvent, Partials } = require('discord.js');
const { REST, Routes } = require('discord.js');

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ================= CONFIG =================
const saveFile = './lastLevel.json';
const checkInterval = 60 * 1000;

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.guildID;
const clientId = process.env.clientID;
const OwnerId = process.env.OwnerID;
const trafficId = process.env.TrafficID;
const MIN_ACCOUNT_AGE_DAYS = 14;
const JOIN_WINDOW_SECONDS = 30;
const JOIN_THRESHOLD = 5;
const WelcomeImage = process.env.WelcomeImage;
const { warnings, userSpam } = require('./utils/automod');
const WARN_THRESHOLD = 3;      // warnings before timeout
const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes
const SPAM_MESSAGE_THRESHOLD = 5; // messages
const SPAM_TIME_WINDOW = 7000;    // ms (7 seconds)
const SPAM_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const { checkYouTube } = require('./utils/youtubeNotifier');
const { checkTwitch } = require('./utils/twitchNotifier');
const blacklist = require('./utils/wordBlacklist');

const recentJoins = [];

const { diff } = require('./utils/diff.js');
const { diffOverwrites } = require('./utils/permDiff.js');
const { sendLog } = require('./utils/logger.js');
const { diffRole } = require('./utils/permDiff.js');


/* ─────────────── CHANNEL UPDATE ─────────────── */

client.on('channelUpdate', async (oldChannel, newChannel) => {
  const logChannel = newChannel.guild.channels.cache.get(process.env.logID);
  if (!logChannel || !logChannel.isTextBased()) return;

  // 1️⃣ Channel property diffs
  const channelDiffs = diff(oldChannel, newChannel, [
    'name',
    'topic',
    'nsfw',
    'rateLimitPerUser'
  ]);

  if (channelDiffs.length) {
    let executor;
    try {
      const logs = await newChannel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelUpdate,
        limit: 1
      });
      executor = logs.entries.first()?.executor;
    } catch {}

    const embed = new EmbedBuilder()
      .setTitle('✏️ Channel Updated')
      .setColor(0xFEE75C)
      .addFields(
        { name: 'Channel', value: `${newChannel} (${newChannel.id})` },
        { name: 'Moderator', value: executor?.tag || 'Unknown' },
        ...channelDiffs.map(d => ({
          name: d.name,
          value: `**Before:** ${d.old}\n**After:** ${d.new}`,
          inline: false
        }))
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  }

  // 2️⃣ Permission overwrite diffs
  const permChanges = diffOverwrites(
    oldChannel.permissionOverwrites.cache,
    newChannel.permissionOverwrites.cache
  );

  if (permChanges.length) {
    let permExecutor;
    try {
      const logs = await newChannel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelOverwriteUpdate,
        limit: 1
      });
      permExecutor = logs.entries.first()?.executor;
    } catch {}

    for (const change of permChanges) {
      let target;
      if (change.type === 0) {
        target = newChannel.guild.roles.cache.get(change.id);
      } else {
        target = await newChannel.guild.members.fetch(change.id).catch(() => null);
      }

      const fields = [
        { name: 'Channel', value: `${newChannel}` },
        {
          name: 'Target',
          value: target
            ? change.type === 0
              ? `Role: **${target.name}**`
              : `Member: **${target.user.tag}**`
            : `ID: ${change.id}`
        },
        { name: 'Moderator', value: permExecutor?.tag || 'Unknown' }
      ];

      if (change.addedAllow.length)
        fields.push({ name: '➕ Allowed', value: change.addedAllow.join(', ') });
      if (change.removedAllow.length)
        fields.push({ name: '➖ Allow Removed', value: change.removedAllow.join(', ') });
      if (change.addedDeny.length)
        fields.push({ name: '🚫 Denied', value: change.addedDeny.join(', ') });
      if (change.removedDeny.length)
        fields.push({ name: '♻️ Deny Removed', value: change.removedDeny.join(', ') });

      const permEmbed = new EmbedBuilder()
        .setTitle('🔐 Channel Permissions Updated')
        .setColor(0xED4245)
        .addFields(fields)
        .setTimestamp();

      await logChannel.send({ embeds: [permEmbed] });
    }
  }
});

/* ─────────────── MEMBER UPDATE ─────────────── */

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const logChannel = newMember.guild.channels.cache.get(process.env.logID);
  if (!logChannel || !logChannel.isTextBased()) return;

  // 1️⃣ Nickname changes
  if (oldMember.nickname !== newMember.nickname) {
    const embed = new EmbedBuilder()
      .setTitle('📝 Nickname Changed')
      .setColor(0x5865F2)
      .addFields(
        { name: 'User', value: newMember.user.tag },
        { name: 'Before', value: oldMember.nickname || 'None', inline: true },
        { name: 'After', value: newMember.nickname || 'None', inline: true }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  }

  // 2️⃣ Role changes
  const added = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
  const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

  for (const role of added.values()) {
    const embed = new EmbedBuilder()
      .setTitle('➕ Role Added')
      .setColor(0x57F287)
      .addFields(
        { name: 'User', value: newMember.user.tag },
        { name: 'Role', value: role.name }
      )
      .setTimestamp();
    await logChannel.send({ embeds: [embed] });
  }

  for (const role of removed.values()) {
    const embed = new EmbedBuilder()
      .setTitle('➖ Role Removed')
      .setColor(0xED4245)
      .addFields(
        { name: 'User', value: newMember.user.tag },
        { name: 'Role', value: role.name }
      )
      .setTimestamp();
    await logChannel.send({ embeds: [embed] });
  }
});

/* ─────────────── MEMBER REMOVE (KICK/BAN) ─────────────── */

client.on('guildMemberRemove', async (member) => {
  const logChannel = member.guild.channels.cache.get(process.env.logID);
  if (!logChannel || !logChannel.isTextBased()) return;

  try {
    // Check audit log for kick
    const logs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
    const entry = logs.entries.first();

    if (entry && entry.target.id === member.id) {
      const embed = new EmbedBuilder()
        .setTitle('👢 Member Kicked')
        .setColor(0xED4245)
        .addFields(
          { name: 'User', value: member.user.tag },
          { name: 'Moderator', value: entry.executor.tag }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error('Kick log failed:', err);
  }
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  try {
    if (oldMessage.partial) oldMessage = await oldMessage.fetch().catch(() => null);
    if (newMessage.partial) newMessage = await newMessage.fetch().catch(() => null);
    if (!oldMessage || !newMessage) return;
    if (oldMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // ignore embed-only changes

    await sendLog(client, {
      title: '✏️ Message Edited',
      color: 0xFEE75C,
      fields: [
        { name: 'User', value: oldMessage.author.tag },
        { name: 'Channel', value: `${oldMessage.channel}` },
        { name: 'Before', value: oldMessage.content || '[empty]' },
        { name: 'After', value: newMessage.content || '[empty]' }
      ],
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Error logging edited message:', err);
  }
});

client.on('messageDelete', async (message) => {
  try {
    if (message.partial) {
      message = await message.fetch().catch(() => null);
      if (!message) return; // Could not fetch, skip
    }
    if (!message.content) return; // No content to log
    if (message.author?.bot) return; // Ignore bot messages

    await sendLog(client, {
      title: '🗑️ Message Deleted',
      color: 0xED4245,
      fields: [
        { name: 'User', value: message.author.tag },
        { name: 'Channel', value: `${message.channel}` },
        { name: 'Content', value: message.content }
      ],
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Error logging deleted message:', err);
  }
});

client.on('roleUpdate', async (oldRole, newRole) => {
  const logChannel = oldRole.guild.channels.cache.get(process.env.logID);
  if (!logChannel || !logChannel.isTextBased()) return;

  const fields = [];

  // Name
  if (oldRole.name !== newRole.name) {
    fields.push({ name: 'Name Changed', value: `Before: ${oldRole.name}\nAfter: ${newRole.name}` });
  }

  // Color
  if (oldRole.color !== newRole.color) {
    fields.push({ name: 'Color Changed', value: `Before: #${oldRole.color.toString(16).padStart(6, '0')}\nAfter: #${newRole.color.toString(16).padStart(6, '0')}` });
  }

  // Hoist
  if (oldRole.hoist !== newRole.hoist) {
    fields.push({ name: 'Hoist Changed', value: `Before: ${oldRole.hoist}\nAfter: ${newRole.hoist}` });
  }

  // Mentionable
  if (oldRole.mentionable !== newRole.mentionable) {
    fields.push({ name: 'Mentionable Changed', value: `Before: ${oldRole.mentionable}\nAfter: ${newRole.mentionable}` });
  }

  // Permissions
  const permDiff = diffRole(oldRole.permissions, newRole.permissions);
  if (permDiff.length) {
    fields.push({ name: 'Permissions Changed', value: permDiff.join('\n') });
  }

  if (!fields.length) return; // No relevant changes

  // Fetch executor from audit logs
  let executor;
  try {
    const logs = await newRole.guild.fetchAuditLogs({ type: 32, limit: 1 }); // ROLE_UPDATE
    executor = logs.entries.first()?.executor;
  } catch {}

  await sendLog(client, {
    title: '🛠️ Role Updated',
    color: 0xFEE75C,
    fields: [
      { name: 'Role', value: `${newRole.name} (${newRole.id})` },
      { name: 'Moderator', value: executor?.tag || 'Unknown' },
      ...fields
    ],
    timestamp: new Date()
  });
});


client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const userId = message.author.id;
  const now = Date.now();

  /* ============================
     1️⃣ SPAM DETECTION
  ============================ */
  const timestamps = userSpam.get(userId) || [];
  timestamps.push(now);

  const recentMessages = timestamps.filter(ts => now - ts < SPAM_TIME_WINDOW);
  userSpam.set(userId, recentMessages);

  if (recentMessages.length >= SPAM_MESSAGE_THRESHOLD) {
    const currentWarns = warnings.get(userId) || 0;
    const newWarns = currentWarns + 1;
    warnings.set(userId, newWarns);

    await message.channel.bulkDelete(recentMessages.length).catch(() => {});
    await message.author.send(
      `⚠️ You have been warned for spamming. Please stop.`
    ).catch(() => {});

    await sendLog(client, {
      title: '⚠️ Auto-Warn: Spam',
      color: 0xFEE75C,
      fields: [
        { name: 'User', value: message.author.tag },
        { name: 'Messages', value: `${recentMessages.length} in ${SPAM_TIME_WINDOW / 1000}s` },
        { name: 'Warnings', value: `${newWarns}` },
        { name: 'Channel', value: message.channel.name }
      ],
      timestamp: new Date()
    });

    if (newWarns >= WARN_THRESHOLD) {
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (member) {
        await member.timeout(SPAM_TIMEOUT, 'Auto-Warn: Excessive spam').catch(() => {});
        await sendLog(client, {
          title: '⏱️ Auto-Timeout: Spam',
          color: 0xED4245,
          fields: [
            { name: 'User', value: member.user.tag },
            { name: 'Duration', value: `${SPAM_TIMEOUT / 60000} minutes` },
            { name: 'Reason', value: 'Excessive spam' }
          ],
          timestamp: new Date()
        });
      }

      warnings.set(userId, 0);
      userSpam.set(userId, []);
    }
    return;
  }

  /* ============================
     2️⃣ BLACKLIST WORD CHECK
  ============================ */
  const matchedWord = blacklist.matches(message.content); // returns the word that matched, or null
  if (!matchedWord) return;

  await message.delete().catch(() => {});

  const currentWarns = warnings.get(userId) || 0;
  const newWarns = currentWarns + 1;
  warnings.set(userId, newWarns);

  await message.author.send(
    `You have been warned for using a prohibited word. Please use common sense.`
  ).catch(() => {});

  await sendLog(client, {
    title: '⚠️ Auto-Warn: Blacklisted Word',
    color: 0xFEE75C,
    fields: [
      { name: 'User', value: message.author.tag },
      { name: 'Word Triggered', value: matchedWord },
      { name: 'Warnings', value: `${newWarns}` },
      { name: 'Channel', value: message.channel.name }
    ],
    timestamp: new Date()
  });

  if (newWarns >= WARN_THRESHOLD) {
    const member = await message.guild.members.fetch(userId).catch(() => null);
    if (member) {
      await member.timeout(SPAM_TIMEOUT, 'Auto-Warn: Excessive infractions').catch(() => {});
      await sendLog(client, {
        title: '⏱️ Auto-Timeout',
        color: 0xED4245,
        fields: [
          { name: 'User', value: member.user.tag },
          { name: 'Duration', value: `${SPAM_TIMEOUT / 60000} minutes` },
          { name: 'Reason', value: 'Excessive infractions' }
        ],
        timestamp: new Date()
      });
    }
    warnings.set(userId, 0);
  }
});

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

// Create a collection for commands
client.commands = new Collection();

// Load commands from the commands folder
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}


// Interaction handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.log(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (!interaction.replied) {
      await interaction.reply({ content: 'There was an error!', ephemeral: true });
    }
  }
});

// channel & server stuff
const newlvlschnl = ('1443065773034836068');
const lvlsping = (`<@&1443069487417917512>`);
const liveping = (`<@&894609836434653214>`);
const uploadping = (`<@&1114778023951081584>`);
const twitchchnl = ("https://twitch.tv/interstellar_ca");
const srvrping = (`<@&1114790179442540554>`)

// Difficulty thumbnails
const difficulty = {
  0: { img: "https://i.ibb.co/jkLM1mhn/na.png", color: "#969796" },
  1: { img: "https://i.ibb.co/wZdCWjWk/auto.png", color: "#f6ca62" },
  2: { img: "https://i.ibb.co/KzrmQ0SK/easy.png", color: "#01b9ff" },
  3: { img: "https://i.ibb.co/wZv4nk7D/normal.png", color: "#00fc05" },
  4: { img: "https://i.ibb.co/Y47JdkK7/hard.png", color: "#fed000" },
  5: { img: "https://i.ibb.co/Y47JdkK7/hard.png", color: "#fed000" },
  6: { img: "https://i.ibb.co/HDdtSByP/harder.png", color: "#fe5501" },
  7: { img: "https://i.ibb.co/HDdtSByP/harder.png", color: "#fe5501" },
  8: { img: "https://i.ibb.co/CpCvHq1D/insane.png", color: "#fe65df" },
  9: { img: "https://i.ibb.co/CpCvHq1D/insane.png", color: "#fe65df" },
  10:{ img: "https://i.ibb.co/rGmc0CvW/demon.png", color: "#ff3444" },
};

// ================= STORAGE =================
function getStoredLvlId() {
  if (!fs.existsSync(saveFile)) return 0;
  const data = JSON.parse(fs.readFileSync(saveFile, 'utf8'));
  return Number(data.lastLvlId) || 0;
}

function saveLvlId(id) {
  fs.writeFileSync(saveFile, JSON.stringify({ lastLvlId: id }, null, 2));
}

// ================= HELPERS =================
function decodeDescription(encoded) {
  if (!encoded) return 'No description';
  try {
    return Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return 'Failed to decode description';
  }
}

function getLengthName(num) {
  return ['Tiny', 'Short', 'Medium', 'Long', 'XL', 'Platformer'][num] ?? 'N/A';
}

// ================= FETCH =================
const USER_TO_SCAN = '21143982';
const USER_ID = '21143982';
const ACCOUNT_ID = '6066142';

function fetchLatestLevel() {
  const postData = new URLSearchParams({
    secret: 'Wmfd2893gb7',
    gameVersion: '22',
    binaryVersion: '45',
    type: '5',
    str: USER_TO_SCAN,
    accountID: ACCOUNT_ID,
    uuid: USER_ID
  }).toString();

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'www.boomlings.com',
      path: '/database/getGJLevels21.php',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        if (data === '-1') return reject('No levels found');

        const parts = data.split('|')[0].split(':');
        const level = {};
        for (let i = 0; i < parts.length; i += 2) {
          level[parts[i]] = parts[i + 1];
        }

        resolve({
          lvlid: Number(level['1']),
          lvlname: level['2'],
          lvlencDesc: level['3'],
          lvlLengNum: Number(level['15']),
          starsReq: Number(level['39'] ?? 0),
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ================= EMBED =================
function buildEmbed(level) {
  const diff = difficulty[level.starsReq] ?? difficulty[0];

  return new EmbedBuilder()
    .setAuthor({ name: "New Level!" })
    .setTitle(level.lvlname || 'Untitled Level')
    .setURL(`https://gdbrowser.com/${level.lvlid}`)
    .setDescription(decodeDescription(level.lvlencDesc))
    .addFields(
      { name: "Stars/Moons Requested", value: String(level.starsReq), inline: false },
      { name: "Level ID", value: String(level.lvlid), inline: false },
      { name: "Length", value: getLengthName(level.lvlLengNum), inline: false }
    )
    .setThumbnail(diff.img)
    .setColor(diff.color)
    .setFooter({
      text: "Interstellar's Galaxy",
      iconURL: "https://i.ibb.co/TMgDmskt/IMG-9269.png"
    })
    .setTimestamp();
}

// ================= LOOP =================
async function checkForNewLevel() {
  try {
    const stored = getStoredLvlId();
    const level = await fetchLatestLevel();

    if (level.lvlid > stored) {
      const channel = await client.channels.fetch(newlvlschnl);
      await channel.send(lvlsping + ' New Interstellar Level!')
      await channel.send({ embeds: [buildEmbed(level)] });
      saveLvlId(level.lvlid);
      console.log(`🆕 New level: ${level.lvlid}`);
    } else {
      console.log('No new level.');
    }
  } catch (err) {
    console.error('Check failed:', err);
  }
}

client.on('guildMemberAdd', async member => {
  const trafficId = process.env.TrafficID;
  const channel = member.guild.channels.cache.get(trafficId);
  if (!channel || !channel.isTextBased()) return;

  const now = Date.now();

  // ===== Store join =====
  recentJoins.push({ time: now, member });

  const windowMs = JOIN_WINDOW_SECONDS * 1000;

  // Remove old joins
  while (recentJoins.length && recentJoins[0].time < now - windowMs) {
    recentJoins.shift();
  }

  // ===== Check raid =====
  if (recentJoins.length >= JOIN_THRESHOLD) {
    await dmOwner(
      member.client,
      `🚨 A RAID IS HAPPENING!!
Server: ${member.guild.name}
Joins: ${recentJoins.length} in ${JOIN_WINDOW_SECONDS}s
Auto-banning suspicious accounts...`
    );

    for (const entry of recentJoins) {
      const m = entry.member;

      // Skip if already gone
      if (!m || !m.bannable) continue;

      const ageMs = now - m.user.createdAt.getTime();
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

      if (ageDays <= RAID_BAN_ACCOUNT_AGE_DAYS) {
        try {
          await m.ban({
            reason: 'Raid detected – new account'
          });

          await dmOwner(
            member.client,
            `🔨 **User Banned**
${m.user.tag} (${m.user.id})
Account Age: ${ageDays} day(s)`
          );
        } catch (err) {
          console.error(`Failed to ban ${m.user.tag}`, err);
        }
      }
    }

    // Reset to avoid repeated bans
    recentJoins.length = 0;
  }

  // ===== Normal traffic log =====
  await channel.send(
    `<@${member.id}> left Earth and joined us in space! Welcome Aboard!`
  );

  // ===== New account warning (DM only) =====
  const ageMs = now - member.user.createdAt.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  if (ageDays < MIN_ACCOUNT_AGE_DAYS) {
    await dmOwner(
      member.client,
      `⚠️ Heads up! This user has a new account!
User: ${member.user.tag}
Server: ${member.guild.name}
Account Age: ${ageDays} day(s)`
    );
  }
});

client.on('guildMemberRemove', async member => {
  const trafficId = process.env.TrafficID;
  const channel = member.guild.channels.cache.get(trafficId);
  if (!channel || !channel.isTextBased()) return;

  channel.send(
    `**${member.user.tag}** retired from an Astronaut and went back to Earth.`
  );
});



// ================= READY =================
client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);

client.user.setPresence({
    status: 'online',
    activities: [
      {
        name: 'Over the Galaxy 🚀',
        type: ActivityType.Watching
      }
    ]
  })
  
  checkForNewLevel();
  setInterval(checkForNewLevel, checkInterval);

   // checkYouTube(client);
  checkTwitch(client);
  
   setInterval(() => {
   // checkYouTube(client).catch(console.error);
    checkTwitch(client).catch(console.error);
  }, 5 * 60 * 1000);
});

if (!token) {
  console.error("DISCORD_TOKEN is not set!");
  process.exit(1);
}

client.login(token);
