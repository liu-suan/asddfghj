/* 轻伴 LightMate — 页面七：我的计划（目标 / 提醒方式 / 数据管理） */
(function (global) {
  'use strict';
  var LM = (global.LM = global.LM || {});
  var U = LM.util, D = LM.data, S = LM.store;

  function render(root) {
    var s = S.get();
    var st = S.stats();
    var goal = S.kcalGoal();
    var auto = S.autoKcalGoal();

    root.innerHTML =
      '<div class="page-head">' +
        '<div class="row-between wrap gap-12">' +
          '<div>' +
            '<h1 class="page-title">🌱 我的计划</h1>' +
            '<p class="page-sub">这里的每一项都能改。计划是给你用的，不是用来要求你的。</p>' +
          '</div>' +
          '<span class="chip chip-info">' + U.fmtMD(s.plan.startDate) + ' 开始 · 第 ' + st.dayIndex + ' / ' + s.plan.targetDays + ' 天</span>' +
        '</div>' +
      '</div>' +

      '<div class="grid grid-dash" style="gap:18px">' +
        '<div class="stack gap-16">' +
          commitmentCard(s) +
          goalCard(s) +
          triggerCard(s) +
          hardCard(s) +
        '</div>' +
        '<div class="stack gap-16">' +
          reminderCard(s) +
          bodyCard(s, goal, auto) +
          manageCard(s, st) +
          aboutCard() +
        '</div>' +
      '</div>';

    bind(root);
  }

  /* ---------------------------- 30 天约定 ---------------------------- */
  function commitmentCard(s) {
    return '<div class="card" style="background:linear-gradient(135deg,var(--mint-50),#fff);border-color:var(--mint-200)">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">🤝</span>我的 30 天约定</div>' +
        '<span class="card-note">首页会显示这句话</span>' +
      '</div>' +
      '<div class="field">' +
        '<textarea class="textarea" id="commit-input" style="background:#fff">' + U.esc(s.user.commitment || '') + '</textarea>' +
      '</div>' +
      '<div class="row-between mt-12 wrap gap-12">' +
        '<span class="tiny muted" id="commit-hint">改完自动保存</span>' +
        '<button class="btn btn-ghost btn-sm" id="commit-reset">恢复默认文案</button>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 目标 ---------------------------- */
  function goalCard(s) {
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">🎯</span>我的主要目标</div>' +
        '<span class="card-note">可多选</span>' +
      '</div>' +
      '<div class="option-grid">' +
        D.GOAL_OPTIONS.map(function (o) {
          var on = s.user.goals.indexOf(o.key) >= 0;
          return '<button class="opt' + (on ? ' on' : '') + '" data-goal="' + o.key + '">' +
            '<span class="opt-emoji">' + o.emoji + '</span>' +
            '<span class="opt-body"><span class="opt-label">' + o.label + '</span>' +
              '<span class="opt-desc">' + o.desc + '</span></span>' +
            '<span class="opt-check">✓</span>' +
          '</button>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 最容易失控 ---------------------------- */
  function triggerCard(s) {
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">⚠️</span>最容易控制不住什么</div>' +
        '<span class="card-note">影响任务清单和提醒内容</span>' +
      '</div>' +
      '<div class="row gap-8 wrap">' +
        D.TRIGGER_OPTIONS.map(function (o) {
          var on = s.user.triggers.indexOf(o.key) >= 0;
          return '<button class="chip ' + (on ? 'chip-warn' : 'chip-outline') + '" data-trigger="' + o.key + '">' +
            o.emoji + ' ' + o.label + (on ? ' ✓' : '') + '</button>';
        }).join('') +
      '</div>' +
      '<div class="tiny muted mt-12">' + triggerTip(s) + '</div>' +
    '</div>';
  }

  function triggerTip(s) {
    var m = {
      milktea: '奶茶：一杯全糖珍珠奶茶 ≈ 一顿正餐。替代方案优先准备无糖茶。',
      snack: '零食：热量密度高、饱腹感低。物理隔离（收进柜子）比意志力有效。',
      takeout: '外卖：点单前先看热量，多数时候会自动选轻一点的。',
      night: '夜宵：21 点后吃的东西基本不会在睡前消耗掉，先喝水等 20 分钟。',
      party: '聚餐：先夹菜再夹肉，七分饱就停。'
    };
    var arr = s.user.triggers.map(function (k) { return m[k]; }).filter(Boolean);
    return arr.length ? arr[0] : '还没有选择。选中后，每日任务会自动针对这几项生成。';
  }

  /* ---------------------------- 最难坚持 ---------------------------- */
  function hardCard(s) {
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">🧗</span>最难坚持什么</div>' +
        '<span class="card-note">越难的地方，任务拆得越小</span>' +
      '</div>' +
      '<div class="option-grid">' +
        D.HARD_OPTIONS.map(function (o) {
          var on = s.user.hardParts.indexOf(o.key) >= 0;
          return '<button class="opt' + (on ? ' on' : '') + '" data-hard="' + o.key + '">' +
            '<span class="opt-emoji">' + o.emoji + '</span>' +
            '<span class="opt-body"><span class="opt-label">' + o.label + '</span>' +
              '<span class="opt-desc">' + o.desc + '</span></span>' +
            '<span class="opt-check">✓</span>' +
          '</button>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 提醒方式 ---------------------------- */
  function reminderCard(s) {
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">🔔</span>提醒方式</div>' +
      '</div>' +
      '<div class="stack gap-8">' +
        D.REMINDER_OPTIONS.map(function (o) {
          var on = s.user.reminder === o.key;
          return '<button class="opt' + (on ? ' on' : '') + '" data-reminder="' + o.key + '">' +
            '<span class="opt-emoji">' + o.emoji + '</span>' +
            '<span class="opt-body"><span class="opt-label">' + o.label + '</span>' +
              '<span class="opt-desc">' + o.desc + '（' + o.freq + '）</span></span>' +
            '<span class="opt-check">✓</span>' +
          '</button>';
        }).join('') +
      '</div>' +
      '<div class="advice-act mt-12"><span class="mark">🌿</span><span class="small">' +
        '产品人格是固定的：<b>温柔 + 坚定</b>。这里只影响提醒的频率和强度，不会改变说话的方式。</span></div>' +
    '</div>';
  }

  /* ---------------------------- 身体数据 / 热量目标 ---------------------------- */
  function bodyCard(s, goal, auto) {
    var b = s.body;
    var fields = [
      ['身高', 'height', 'cm', 140, 200, 1],
      ['当前体重', 'weight', 'kg', 35, 150, 0.1],
      ['目标体重', 'targetWeight', 'kg', 35, 150, 0.1],
      ['年龄', 'age', '岁', 16, 40, 1]
    ];
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">📐</span>基础信息与热量目标</div>' +
      '</div>' +
      '<div class="row-between wrap gap-12 mb-12">' +
        '<div class="seg" id="gender-seg">' +
          '<button data-gender="female" class="' + (b.gender === 'female' ? 'on' : '') + '">女生</button>' +
          '<button data-gender="male" class="' + (b.gender === 'male' ? 'on' : '') + '">男生</button>' +
        '</div>' +
        '<div class="seg" id="act-seg">' +
          [['low', '很少动'], ['light', '偶尔运动'], ['mid', '经常运动'], ['high', '每天训练']].map(function (x) {
            return '<button data-act="' + x[0] + '" class="' + (b.activity === x[0] ? 'on' : '') + '">' + x[1] + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="grid grid-2 mb-16">' +
        fields.map(function (f) {
          return '<div class="field"><label class="label">' + f[0] + '（' + f[2] + '）</label>' +
            '<input class="input" type="number" data-body="' + f[1] + '" step="' + f[5] + '" min="' + f[3] + '" max="' + f[4] + '" value="' + b[f[1]] + '"></div>';
        }).join('') +
      '</div>' +
      '<div class="card card-tight card-flat" style="background:var(--mint-50);border-color:var(--mint-200)">' +
        '<div class="row-between wrap gap-12">' +
          '<div><div class="stat-label">每日热量目标</div>' +
            '<div class="stat-value" style="font-size:24px" id="goal-view">' + U.comma(goal) + '<small>kcal</small></div>' +
            '<div class="tiny muted" id="goal-note">' +
              (s.plan.kcalGoal ? '当前为手动设置，自动计算结果为 ' + U.comma(auto) + ' kcal' : '自动估算（温和缺口 400 kcal，不低于安全下限）') +
            '</div>' +
          '</div>' +
          '<div class="stack gap-8" style="min-width:190px">' +
            '<div class="row gap-8">' +
              '<input class="input" type="number" id="goal-input" step="10" min="800" max="4000" placeholder="手动设置" value="' + (s.plan.kcalGoal || '') + '">' +
              '<button class="btn btn-ghost btn-sm" id="goal-auto">自动</button>' +
            '</div>' +
            '<button class="btn btn-soft btn-sm" id="goal-apply">应用手动目标</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 计划管理 ---------------------------- */
  function manageCard(s, st) {
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">⚙️</span>计划与数据</div>' +
        '<span class="card-note">演示工具</span>' +
      '</div>' +
      '<div class="stack gap-8">' +
        row('🔄', '重新开始 30 天', '把计划起点设为今天，历史记录保留', 'reset-plan', 'btn-ghost') +
        row('🎬', '载入 18 天演示数据', '一键生成完整历史，适合项目展示', 'seed-demo', 'btn-soft') +
        row('⬇️', '导出我的数据', '下载 JSON 备份（' + st.totalLoggedDays + ' 天记录）', 'export-data', 'btn-ghost') +
        row('⬆️', '导入数据', '从 JSON 备份恢复', 'import-data', 'btn-ghost') +
        row('🗑', '清空所有数据', '删除本机保存的全部记录，不可恢复', 'clear-data', 'btn-danger-soft') +
      '</div>' +
      '<input type="file" accept="application/json,.json" id="import-file" class="hide">' +
      '<div class="tiny muted mt-12">数据只保存在这台设备的浏览器本地（localStorage），不会上传到任何服务器。</div>' +
    '</div>';
  }

  function row(emoji, title, desc, id, kind) {
    return '<button class="log-item" style="width:100%;text-align:left" id="' + id + '">' +
      '<span style="font-size:18px">' + emoji + '</span>' +
      '<span class="grow"><span class="small" style="font-weight:700">' + title + '</span>' +
        '<div class="tiny muted">' + desc + '</div></span>' +
      '<span class="btn ' + kind + ' btn-sm" style="pointer-events:none">执行</span>' +
    '</button>';
  }

  /* ---------------------------- 关于产品 ---------------------------- */
  function aboutCard() {
    return '<div class="card">' +
      '<div class="card-title mb-12"><span class="emoji">📖</span>关于轻伴</div>' +
      '<div class="stack gap-10 small muted">' +
        '<div><b class="ink">它不是</b>：卡路里计算器、减肥打卡工具、体重记录工具，或者一个只会聊天的 AI。</div>' +
        '<div><b class="ink">它是</b>：AI 饮食识别 + 每日目标 + 行为打卡 + 动态提醒 + 长期成长反馈。</div>' +
        '<div class="advice-act" style="margin-top:4px"><span class="mark">🌿</span><span>' +
          '温柔是沟通方式，严格是行为底线。<br>不要求你完美，但一定要求你有行动。</span></div>' +
      '</div>' +
    '</div>';
  }

  /* ================================================================== *
   * 交互
   * ================================================================== */
  function bind(root) {
    // —— 约定（静默保存，不重绘，保持焦点）
    var commit = U.$('#commit-input', root);
    if (commit) commit.addEventListener('input', function () {
      S.get().user.commitment = commit.value;
      S.save(true);
      var hint = U.$('#commit-hint', root);
      if (hint) hint.textContent = '已保存 ✓';
    });
    var cReset = U.$('#commit-reset', root);
    if (cReset) cReset.addEventListener('click', function () {
      S.get().user.commitment = '接下来的 30 天，我会认真对待自己的每一次选择。';
      S.save();
      U.toast('已恢复默认文案', 'ok');
    });

    // —— 目标 / 痛点 / 难点（点击即保存并重绘）
    U.$$('[data-goal]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        toggleIn(S.get().user.goals, b.getAttribute('data-goal'));
        S.save();
        U.toast('目标已更新，每日任务会跟着调整 🌱', 'ok');
      });
    });
    U.$$('[data-trigger]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        toggleIn(S.get().user.triggers, b.getAttribute('data-trigger'));
        S.save();
      });
    });
    U.$$('[data-hard]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        toggleIn(S.get().user.hardParts, b.getAttribute('data-hard'));
        S.save();
      });
    });

    // —— 提醒方式
    U.$$('[data-reminder]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        S.get().user.reminder = b.getAttribute('data-reminder');
        S.save();
        U.toast('提醒方式已更新', 'ok');
      });
    });

    // —— 性别 / 活动量
    U.$$('[data-gender]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        S.get().body.gender = b.getAttribute('data-gender');
        S.save();
      });
    });
    U.$$('[data-act]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        S.get().body.activity = b.getAttribute('data-act');
        S.save();
      });
    });

    // —— 身体数据（静默保存 + 局部刷新热量目标）
    U.$$('[data-body]', root).forEach(function (inp) {
      inp.addEventListener('input', function () {
        var v = Number(inp.value);
        if (!v) return;
        S.get().body[inp.getAttribute('data-body')] = v;
        S.save(true);
        refreshGoal(root);
      });
    });

    // —— 热量目标
    var gAuto = U.$('#goal-auto', root);
    if (gAuto) gAuto.addEventListener('click', function () {
      S.get().plan.kcalGoal = null;
      S.save();
      U.toast('已切换为自动估算：' + U.comma(S.autoKcalGoal()) + ' kcal', 'ok');
    });
    var gApply = U.$('#goal-apply', root);
    if (gApply) gApply.addEventListener('click', function () {
      var inp = U.$('#goal-input', root);
      var v = Number(inp.value);
      if (!v || v < 800 || v > 4000) { U.toast('请输入 800～4000 之间的数值', 'bad'); return; }
      S.get().plan.kcalGoal = v;
      S.save();
      U.toast('每日热量目标已设为 ' + U.comma(v) + ' kcal', 'ok');
    });

    // —— 计划管理
    var rp = U.$('#reset-plan', root);
    if (rp) rp.addEventListener('click', function () {
      U.modal({
        title: '重新开始 30 天？',
        body: '<p>计划起点会设为今天，之前的历史记录会保留在成长页里。</p>',
        actions: [
          { label: '取消', kind: 'btn-ghost' },
          { label: '确定重新开始', kind: 'btn-primary', onClick: function () {
            S.restartPlan(30);
            S.setCheckin(false, U.today());
            U.toast('新的 30 天从今天开始 🌱', 'ok');
            LM.app.render();
          } }
        ]
      });
    });

    var sd = U.$('#seed-demo', root);
    if (sd) sd.addEventListener('click', function () {
      U.modal({
        title: '载入演示数据？',
        body: '<p>会生成 18 天的完整历史（含一次 3 天中断），用于展示成长曲线、热力图、动态督促与失败恢复。</p>' +
              '<p class="mt-8 muted small">当前数据会被覆盖，建议先导出备份。</p>',
        actions: [
          { label: '取消', kind: 'btn-ghost' },
          { label: '载入演示数据', kind: 'btn-primary', onClick: function () {
            S.seedDemo();
            U.toast('演示数据已载入：18 天记录 + 1 次中断恢复', 'ok');
            location.hash = '#/today';
            LM.app.render();
          } }
        ]
      });
    });

    var ed = U.$('#export-data', root);
    if (ed) ed.addEventListener('click', function () {
      var blob = new Blob([S.exportJSON()], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'lightmate-data-' + U.today() + '.json';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 300);
      U.toast('数据已导出', 'ok');
    });

    var impFile = U.$('#import-file', root);
    var im = U.$('#import-data', root);
    if (im && impFile) {
      im.addEventListener('click', function () { impFile.click(); });
      impFile.addEventListener('change', function () {
        if (!impFile.files || !impFile.files[0]) return;
        var reader = new FileReader();
        reader.onload = function () {
          if (S.importJSON(reader.result)) { U.toast('数据导入成功', 'ok'); location.hash = '#/today'; LM.app.render(); }
          else U.toast('文件格式不正确', 'bad');
        };
        reader.readAsText(impFile.files[0]);
      });
    }

    var cd = U.$('#clear-data', root);
    if (cd) cd.addEventListener('click', function () {
      U.modal({
        title: '清空所有数据？',
        body: '<p>会删除本机保存的全部记录、体重和历史，且无法恢复。</p><p class="mt-8 muted small">这个操作不会上传任何东西，只是把浏览器里的数据删掉。</p>',
        actions: [
          { label: '取消', kind: 'btn-ghost' },
          { label: '确认清空', kind: 'btn-danger-soft', onClick: function () {
            S.reset();
            U.toast('数据已清空', 'warn');
            location.hash = '#/welcome';
            LM.app.render();
          } }
        ]
      });
    });
  }

  function toggleIn(arr, v) {
    var i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1); else arr.push(v);
  }

  // 局部刷新：只更新热量目标显示，避免整页重绘打断输入
  function refreshGoal(root) {
    var interim = { logs: {}, weights: [], plan: { kcalGoal: null }, body: S.get().body, user: S.get().user };
    var b = S.get().body;
    var bmr = b.gender === 'male'
      ? 10 * b.weight + 6.25 * b.height - 5 * b.age + 5
      : 10 * b.weight + 6.25 * b.height - 5 * b.age - 161;
    var factor = { low: 1.2, light: 1.375, mid: 1.55, high: 1.725 }[b.activity] || 1.375;
    var auto = Math.round(Math.max(bmr * factor - 400, b.gender === 'male' ? 1500 : 1200) / 10) * 10;
    var gv = U.$('#goal-view', root);
    var gn = U.$('#goal-note', root);
    if (gv) gv.innerHTML = U.comma(S.get().plan.kcalGoal || auto) + '<small>kcal</small>';
    if (gn) gn.textContent = S.get().plan.kcalGoal
      ? '当前为手动设置，自动计算结果为 ' + U.comma(auto) + ' kcal'
      : '自动估算（温和缺口 400 kcal，不低于安全下限）';
  }

  LM.views = LM.views || {};
  LM.views.plan = { render: render };
})(window);
