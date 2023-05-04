/**
 *  通用工具函数
 */
const log4js = require('./log4j');
const jwt = require('jsonwebtoken');

// 状态码
const CODE = {
  SUCCESS: 200,
  PARAM_ERROR: 10001, // 参数错误
  USER_ACCOUNT_ERROR: 20001, // 账号或密码错误
  USER_LOGIN_ERROR: 30001, // 用户未登录
  BUSINESS_ERROR: 40001, // 业务请求失败
  AUTH_ERROR: 500001, // 认证失败或TOKEN过期
};

module.exports = {
  CODE,
  /**
   * 分页结构封装
   * @param {number} pageNum
   * @param {number} pageSize
   */
  pager({ pageNum = 1, pageSize = 10 }) {
    pageNum *= 1;
    pageSize *= 1;
    // 起始索引
    const skipIndex = (pageNum - 1) * pageSize;
    return {
      page: {
        pageNum,
        pageSize,
      },
      skipIndex,
    };
  },
  /**
   * 接口调用成功后返回的数据封装
   */
  success(data = '', msg = '', code = CODE.SUCCESS) {
    log4js.debug(data);
    return {
      code,
      data,
      msg,
    };
  },
  /**
   * 接口调用失败后返回的数据封装
   */
  fail(msg = '', code = CODE.BUSINESS_ERROR, data = '') {
    log4js.debug(msg);
    return {
      code,
      data,
      msg,
    };
  },
  // 递归拼接树形菜单
  getTreeMenu(rootList, id, list, getAll = false) {
    for (let i = 0; i < rootList.length; i++) {
      const item = rootList[i];
      if (
        String(item.parentId.slice().pop()) === String(id) &&
        (item.menuState !== 2 || getAll)
      ) {
        list.push(item._doc);
      }
    }
    list.map((item) => {
      item.children = [];
      this.getTreeMenu(rootList, item._id, item.children, getAll);
      if (item.children.length === 0) {
        delete item.children;
      } else if (item.children.length > 0 && item.children[0].menuType === 2) {
        item.action = item.children;
      }
    });
    return list;
  },
  // 解密token数据
  decoded(authorization) {
    if (authorization) {
      let token = authorization.split(' ')[1];
      return jwt.verify(token, 'qiulengshuo');
    }
    return '';
  },
  // 格式化时间
  formateDate(date, rule) {
    let fmt = rule || 'yyyy-MM-dd hh:mm:ss';
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, date.getFullYear());
    }
    const o = {
      // 'y+': date.getFullYear(),
      'M+': date.getMonth() + 1,
      'd+': date.getDate(),
      'h+': date.getHours(),
      'm+': date.getMinutes(),
      's+': date.getSeconds(),
    };
    for (let k in o) {
      if (new RegExp(`(${k})`).test(fmt)) {
        const val = o[k] + '';
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length == 1 ? val : ('00' + val).substr(val.length)
        );
      }
    }
    return fmt;
  },
};
