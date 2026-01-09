const LvlModel = require('./models/LvlModel'); // the schema file

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
