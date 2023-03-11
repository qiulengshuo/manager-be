const mongoose = require('mongoose');
const roleSchema = mongoose.Schema({
  roleName: String, // 角色说明
  remark: String, // 拥有的所有权限
  permissionList: {
    checkedKeys: [],
    halfCheckedKeys: [],
  },
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
module.exports = mongoose.model('roles', roleSchema, 'roles');
