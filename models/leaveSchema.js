const mongoose = require('mongoose');
const leaveSchema = mongoose.Schema({
  orderNo: String,
  // 休假类型
  applyType: Number,
  startTime: { type: Date, default: Date.now() },
  endTime: { type: Date, default: Date.now() },
  // 申请人
  applyUser: {
    userId: Number,
    userName: String,
    userEmail: String,
  },
  leaveTime: String,
  reasons: String,
  // 所有审批人
  auditUsers: String,
  // 当前审批人
  curAuditUserName: String,
  // 审批流
  auditFlows: [
    {
      userId: Number,
      userName: String,
      userEmail: String,
    },
  ],
  // 审批日志
  auditLogs: [
    {
      userId: Number,
      userName: String,
      createTime: Date,
      remark: String,
      action: String,
    },
  ],
  // 当前审批状态
  applyState: { type: Number, default: 1 },
  createTime: { type: Date, default: Date.now() },
});

// 名称 映射数据库集合的规则 数据库集合名
module.exports = mongoose.model('leaves', leaveSchema, 'leaves');
