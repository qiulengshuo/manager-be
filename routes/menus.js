const router = require('koa-router')();
const utils = require('../utils/utils');
const Menu = require('../models/menuSchema');

router.prefix('/menu');

router.get('/list', async (ctx) => {
  const { menuName, menuState } = ctx.request.query;
  const params = {};
  if (menuName) params.menuName = menuName;
  if (menuState) params.menuState = menuState;
  const rootList = (await Menu.find(params)) || [];
  const permissionList = utils.getTreeMenu(rootList, null, [], true);
  ctx.body = utils.success(permissionList);
});

router.post('/operate', async (ctx) => {
  const { _id, action, ...params } = ctx.request.body;
  let info;
  try {
    if (action === 'add') {
      await Menu.create(params);
      info = '创建成功';
    } else if (action === 'edit') {
      params.updateTime = new Date();
      await Menu.findByIdAndUpdate(_id, params);
      info = '编辑成功';
    } else {
      await Menu.findByIdAndRemove(_id);
      await Menu.deleteMany({ parentId: { $all: [_id] } });
      info = '删除成功';
    }
    ctx.body = utils.success('', info);
  } catch (error) {
    ctx.body = utils.fail(error.stack);
  }
});


module.exports = router;
