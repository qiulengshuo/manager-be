const router = require('koa-router')();
const util = require('../utils/utils');
const Standard = require('../models/standardSchema');
const Assessment = require('../models/assessmentResultSchema');
const Dept = require('../models/deptSchema');
const Course = require('../models/courseSchema');
const Major = require('../models/majorSchema');

router.prefix('/assessment');

// 标准列表
router.get('/standardList', async (ctx) => {
  const { type } = ctx.request.query;
  const params = {};
  if (type) params.type = type;
  const standardList = await Standard.find(params);
  ctx.body = util.success({ list: standardList });
});

// 操作标准列表(新增编辑删除)
router.post('/operateStandardList', async (ctx) => {
  try {
    // _id? action type? standardName? standardDescription?
    const { _id, action, ...queryParams } = ctx.request.body;
    let info;
    if (action === 'create') {
      // action type standardName standardDescription
      await Standard.create(queryParams);
      info = '创建成功';
    } else if (action === 'edit') {
      // _id action standardName standardDescription
      if (_id) {
        const params = Object.assign({}, queryParams);
        params.updateTime = new Date();
        await Standard.findByIdAndUpdate(_id, params);
        info = '编辑成功';
      } else if (Array.isArray(queryParams.standardList)) {
        // _id action standardList.standardWeight
        const standardList = queryParams.standardList;
        await Promise.all(
          standardList.map(async (item) => {
            await Standard.findByIdAndUpdate(item._id, {
              standardWeight: item.standardWeight,
              updateTime: new Date(),
            });
          })
        );
        info = '编辑成功';
      } else {
        ctx.body = util.fail('缺少参数params: _id');
        return;
      }
    } else if (action === 'delete') {
      // action _id[]
      if (_id) {
        await Standard.deleteMany({ _id: { $in: _id } });
        info = '删除成功';
      } else {
        ctx.body = util.fail('缺少参数params: _id');
        return;
      }
    }
    ctx.body = util.success('', info);
  } catch (error) {
    ctx.body = util.fail('', error.stack);
  }
});

// 判断之前有没有评估过，有的话，编辑覆盖
router.get('/validHadAssessment', async (ctx) => {
  try {
    const { deptId } = ctx.request.query;
    const res = await Assessment.find({
      assessmentId: deptId,
    });
    ctx.body = util.success(res);
  } catch (error) {
    ctx.body = util.fail('查询失败');
  }
});

// 创建/编辑评估结果
router.post('/operateAssessment', async (ctx) => {
  try {
    // assessmentName: `${type.value}-${deptName}`,
    // assessmentId: curDeptId,
    // comments: comments.value,
    // assessmentResult: standardList
    const params = ctx.request.body;
    let info;
    const hasAssessment = await Assessment.find({
      assessmentId: params.assessmentId,
    });
    if (hasAssessment.length === 0) {
      await Assessment.create(params);
      info = '创建成功';
    } else {
      await Assessment.findByIdAndUpdate(hasAssessment[0]._id, {
        comments: params.comments,
        assessmentResult: params.assessmentResult,
      });
      info = '编辑成功';
    }
    ctx.body = util.success(info);
  } catch (e) {
    ctx.body = util.fail(e.stack);
  }
});

// 获取评估结果
router.get('/assessmentResult', async (ctx) => {
  const { deptId, action } = ctx.request.query;
  try {
    // 拿到需要查结果表的id
    const res = await Dept.find();
    let preInfo = [];
    if (action === 'all') {
      for (let i = 0; i < res.length; i++) {
        const parentIdList = res[i].parentId;
        if (String(parentIdList[parentIdList.length - 1]) === deptId) {
          preInfo.push(res[i]._id);
        }
      }
    } else if (action === 'single') {
      preInfo = res.find((item) => String(item._id) === deptId)?._id;
    }
    // 查询结果表
    const info = await Assessment.find({
      assessmentId: { $in: preInfo },
    });
    let msg = '';
    if (info.length < preInfo.length) {
      msg = 'leak';
    }
    ctx.body = util.success({
      list: info,
      msg,
    });
  } catch (error) {
    ctx.body = util.fail(error.stack);
  }
});
           
router.get('/detailList', async (ctx) => {
  const { deptId, type } = ctx.request.query;
  const { page, skipIndex } = util.pager(ctx.request.query);
  try {
    let total;
    let list;
    if (type === 'course') {
      const params = {
        courseId: deptId,
      };
      const query = Course.find(params);
      list = await query.skip(skipIndex).limit(page.pageSize);
      total = await Course.countDocuments(params);
    } else {
      const params = {
        majorsId: deptId,
      };
      const query = Major.find(params);
      list = await query.skip(skipIndex).limit(page.pageSize);
      total = await Major.countDocuments(params);
    }
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

// 操作课程/专业具体情况
router.post('/operateDetailList', async (ctx) => {
  const { _id, type, action, ...detailForm } = ctx.request.body;
  let info;
  if (action === 'create') {
    if (type === 'course') {
      await Course.create(detailForm);
    } else if (type === 'majors') {
      await Major.create(detailForm);
    }
    info = '创建成功';
  } else if (action === 'edit') {
    if (type === 'course') {
      await Course.findByIdAndUpdate(_id, detailForm);
    } else if (type === 'majors') {
      await Major.findByIdAndUpdate(_id, detailForm);
    }
    info = '编辑成功';
  } else if (action === 'delete') {
    if (type === 'course') {
      await Course.deleteMany({ _id: { $in: _id } });
    } else if (type === 'majors') {
      await Major.deleteMany({ _id: { $in: _id } });
    }
    info = '删除成功';
  }
  ctx.body = util.success(info);
});
module.exports = router;
