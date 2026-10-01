/* 轻伴 LightMate — 页面四：AI 饮食分析
 * 上传 → 识别 → 热量估算 → 温柔而坚定的建议 → 确认记录
 */
(function (global) {
  'use strict';
  var LM = (global.LM = global.LM || {});
  var U = LM.util, D = LM.data, S = LM.store;

  // 页面级临时状态（切换页面不丢）
  var V = {
    mealKey: null,
    fileName: '',
    imgUrl: null,
    sampleEmoji: '',
    sampleTone: '',
    phase: 'idle',      // idle | ready | scanning | result
    scanStep: 0,
    items: [],
    result: null,
    seed: 0,
    search: '',
    editing: null       // 正在编辑的条目 index
  };

  var SAMPLES = [
    { key: 'milktea', emoji: '🧋', label: '奶茶', file: 'milktea-bubble-tea.jpg', tone: 'linear-gradient(135deg,#F6D9E6,#E7B4CC)' },
    { key: 'canteen', emoji: '🍚', label: '食堂', file: 'canteen-rice-lunch.jpg', tone: 'linear-gradient(135deg,#E7EEDA,#C9DCC0)' },
    { key: 'takeout', emoji: '🍗', label: '外卖', file: 'takeout-fried-chicken.jpg', tone: 'linear-gradient(135deg,#FBE6CF,#F0C79A)' },
    { key: 'night',   emoji: '🌙', label: '夜宵', file: 'night-snack-bbq.jpg', tone: 'linear-gradient(135deg,#DCE2F0,#B7C2DC)' },
    { key: 'salad',   emoji: '🥗', label: '轻食', file: 'salad-healthy-bowl.jpg', tone: 'linear-gradient(135deg,#DDF0E4,#AFDCC2)' }
  ];

  var SCAN_STEPS = [
    '正在识别图片内容…',
    '匹配食物数据库（62 种常见食物）…',
    '估算份量与热量…',
    '结合你的目标生成建议…'
  ];

  /* ================================================================== *
   * 渲染
   * ================================================================== */
  function render(root) {
    if (!V.mealKey) V.mealKey = D.mealByHour(new Date().getHours()).key;
    paint(root);
  }

  function paint(root) {
    var t = U.today();
    var goal = S.kcalGoal();
    var todayKcal = S.dayKcal(t);
    var d = S.get().logs[t];
    var meals = (d && d.meals) || [];
    root.innerHTML =
      '<div class="page-head">' +
        '<div class="row-between wrap gap-12">' +
          '<div>' +
            '<h1 class="page-title">📷 AI 饮食分析</h1>' +
            '<p class="page-sub">拍一张照片，轻伴帮你估算热量、指出问题，并给出一个能马上做的动作。</p>' +
          '</div>' +
          '<div class="row gap-8">' +
            '<span class="chip ' + (todayKcal > goal ? 'chip-bad' : 'chip-ok') + '">今日 ' + U.comma(todayKcal) + ' / ' + U.comma(goal) + ' kcal</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="grid grid-dash" style="gap:18px">' +
        '<div class="stack gap-16">' +
          mealPicker() +
          uploadCard() +
          resultCard() +
          flowCard() +
        '</div>' +
        '<div class="stack gap-16">' +
          todayCard(meals) +
          tipCard() +
        '</div>' +
      '</div>';

    bind(root);
  }

  /* ---------------------------- 餐次选择 ---------------------------- */
  function mealPicker() {
    return '<div class="card card-tight">' +
      '<div class="row-between wrap gap-12">' +
        '<div class="card-title"><span class="emoji">🕐</span>这是哪一餐？</div>' +
        '<div class="seg" id="meal-seg">' +
          D.MEALS.map(function (m) {
            return '<button data-meal="' + m.key + '" class="' + (V.mealKey === m.key ? 'on' : '') + '">' +
              m.emoji + ' ' + m.name + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 上传区 ---------------------------- */
  function uploadCard() {
    if (V.phase === 'idle') {
      return '<div class="card">' +
        '<div class="card-head">' +
          '<div class="card-title"><span class="emoji">🍱</span>上传餐食照片</div>' +
        '</div>' +
        '<div class="dropzone" id="drop">' +
          '<div class="dropzone-emoji">📸</div>' +
          '<div class="dropzone-title">点击上传 / 拖拽图片到这里</div>' +
          '<div class="dropzone-sub">支持拍照、相册选图；也可以直接用下面的示例图片体验（不会上传，不联网）</div>' +
          '<input type="file" accept="image/*" id="file" class="hide">' +
        '</div>' +
        '<div class="row gap-8 wrap mt-12">' +
          '<span class="tiny muted">示例：</span>' +
          SAMPLES.map(function (s) {
            return '<button class="chip chip-outline" data-sample="' + s.key + '">' + s.emoji + ' ' + s.label + '</button>';
          }).join('') +
        '</div>' +
      '</div>';
    }

    // 已识别：收起成一条，把宽度让给结果列表
    if (V.phase === 'result') {
      return '<div class="card card-tight">' +
        '<div class="row gap-12 wrap">' +
          thumb() +
          '<div class="grow" style="min-width:160px">' +
            '<div class="small"><b>已识别 ' + V.items.length + ' 项食物</b></div>' +
            '<div class="tiny muted">' + U.esc(V.fileName || '示例图片') + ' · ' + mealName() + '</div>' +
          '</div>' +
          '<div class="row gap-8">' +
            '<button class="btn btn-ghost btn-sm" id="rescan">🔄 重新识别</button>' +
            '<button class="btn btn-ghost btn-sm" id="reset-photo">换一张</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    // ready / scanning
    var inner = V.phase === 'scanning'
      ? '<div class="analyzing" id="scan-steps">' +
          SCAN_STEPS.map(function (txt, i) {
            var cls = i < V.scanStep ? 'done' : (i === V.scanStep ? 'active' : '');
            return '<div class="analyzing-step ' + cls + '"><span class="step-dot">' + (i < V.scanStep ? '✓' : '') + '</span>' + txt + '</div>';
          }).join('') +
          '<div class="tiny muted mt-8">正在分析…</div>' +
        '</div>'
      : '<div class="row gap-12 wrap">' +
          '<div class="grow" style="min-width:180px">' +
            '<div class="label">已选择图片</div>' +
            '<div class="small muted">' + U.esc(V.fileName || '未命名图片') + '</div>' +
          '</div>' +
          '<button class="btn btn-primary btn-lg" id="scan-btn">✨ 开始 AI 识别</button>' +
        '</div>';

    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">🍱</span>上传餐食照片</div>' +
        '<button class="btn btn-ghost btn-sm" id="reset-photo">换一张</button>' +
      '</div>' +
      '<div class="preview ' + (V.phase === 'scanning' ? 'scan' : '') + '" style="max-height:250px;' +
        (V.imgUrl ? '' : 'background:' + (V.sampleTone || 'var(--bg-2)')) + '">' +
        (V.imgUrl ? '<img src="' + V.imgUrl + '" alt="餐食照片">' : '<span class="preview-ph">' + (V.sampleEmoji || '🍽') + '</span>') +
      '</div>' +
      '<div class="mt-16">' + inner + '</div>' +
    '</div>';
  }

  function thumb() {
    if (V.imgUrl) return '<span class="thumb"><img src="' + V.imgUrl + '" alt=""></span>';
    return '<span class="thumb" style="' + (V.sampleTone ? 'background:' + V.sampleTone : '') + '">' +
      (V.sampleEmoji || '🍽') + '</span>';
  }

  function mealName() {
    var m = D.MEALS.filter(function (x) { return x.key === V.mealKey; })[0] || D.MEALS[1];
    return m.name;
  }

  /* ---------------------------- 识别结果 ---------------------------- */
  function resultCard() {
    if (V.phase !== 'result') return '';
    var r = V.result || { total: 0, confidence: 0 };
    var goal = S.kcalGoal();
    var mealShare = (D.MEALS.filter(function (m) { return m.key === V.mealKey; })[0] || D.MEALS[1]).share;
    var budget = Math.round(goal * mealShare);

    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">🔍</span>识别结果</div>' +
        '<div class="row gap-6 wrap">' +
          '<span class="chip chip-info">置信度 ' + Math.round((r.confidence || 0) * 100) + '%</span>' +
          '<span class="chip ' + (r.total > budget ? 'chip-warn' : 'chip-ok') + '">本餐 ' + U.comma(r.total) + ' / ' + U.comma(budget) + ' kcal</span>' +
        '</div>' +
      '</div>' +
      '<div class="stack gap-8">' +
        V.items.map(function (it, i) { return itemRow(it, i); }).join('') +
      '</div>' +
      '<div class="row gap-8 wrap mt-16">' +
        '<button class="btn btn-soft btn-sm" id="add-more">＋ 手动添加食物</button>' +
        '<span class="tiny muted">份量可以直接改，改完建议会自动更新。</span>' +
      '</div>' +
      (V.editing === 'add' ? addFoodPanel() : '') +
    '</div>';
  }

  function itemRow(it, i) {
    var isEditing = V.editing === i;
    return '<div class="food-row" style="gap:8px">' +
      '<span class="food-emoji">' + it.emoji + '</span>' +
      '<span class="grow" style="min-width:0">' +
        '<div class="row gap-6 wrap"><span class="food-name">' + U.esc(it.name) + '</span>' +
          '<span class="food-unit">1' + it.unit + ' ≈ ' + it.kcal + ' kcal</span></div>' +
        '<div class="row gap-6 mt-4 wrap">' +
          (it.tags || []).slice(0, 3).map(function (tag) {
            var cls = tag === '高油' ? 'tag-oil' : tag === '低卡' ? 'tag-good' : tag === '高蛋白' ? 'tag-protein' : '';
            return '<span class="tag ' + cls + '">' + tag + '</span>';
          }).join('') +
          (it.confidence ? '<span class="tag">置信 ' + Math.round(it.confidence * 100) + '%</span>' : '') +
        '</div>' +
      '</span>' +
      '<span class="stepper">' +
        '<button data-dec="' + i + '">−</button>' +
        '<span>' + it.portion + it.unit + '</span>' +
        '<button data-inc="' + i + '">＋</button>' +
      '</span>' +
      '<b class="food-kcal num" style="min-width:56px;text-align:right">' + U.comma(it.kcal * it.portion) + '</b>' +
      '<button class="btn btn-icon btn-ghost" data-del="' + i + '" title="删除">✕</button>' +
    '</div>';
  }

  function addFoodPanel() {
    var q = V.search.trim();
    var list = q ? D.FOODS.filter(function (f) {
      return f.name.indexOf(q) >= 0 || f.cat.indexOf(q) >= 0 ||
        (f.tags || []).some(function (t) { return t.indexOf(q) >= 0; });
    }).slice(0, 12) : D.FOODS.slice(0, 12);

    return '<div class="card card-tight" style="background:var(--mint-50);border-color:var(--mint-200)">' +
      '<div class="row gap-8 mb-12">' +
        '<input class="input" id="food-search" placeholder="搜索食物，例如：奶茶 / 米饭 / 炸鸡" value="' + U.esc(V.search) + '">' +
        '<button class="btn btn-ghost btn-sm" id="add-close">收起</button>' +
      '</div>' +
      '<div class="row gap-8 wrap">' +
        list.map(function (f) {
          return '<button class="chip chip-outline" data-add="' + f.id + '">' + f.emoji + ' ' + f.name +
            ' <span class="muted">' + f.kcal + '</span></button>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 流程卡（建议 + 确认） ---------------------------- */
  function flowCard() {
    if (V.phase !== 'result') return '';
    var adv = LM.advice.analyzeMeal(V.items, V.mealKey, U.today(), { alreadyLogged: false });
    V.lastAdvice = adv;

    return '<div class="advice">' +
      '<div class="advice-head tone-' + adv.tone + '">' +
        '<div class="row-between wrap gap-8">' +
          '<div class="advice-title">🤖 ' + U.esc(adv.head) + '</div>' +
          '<span class="chip ' + (adv.overToday ? 'chip-bad' : 'chip-ok') + '">' +
            (adv.overToday ? '今日超出 ' + U.comma(adv.todayTotal - adv.goal) : '今日剩余 ' + U.comma(adv.remaining)) + ' kcal</span>' +
        '</div>' +
      '</div>' +
      '<div class="advice-body">' +
        adv.lines.map(function (l) {
          var mark = l.type === 'ok' ? '✓' : l.type === 'issue' ? '!' : '—';
          return '<div class="advice-line ' + l.type + '"><span class="mark">' + mark + '</span><span>' + U.esc(l.text) + '</span></div>';
        }).join('') +
        '<div class="advice-act"><span class="mark">→</span><span>接下来做这一件事：<b>' + U.esc(adv.action) + '</b></span></div>' +
        '<div class="row gap-8 wrap mt-8">' +
          '<button class="btn btn-primary btn-lg" id="confirm-meal">✓ 确认记录这一餐</button>' +
          '<button class="btn btn-ghost btn-lg" id="discard-meal">不记了</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 今日已记录 ---------------------------- */
  function todayCard(meals) {
    var t = U.today();
    var inner;
    if (!meals.length) {
      inner = '<div class="empty" style="padding:26px 12px"><div class="empty-emoji">🍽</div>' +
        '<div class="empty-desc">今天还没有记录任何一餐。</div></div>';
    } else {
      inner = '<div class="stack gap-8">' + meals.map(function (m) {
        var meta = D.MEALS.filter(function (x) { return x.key === m.mealKey; })[0] || D.MEALS[1];
        return '<div class="log-item">' +
          '<span style="font-size:18px">' + meta.emoji + '</span>' +
          '<span class="grow" style="min-width:0">' +
            '<div class="small"><b>' + meta.name + '</b> <span class="tiny muted">' + U.esc(m.time || '') + '</span></div>' +
            '<div class="tiny muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
              m.items.map(function (i) { return i.emoji + i.name; }).join(' · ') + '</div>' +
          '</span>' +
          '<b class="small num">' + U.comma(S.mealKcal(m)) + '</b>' +
          '<button class="btn btn-icon btn-ghost" data-del-meal="' + m.id + '" title="删除">✕</button>' +
        '</div>';
      }).join('') + '</div>';
    }
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">📋</span>今天已记录</div>' +
        '<span class="card-note">' + meals.length + ' 餐 · ' + U.comma(S.dayKcal(t)) + ' kcal</span>' +
      '</div>' + inner +
    '</div>';
  }

  function tipCard() {
    var s = S.get();
    var tips = {
      milktea: '你选了「最容易控制不住：奶茶」。识别时我们会特别留意含糖饮料，并在建议里给你替换方案。',
      snack: '你选了「最容易控制不住：零食」。建议把零食从桌面上收进柜子——看不见就不太会想起来。',
      takeout: '你选了「最容易控制不住：外卖」。点单前先看一眼热量，往往就能换一个更轻的选项。',
      night: '你选了「最容易控制不住：夜宵」。晚上 21 点后吃进去的东西，基本不会在睡前消耗掉。',
      party: '你选了「最容易控制不住：聚餐」。原则很简单：先夹菜，再夹肉，七分饱就停。'
    };
    var lines = s.user.triggers.map(function (k) { return tips[k]; }).filter(Boolean);
    return '<div class="card">' +
      '<div class="card-title mb-12"><span class="emoji">🌿</span>轻伴的提醒</div>' +
      '<div class="stack gap-10 small muted">' +
        (lines.length ? lines.map(function (l) { return '<div class="advice-line"><span class="mark">·</span><span>' + U.esc(l) + '</span></div>'; }).join('')
          : '<div class="advice-line"><span class="mark">·</span><span>先在「我的计划」里设置你最容易被诱惑的几项，轻伴的提醒会更准。</span></div>') +
      '</div>' +
    '</div>';
  }

  /* ================================================================== *
   * 交互
   * ================================================================== */
  function bind(root) {
    // 餐次
    U.$$('#meal-seg button', root).forEach(function (b) {
      b.addEventListener('click', function () {
        V.mealKey = b.getAttribute('data-meal');
        repaint(root);
      });
    });

    // 上传
    var drop = U.$('#drop', root);
    var file = U.$('#file', root);
    if (drop && file) {
      drop.addEventListener('click', function () { file.click(); });
      drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
      drop.addEventListener('dragleave', function () { drop.classList.remove('over'); });
      drop.addEventListener('drop', function (e) {
        e.preventDefault(); drop.classList.remove('over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0], root);
      });
      file.addEventListener('change', function () {
        if (file.files && file.files[0]) handleFile(file.files[0], root);
      });
    }

    // 示例图片
    U.$$('[data-sample]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var s = SAMPLES.filter(function (x) { return x.key === b.getAttribute('data-sample'); })[0];
        if (!s) return;
        V.fileName = s.file; V.imgUrl = null; V.sampleEmoji = s.emoji; V.sampleTone = s.tone;
        V.phase = 'ready'; V.items = []; V.result = null; V.editing = null;
        repaint(root);
      });
    });

    var reset = U.$('#reset-photo', root);
    if (reset) reset.addEventListener('click', function () {
      V.phase = 'idle'; V.fileName = ''; V.imgUrl = null; V.sampleEmoji = ''; V.sampleTone = '';
      V.items = []; V.result = null; V.editing = null; V.scanStep = 0;
      repaint(root);
    });

    var scanBtn = U.$('#scan-btn', root);
    if (scanBtn) scanBtn.addEventListener('click', function () { startScan(root); });

    var rescan = U.$('#rescan', root);
    if (rescan) rescan.addEventListener('click', function () { startScan(root, true); });

    // 份量调整
    U.$$('[data-inc]', root).forEach(function (b) {
      b.addEventListener('click', function () { bump(+b.getAttribute('data-inc'), +0.5, root); });
    });
    U.$$('[data-dec]', root).forEach(function (b) {
      b.addEventListener('click', function () { bump(+b.getAttribute('data-dec'), -0.5, root); });
    });
    U.$$('[data-del]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        V.items.splice(+b.getAttribute('data-del'), 1);
        if (!V.items.length) { V.phase = 'ready'; }
        recount(); repaint(root);
      });
    });

    // 手动添加
    var addMore = U.$('#add-more', root);
    if (addMore) addMore.addEventListener('click', function () { V.editing = 'add'; repaint(root); });
    var addClose = U.$('#add-close', root);
    if (addClose) addClose.addEventListener('click', function () { V.editing = null; repaint(root); });
    var search = U.$('#food-search', root);
    if (search) {
      search.addEventListener('input', function () {
        V.search = search.value;
        var panel = search.closest('.card');
        var list = panel.querySelector('.row.wrap');
        list.innerHTML = filteredFoods().map(function (f) {
          return '<button class="chip chip-outline" data-add="' + f.id + '">' + f.emoji + ' ' + f.name +
            ' <span class="muted">' + f.kcal + '</span></button>';
        }).join('');
        U.$$('[data-add]', list).forEach(function (b) {
          b.addEventListener('click', function () { addFood(b.getAttribute('data-add'), root); });
        });
      });
    }
    U.$$('[data-add]', root).forEach(function (b) {
      b.addEventListener('click', function () { addFood(b.getAttribute('data-add'), root); });
    });

    // 确认 / 放弃
    var confirm = U.$('#confirm-meal', root);
    if (confirm) confirm.addEventListener('click', function () { confirmMeal(root); });
    var discard = U.$('#discard-meal', root);
    if (discard) discard.addEventListener('click', function () {
      V.phase = 'idle'; V.items = []; V.result = null; V.imgUrl = null; V.sampleEmoji = '';
      U.toast('这次没有记录。想记的时候随时来 🌿', 'warn');
      repaint(root);
    });

    // 删除已记录
    U.$$('[data-del-meal]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        S.removeMeal(b.getAttribute('data-del-meal'));
        U.toast('已删除这一餐', 'warn');
        LM.app.render();
      });
    });
  }

  function filteredFoods() {
    var q = V.search.trim();
    if (!q) return D.FOODS.slice(0, 12);
    return D.FOODS.filter(function (f) {
      return f.name.indexOf(q) >= 0 || f.cat.indexOf(q) >= 0 ||
        (f.tags || []).some(function (t) { return t.indexOf(q) >= 0; });
    }).slice(0, 12);
  }

  function repaint(root) { paint(root || document.getElementById('view')); }

  function handleFile(f, root) {
    if (!f.type || f.type.indexOf('image') !== 0) { U.toast('请选择图片文件', 'bad'); return; }
    V.fileName = f.name;
    V.sampleEmoji = ''; V.sampleTone = '';
    var reader = new FileReader();
    reader.onload = function () {
      V.imgUrl = reader.result;
      V.phase = 'ready';
      repaint(root);
    };
    reader.readAsDataURL(f);
  }

  function bump(i, delta, root) {
    var it = V.items[i];
    if (!it) return;
    it.portion = Math.max(0.5, Math.min(8, +((it.portion || 1) + delta).toFixed(1)));
    recount();
    repaint(root);
  }

  function addFood(fid, root) {
    var f = D.FOOD_MAP[fid];
    if (!f) return;
    V.items.push({
      fid: f.id, name: f.name, emoji: f.emoji, unit: f.unit, kcal: f.kcal,
      portion: f.portion || 1, grams: Math.round(f.kcal * 1.6), confidence: 1, tags: f.tags || [], cat: f.cat
    });
    recount();
    U.toast('已加入：' + f.emoji + f.name, 'ok');
    repaint(root);
  }

  function recount() {
    var total = V.items.reduce(function (s, it) { return s + it.kcal * it.portion; }, 0);
    V.result = Object.assign({}, V.result || {}, {
      total: Math.round(total),
      items: V.items
    });
  }

  function startScan(root, rescan) {
    if (rescan) { V.seed++; V.items = []; V.result = null; }
    V.phase = 'scanning';
    V.scanStep = 0;
    repaint(root);

    var step = 0;
    var timer = setInterval(function () {
      step++;
      V.scanStep = step;
      var box = document.querySelector('#scan-steps');
      if (box) {
        U.$$('.analyzing-step', box).forEach(function (n, i) {
          n.className = 'analyzing-step ' + (i < step ? 'done' : i === step ? 'active' : '');
          var dot = n.querySelector('.step-dot');
          if (dot) dot.textContent = i < step ? '✓' : '';
        });
      }
      if (step >= SCAN_STEPS.length - 1) {
        clearInterval(timer);
        setTimeout(function () {
          var r = LM.advice.recognize(V.fileName, V.mealKey, (V.fileName || 'x') + '#' + V.seed);
          V.items = r.items;
          V.result = r;
          V.phase = 'result';
          repaint(root);
          U.toast('识别完成，共 ' + U.comma(r.total) + ' kcal', 'ok');
        }, 520);
      }
    }, 340);
  }

  function confirmMeal(root) {
    if (!V.items.length) { U.toast('还没有识别到食物', 'bad'); return; }
    S.addMeal({
      mealKey: V.mealKey,
      time: U.nowTime(),
      items: V.items.map(function (it) { return Object.assign({}, it); }),
      source: 'ai',
      photo: V.imgUrl ? 'uploaded' : (V.fileName || null)
    });
    var adv = LM.advice.analyzeMeal(V.items, V.mealKey, U.today(), { alreadyLogged: true });
    V.phase = 'idle'; V.items = []; V.result = null; V.imgUrl = null; V.sampleEmoji = ''; V.sampleTone = '';
    U.toast('已记录这一餐 ✓ 今天还剩 ' + (adv.remaining > 0 ? U.comma(adv.remaining) + ' kcal' : '0 kcal（已达标）'), 'ok');
    LM.app.render();
  }

  function reset() {
    V.items = []; V.result = null; V.phase = 'idle'; V.imgUrl = null;
    V.sampleEmoji = ''; V.sampleTone = ''; V.fileName = ''; V.editing = null;
  }

  LM.views = LM.views || {};
  LM.views.diet = { render: render, reset: reset };
})(window);
