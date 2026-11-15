/* School catalogue shared by the browser and server. Logos are served locally. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LabSchools = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const list = [
  {
    "id": "pku",
    "name": "北京大学",
    "aliases": [
      "北大",
      "PKU",
      "Peking"
    ],
    "logo": "/assets/schools/pku.png"
  },
  {
    "id": "tsinghua",
    "name": "清华大学",
    "aliases": [
      "清华",
      "THU",
      "Tsinghua"
    ],
    "logo": "/assets/schools/tsinghua.png"
  },
  {
    "id": "fudan",
    "name": "复旦大学",
    "aliases": [
      "复旦",
      "FDU",
      "Fudan"
    ],
    "logo": "/assets/schools/fudan.png"
  },
  {
    "id": "sjtu",
    "name": "上海交通大学",
    "aliases": [
      "上海交大",
      "上交",
      "SJTU"
    ],
    "logo": "/assets/schools/sjtu.png"
  },
  {
    "id": "zju",
    "name": "浙江大学",
    "aliases": [
      "浙大",
      "ZJU"
    ],
    "logo": "/assets/schools/zju.png"
  },
  {
    "id": "ustc",
    "name": "中国科学技术大学",
    "aliases": [
      "中国科大",
      "中科大",
      "USTC"
    ],
    "logo": "/assets/schools/ustc.png"
  },
  {
    "id": "nju",
    "name": "南京大学",
    "aliases": [
      "南大",
      "NJU"
    ],
    "logo": "/assets/schools/nju.png"
  },
  {
    "id": "whu",
    "name": "武汉大学",
    "aliases": [
      "武大",
      "WHU"
    ],
    "logo": "/assets/schools/whu.png"
  },
  {
    "id": "hust",
    "name": "华中科技大学",
    "aliases": [
      "华中科大",
      "华科",
      "HUST"
    ],
    "logo": "/assets/schools/hust.png"
  },
  {
    "id": "xjtu",
    "name": "西安交通大学",
    "aliases": [
      "西安交大",
      "西交",
      "XJTU"
    ],
    "logo": "/assets/schools/xjtu.png"
  },
  {
    "id": "sysu",
    "name": "中山大学",
    "aliases": [
      "中大",
      "SYSU"
    ],
    "logo": "/assets/schools/sysu.png"
  },
  {
    "id": "scu",
    "name": "四川大学",
    "aliases": [
      "川大",
      "SCU"
    ],
    "logo": "/assets/schools/scu.png"
  },
  {
    "id": "sdu",
    "name": "山东大学",
    "aliases": [
      "山大",
      "SDU"
    ],
    "logo": "/assets/schools/sdu.png"
  },
  {
    "id": "szu",
    "name": "深圳大学",
    "aliases": [
      "深大",
      "SZU"
    ],
    "logo": "/assets/schools/szu.png"
  },
  {
    "id": "zzu",
    "name": "郑州大学",
    "aliases": [
      "郑大",
      "ZZU"
    ],
    "logo": "/assets/schools/zzu.png"
  },
  {
    "id": "henu",
    "name": "河南大学",
    "aliases": [
      "河大",
      "HENU"
    ],
    "logo": "/assets/schools/henu.png"
  },
  {
    "id": "ccmu",
    "name": "首都医科大学",
    "aliases": [
      "首医",
      "首医大",
      "CCMU"
    ],
    "logo": "/assets/schools/ccmu.png"
  },
  {
    "id": "bucm",
    "name": "北京中医药大学",
    "aliases": [
      "北中医",
      "BUCM"
    ],
    "logo": "/assets/schools/bucm.png"
  },
  {
    "id": "tju",
    "name": "天津大学",
    "aliases": [
      "天大",
      "TJU"
    ],
    "logo": "/assets/schools/tju.png"
  },
  {
    "id": "nankai",
    "name": "南开大学",
    "aliases": [
      "南开",
      "NKU"
    ],
    "logo": "/assets/schools/nankai.png"
  },
  {
    "id": "xmu",
    "name": "厦门大学",
    "aliases": [
      "厦大",
      "XMU"
    ],
    "logo": "/assets/schools/xmu.png"
  },
  {
    "id": "tongji",
    "name": "同济大学",
    "aliases": [
      "同济",
      "TONGJI"
    ],
    "logo": "/assets/schools/tongji.png"
  },
  {
    "id": "seu",
    "name": "东南大学",
    "aliases": [
      "东大",
      "SEU"
    ],
    "logo": "/assets/schools/seu.png"
  },
  {
    "id": "csu",
    "name": "中南大学",
    "aliases": [
      "中南",
      "CSU"
    ],
    "logo": "/assets/schools/csu.png"
  },
  {
    "id": "cqu",
    "name": "重庆大学",
    "aliases": [
      "重大",
      "CQU"
    ],
    "logo": "/assets/schools/cqu.png"
  },
  {
    "id": "hit",
    "name": "哈尔滨工业大学",
    "aliases": [
      "哈工大",
      "HIT"
    ],
    "logo": "/assets/schools/hit.png"
  },
  {
    "id": "jlu",
    "name": "吉林大学",
    "aliases": [
      "吉大",
      "JLU"
    ],
    "logo": "/assets/schools/jlu.png"
  },
  {
    "id": "lzu",
    "name": "兰州大学",
    "aliases": [
      "兰大",
      "LZU"
    ],
    "logo": "/assets/schools/lzu.png"
  },
  {
    "id": "ruc",
    "name": "中国人民大学",
    "aliases": [
      "人大",
      "RUC"
    ],
    "logo": "/assets/schools/ruc.png"
  },
  {
    "id": "bnu",
    "name": "北京师范大学",
    "aliases": [
      "北师大",
      "BNU"
    ],
    "logo": "/assets/schools/bnu.png"
  },
  {
    "id": "ecnu",
    "name": "华东师范大学",
    "aliases": [
      "华东师大",
      "ECNU"
    ],
    "logo": "/assets/schools/ecnu.png"
  },
  {
    "id": "hnu",
    "name": "湖南大学",
    "aliases": [
      "湖大",
      "HNU"
    ],
    "logo": "/assets/schools/hnu.png"
  },
  {
    "id": "uestc",
    "name": "电子科技大学",
    "aliases": [
      "电子科大",
      "成电",
      "UESTC"
    ],
    "logo": "/assets/schools/uestc.png"
  },
  {
    "id": "npu",
    "name": "西北工业大学",
    "aliases": [
      "西工大",
      "NPU"
    ],
    "logo": "/assets/schools/npu.png"
  },
  {
    "id": "dut",
    "name": "大连理工大学",
    "aliases": [
      "大工",
      "DUT"
    ],
    "logo": "/assets/schools/dut.png"
  },
  {
    "id": "xidian",
    "name": "西安电子科技大学",
    "aliases": [
      "西电",
      "XDU"
    ],
    "logo": "/assets/schools/xidian.png"
  },
  {
    "id": "sustech",
    "name": "南方科技大学",
    "aliases": [
      "南科大",
      "SUSTECH"
    ],
    "logo": "/assets/schools/sustech.png"
  },
  {
    "id": "ucas",
    "name": "中国科学院大学",
    "aliases": [
      "国科大",
      "UCAS"
    ],
    "logo": "/assets/schools/ucas.png"
  },
  {
    "id": "scut",
    "name": "华南理工大学",
    "aliases": [
      "华工",
      "SCUT"
    ],
    "logo": "/assets/schools/scut.png"
  },
  {
    "id": "cpu",
    "name": "中国药科大学",
    "aliases": [
      "药大",
      "中国药大",
      "CPU"
    ],
    "logo": "/assets/schools/cpu.png"
  },
  {
    "id": "henan-medical",
    "name": "河南医药大学",
    "aliases": [
      "新乡医学院",
      "新医",
      "河南医大",
      "Henan Medical University",
      "Xinxiang Medical University"
    ],
    "logo": "/assets/schools/henan-medical.png"
  },
  {
    "id": "zzuli",
    "name": "郑州轻工业大学",
    "aliases": [
      "郑州轻工",
      "郑轻",
      "郑州轻工业学院",
      "ZZULI"
    ],
    "logo": "/assets/schools/zzuli.png"
  }
];
  function find(id) { return list.find(function (school) { return school.id === id; }) || null; }
  function match(name) {
    const query = String(name || '').trim().toLowerCase();
    return list.find(function (school) {
      return [school.name].concat(school.aliases || []).some(function (value) { return value.toLowerCase() === query; });
    }) || null;
  }
  return { list: list, find: find, match: match };
});
