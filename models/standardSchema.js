const mongoose = require('mongoose');
const standardSchema = mongoose.Schema({
  standardName: String, // 标准名称
  type: String, // 标准所属类型(course or majors)
  standardDescription: String, // 标准描述说明
  standardWeight: {
    type: Number,
    default: 0,
  }, // 标准权重
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
module.exports = mongoose.model('standards', standardSchema, 'standards');
