/* 轻伴 LightMate — 静态数据层
 * 食物库 / 文案库 / 徽章 / 识别规则
 * 零依赖：挂载到 window.LM.data
 */
(function (global) {
  'use strict';

  var LM = (global.LM = global.LM || {});

  /* ------------------------------------------------------------------ *
   * 1. 食物库
   * kcal = 每单位热量；unit 展示单位；默认份量 portion
   * tags: 用于匹配用户「最容易控制不住」的选项
   * ------------------------------------------------------------------ */
  var FOODS = [
    // —— 食堂 ——
    { id: 'rice',      name: '米饭',        emoji: '🍚', unit: '碗', kcal: 232, portion: 1, cat: '食堂', tags: ['主食'] },
    { id: 'mantou',    name: '馒头',        emoji: '🍞', unit: '个', kcal: 220, portion: 1, cat: '食堂', tags: ['主食'] },
    { id: 'tomato_egg',name: '番茄炒蛋',    emoji: '🍅', unit: '份', kcal: 180, portion: 1, cat: '食堂', tags: [] },
    { id: 'hongshaorou',name:'红烧肉',      emoji: '🥩', unit: '份', kcal: 450, portion: 1, cat: '食堂', tags: ['高油'] },
    { id: 'gongbao',   name: '宫保鸡丁',    emoji: '🍗', unit: '份', kcal: 320, portion: 1, cat: '食堂', tags: [] },
    { id: 'qingcai',   name: '清炒时蔬',    emoji: '🥬', unit: '份', kcal: 90,  portion: 1, cat: '食堂', tags: ['低卡'] },
    { id: 'tudousi',   name: '酸辣土豆丝',  emoji: '🥔', unit: '份', kcal: 150, portion: 1, cat: '食堂', tags: ['主食'] },
    { id: 'mapo',      name: '麻婆豆腐',    emoji: '🌶️', unit: '份', kcal: 240, portion: 1, cat: '食堂', tags: [] },
    { id: 'jitui',     name: '卤鸡腿',      emoji: '🍖', unit: '个', kcal: 180, portion: 1, cat: '食堂', tags: ['高蛋白'] },
    { id: 'yuxiang',   name: '鱼香肉丝',    emoji: '🥢', unit: '份', kcal: 300, portion: 1, cat: '食堂', tags: ['高油'] },
    { id: 'zicaitang', name: '紫菜蛋花汤',  emoji: '🥣', unit: '碗', kcal: 50,  portion: 1, cat: '食堂', tags: ['低卡', '汤'] },
    { id: 'xiaomi',    name: '小米粥',      emoji: '🥣', unit: '碗', kcal: 90,  portion: 1, cat: '食堂', tags: ['汤'] },
    { id: 'doujiang',  name: '豆浆',        emoji: '🥛', unit: '杯', kcal: 110, portion: 1, cat: '食堂', tags: ['早餐'] },
    { id: 'chadan',    name: '茶叶蛋',      emoji: '🥚', unit: '个', kcal: 75,  portion: 1, cat: '食堂', tags: ['高蛋白', '早餐'] },
    { id: 'jianbing',  name: '煎饼果子',    emoji: '🌯', unit: '个', kcal: 420, portion: 1, cat: '食堂', tags: ['早餐', '高油'] },
    { id: 'shouzhuabing', name: '手抓饼',   emoji: '🥞', unit: '个', kcal: 380, portion: 1, cat: '食堂', tags: ['早餐', '高油'] },
    { id: 'malatang',  name: '麻辣烫',      emoji: '🍲', unit: '份', kcal: 600, portion: 1, cat: '食堂', tags: ['高油', '夜宵'] },
    { id: 'luosifen',  name: '螺蛳粉',      emoji: '🍜', unit: '碗', kcal: 550, portion: 1, cat: '食堂', tags: ['夜宵'] },
    { id: 'huangmenji',name: '黄焖鸡米饭',  emoji: '🍛', unit: '份', kcal: 750, portion: 1, cat: '食堂', tags: ['套餐', '主食'] },
    { id: 'lamian',    name: '兰州拉面',    emoji: '🍜', unit: '碗', kcal: 520, portion: 1, cat: '食堂', tags: ['主食'] },
    { id: 'gaijiaofan',name: '盖浇饭',      emoji: '🍛', unit: '份', kcal: 680, portion: 1, cat: '食堂', tags: ['套餐', '主食'] },

    // —— 外卖 ——
    { id: 'fried_chicken', name: '炸鸡',    emoji: '🍗', unit: '份', kcal: 600, portion: 1, cat: '外卖', tags: ['外卖', '高油'] },
    { id: 'hamburger', name: '汉堡',        emoji: '🍔', unit: '个', kcal: 450, portion: 1, cat: '外卖', tags: ['外卖', '高油'] },
    { id: 'fries',     name: '薯条',        emoji: '🍟', unit: '中份', kcal: 320, portion: 1, cat: '外卖', tags: ['外卖', '零食', '高油'] },
    { id: 'pizza',     name: '披萨',        emoji: '🍕', unit: '片', kcal: 250, portion: 2, cat: '外卖', tags: ['外卖', '聚餐'] },
    { id: 'xiangguo',  name: '麻辣香锅',    emoji: '🍲', unit: '份', kcal: 800, portion: 1, cat: '外卖', tags: ['外卖', '聚餐', '高油'] },
    { id: 'shala',     name: '轻食沙拉',    emoji: '🥗', unit: '份', kcal: 180, portion: 1, cat: '外卖', tags: ['外卖', '低卡'] },
    { id: 'shousi',    name: '寿司',        emoji: '🍣', unit: '8 个', kcal: 320, portion: 1, cat: '外卖', tags: ['外卖'] },
    { id: 'mixian',    name: '米线',        emoji: '🍜', unit: '碗', kcal: 450, portion: 1, cat: '外卖', tags: ['外卖', '主食'] },

    // —— 奶茶饮品 ——
    { id: 'zhenzhu_naicha', name: '珍珠奶茶', emoji: '🧋', unit: '大杯', kcal: 550, portion: 1, cat: '奶茶', tags: ['奶茶'] },
    { id: 'naicha',    name: '奶茶',        emoji: '🧋', unit: '中杯', kcal: 350, portion: 1, cat: '奶茶', tags: ['奶茶'] },
    { id: 'guocha',    name: '果茶',        emoji: '🍹', unit: '杯', kcal: 180, portion: 1, cat: '奶茶', tags: ['奶茶'] },
    { id: 'meishi',    name: '美式咖啡',    emoji: '☕', unit: '杯', kcal: 5,   portion: 1, cat: '奶茶', tags: ['低卡'] },
    { id: 'natie',     name: '拿铁',        emoji: '☕', unit: '杯', kcal: 150, portion: 1, cat: '奶茶', tags: ['奶茶'] },
    { id: 'wutangcha', name: '无糖茶',      emoji: '🍵', unit: '瓶', kcal: 0,   portion: 1, cat: '奶茶', tags: ['低卡'] },
    { id: 'ningmengshui', name: '柠檬水',   emoji: '🍋', unit: '杯', kcal: 10,  portion: 1, cat: '奶茶', tags: ['低卡'] },

    // —— 零食 ——
    { id: 'shupian',   name: '薯片',        emoji: '🥔', unit: '包', kcal: 320, portion: 1, cat: '零食', tags: ['零食', '高油'] },
    { id: 'qiaokeli',  name: '巧克力',      emoji: '🍫', unit: '块', kcal: 80,  portion: 2, cat: '零食', tags: ['零食'] },
    { id: 'binggan',   name: '饼干',        emoji: '🍪', unit: '包', kcal: 200, portion: 1, cat: '零食', tags: ['零食'] },
    { id: 'latiao',    name: '辣条',        emoji: '🌶️', unit: '包', kcal: 180, portion: 1, cat: '零食', tags: ['零食'] },
    { id: 'jianguo',   name: '坚果',        emoji: '🥜', unit: '把', kcal: 170, portion: 1, cat: '零食', tags: ['零食'] },
    { id: 'bingqilin', name: '冰淇淋',      emoji: '🍦', unit: '个', kcal: 220, portion: 1, cat: '零食', tags: ['零食'] },
    { id: 'mianbao',   name: '面包',        emoji: '🍞', unit: '个', kcal: 260, portion: 1, cat: '零食', tags: ['零食', '早餐'] },
    { id: 'dangao',    name: '蛋糕',        emoji: '🍰', unit: '块', kcal: 350, portion: 1, cat: '零食', tags: ['零食'] },

    // —— 夜宵 ——
    { id: 'paomian',   name: '泡面',        emoji: '🍜', unit: '桶', kcal: 450, portion: 1, cat: '夜宵', tags: ['夜宵'] },
    { id: 'shaokao',   name: '烧烤',        emoji: '🍢', unit: '串', kcal: 80,  portion: 5, cat: '夜宵', tags: ['夜宵', '聚餐', '高油'] },
    { id: 'guandongzhu', name: '关东煮',    emoji: '🍢', unit: '份', kcal: 200, portion: 1, cat: '夜宵', tags: ['夜宵'] },
    { id: 'chaofan',   name: '蛋炒饭',      emoji: '🍚', unit: '份', kcal: 500, portion: 1, cat: '夜宵', tags: ['夜宵', '主食'] },
    { id: 'xiaolongxia', name: '小龙虾',    emoji: '🦐', unit: '份', kcal: 400, portion: 1, cat: '夜宵', tags: ['夜宵', '聚餐'] },
    { id: 'zhachuan',  name: '炸串',        emoji: '🍡', unit: '份', kcal: 350, portion: 1, cat: '夜宵', tags: ['夜宵', '高油'] },

    // —— 健康选择 ——
    { id: 'apple',     name: '苹果',        emoji: '🍎', unit: '个', kcal: 80,  portion: 1, cat: '健康', tags: ['低卡', '水果'] },
    { id: 'banana',    name: '香蕉',        emoji: '🍌', unit: '根', kcal: 90,  portion: 1, cat: '健康', tags: ['水果'] },
    { id: 'suannai',   name: '无糖酸奶',    emoji: '🥛', unit: '杯', kcal: 120, portion: 1, cat: '健康', tags: ['低卡', '高蛋白'] },
    { id: 'jidan',     name: '水煮蛋',      emoji: '🥚', unit: '个', kcal: 75,  portion: 1, cat: '健康', tags: ['高蛋白', '早餐'] },
    { id: 'jixiong',   name: '鸡胸肉',      emoji: '🍗', unit: '份', kcal: 165, portion: 1, cat: '健康', tags: ['高蛋白', '低卡'] },
    { id: 'quanmai',   name: '全麦面包',    emoji: '🍞', unit: '片', kcal: 80,  portion: 2, cat: '健康', tags: ['早餐'] },
    { id: 'yanmai',    name: '燕麦粥',      emoji: '🥣', unit: '碗', kcal: 150, portion: 1, cat: '健康', tags: ['早餐', '低卡'] },
    { id: 'yumi',      name: '水煮玉米',    emoji: '🌽', unit: '根', kcal: 110, portion: 1, cat: '健康', tags: ['主食', '低卡'] }
  ];

  var FOOD_MAP = {};
  FOODS.forEach(function (f) { FOOD_MAP[f.id] = f; });

  /* ------------------------------------------------------------------ *
   * 2. 餐次定义
   * ------------------------------------------------------------------ */
  var MEALS = [
    { key: 'breakfast', name: '早餐', emoji: '🌅', range: [5, 10],  share: 0.25 },
    { key: 'lunch',     name: '午餐', emoji: '☀️', range: [10, 16], share: 0.35 },
    { key: 'dinner',    name: '晚餐', emoji: '🌆', range: [16, 21], share: 0.30 },
    { key: 'snack',     name: '加餐 / 夜宵', emoji: '🌙', range: [21, 29], share: 0.10 }
  ];

  function mealByHour(h) {
    for (var i = 0; i < MEALS.length; i++) {
      var r = MEALS[i].range;
      var hh = h < 5 ? h + 24 : h; // 0-4 点算夜宵
      if (hh >= r[0] && hh < r[1]) return MEALS[i];
    }
    return MEALS[0];
  }

  /* ------------------------------------------------------------------ *
   * 3. 目标 / 痛点 / 提醒方式 —— 与需求文档 1:1 对应
   * ------------------------------------------------------------------ */
  var GOAL_OPTIONS = [
    { key: 'diet',    emoji: '🥗', label: '控制饮食',     desc: '先把吃进去的东西看清楚' },
    { key: 'fat',     emoji: '🔥', label: '减少体脂',     desc: '在不挨饿的前提下慢慢降' },
    { key: 'habit',   emoji: '🌱', label: '养成健康习惯', desc: '让好的选择变成默认' },
    { key: 'sport',   emoji: '🏃', label: '规律运动',     desc: '每周动起来 3 次就够' }
  ];

  var TRIGGER_OPTIONS = [
    { key: 'milktea', emoji: '🧋', label: '奶茶',   tip: '舍友一喊就点单' },
    { key: 'snack',   emoji: '🍟', label: '零食',   tip: '写作业时嘴停不下来' },
    { key: 'takeout', emoji: '🍜', label: '外卖',   tip: '懒得去食堂就点重口味的' },
    { key: 'night',   emoji: '🌙', label: '夜宵',   tip: '十一点后特别饿' },
    { key: 'party',   emoji: '🍽', label: '聚餐',   tip: '一聚会就吃超' }
  ];

  var HARD_OPTIONS = [
    { key: 'diet',   emoji: '🥗', label: '饮食',     desc: '管住嘴' },
    { key: 'sport',  emoji: '🏃', label: '运动',     desc: '动起来' },
    { key: 'sleep',  emoji: '😴', label: '睡眠',     desc: '早点睡' },
    { key: 'record', emoji: '📝', label: '每日记录', desc: '坚持记' }
  ];

  var REMINDER_OPTIONS = [
    { key: 'gentle',   emoji: '🌱', label: '轻提醒',     desc: '每天 1～2 次，不打扰你', freq: '1～2 次 / 天' },
    { key: 'moderate', emoji: '⚡', label: '适度督促',   desc: '根据你的行为动态提醒',   freq: '动态触发' },
    { key: 'firm',     emoji: '🔔', label: '明确提醒',   desc: '连续偏离时会更积极一些', freq: '动态 + 连续偏离加频' }
  ];

  /* ------------------------------------------------------------------ *
   * 4. 每日任务模板（按用户痛点动态生成）
   * ------------------------------------------------------------------ */
  var TASK_LIBRARY = {
    record:  { key: 'record',  emoji: '📷', label: '记录今天吃的东西', note: '哪怕只记一顿也算' },
    water:   { key: 'water',   emoji: '💧', label: '喝够 8 杯水',      note: '奶茶不算水' },
    veg:     { key: 'veg',     emoji: '🥬', label: '吃一份蔬菜',        note: '食堂打菜加一份青菜' },
    protein: { key: 'protein', emoji: '🥚', label: '补充一份蛋白质',    note: '鸡蛋 / 鸡胸 / 酸奶' },
    walk:    { key: 'walk',    emoji: '🚶', label: '走够 6000 步',      note: '下课绕操场两圈' },
    sport:   { key: 'sport',   emoji: '🏃', label: '运动 20 分钟',      note: '跳绳、跑步、帕梅拉都算' },
    sleep:   { key: 'sleep',   emoji: '😴', label: '12 点前上床',       note: '熬夜最容易饿' },
    no_sugar:{ key: 'no_sugar',emoji: '🧋', label: '今天不喝含糖饮料',  note: '换成无糖茶或美式' },
    no_night:{ key: 'no_night',emoji: '🌙', label: '今天不吃夜宵',      note: '饿了先喝水，等 20 分钟' },
    no_snack:{ key: 'no_snack',emoji: '🍟', label: '今天不碰零食',      note: '把零食放到看不见的地方' },
    no_takeout:{key:'no_takeout',emoji:'🍜',label: '今天不点高油外卖',  note: '去食堂吃一次' },
    control: { key: 'control', emoji: '🍽', label: '聚餐也吃到七分饱',  note: '先夹菜再夹肉' }
  };

  /* ------------------------------------------------------------------ *
   * 5. 徽章
   * ------------------------------------------------------------------ */
  var BADGES = [
    { key: 'first',   emoji: '🌱', name: '第一步',   desc: '完成首次目标设置',       check: function (s) { return s.onboarded; } },
    { key: 'day1',    emoji: '✅', name: '完成一天', desc: '完成第一次每日打卡',     check: function (s) { return LM.store.stats(s).checkinDays >= 1; } },
    { key: 's3',      emoji: '🔥', name: '坚持 3 天', desc: '连续打卡 3 天',          check: function (s) { return LM.store.stats(s).bestStreak >= 3; } },
    { key: 's7',      emoji: '⭐', name: '一周不断', desc: '连续打卡 7 天',          check: function (s) { return LM.store.stats(s).bestStreak >= 7; } },
    { key: 's14',     emoji: '🏅', name: '两周不掉线', desc: '连续打卡 14 天',       check: function (s) { return LM.store.stats(s).bestStreak >= 14; } },
    { key: 's30',     emoji: '👑', name: '30 天约定达成', desc: '连续打卡 30 天',    check: function (s) { return LM.store.stats(s).bestStreak >= 30; } },
    { key: 'photo10', emoji: '📷', name: '记录 10 餐', desc: '累计记录 10 餐',        check: function (s) { return LM.store.stats(s).mealCount >= 10; } },
    { key: 'photo30', emoji: '🎬', name: '记录 30 餐', desc: '累计记录 30 餐',        check: function (s) { return LM.store.stats(s).mealCount >= 30; } },
    { key: 'comeback',emoji: '💪', name: '回来了',   desc: '中断后重新回到计划',     check: function (s) { return LM.store.stats(s).comebacks >= 1; } },
    { key: 'lowcal',  emoji: '🥗', name: '清淡一天', desc: '单日摄入控制在目标内',   check: function (s) { return LM.store.stats(s).goodDays >= 1; } },
    { key: 'lowcal7', emoji: '🧘', name: '清淡 7 天', desc: '累计 7 天控制在目标内', check: function (s) { return LM.store.stats(s).goodDays >= 7; } },
    { key: 'weight',  emoji: '📉', name: '真的在降', desc: '体重曲线下降 1kg 以上',  check: function (s) { return LM.store.stats(s).weightDelta <= -1; } }
  ];

  /* ------------------------------------------------------------------ *
   * 6. 温柔陪伴 / 坚定督促 —— 文案库
   *    原则：不批评，但指出问题；允许失败，但要求行动
   * ------------------------------------------------------------------ */
  var COPY = {
    greeting: {
      morning:   { text: '早上好', emoji: '☀️', sub: '今天也不用做到完美，完成今天该做的就很好。' },
      afternoon: { text: '下午好', emoji: '🌤️', sub: '今天也不用做到完美，完成今天该做的就很好。' },
      evening:   { text: '晚上好', emoji: '🌙', sub: '今天也不用做到完美，完成今天该做的就很好。' }
    },

    // 动态督促状态：等级 0～3
    nudge: {
      0: {
        level: '温柔陪伴', emoji: '🌿', tone: 'calm',
        head: '你这几天做得很稳',
        body: '计划在正常往前走，不用再给自己加码。'
      },
      1: {
        level: '温柔提醒', emoji: '🍃', tone: 'aware',
        head: '昨天稍微超了一点',
        body: '偶尔一次没关系。不是从零开始，是从昨天继续。'
      },
      2: {
        level: '明确督促', emoji: '⚡', tone: 'push',
        head: '这两天的摄入都偏高了',
        body: '我们不去追究原因，先做一件小事：把今天剩下来的选择做好。'
      },
      3: {
        level: '坚定干预', emoji: '🔔', tone: 'firm',
        head: '已经连续几天偏离计划了',
        body: '我知道坚持很难。但今天必须有一个动作——记录任意一餐，就算数。'
      }
    },

    // 失败恢复
    recover: {
      title: '昨天（{date}）没有完成记录，没关系。',
      body: '断一天不会毁掉 30 天。今天我们只做一件最小的事：把今天的第一餐记下来。',
      action: '好，从这一餐开始'
    },

    // 鼓励语（按连续天数）
    streak: [
      '今天开始了，就是好的一天。',
      '{n} 天了，你已经比大多数人走得远。',
      '连续 {n} 天，习惯正在长出来。',
      '连续 {n} 天。稳定比拼命更难，你做到了。',
      '连续 {n} 天，这已经不是「坚持」，是习惯了。'
    ]
  };

  /* ------------------------------------------------------------------ *
   * 7. 完成度 / 阶段成长文案（30 天分成 4 个阶段）
   * ------------------------------------------------------------------ */
  var STAGES = [
    { from: 0,  to: 7,  name: '适应期', emoji: '🌱', desc: '目标不是瘦，是「开始记录」。先让你看见自己每天吃了什么。' },
    { from: 7,  to: 14, name: '调整期', emoji: '🌿', desc: '开始替换：把最容易失控的那一项，换成一个更轻的选择。' },
    { from: 14, to: 21, name: '稳定期', emoji: '🌳', desc: '不需要靠意志力了，选择变成本能。允许偶尔放松。' },
    { from: 21, to: 30, name: '巩固期', emoji: '🏔️', desc: '把 30 天里的做法固定成你自己的节奏，然后继续。' }
  ];

  function stageOf(day) {
    for (var i = 0; i < STAGES.length; i++) {
      if (day < STAGES[i].to) return STAGES[i];
    }
    return STAGES[STAGES.length - 1];
  }

  /* ------------------------------------------------------------------ *
   * 8. 关键词 → 食物匹配（图片文件名 / 用户备注 命中时提升识别准确度）
   * ------------------------------------------------------------------ */
  var KEYWORDS = [
    { kw: ['奶茶', 'milk', 'tea', 'bubble'],      ids: ['zhenzhu_naicha', 'naicha'] },
    { kw: ['炸鸡', 'chicken', 'fried', 'kfc'],    ids: ['fried_chicken', 'jitui'] },
    { kw: ['汉堡', 'burger'],                     ids: ['hamburger', 'fries'] },
    { kw: ['薯条', 'fries'],                      ids: ['fries'] },
    { kw: ['披萨', 'pizza'],                      ids: ['pizza'] },
    { kw: ['面', 'noodle', 'ramen', '粉'],        ids: ['lamian', 'luosifen', 'mixian', 'paomian'] },
    { kw: ['饭', 'rice', '盖浇'],                 ids: ['rice', 'gaijiaofan', 'chaofan', 'huangmenji'] },
    { kw: ['沙拉', 'salad', '轻食'],              ids: ['shala', 'jixiong', 'qingcai'] },
    { kw: ['烧烤', 'bbq', '串', '夜宵'],          ids: ['shaokao', 'zhachuan', 'xiaolongxia'] },
    { kw: ['火锅', '麻辣', 'spicy', '香锅', '烫'], ids: ['xiangguo', 'malatang'] },
    { kw: ['零食', '薯片', 'snack', 'chip'],      ids: ['shupian', 'latiao', 'binggan'] },
    { kw: ['蛋糕', '甜', 'cake', 'dessert'],      ids: ['dangao', 'qiaokeli', 'bingqilin'] },
    { kw: ['咖啡', 'coffee', 'latte'],            ids: ['meishi', 'natie'] },
    { kw: ['水果', 'fruit', '苹果', '香蕉'],      ids: ['apple', 'banana'] },
    { kw: ['鸡蛋', 'egg', '早餐', 'breakfast'],   ids: ['jidan', 'chadan', 'doujiang', 'yanmai'] },
    { kw: ['食堂', 'canteen'],                    ids: ['rice', 'tomato_egg', 'qingcai', 'gongbao'] },
    { kw: ['外卖', 'takeout', 'delivery'],        ids: ['gaijiaofan', 'xiangguo', 'mixian'] }
  ];

  LM.data = {
    FOODS: FOODS,
    FOOD_MAP: FOOD_MAP,
    MEALS: MEALS,
    mealByHour: mealByHour,
    GOAL_OPTIONS: GOAL_OPTIONS,
    TRIGGER_OPTIONS: TRIGGER_OPTIONS,
    HARD_OPTIONS: HARD_OPTIONS,
    REMINDER_OPTIONS: REMINDER_OPTIONS,
    TASK_LIBRARY: TASK_LIBRARY,
    BADGES: BADGES,
    COPY: COPY,
    STAGES: STAGES,
    stageOf: stageOf,
    KEYWORDS: KEYWORDS
  };
})(window);
