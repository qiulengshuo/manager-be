/**
 * 用户管理模块
 */

const router = require('koa-router')();
const Leave = require('../models/leaveSchema');
const Dept = require('../models/deptSchema');
const util = require('../utils/utils');

router.prefix('/leave');

// 查询登录用户的休假、审批列表
router.get('/list', async (ctx) => {
  const { applyState, type } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query);
  const authorization = ctx.request.headers.authorization;
  const { data } = util.decoded(authorization);
  try {
    let params = {};
    // 待审批流程
    if (type === 'approve') {
      // 待审批列表，只有当前审批人可查
      if (applyState == 1 || applyState == 2) {
        params.curAuditUserName = data.userName;
        params.$or = [{ applyState: 1 }, { applyState: 2 }];
      } else if (applyState > 2) {
        // 审批通过 审批拒绝 作废
        // 只要审批流中有当前角色就显示
        params = {
          'auditFlows.userId': data.userId,
          applyState,
        };
      } else {
        // 所有
        // 审批流中有当前角色就显示
        params = {
          'auditFlows.userId': data.userId,
        };
      }
    } else {
      // 休假列表
      // 只能查自己的
      params = {
        'applyUser.userId': data.userId,
      };
      if (applyState) params.applyState = applyState;
    }
    const query = Leave.find(params);
    const list = await query.skip(skipIndex).limit(page.pageSize);
    const total = await Leave.countDocuments(params);
    ctx.body = util.success({
      page: {
        ...page,
        total,
      },
      list,
    });
  } catch (error) {
    ctx.body = util.fail(`查询失败:${error.stack}`);
  }
});

// 休假操作(创建 作废)
router.post('/operate', async (ctx) => {
  const { _id, action, ...params } = ctx.request.body;
  const authorization = ctx.request.headers.authorization;
  const { data } = util.decoded(authorization);

  if (action === 'create') {
    // 生成申请单号
    let orderNo = 'XJ';
    orderNo += util.formateDate(new Date(), 'yyyyMMdd');
    const total = await Leave.countDocuments();
    params.orderNo = orderNo + total;

    // 获取用户当前部门ID
    const id = data.deptId.pop();
    // 查找负责人信息
    const dept = await Dept.findById(id);
    // 获取人事部门和财务部门负责人信息
    const userList = await Dept.find({
      deptName: { $in: ['人事', '财务'] },
    });

    let auditUsers = dept.userName;
    const auditFlows = [
      {
        userId: dept.userId,
        userName: dept.userName,
        userEmail: dept.userEmail,
      },
    ];
    userList.map((item) => {
      auditFlows.push({
        userId: item.userId,
        userName: item.userName,
        userEmail: item.userEmail,
      });
      auditUsers += ',' + item.userName;
    });

    params.auditUsers = auditUsers;
    params.curAuditUserName = dept.userName;
    params.auditFlows = auditFlows;
    params.auditLogs = [];
    params.applyUser = {
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
    };

    await Leave.create(params);
    ctx.body = util.success('', '创建成功');
  } else {
    await Leave.findByIdAndUpdate(_id, { applyState: 5 });
    ctx.body = util.success('', '操作成功');
  }
});

// 审批操作(审批拒绝 审批通过)
router.post('/approve', async (ctx) => {
  const { action, remark, _id } = ctx.request.body;
  let authorization = ctx.request.headers.authorization;
  let { data } = util.decoded(authorization);
  const params = {};
  try {
    // 1:待审批 2:审批中 3:审批拒绝 4:审批通过 5:作废
    const doc = await Leave.findById(_id);
    const auditLogs = doc.auditLogs || [];
    if (action === 'refuse') {
      params.applyState = 3;
    } else {
      // 审核通过
      // 已经走完审批流了
      if (doc.auditFlows.length === doc.auditLogs.length) {
        ctx.body = util.success('当前申请单已处理，请勿重复提交');
        return;
        // 最后一个审批人 -> 审批通过
      } else if (doc.auditFlows.length === doc.auditLogs.length + 1) {
        params.applyState = 4;
        // 其他审批人 -> 审批中
      } else if (doc.auditFlows.length > doc.auditLogs.length) {
        params.applyState = 2;
        params.curAuditUserName =
          doc.auditFlows[doc.auditLogs.length + 1].userName;
      }
    }
    auditLogs.push({
      userId: data.userId,
      userName: data.userName,
      createTime: new Date(),
      remark,
      action: action == 'refuse' ? '审核拒绝' : '审核通过',
    });
    params.auditLogs = auditLogs;
    await Leave.findByIdAndUpdate(_id, params);
    ctx.body = util.success('', '处理成功');
  } catch (error) {
    ctx.body = util.fail(`查询异常：${error.message}`);
  }
});

// 待审批数量
router.get('/count', async (ctx) => {
  const authorization = ctx.request.headers.authorization;
  const { data } = util.decoded(authorization);
  try {
    const params = {};
    params.curAuditUserName = data.userName;
    params.$or = [{ applyState: 1 }, { applyState: 2 }];
    const total = await Leave.countDocuments(params);
    ctx.body = util.success(total);
  } catch (error) {
    ctx.body = util.fail(`查询异常：${error.message}`);
  }
});

module.exports = router;
