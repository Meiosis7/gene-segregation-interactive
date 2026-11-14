(() => {
  const { genotypes, cross, resolveParents, fertilize } = Genetics;
  const byId = id => document.getElementById(id);
  const all = selector => [...document.querySelectorAll(selector)];
  const number = new Intl.NumberFormat('zh-CN');
  const percent = probability => `${Math.round(probability * 1000) / 10}%`;
  const fraction = probability => ({ 1: '1', 0.5: '½', 0.25: '¼' }[probability]);
  const phenotype = genotype => genotype === 'aa' ? '绿色' : '黄色';
  const seed = genotype => `<i class="seed ${genotype === 'aa' ? 'green' : 'yellow'}" aria-hidden="true"></i>`;

  const phases = [
    {
      kind: '分裂前期 · 已完成复制',
      title: 'A 和 a 位于同源染色体的相同位置',
      text: 'Aa 细胞中，一条同源染色体带 A，另一条带 a。图中的染色体已经复制，每条包含两条姐妹染色单体。',
      insight: '先找基因位点，再追踪染色体的去向。',
    },
    {
      kind: '减数第一次分裂 · 后期',
      title: '同源染色体分向两极',
      text: '带 A 和带 a 的同源染色体被拉向细胞两极。随同源染色体分开，A 与 a 也分别进入两个子细胞。此时姐妹染色单体仍连在一起。',
      insight: '等位基因随同源染色体分离。',
    },
    {
      kind: '减数第二次分裂 · 完成',
      title: '每个分裂产物只含 A 或 a',
      text: '姐妹染色单体分开后，图中 4 个单倍体产物有 2 个带 A、2 个带 a。正常情况下，Aa 产生的 A 与 a 配子各占 ½。',
      insight: '配子只带这一对等位基因中的一个。',
    },
    {
      kind: '受精 · 从两个配子池各取一个',
      title: '受精使等位基因重新成对',
      text: '点击画面，从卵细胞池和精子池各随机抽取一个配子。两者携带的等位基因决定这一粒子代的基因型。结果计入杂交实验。',
      insight: '每次受精独立抽取，结果可重复出现。',
    },
  ];

  const exercises = [
    {
      question: '一株结黄色种子的豌豆是 AA 还是 Aa？怎样用测交判断？',
      steps: [
        '黄色是显性表型，待测植株可能是 AA，也可能是 Aa。',
        '用隐性纯合子 aa 测交。它只提供 a，子代差异来自待测亲本的配子。',
        '如果待测亲本是 AA，理论上子代全为黄色 Aa；如果是 Aa，理论上黄色 Aa 和绿色 aa 各占 ½。',
        '出现绿色子代可判定待测亲本为 Aa。样本量较小时，若子代全黄，Aa 仍有可能。',
      ],
      link: '从 Aa × aa 开始，再把母本改成 AA，比较两种假设。',
      mode: 'test',
    },
    {
      question: 'Aa 自交，已知随机选到的是一粒黄色种子。它是 Aa 的概率是多少？',
      steps: [
        'Aa 自交，子代 AA、Aa、aa 的理论概率依次为 ¼、½、¼。',
        '在完全显性条件下，黄色包括 AA 和 Aa，因此黄色的概率为 ¼ + ½ = ¾。',
        'Aa 都是黄色。限定在黄色子代中，Aa 的条件概率是 (½) ÷ (¾) = ⅔。',
      ],
      link: '带入 Aa 自交，在棋盘中逐格找出能形成黄色子代的格子。',
      mode: 'self',
    },
    {
      question: '已知 Aa 与 aa 测交，随机观察 3 粒子代。三粒都为黄色的概率是多少？',
      steps: [
        'Aa × aa 的子代有 ½ 为黄色 Aa，½ 为绿色 aa。',
        '若三次受精相互独立，每粒仍有 ½ 的概率为黄色。',
        '三粒都为黄色的概率为 ½ × ½ × ½ = ⅛。样本很小时，测交可能暂时观察不到绿色。',
      ],
      link: '带入 Aa × aa，连续点三次「抽 1 粒」观察结果。',
      mode: 'test',
    },
  ];

  let stage = 0;
  let view = 'mechanism';
  let mode = 'self';
  let female = 'Aa';
  let customMale = 'Aa';
  let run = null;
  let reason = 0;
  let selectedCell = null;
  let counts = { AA: 0, Aa: 0, aa: 0 };
  let recent = [];
  let latest = null;
  let fusion = null;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const naturalLandscape = window.matchMedia('(orientation: landscape)');
  const parents = () => resolveParents(mode, female, customMale);

  function setPressed(selector, isActive) {
    for (const button of all(selector)) {
      button.setAttribute('aria-pressed', String(isActive(button)));
    }
  }

  function showView(nextView, moveFocus = false) {
    stopPlayback();
    view = nextView;
    for (const panel of all('.view')) panel.hidden = panel.id !== view;
    for (const button of all('[data-view]')) {
      if (button.dataset.view === view) {
        button.setAttribute('aria-current', 'page');
        if (moveFocus) button.focus();
      } else {
        button.removeAttribute('aria-current');
      }
    }
    if (view === 'mechanism') renderStage();
    if (view === 'lab') renderLab();
    if (view === 'practice') renderExercise();
  }

  function at(className, x, y, content = '', style = '') {
    return `<span class="${className}" style="--x:${x}%;--y:${y}%;${style}">${content}</span>`;
  }

  function membrane(x, y, width, height) {
    return at('cell-membrane', x, y, '', `--w:${width}%;--h:${height}%;`);
  }

  function chromosome(allele, x, y, single = false) {
    return at(`chromosome allele-${allele}${single ? ' single' : ''}`, x, y,
      `<span class="chromosome-art" aria-hidden="true"></span><span class="locus">${allele}</span>${single ? '' : `<span class="locus locus-pair">${allele}</span>`}`);
  }

  function renderSeparation() {
    if (stage === 0) {
      return at('plant-context', 12, 51, '<span class="plant-art"></span><span class="plant-name">豌豆 · Aa</span>') + membrane(59, 50, 55, 82) + chromosome('A', 51, 50) + chromosome('a', 67, 50)
        + at('scene-caption', 59, 9, '走进 Aa 的细胞')
        + at('scene-label', 59, 91, '相同位点 · 不同等位基因');
    }
    if (stage === 1) {
      return membrane(50, 50, 87, 72) + chromosome('A', 27, 50) + chromosome('a', 73, 50)
        + at('direction', 42, 48, '⟵') + at('direction', 58, 48, '⟶')
        + at('scene-label', 27, 75, '携带 A') + at('scene-label', 73, 75, '携带 a');
    }
    return at('scene-caption', 50, 14, '4 个单倍体产物')
      + [14, 38, 62, 86].map((x, index) => {
        const allele = index < 2 ? 'A' : 'a';
        return membrane(x, 49, 21, 53) + chromosome(allele, x, 49, true);
      }).join('')
      + at('scene-label', 26, 84, 'A 配子概率 ½')
      + at('scene-label', 74, 84, 'a 配子概率 ½');
  }

  function renderFertilization() {
    const [mother, father] = parents();
    const { eggs, sperm } = cross(mother, father);
    const poolY = (gameteList, index) => gameteList.length === 1 ? 50 : 35 + index * 37;
    const pool = (gameteList, x) => gameteList.map(({ allele, p }, index) =>
      at(`gamete-chip pool-chip allele-${allele}`, x, poolY(gameteList, index),
        `<span>${allele}<small class="pool-prob">${fraction(p)}</small></span>`)
    ).join('');
    const pick = (allele, gameteList, x) => {
      const y = poolY(gameteList, gameteList.findIndex(item => item.allele === allele));
      return at(`gamete-chip fusion-pick allele-${allele}`, 50, 50, allele,
        `--from-x:${x}%;--from-y:${y}%;`);
    };
    const paired = fusion ? pick(fusion.egg, eggs, 19) + pick(fusion.sperm, sperm, 81) : '';
    return at('scene-caption', 19, 14, `卵细胞池 · ${mother}`)
      + at('scene-caption', 81, 14, `精子池 · ${father}`)
      + pool(eggs, 19) + pool(sperm, 81)
      + at('direction', 33, 50, '→') + at('direction', 67, 50, '←')
      + at(`fusion-result${fusion ? ' filled' : ''}`, 50, 50, fusion?.genotype ?? '?')
      + at('scene-label', 50, 75, fusion ? `受精卵 · ${phenotype(fusion.genotype)}子代` : '待受精')
      + paired;
  }

  function renderStage(previous = stage) {
    const phase = phases[stage];
    byId('phase-kind').textContent = phase.kind;
    byId('phase-count').textContent = `${stage + 1} / ${phases.length}`;
    byId('phase-title').textContent = phase.title;
    byId('phase-text').textContent = phase.text;
    byId('phase-insight').textContent = phase.insight;
    byId('scene').dataset.stage = stage;
    byId('scene-art').innerHTML = stage === 3 ? renderFertilization() : renderSeparation();
    byId('scene-prompt').textContent = stage === 3 ? '点击画面 · 随机受精' : '点击画面 · 推进动画';
    byId('scene').setAttribute('aria-label', stage === 3 && fusion
      ? `抽到 ${fusion.egg} 卵细胞和 ${fusion.sperm} 精子，受精卵为 ${fusion.genotype}。点击再次随机受精`
      : byId('scene-prompt').textContent);
    byId('prev').disabled = stage === 0;
    byId('next').textContent = stage === 3 ? '进入杂交实验 →' : '下一步 →';
    for (const button of all('[data-stage]')) {
      if (Number(button.dataset.stage) === stage) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    }

    const offsets = previous === 0 && stage === 1 ? [16, -16]
      : previous === 1 && stage === 2 ? [13, -11, 11, -13] : [];
    if (!motion.matches) all('.chromosome').forEach((item, index) => {
      if (offsets[index] === undefined) return;
      const distance = byId('scene').clientWidth * offsets[index] / 100;
      item.animate([{ transform: `translateX(${distance}px)` }, { transform: 'translateX(0)' }],
        { duration: 680, easing: 'cubic-bezier(.27,.73,.29,1)' });
    });
  }

  function goStage(next, manual = true) {
    if (manual) stopPlayback();
    const previous = stage;
    stage = Math.min(Math.max(next, 0), phases.length - 1);
    if (previous !== stage) fusion = null;
    renderStage(previous);
  }

  function stopPlayback() {
    clearInterval(run);
    run = null;
    byId('play').textContent = '▷ 播放';
    byId('play').setAttribute('aria-pressed', 'false');
  }

  function togglePlayback() {
    if (run !== null) {
      stopPlayback();
      return;
    }
    if (stage === 3) goStage(0, false);
    byId('play').textContent = 'Ⅱ 暂停';
    byId('play').setAttribute('aria-pressed', 'true');
    run = setInterval(() => {
      if (stage < 3) goStage(stage + 1, false);
      else {
        drawFusion();
        stopPlayback();
      }
    }, 2350);
  }

  function draw(count) {
    const [mother, father] = parents();
    for (let index = 0; index < count; index++) {
      latest = fertilize(mother, father);
      counts[latest.genotype]++;
      recent.push(latest.genotype);
      if (recent.length > 24) recent.shift();
    }
    return latest;
  }

  function drawFusion() {
    fusion = draw(1);
    renderStage();
  }

  function clearSamples() {
    counts = { AA: 0, Aa: 0, aa: 0 };
    recent = [];
    latest = null;
    fusion = null;
  }

  function changeCross(update) {
    const previous = parents().join('×');
    update();
    if (parents().join('×') !== previous) {
      clearSamples();
      selectedCell = null;
    }
    renderLab();
  }

  function renderPunnett(result) {
    const { eggs, sperm, cells } = result;
    const heading = gamete => `<b>${gamete.allele}</b><small>${fraction(gamete.p)}</small>`;
    byId('punnett').innerHTML = `<thead><tr><th>卵 ↓ / 精 →</th>${
      sperm.map(item => `<th scope="col">${heading(item)}</th>`).join('')
    }</tr></thead><tbody>${cells.map((row, i) => `<tr><th scope="row">${heading(eggs[i])}</th>${
      row.map(({ genotype, p }, j) => `<td><button type="button" data-cell="${i}:${j}" aria-label="${genotype}，${percent(p)}"
        class="${genotype === 'aa' ? 'recessive' : ''}" aria-pressed="${selectedCell === `${i}:${j}`}">
        ${seed(genotype)}<b>${genotype}</b><small>${percent(p)}</small></button></td>`).join('')
    }</tr>`).join('')}</tbody>`;
    renderCellDetail(result);
  }

  function renderCellDetail(result) {
    let description = '点棋盘格，查看配子组合和概率。';
    if (selectedCell !== null) {
      const [i, j] = selectedCell.split(':').map(Number);
      const { egg, sperm, genotype, p } = result.cells[i][j];
      description = `卵 ${egg.allele} × 精 ${sperm.allele} → ${genotype}（${phenotype(genotype)}）。本格概率 ${fraction(egg.p)} × ${fraction(sperm.p)} = ${percent(p)}。`;
    }
    byId('cell-detail').textContent = description;
  }

  function distribution(caption, rows, total = null) {
    const observed = total !== null;
    return `<table class="distribution"><caption>${caption}</caption><thead><tr><th scope="col">类别</th>
      ${observed ? '<th scope="col">粒数</th>' : ''}<th scope="col">${observed ? '频率' : '概率'}</th>
      <th scope="col"><span class="sr-only">比例条</span></th></tr></thead><tbody>
      ${rows.map(([name, value, icon]) => {
        const p = observed ? value / total : value;
        const displayed = observed && !total ? '—' : percent(p);
        const width = observed && !total ? 0 : p * 100;
        return `<tr><th scope="row">${icon ?? ''}${name}</th>
          ${observed ? `<td>${number.format(value)}</td>` : ''}<td>${displayed}</td>
          <td><span class="meter" aria-hidden="true"><i style="--p:${width}%"></i></span></td></tr>`;
      }).join('')}</tbody></table>`;
  }

  function renderSamples() {
    const total = counts.AA + counts.Aa + counts.aa;
    byId('sample-count').textContent = `共 ${number.format(total)} 粒`;
    byId('clear-samples').disabled = total === 0;
    byId('latest').textContent = latest
      ? `最近一粒：卵 ${latest.egg} × 精 ${latest.sperm} → ${latest.genotype}（${phenotype(latest.genotype)}）。下方展示最近 ${recent.length} 粒。`
      : '每次从卵细胞池和精子池各独立抽取一个配子。抽样结果累加。';
    byId('sample-seeds').innerHTML = recent.map(seed).join('');
    byId('observed').innerHTML = distribution('实测基因型', genotypes.map(g => [g, counts[g]]), total)
      + distribution('实测表型', [['黄色', counts.AA + counts.Aa, seed('AA')], ['绿色', counts.aa, seed('aa')]], total);
  }

  function renderLab() {
    const [mother, father] = parents();
    byId('female').value = mother;
    byId('male').value = father;
    byId('male').disabled = mode !== 'custom';
    setPressed('[data-cross]', button => button.dataset.cross === mode);
    byId('cross-note').textContent = {
      self: '同株自交，父本基因型与母本相同。',
      test: '测交，以隐性纯合子 aa 提供精子。',
      custom: '可分别选择卵细胞和精子的亲本。',
    }[mode];
    const result = cross(mother, father);
    renderPunnett(result);
    const { yellow, green } = result.phenotypes;
    const key = [mother, father].sort().join('×');
    const ratio = key === 'Aa×Aa'
      ? '基因型 1∶2∶1 · 表型 3∶1'
      : key === 'Aa×aa' ? 'Aa∶aa = 1∶1 · 黄色∶绿色 = 1∶1' : '';
    byId('theory').innerHTML = distribution('子代基因型', genotypes.map(g => [g, result.genotypes[g]]))
      + distribution('子代表型 · 完全显性', [['黄色', yellow, seed('AA')], ['绿色', green, seed('aa')]])
      + (ratio ? `<p class="ratio">${ratio}</p>` : '');
    renderSamples();
  }

  function renderExercise() {
    const exercise = exercises[byId('exercise').value];
    byId('question').textContent = exercise.question;
    byId('reasoning').innerHTML = exercise.steps.slice(0, reason).map(step => `<li>${step}</li>`).join('');
    byId('reason-next').disabled = reason === exercise.steps.length;
    byId('reason-next').textContent = reason === exercise.steps.length ? '推理完成' : '揭示下一步 →';
    byId('reason-back').disabled = reason === 0;
    byId('reason-reset').disabled = reason === 0;
    byId('exercise-link-text').textContent = exercise.link;
  }

  function renderDisplay() {
    const rotated = document.body.classList.contains('rotated');
    const full = Boolean(document.fullscreenElement) || document.body.classList.contains('presented');
    byId('landscape').setAttribute('aria-pressed', String(rotated));
    byId('landscape').textContent = rotated ? '恢复竖屏' : '横屏阅读';
    byId('fullscreen').setAttribute('aria-pressed', String(full));
    byId('fullscreen').textContent = full ? '退出全屏' : '全屏';
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (document.body.classList.contains('presented')) {
      document.body.classList.remove('presented');
    } else {
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        document.body.classList.add('presented');
      }
    }
    renderDisplay();
  }

  all('[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
  all('[data-stage]').forEach(button => button.addEventListener('click', () => goStage(Number(button.dataset.stage))));
  byId('prev').addEventListener('click', () => goStage(stage - 1));
  byId('next').addEventListener('click', () => stage === 3 ? showView('lab', true) : goStage(stage + 1));
  byId('play').addEventListener('click', togglePlayback);
  byId('reset').addEventListener('click', () => goStage(0));
  byId('scene').addEventListener('click', () => {
    if (stage < 3) goStage(stage + 1);
    else {
      stopPlayback();
      drawFusion();
    }
  });
  all('[data-cross]').forEach(button => button.addEventListener('click', () => changeCross(() => {
    mode = button.dataset.cross;
  })));
  byId('female').addEventListener('change', event => changeCross(() => { female = event.target.value; }));
  byId('male').addEventListener('change', event => changeCross(() => { customMale = event.target.value; }));
  byId('punnett').addEventListener('click', event => {
    const button = event.target.closest('[data-cell]');
    if (!button) return;
    selectedCell = button.dataset.cell;
    setPressed('[data-cell]', cell => cell === button);
    renderCellDetail(cross(...parents()));
  });
  byId('draw-one').addEventListener('click', () => { draw(1); renderSamples(); });
  byId('draw-batch').addEventListener('click', () => { draw(Number(byId('batch').value)); renderSamples(); });
  byId('clear-samples').addEventListener('click', () => { clearSamples(); renderSamples(); });
  byId('exercise').addEventListener('change', () => { reason = 0; renderExercise(); });
  byId('reason-next').addEventListener('click', () => { reason++; renderExercise(); });
  byId('reason-back').addEventListener('click', () => { reason--; renderExercise(); });
  byId('reason-reset').addEventListener('click', () => { reason = 0; renderExercise(); });
  byId('exercise-lab').addEventListener('click', () => {
    changeCross(() => { mode = exercises[byId('exercise').value].mode; female = 'Aa'; });
    showView('lab', true);
  });
  byId('fullscreen').addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', renderDisplay);
  byId('landscape').addEventListener('click', () => {
    document.body.classList.toggle('rotated');
    renderDisplay();
  });
  naturalLandscape.addEventListener('change', event => {
    if (event.matches) document.body.classList.remove('rotated');
    renderDisplay();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.body.classList.remove('presented', 'rotated');
    renderDisplay();
  });

  renderStage();
  renderLab();
  renderExercise();
})();
