const fs = require('fs');
const https = require('https');
const { Client, GatewayIntentBits, EmbedBuilder, Collection } = require('discord.js');
const { REST, Routes } = require('discord.js');

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// ================= CONFIG =================
const saveFile = './lastLevel.json';
const checkInterval = 60 * 1000;

const token = process.env.DISCORD_TOKEN;
const channelID = process.env.channelID;
const guildID = process.env.guildID;
const clientId = process.env.clientID;

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Refreshing guild commands...');
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );
    console.log('Guild commands refreshed!');
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
const announcechnl = ('673378001324605484');
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
      await channel.send('New Interstellar Level! ' + lvlsping)
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

// ================= READY =================
client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
  checkForNewLevel();
  setInterval(checkForNewLevel, checkInterval);
});

if (!token) {
  console.error("DISCORD_TOKEN is not set!");
  process.exit(1);
}

client.login(token);
