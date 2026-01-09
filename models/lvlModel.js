const mongoose = require('mongoose');

const lvlSchema = new mongoose.Schema({
  _id: { type: String, default: 'lastLvl' }, 
  lastLvlId: { type: Number, default: 0 },
});

const LvlModel = mongoose.model('Lvl', lvlSchema);

module.exports = LvlModel;
