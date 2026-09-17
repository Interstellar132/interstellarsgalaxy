const mongoose = require('mongoose');

const factsSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    fact: { type: String, required: true },
    factId: { type: String, required: true }
});

module.exports = mongoose.model('facts', factsSchema);