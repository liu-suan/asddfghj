/* 轻伴 LightMate — 页面一：欢迎页 / 页面二：首次目标设置（5 步） */
(function (global) {
  'use strict';
  var LM = (global.LM = global.LM || {});
  var U = LM.util, D = LM.data, S = LM.store;

  /* ================================================================== *
   * 页面一：欢迎页
   * ================================================================== */
  function welcome(root) {
    root.innerHTML =
      '<div class="welcome">' +
        '<span class="float-blob blob-1"></span><span class="float-blob blob-2"></span>' +
        '<div class="welcome-inner">' +
          '<span class="welcome-badge">🌿 轻伴 · 大学生 AI 减脂陪伴</span>' +
          '<h1>今天，也<em>不用一下子</em><br>改变很多。</h1>' +
          '<div class="welcome-sub">从一个小选择开始。</div>' +
          '<p class="welcome-desc">轻伴陪你记录每一餐、完成每一天的小目标。<br>不要求完美，但陪你坚持。</p>' +
          '<div class="welcome-actions">' +
            '<button class="btn btn-primary btn-lg" id="w-start">开始我的计划 →</button>' +
            '<button class="btn btn-ghost btn-lg" id="w-demo">先看看示例数据</button>' +
          '</div>' +
          '<div class="welcome-points">' +
            point('📷', '拍一张就知道', '食堂、外卖、奶茶，拍完自动估算热量与结构。') +
            point('🌿', '温柔陪伴，坚定督促', '偏离时不批评，但一定给你一个能立刻做的动作。') +
            point('📈', '30 天看得见的成长', '连续记录、体重曲线、阶段反馈，一起走完。') +
          '</div>' +
        '</div>' +
      '</div>';

    U.$('#w-start', root).addEventListener('click', function () { location.hash = '#/onboarding'; });
    U.$('#w-demo', root).addEventListener('click', function () {
      S.seedDemo();
      U.toast('已载入 18 天示例数据，可以直接体验完整闭环', 'ok');
      location.hash = '#/today';
    });
  }

  function point(emoji, title, desc) {
    return '<div class="wp">' +
      '<div class="wp-emoji">' + emoji + '</div>' +
      '<div class="wp-title">' + title + '</div>' +
      '<div class="wp-desc">' + desc + '</div>' +
      '</div>';
  }

  /* ================================================================== *
   * 页面二：首次目标设置
   * ================================================================== */
  var STEPS = [
    { key: 'goals',     title: '你的主要目标？',        sub: '可以多选。选你真正想要的，不用选看起来正确的。' },
    { key: 'triggers',  title: '最容易控制不住什么？',  sub: '多选。轻伴会针对这几项，给你更具体的提醒。' },
    { key: 'hardParts', title: '最难坚持什么？',        sub: '多选。越难的地方，我们会把任务拆得越小。' },
    { key: 'reminder',  title: '选择提醒方式',          sub: '人格固定为「温柔 + 坚定」，这里只决定提醒频率。' },
    { key: 'commit',    title: '给自己一个 30 天约定',  sub: '这句话会出现在你的首页，随时可以改。' }
  ];

  function onboarding(root) {
    var draft = {
      goals: [],
      triggers: [],
      hardParts: [],
      reminder: 'moderate',
      commitment: '接下来的 30 天，我会认真对待自己的每一次选择。',
      body: { gender: 'female', age: 20, height: 165, weight: 60, targetWeight: 54, activity: 'light' },
      name: ''
    };
    var step = 0;

    function render() {
      var s = STEPS[step];
      var pct = ((step + 1) / STEPS.length) * 100;

      root.innerHTML =
        '<div class="onb">' +
          '<div class="row-between mb-16">' +
            '<div class="brand" style="padding:0"><div class="brand-logo">🌿</div>' +
              '<div><div class="brand-name">轻伴</div><div class="brand-sub">LightMate</div></div></div>' +
            '<button class="btn btn-ghost btn-sm" id="o-skip">跳过引导</button>' +
          '</div>' +
          '<div class="onb-steps">' +
            STEPS.map(function (_, i) {
              var cls = i < step ? 'done' : (i === step ? 'on' : '');
              return '<div class="onb-step ' + cls + '"><i></i></div>';
            }).join('') +
          '</div>' +
          '<div class="onb-eyebrow">Step ' + (step + 1) + ' / ' + STEPS.length + '</div>' +
          '<h2 class="onb-title">' + U.esc(s.title) + '</h2>' +
          '<p class="onb-sub">' + U.esc(s.sub) + '</p>' +
          '<div class="onb-body" id="o-body"></div>' +
          '<div class="onb-foot">' +
            (step > 0 ? '<button class="btn btn-ghost" id="o-back">← 上一步</button>' : '') +
            '<div class="grow"></div>' +
            '<span class="onb-hint" id="o-hint"></span>' +
            '<button class="btn btn-primary btn-lg" id="o-next">' +
              (step === STEPS.length - 1 ? '开始 30 天计划' : '下一步 →') +
            '</button>' +
          '</div>' +
        '</div>';

      var body = U.$('#o-body', root);
      body.appendChild(buildStep(step, draft, render));
      bind();
    }

    function bind() {
      var next = U.$('#o-next', root);
      var back = U.$('#o-back', root);
      var skip = U.$('#o-skip', root);
      var hint = U.$('#o-hint', root);

      var need = requirement(step, draft);
      next.disabled = need.blocked;
      if (need.msg) hint.textContent = need.msg;

      next.addEventListener('click', function () {
        if (step < STEPS.length - 1) { step++; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        else finish(draft);
      });
      if (back) back.addEventListener('click', function () { step--; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      if (skip) skip.addEventListener('click', function () { finish(draft, true); });
    }

    render();
  }

  function requirement(step, d) {
    if (step === 0) return { blocked: d.goals.length === 0, msg: d.goals.length ? '已选 ' + d.goals.length + ' 项' : '至少选一项' };
    if (step === 1) return { blocked: false, msg: d.triggers.length ? '已选 ' + d.triggers.length + ' 项' : '没有也可以直接下一步' };
    if (step === 2) return { blocked: false, msg: d.hardParts.length ? '已选 ' + d.hardParts.length + ' 项' : '没有也可以直接下一步' };
    if (step === 3) return { blocked: false, msg: '' };
    return { blocked: d.commitment.trim().length < 4, msg: d.commitment.trim().length < 4 ? '写一句你愿意遵守的话' : '' };
  }

  /* ---------------------- 各步骤内容 ---------------------- */
  function buildStep(step, d, rerender) {
    if (step === 0) return multiGrid(D.GOAL_OPTIONS, d.goals, rerender, false);
    if (step === 1) return multiGrid(D.TRIGGER_OPTIONS, d.triggers, rerender, false);
    if (step === 2) return multiGrid(D.HARD_OPTIONS, d.hardParts, rerender, false);
    if (step === 3) return reminderStep(d, rerender);
    return commitStep(d, rerender);
  }

  function multiGrid(options, selected, rerender, single) {
    var wrap = U.el('div', { class: 'option-grid' });
    options.forEach(function (o) {
      var on = selected.indexOf(o.key) >= 0;
      var btn = U.el('button', { class: 'opt' + (on ? ' on' : ''), type: 'button' }, [
        U.el('span', { class: 'opt-emoji', text: o.emoji }),
        U.el('span', { class: 'opt-body' }, [
          U.el('span', { class: 'opt-label', text: o.label }),
          U.el('span', { class: 'opt-desc', text: o.desc || o.tip || '' })
        ]),
        U.el('span', { class: 'opt-check', text: '✓' })
      ]);
      btn.addEventListener('click', function () {
        var i = selected.indexOf(o.key);
        if (i >= 0) selected.splice(i, 1);
        else { if (single) selected.length = 0; selected.push(o.key); }
        rerender();
      });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function reminderStep(d, rerender) {
    var frag = document.createDocumentFragment();
    var grid = U.el('div', { class: 'option-grid one' });
    D.REMINDER_OPTIONS.forEach(function (o) {
      var on = d.reminder === o.key;
      var btn = U.el('button', { class: 'opt' + (on ? ' on' : ''), type: 'button' }, [
        U.el('span', { class: 'opt-emoji', text: o.emoji }),
        U.el('span', { class: 'opt-body' }, [
          U.el('span', { class: 'opt-label' }, [
            document.createTextNode(o.label + ' '),
            on ? U.el('span', { class: 'tag', text: '默认推荐' }) : document.createTextNode('')
          ]),
          U.el('span', { class: 'opt-desc', text: o.desc + '（' + o.freq + '）' })
        ]),
        U.el('span', { class: 'opt-check', text: '✓' })
      ]);
      btn.addEventListener('click', function () { d.reminder = o.key; rerender(); });
      grid.appendChild(btn);
    });
    frag.appendChild(grid);

    var note = U.el('div', { class: 'card card-tight card-flat', style: { background: 'var(--mint-50)', borderColor: 'var(--mint-200)' } }, [
      U.el('div', { class: 'small', html:
        '<b>🌿 温柔是沟通方式，严格是行为底线。</b><br>' +
        '不管选哪一种，轻伴都不会骂你。但如果你连续几天偏离计划，提醒会变得更明确、更坚持。' })
    ]);
    frag.appendChild(note);
    return frag;
  }

  function commitStep(d, rerender) {
    var frag = document.createDocumentFragment();

    // —— 30 天约定卡
    var ta = U.el('textarea', { class: 'textarea', rows: 3, style: { background: '#fff' } });
    ta.value = d.commitment;
    ta.addEventListener('input', function () {
      d.commitment = ta.value;
      var btn = U.$('#o-next');
      var hint = U.$('#o-hint');
      var ok = d.commitment.trim().length >= 4;
      if (btn) btn.disabled = !ok;
      if (hint) hint.textContent = ok ? '' : '写一句你愿意遵守的话';
    });

    frag.appendChild(U.el('div', { class: 'commit-card' }, [
      U.el('div', { class: 'card-title' }, [U.el('span', { class: 'emoji', text: '🤝' }), document.createTextNode('30 天约定')]),
      U.el('div', { class: 'commit-quote', text: '“接下来的 30 天，我会认真对待自己的每一次选择。”' }),
      ta,
      U.el('div', { class: 'tiny muted mt-8', text: '上面这句是默认版本，也可以换成你自己的说法。' })
    ]));

    // —— 身体数据（可选，用于热量目标）
    var b = d.body;
    var fields = [
      ['身高', 'height', 'cm', 140, 200, 1],
      ['当前体重', 'weight', 'kg', 35, 150, 0.1],
      ['目标体重', 'targetWeight', 'kg', 35, 150, 0.1],
      ['年龄', 'age', '岁', 16, 40, 1]
    ];
    var grid = U.el('div', { class: 'grid grid-2' });
    fields.forEach(function (f) {
      var input = U.el('input', { class: 'input', type: 'number', step: f[5], min: f[3], max: f[4] });
      input.value = b[f[1]];
      input.addEventListener('input', function () { b[f[1]] = Number(input.value); });
      grid.appendChild(U.el('div', { class: 'field' }, [
        U.el('label', { class: 'label', text: f[0] + '（' + f[2] + '）' }),
        input
      ]));
    });

    var genderSeg = U.el('div', { class: 'seg' });
    [['female', '女生'], ['male', '男生']].forEach(function (g) {
      var on = b.gender === g[0];
      var btn = U.el('button', { class: on ? 'on' : '', type: 'button', text: g[1] });
      btn.addEventListener('click', function () { b.gender = g[0]; rerender(); });
      genderSeg.appendChild(btn);
    });

    var actSeg = U.el('div', { class: 'seg' });
    [['low', '很少动'], ['light', '偶尔运动'], ['mid', '经常运动'], ['high', '每天训练']].forEach(function (g) {
      var on = b.activity === g[0];
      var btn = U.el('button', { class: on ? 'on' : '', type: 'button', text: g[1] });
      btn.addEventListener('click', function () { b.activity = g[0]; rerender(); });
      actSeg.appendChild(btn);
    });

    frag.appendChild(U.el('div', { class: 'card' }, [
      U.el('div', { class: 'card-head' }, [
        U.el('div', { class: 'card-title' }, [U.el('span', { class: 'emoji', text: '📐' }), document.createTextNode('基础信息')]),
        U.el('span', { class: 'card-note', text: '用于估算每日热量目标，可跳过' })
      ]),
      U.el('div', { class: 'row-between mb-12 wrap' }, [
        U.el('span', { class: 'label', text: '性别' }), genderSeg
      ]),
      U.el('div', { class: 'row-between mb-16 wrap' }, [
        U.el('span', { class: 'label', text: '日常活动量' }), actSeg
      ]),
      grid
    ]));

    // —— 预估结果
    var preview = U.el('div', { class: 'card', style: { background: 'var(--mint-50)', borderColor: 'var(--mint-200)' } });
    function refreshPreview() {
      var tmp = { body: b, plan: { kcalGoal: null }, weights: [] };
      // 临时借用量：用纯函数估算
      var bmr = b.gender === 'male'
        ? 10 * b.weight + 6.25 * b.height - 5 * b.age + 5
        : 10 * b.weight + 6.25 * b.height - 5 * b.age - 161;
      var factor = { low: 1.2, light: 1.375, mid: 1.55, high: 1.725 }[b.activity] || 1.375;
      var goal = Math.round(Math.max(bmr * factor - 400, b.gender === 'male' ? 1500 : 1200) / 10) * 10;
      var diff = Math.max(0, (b.weight - b.targetWeight)).toFixed(1);
      preview.innerHTML =
        '<div class="row-between wrap gap-12">' +
          '<div><div class="stat-label">每日热量目标（自动估算）</div>' +
          '<div class="stat-value">' + U.comma(goal) + '<small>kcal</small></div></div>' +
          '<div><div class="stat-label">计划减重</div>' +
          '<div class="stat-value">' + diff + '<small>kg</small></div></div>' +
          '<div><div class="stat-label">预计节奏</div>' +
          '<div class="stat-value">' + (diff > 0 ? (diff / 0.5).toFixed(0) : 0) + '<small>周</small></div></div>' +
        '</div>' +
        '<div class="tiny muted mt-12">按照每周减 0.5kg 的温和节奏估算，不追求速度。目标可以随时在我的计划里改。</div>';
    }
    refreshPreview();
    fields.forEach(function (f, i) {
      var inputs = grid.querySelectorAll('input');
      inputs[i].addEventListener('input', refreshPreview);
    });
    genderSeg.addEventListener('click', refreshPreview);
    actSeg.addEventListener('click', refreshPreview);
    frag.appendChild(preview);

    return frag;
  }

  function finish(draft, skipped) {
    if (skipped) {
      draft.goals = draft.goals.length ? draft.goals : ['diet', 'fat'];
      draft.triggers = draft.triggers.length ? draft.triggers : ['milktea'];
      draft.hardParts = draft.hardParts.length ? draft.hardParts : ['record'];
    }
    S.completeOnboarding({
      user: {
        goals: draft.goals,
        triggers: draft.triggers,
        hardParts: draft.hardParts,
        reminder: draft.reminder,
        commitment: draft.commitment,
        name: '同学'
      },
      body: draft.body,
      plan: { startDate: U.today(), targetDays: 30 }
    });
    U.toast('你的 30 天计划已经开始了 🌱', 'ok');
    location.hash = '#/today';
  }

  LM.views = LM.views || {};
  LM.views.welcome = welcome;
  LM.views.onboarding = onboarding;
})(window);
