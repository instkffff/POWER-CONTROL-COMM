// IDlist.js

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const deviceConfig = require('../deviceConfig.json');

/**
 * 获取 deviceConfig 里面的所有id的value
 * @returns {Array} 所有ID值的数组
 */
function getAllIds() {
  const values = [];
  
  // 遍历 deviceConfig 对象的每一层结构
  Object.values(deviceConfig).forEach(floor => {
    Object.values(floor).forEach(group => {
      Object.values(group).forEach(device => {
        // 将每个设备的值（即value）添加到数组中
        values.push(...Object.values(device));
      });
    });
  });

  return values;
}

export { getAllIds };

/* console.log(getAllIds()); */