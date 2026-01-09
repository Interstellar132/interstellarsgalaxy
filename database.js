const mongoose = require('mongoose');

modulue.exports = async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true
    });
    console.log('I have connected to the database');
  } catch (err) {
    console.error('I did not want to connect', err);
    process.exit(1);
  }
};
