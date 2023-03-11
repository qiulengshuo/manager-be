const mongoose = require('mongoose');
const counterSchema = mongoose.Schema({
  _id: String, //增长字段
  sequence_value: Number, //增长值
});

// 名称 映射数据库集合的规则 数据库集合名
module.exports = mongoose.model('counter', counterSchema, 'counters');
