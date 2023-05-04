const mongoose = require('mongoose');
const majorSchema = mongoose.Schema({
  majorsId: mongoose.Types.ObjectId,
  majorsName: String,
  situation: [
    {
      label: String,
      result: String,
    },
  ],
});

module.exports = mongoose.model('majors', majorSchema, 'majors');
