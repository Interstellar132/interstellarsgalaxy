const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    coasterName: { type: String, required: true },
    homePark: { type: String, required: true },
    coasterCredits: { type: String, required: true },
    coasterRarity: { type: String, required: true },
    coasterManufacturer: { type: String, required: true },
    coasterImageLink: { type: String, required: true },
    coasterID: { type: String, required: true },
    guildID: { type: String, required: true }
});

module.exports = mongoose.model('coasterGame', gameSchema);