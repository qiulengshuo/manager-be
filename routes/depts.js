const router = require('koa-router')();
const util = require('./../utils/utils');
const Dept = require('./../models/deptSchema');

router.prefix('/dept');

// 部门树形列表
router.get('/list', async (ctx) => {
  const { deptName } = ctx.request.query;
  const params = {};
  if (deptName) params.deptName = deptName;
  const rootList = await Dept.find(params);
  if (deptName) {
    ctx.body = util.success(rootList);
  } else {
    const treeList = getTreeDept(rootList, null, []);
    ctx.body = util.success(treeList);
  }
});

router.get('/allList', async (ctx) => {
  try {
    const res = await Dept.find();
    ctx.body = util.success(res);
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
});

// 递归生成树形部门列表
function getTreeDept(rootList, id, list) {
  for (let i = 0; i < rootList.length; i++) {
    const item = rootList[i];
    if (String(item.parentId.slice().pop()) == String(id)) {
      list.push(item._doc);
    }
  }
  list.map((item) => {
    item.children = [];
    getTreeDept(rootList, item._id, item.children);
    if (item.children.length == 0) {
      delete item.children;
    }
  });
  return list;
}

// 部门操作：创建、编辑、删除
router.post('/operate', async (ctx) => {
  const { _id, action, ...params } = ctx.request.body;
  let info;
  try {
    if (action == 'create') {
      await Dept.create(params);
      info = '创建成功';
    } else if (action == 'edit') {
      params.updateTime = new Date();
      await Dept.findByIdAndUpdate(_id, params);
      info = '编辑成功';
    } else if (action == 'delete') {
      // 删自己
      await Dept.findByIdAndRemove(_id);
      // 删下级部门
      await Dept.deleteMany({ parentId: { $all: [_id] } });
      info = '删除成功';
    }
    ctx.body = util.success('', info);
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
});

module.exports = router;
