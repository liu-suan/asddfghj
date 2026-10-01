/* 轻伴 LightMate — 页面五：每日打卡（含失败恢复 / 补记机制） */
(function (global) {
  'use strict';
  var LM = (global.LM = global.LM || {});
  var U = LM.util, D = LM.data, S = LM.store;

  var V = { date: null };

  var MOODS = [
    { key: 'great', emoji: '😄', label: '很好' },
    { key: 'ok',    emoji: '🙂', label: '还不错' },
    { key: 'flat',  emoji: '😐', label: '一般' },
    { key: 'tired', emoji: '😴', label: '有点累' },
    { key: 'bad',   emoji: '😣', label: '不太好' }
  ];

  function render(root) {
    if (!V.date) V.date = U.today();
    paint(root);
  }

  function paint(root) {
    var t = U.today();
    var key = V.date;
    var s = S.get();
    var d = S.day(key);
    var tp = S.taskProgress(key);
    var isToday = key === t;
    var kcal = S.dayKcal(key);
    var goal = S.kcalGoal();

    root.innerHTML =
      '<div class="page-head">' +
        '<div class="row-between wrap gap-12">' +
          '<div>' +
            '<h1 class="page-title">✅ 每日打卡</h1>' +
            '<p class="page-sub">今天的任务不用全做完。做完一半，也比不做强。</p>' +
          '</div>' +
          '<span class="chip ' + (d.checked ? 'chip-ok' : 'chip-outline') + '">' +
            (d.checked ? '本日已打卡' : '本日未打卡') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="grid grid-dash" style="gap:18px">' +
        '<div class="stack gap-16">' +
          dayPicker(t) +
          (key !== t ? backfillBanner(key, d) : '') +
          taskCard(key, tp) +
          noteCard(key, d) +
        '</div>' +
        '<div class="stack gap-16">' +
          checkinCard(key, d, tp, kcal, goal, isToday) +
          historyCard(t) +
          principleCard() +
        '</div>' +
      '</div>';

    bind(root);
  }

  /* ---------------------------- 日期选择 ---------------------------- */
  function dayPicker(t) {
    var days = [];
    for (var i = 6; i >= 0; i--) days.push(U.addDays(t, -i));
    return '<div class="card card-tight">' +
      '<div class="row-between wrap gap-12">' +
        '<div class="card-title"><span class="emoji">📆</span>选择日期</div>' +
        '<span class="tiny muted">中断过也没关系，可以补记</span>' +
      '</div>' +
      '<div class="row gap-8 wrap mt-12">' +
        days.map(function (k) {
          var dd = S.get().logs[k];
          var cls = k === V.date ? 'chip-info' : (dd && dd.checked ? 'chip-ok' : 'chip-outline');
          return '<button class="chip ' + cls + '" data-day="' + k + '">' +
            (k === t ? '今天' : U.fmtMD(k).replace('月', '/').replace('日', '')) +
            ' ' + U.weekdayCN(k).slice(1) +
            (dd && dd.checked ? ' ✓' : '') +
          '</button>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  function backfillBanner(key, d) {
    return '<div class="nudge nudge-aware">' +
      '<div class="nudge-top"><span class="nudge-level">补记中</span>' +
        '<span class="nudge-head">正在查看 ' + U.fmtMDW(key) + '</span></div>' +
      '<div class="nudge-body">补记也算数。重要的从来不是那一天有没有做到，而是你愿意回来把它补上。</div>' +
    '</div>';
  }

  /* ---------------------------- 任务 ---------------------------- */
  function taskCard(key, tp) {
    var d = S.day(key);
    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">🎯</span>今日任务清单</div>' +
        '<span class="chip" id="task-chip">' + tp.done + ' / ' + tp.total + ' 已完成</span>' +
      '</div>' +
      '<div class="bar bar-mint mb-16" id="task-bar"><i style="width:' + U.pct(tp.done, tp.total) + '%"></i></div>' +
      '<div class="stack gap-8">' +
        tp.list.map(function (task) {
          var on = !!d.tasks[task.key];
          return '<div class="task' + (on ? ' done' : '') + '" data-task="' + task.key + '">' +
            '<span class="tick">✓</span>' +
            '<span class="grow"><span class="task-label">' + task.emoji + ' ' + U.esc(task.label) + '</span>' +
            '<div class="task-note">' + U.esc(task.note) + '</div></span>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="row gap-8 mt-16">' +
        '<button class="btn btn-ghost btn-sm" id="all-done">一键全部完成</button>' +
        '<button class="btn btn-ghost btn-sm" id="all-clear">全部取消</button>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 心情 + 备注 ---------------------------- */
  function noteCard(key, d) {
    var moodRow = MOODS.map(function (m) {
      return '<button class="chip ' + (d.mood === m.key ? 'chip-ok' : 'chip-outline') + '" data-mood="' + m.key + '">' +
        m.emoji + ' ' + m.label + '</button>';
    }).join('');

    return '<div class="card">' +
      '<div class="card-head">' +
        '<div class="card-title"><span class="emoji">💬</span>今天感觉怎么样</div>' +
        '<span class="card-note">' + U.fmtMDW(key) + '</span>' +
      '</div>' +
      '<div class="row gap-8 wrap mb-16">' + moodRow + '</div>' +
      '<div class="field">' +
        '<label class="label">一句话记录</label>' +
        '<textarea class="textarea" id="note-input" placeholder="今天有什么想说的？（选填）例如：舍友点奶茶，我换了无糖茶。">' +
          U.esc(d.note || '') +
        '</textarea>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 打卡卡 ---------------------------- */
  function checkinCard(key, d, tp, kcal, goal, isToday) {
    var allDone = tp.done >= tp.total;
    var half = tp.done >= Math.ceil(tp.total / 2);
    var ring = U.ringSVG(U.pct(tp.done, tp.total), { size: 150, stroke: 14 });

    var head, body, btnLabel, btnKind;
    if (d.checked) {
      head = '这一天的打卡已经完成了 ✓';
      body = '打卡不是为了证明你完美，是为了让 30 天不断掉。明天见。';
      btnLabel = '撤销打卡';
      btnKind = 'btn-ghost';
    } else if (!half) {
      head = '不用急，先做一件小事';
      body = '完成 ' + Math.ceil(tp.total / 2) + ' 项就算打卡成功。现在挑了最容易的那一项开始吧。';
      btnLabel = '完成打卡';
      btnKind = 'btn-soft';
    } else {
      head = allDone ? '任务全部完成，可以打卡了 🎉' : '已经过半，可以直接打卡';
      body = allDone ? '今天的你比昨天更稳一点。这种稳定，才是真正会带来变化的东西。'
                     : '不必等到完美才打卡。剩下的任务能做就做，做不完也不算失败。';
      btnLabel = '完成打卡';
      btnKind = 'btn-primary';
    }

    return '<div class="card">' +
      '<div class="row gap-16 wrap" style="align-items:center">' +
        '<div class="ring-wrap" style="width:150px;height:150px">' + ring +
          '<div class="ring-center">' +
            '<div class="ring-value" style="font-size:26px">' + tp.done + '<small style="font-size:14px;color:var(--ink-3)">/' + tp.total + '</small></div>' +
            '<div class="ring-label">今日任务</div>' +
          '</div>' +
        '</div>' +
        '<div class="grow" style="min-width:200px">' +
          '<div class="card-title mb-8"><span class="emoji">🔥</span>' + U.esc(head) + '</div>' +
          '<p class="small muted">' + U.esc(body) + '</p>' +
          '<div class="row gap-8 wrap mt-16">' +
            '<button class="btn ' + btnKind + ' btn-lg" id="checkin-btn">' + btnLabel + '</button>' +
            (d.checked ? '<span class="chip chip-ok">已打卡</span>' : '<span class="chip chip-outline">待打卡</span>') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="row gap-16 wrap mt-20" style="border-top:1px solid var(--line);padding-top:16px">' +
        '<div class="grow"><div class="stat-label">本日热量</div>' +
          '<div class="stat-value" style="font-size:20px">' + U.comma(kcal) + '<small>/' + U.comma(goal) + '</small></div>' +
          '<div class="bar ' + (kcal > goal ? 'bar-bad' : 'bar-mint') + '"><i style="width:' + Math.min(U.pct(kcal, goal), 100) + '%"></i></div></div>' +
        '<div class="grow"><div class="stat-label">已记录餐次</div>' +
          '<div class="stat-value" style="font-size:20px">' + S.dayMealCount(key) + '<small>餐</small></div></div>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------------- 最近打卡历史 ---------------------------- */
  function historyCard(t) {
    var rows = [];
    for (var i = 1; i <= 7; i++) {
      var k = U.addDays(t, -i);
      var d = S.get().logs[k];
      var checked = d && d.checked;
      var kcal = S.dayKcal(k);
      var hasRec = d && d.meals.length > 0;
      var st = checked ? { t: '已完成', c: 'chip-ok' }
             : hasRec ? { t: '有记录未打卡', c: 'chip-info' }
             : { t: '中断', c: 'chip-bad' };
      rows.push('<div class="log-item">' +
        '<span class="grow"><div class="small"><b>' + U.fmtMD(k) + '</b> <span class="tiny muted">' + U.weekdayCN(k) + '</span></div>' +
          '<div class="tiny muted">' + (kcal ? U.comma(kcal) + ' kcal' : '没有记录') + '</div></span>' +
        '<span class="chip ' + st.c + '">' + st.t + '</span>' +
      '</div>');
    }
    return '<div class="card">' +
      '<div class="card-title mb-12"><span class="emoji">🕘</span>最近 7 天</div>' +
      '<div class="stack gap-8">' + rows.join('') + '</div>' +
    '</div>';
  }

  /* ---------------------------- 产品理念提示 ---------------------------- */
  function principleCard() {
    return '<div class="card" style="background:linear-gradient(160deg,var(--mint-50),#fff);border-color:var(--mint-200)">' +
      '<div class="card-title mb-12"><span class="emoji">🌿</span>轻伴的三条底线</div>' +
      '<div class="stack gap-10 small">' +
        line('不会骂你', '没有「你怎么又吃这么多」，只有「我们看看接下来还能怎么调整」。') +
        line('允许失控', '偶尔一次没关系。但今天剩下的时间，我们要把选择做好。') +
        line('不允许消失', '连续几天偏离时，提醒会变得更明确——因为消失才是最危险的。') +
      '</div>' +
    '</div>';
  }

  function line(title, desc) {
    return '<div class="advice-line"><span class="mark">·</span><span><b>' + title + '</b>：' + desc + '</span></div>';
  }

  /* ================================================================== *
   * 交互
   * ================================================================== */
  function bind(root) {
    U.$$('[data-day]', root).forEach(function (b) {
      b.addEventListener('click', function () { V.date = b.getAttribute('data-day'); paint(root); });
    });

    U.$$('.task', root).forEach(function (node) {
      node.addEventListener('click', function () {
        var on = S.toggleTask(node.getAttribute('data-task'), V.date);
        node.classList.toggle('done', on);
        refreshNumbers(root);
      });
    });

    var allDone = U.$('#all-done', root);
    if (allDone) allDone.addEventListener('click', function () {
      var tp = S.taskProgress(V.date);
      tp.list.forEach(function (t) { if (!S.day(V.date).tasks[t.key]) S.toggleTask(t.key, V.date); });
      U.toast('今天的任务全部完成 ✓', 'ok');
      LM.app.render();
    });

    var allClear = U.$('#all-clear', root);
    if (allClear) allClear.addEventListener('click', function () {
      var tp = S.taskProgress(V.date);
      tp.list.forEach(function (t) { if (S.day(V.date).tasks[t.key]) S.toggleTask(t.key, V.date); });
      LM.app.render();
    });

    U.$$('[data-mood]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        S.setMood(b.getAttribute('data-mood'), V.date);
      });
    });

    var noteInput = U.$('#note-input', root);
    if (noteInput) noteInput.addEventListener('input', function () { S.setNote(noteInput.value, V.date); });

    var ck = U.$('#checkin-btn', root);
    if (ck) ck.addEventListener('click', function () {
      var d = S.day(V.date);
      if (d.checked) {
        S.setCheckin(false, V.date);
        U.toast('已撤销打卡', 'warn');
      } else {
        S.setCheckin(true, V.date);
        var isToday = V.date === U.today();
        var st = S.stats();
        U.toast(isToday ? '打卡成功！连续 ' + st.streak + ' 天 🔥' : U.fmtMD(V.date) + ' 补记成功，你回来了 💪', 'ok');
        if (!isToday) {
          U.modal({
            title: '补记成功 💪',
            body: '<p>中断不是失败，不再回来才是。</p><p class="mt-8">' + U.fmtMD(V.date) + ' 已经补上。接下来我们把注意力放回今天。</p>',
            actions: [
              { label: '继续补记', kind: 'btn-ghost' },
              { label: '回到今天', kind: 'btn-primary', onClick: function () { V.date = U.today(); LM.app.render(); } }
            ]
          });
        }
      }
      LM.app.render();
    });
  }

  // 只更新依赖任务数的局部数字（避免整页重绘）
  function refreshNumbers(root) {
    var tp = S.taskProgress(V.date);
    var chip = root.querySelector('#task-chip');
    if (chip) chip.textContent = tp.done + ' / ' + tp.total + ' 已完成';
    var bar = root.querySelector('#task-bar > i');
    if (bar) bar.style.width = U.pct(tp.done, tp.total) + '%';
    var rv = root.querySelector('.ring-center .ring-value');
    if (rv) rv.innerHTML = tp.done + '<small style="font-size:14px;color:var(--ink-3)">/' + tp.total + '</small>';
    var ckBtn = root.querySelector('#checkin-btn');
    if (ckBtn && !S.day(V.date).checked) {
      ckBtn.className = 'btn ' + (tp.done >= Math.ceil(tp.total / 2) ? 'btn-primary' : 'btn-soft') + ' btn-lg';
    }
  }

  function reset() { V.date = U.today(); }

  LM.views = LM.views || {};
  LM.views.checkin = { render: render, reset: reset };
})(window);
