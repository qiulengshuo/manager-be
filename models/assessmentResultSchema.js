const mongoose = require('mongoose');
const assessmentResultScheme = mongoose.Schema({
  assessmentName: String, // 评估结果名称
  assessmentId: mongoose.Types.ObjectId, // 评估对象ID
  comments: String, // 评语
  assessmentResult: [
    // 评估结果
    {
      _id: mongoose.Types.ObjectId, // 标准id
      standardName: String, // 标准名字
      standardWeight: Number, // 标准权重
      score: Number, // 标准得分
    },
  ],
  updateTime: {
    type: Date,
    default: Date.now(),
  },
  createTime: {
    type: Date,
    default: Date.now(),
  },
});

// 名称 映射数据库集合的规则 数据库集合名
module.exports = mongoose.model(
  'assessments',
  assessmentResultScheme,
  'assessments'
);
