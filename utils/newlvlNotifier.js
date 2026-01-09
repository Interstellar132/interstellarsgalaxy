const LvlModel = require('./models/LvlModel'); // the schema file

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

// Get stored level ID
async function getStoredLvlId() {
  const doc = await LvlModel.findById('lastLvl');
  return doc ? doc.lastLvlId : 0;
}

// Save level ID
async function saveLvlId(id) {
  await LvlModel.findByIdAndUpdate(
    'lastLvl',
    { lastLvlId: id },
    { upsert: true, new: true }
  );
}

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
