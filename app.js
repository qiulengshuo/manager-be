const Koa = require('koa');
const app = new Koa();
const views = require('koa-views');
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser');
const logger = require('koa-logger');
const router = require('koa-router')();
const users = require('./routes/users');
const menus = require('./routes/menus');
const roles = require('./routes/roles');
const depts = require('./routes/depts');
const leave = require('./routes/leave');
const assessment = require('./routes/assessment');
const log4js = require('./utils/log4j');
const utils = require('./utils/utils');
const koajwt = require('koa-jwt');

// error handler
onerror(app);

require('./config/db');


app.use(
  bodyparser({
    enableTypes: ['json', 'form', 'text'],
  })
);
app.use(json());
app.use(logger());
app.use(require('koa-static')(__dirname + '/public'));

app.use(
  views(__dirname + '/views', {
    extension: 'pug',
  })
);

// logger
app.use(async (ctx, next) => {
  log4js.info(`get params:${JSON.stringify(ctx.request.query)}`);
  log4js.info(`post params:${JSON.stringify(ctx.request.body)}`);
  await next().catch((err) => {
    if (err.status == 401) {
      ctx.status = 200;
      ctx.body = utils.fail('Token认证失败', utils.CODE.AUTH_ERROR);
    } else {
      throw err;
    }
  });
});

// token 验证，排除登录接口
app.use(
  koajwt({ secret: 'qiulengshuo' }).unless({
    path: [/^\/api\/users\/login/],
  })
);

// 一级路由
router.prefix('/api');

// 二级路由
router.use(users.routes(), users.allowedMethods());
router.use(menus.routes(), menus.allowedMethods());
router.use(roles.routes(), roles.allowedMethods());
router.use(depts.routes(), depts.allowedMethods());
router.use(leave.routes(), leave.allowedMethods());
router.use(assessment.routes(), assessment.allowedMethods());

// routes
app.use(router.routes(), router.allowedMethods());

// error-handling
app.on('error', (err) => {
  log4js.error(`${err.stack}`)
});

module.exports = app;
