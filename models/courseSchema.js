const mongoose = require('mongoose');
const courseSchema = mongoose.Schema({
  courseId: mongoose.Types.ObjectId,
  courseName: String,
  studentId: String,
  studentName: String,
  situation: [
    {
      label: String,
      result: String,
    },
  ],
});

module.exports = mongoose.model('courses', courseSchema, 'courses');
