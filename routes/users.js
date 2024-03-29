/**
 *  用户管理模块
 */

const router = require('koa-router')();
const User = require('./../models/userSchema');
const Counter = require('./../models/counterSchema');
const Role = require('./../models/roleSchema');
const Menu = require('./../models/menuSchema');
const util = require('./../utils/utils');
const jwt = require('jsonwebtoken');
const md5 = require('md5');

router.prefix('/users');

router.post('/login', async (ctx) => {
  try {
    const { userName, userPwd } = ctx.request.body;
    const res = await User.findOne(
      {
        userName,
        userPwd: md5(userPwd),
      },
      'userId userName userEmail state role deptId roleList'
    );

    if (res) {
      const data = res._doc;
      const token = jwt.sign(
        {
          data,
        },
        'qiulengshuo',
        {
          expiresIn: 3000,
        }
      );
      data.token = token;
      ctx.body = util.success(res);
    } else {
      ctx.body = util.fail('账号或密码不正确');
    }
  } catch (error) {
    ctx.body = util.fail(error.msg);
  }
});

router.get('/list', async (ctx) => {
  const { userId, userName, state } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query);
  const params = {};
  if (userId) params.userId = userId;
  if (userName) params.userName = userName;
  if (state && state !== '0') params.state = state;
  try {
    const query = User.find(params, { _id: 0, userPwd: 0 });
    const list = await query.skip(skipIndex).limit(page.pageSize);
    const total = await User.countDocuments(params);

    ctx.body = util.success({
      page: {
        ...page,
        total,
      },
      list,
    });
  } catch (error) {
    ctx.body = util.fail(`查询异常:${error.stack}`);
  }
});

router.get('/all/list', async (ctx) => {
  try {
    const list = await User.find({ state: 1 }, 'userId userName userEmail');
    ctx.body = util.success(list);
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
});

router.get('/getPermissionList', async (ctx) => {
  const authorization = ctx.request.headers.authorization;
  const { data } = util.decoded(authorization);
  const menuList = await getMenuList(
    data.role,
    data.roleList,
    data.userId === 1000007 ? true : false
  );
  const actionList = getAction(JSON.parse(JSON.stringify(menuList)));
  ctx.body = util.success({ menuList, actionList });
});

async function getMenuList(userRole, roleKeys, admin = false) {
  let rootList = [];
  if (userRole === 0 && admin) {
    // 管理员，默认拥有所有权限列表(含按钮)
    rootList = (await Menu.find({})) || [];
  } else {
    // 根据用户拥有的角色，获取权限列表(含按钮)
    const roleList = await Role.find({ _id: { $in: roleKeys } });
    let permissionList = [];
    roleList.map((role) => {
      const { checkedKeys, halfCheckedKeys } = role.permissionList;
      permissionList = permissionList.concat([
        ...checkedKeys,
        ...halfCheckedKeys,
      ]);
    });
    permissionList = [...new Set(permissionList)];
    rootList = await Menu.find({ _id: { $in: permissionList } });
  }
  return util.getTreeMenu(rootList, null, []);
}

function getAction(list) {
  const actionList = [];
  const deep = (arr) => {
    while (arr.length) {
      const item = arr.pop();
      if (item.action) {
        item.action.map((action) => {
          actionList.push(action.menuCode);
        });
      }
      if (item.children && !item.action) {
        deep(item.children);
      }
    }
  };
  deep(list);
  return actionList;
}

// 用户删除/批量删除
router.post('/delete', async (ctx) => {
  // 待删除的用户Id数组
  const { userIds } = ctx.request.body;
  const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 });
  if (res.modifiedCount) {
    ctx.body = util.success(res, `共删除成功${res.modifiedCount}条`);
    return;
  }
  ctx.body = util.fail('删除失败');
});

// 用户新增/编辑
router.post('/operate', async (ctx) => {
  const {
    userId,
    userName,
    userEmail,
    mobile,
    job,
    state,
    roleList,
    deptId,
    action,
  } = ctx.request.body;
  if (action === 'add') {
    // 必填项
    if (!userName || !userEmail || !deptId) {
      ctx.body = util.fail('参数错误', util.CODE.PARAM_ERROR);
      return;
    }
    const res = await User.findOne(
      { $or: [{ userName }, { userEmail }] },
      '_id userName userEmail'
    );
    if (res) {
      ctx.body = util.fail(
        `系统监测到有重复的用户，信息如下：${res.userName} - ${res.userEmail}`
      );
    } else {
      const doc = await Counter.findOneAndUpdate(
        { _id: 'userId' },
        { $inc: { sequence_value: 1 } },
        { new: true }
      );
      try {
        const user = new User({
          userId: doc.sequence_value,
          userName,
          userPwd: md5('123456'),
          userEmail,
          roleList,
          job,
          state,
          deptId,
          mobile,
        });
        await user.save();
        ctx.body = util.success({}, '用户创建成功');
      } catch (error) {
        ctx.body = util.fail(error.stack, '用户创建失败');
      }
    }
  } else {
    // 必填项
    if (!deptId) {
      ctx.body = util.fail('部门不能为空', util.CODE.PARAM_ERROR);
      return;
    }
    try {
      await User.findOneAndUpdate(
        { userId },
        { mobile, job, state, roleList, deptId }
      );
      ctx.body = util.success({}, '更新成功');
    } catch (error) {
      ctx.body = util.fail(error.stack, '更新失败');
    }
  }
});

module.exports = router;
