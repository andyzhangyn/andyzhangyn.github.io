"use strict";

const form = document.querySelector("#word-form");
const input = document.querySelector("#word-input");
const analyzeButton = document.querySelector("#analyze-button");
const message = document.querySelector("#validation-message");
const resultSection = document.querySelector("#result-section");
const wordSummary = document.querySelector("#word-summary");
const forestEmpty = document.querySelector("#forest-empty");
const forestToolbar = document.querySelector("#forest-toolbar");
const forestViewport = document.querySelector("#forest-viewport");
const forestStage = document.querySelector("#forest-stage");
const invariantGrid = document.querySelector("#invariants");
const randomGInput = document.querySelector("#random-g");
const randomAInput = document.querySelector("#random-a");
const randomButton = document.querySelector("#random-button");
const shuffleButton = document.querySelector("#shuffle-button");
const flipButton = document.querySelector("#flip-button");
const zoomRange = document.querySelector("#zoom-range");
const zoomLabel = document.querySelector("#zoom-label");
const languageButtons = document.querySelectorAll("[data-language]");
const aboutOpen = document.querySelector("#about-open");
const aboutDialog = document.querySelector("#about-dialog");
const aboutClose = document.querySelector("#about-close");
const youngDiagramPanel = document.querySelector("#young-diagram-panel");
const youngDiagramCanvas = document.querySelector("#young-diagram-canvas");
const youngDiagramMeta = document.querySelector("#young-diagram-meta");
const youngDiagramOpen = document.querySelector("#young-diagram-open");
const youngDiagramDialog = document.querySelector("#young-diagram-dialog");
const youngDiagramClose = document.querySelector("#young-diagram-close");
const youngDiagramLargeViewport = document.querySelector(
  ".young-diagram-large-viewport",
);
const youngDiagramLargeStage = document.querySelector(
  "#young-diagram-large-stage",
);
const youngDiagramColumnAxis = document.querySelector(
  "#young-diagram-column-axis",
);
const youngDiagramRowAxis = document.querySelector(
  "#young-diagram-row-axis",
);
const youngDiagramLargeCanvas = document.querySelector(
  "#young-diagram-large-canvas",
);
const minG = Number(
  document.querySelector('meta[name="ui-min-g"]').getAttribute("content"),
);
const maxG = Number(
  document.querySelector('meta[name="ui-max-g"]').getAttribute("content"),
);

const translations = {
  en: {
    "page.title": "domino forest",
    "page.description": "Interactive weighted-forest visualization for supersingular cyclic Frobenius words.",
    "brand.title": "domino <span>forest</span>",
    "language.label": "Language",
    "about.open": "About this tool",
    "about.close": "Close about dialog",
    "about.title": "about domino forest",
    "about.flow": String.raw`<span class="math-flow" data-tex="\boldsymbol{\varepsilon}\longrightarrow \bigwedge^2 H^1_{\mathrm{crys}}\longrightarrow \{\mathbf h^{(s)}\}\longrightarrow \mathcal F_U\longrightarrow (J,\lambda,e,\sigma_{\mathrm{Art}})">ε → Λ²H¹crys → heights → forest → invariants</span>`,
    "about.flowLabel": "Computation overview",
    "about.inputHeading": "input",
    "about.inputBody": String.raw`A balanced binary cyclic word with <span class="math-inline" data-tex="g">g</span> zeros and <span class="math-inline" data-tex="g">g</span> ones. It records the <span class="math-inline" data-tex="p">p</span>-adic Frobenius valuations of a cyclic basis for a supersingular <span class="math-inline" data-tex="F">F</span>-crystal. Words are normalized up to cyclic rotation.`,
    "about.forestHeading": "forest",
    "about.forestBody": String.raw`The tool forms the exterior square and turns the superlevel sets of its normalized height functions into rooted trees. A vertex <span class="math-inline" data-tex="U_j">Uj</span> records an elementary domino type; an edge <span class="math-inline" data-tex="V^m">Vm</span> records its extension weight.`,
    "about.outputHeading": "output",
    "about.outputBody": String.raw`The forest determines the displayed type sequence <span class="math-inline" data-tex="J">J</span>, isogeny partition <span class="math-inline" data-tex="\lambda">λ</span>, Artin invariant <span class="math-inline" data-tex="\sigma_{\mathrm{Art}}">σArt</span>, <span class="math-inline" data-tex="p">p</span>-exponent, and <span class="math-inline" data-tex="a">a</span>-number. The interval plots compare the example with the bounds used in the paper.`,
    "about.scopeHeading": "scope",
    "about.scopeBody": "This is the cyclic combinatorial case. Unit coefficients are normalized, and the page does not test geometric realizability or the existence of a principal polarization.",
    "word.controls": "cyclic word controls",
    "word.label": "word",
    "word.inputLabel": "Cyclic binary word",
    "action.build": "build",
    "action.building": "building…",
    "action.random": "random",
    "action.close": "close",
    "status.ready": "ready",
    "status.reconstructing": "g={g} / reconstructing",
    "status.rendering": "rendering forest",
    "status.success": "{nodes} nodes / {trees} trees",
    "status.randomAny": "random / g={g} / a∈[1,{g}]",
    "status.randomA": "random / g={g} / a={a}",
    "random.label": "Random cyclic word",
    "random.placeholder": "random",
    "random.hint": "Enter an integer from 1 to g, or leave blank to choose a randomly.",
    "random.aRange": "a must be an integer in [1, {g}] or blank",
    "random.setG": "set g before a",
    "random.invalidG": "g must be an integer in [{min}, {max}]",
    "random.failed": "random generation failed",
    "forest.heading": "forest",
    "forest.layout": "Forest component layout",
    "forest.flip": "Flip vertical forest orientation",
    "forest.shuffle": "Shuffle component layout",
    "forest.zoomControls": "Forest zoom controls",
    "forest.scale": "scale",
    "forest.fit": "Fit forest to boundary",
    "forest.awaiting": "awaiting word",
    "forest.empty": "empty degree-two forest",
    "forest.rootUp": "root ↑",
    "forest.rootDown": "root ↓",
    "forest.canvasAria": "Weighted rooted forest with {nodes} vertices, {edges} edges, and {components} components; roots {orientation}",
    "forest.rootsAbove": "above",
    "forest.rootsBelow": "below",
    "layout.scatter": "scatter",
    "layout.read": "list",
    "invariant.typeSequence": "type sequence",
    "invariant.isogenyPartition": "isogeny partition",
    "invariant.sigma": "degree-two Artin invariant",
    "invariant.pexp": "domino p-exponent",
    "invariant.anumber": "a-number",
    "copy.typeSequence": "Copy type sequence",
    "copy.isogenyPartition": "Copy isogeny partition",
    "copy.copied": "Copied",
    "copy.unavailable": "clipboard unavailable",
    "young.title": "Young diagram",
    "young.open": "Open enlarged Young diagram",
    "young.largeAria": "Enlarged Young diagram with 1-based row and column coordinates",
    "young.scaled": "scaled to fit",
    "young.aria": "Young diagram with {rows}, {columns} at its widest, and {boxes}",
    "count.row.one": "row",
    "count.row.other": "rows",
    "count.column.one": "column",
    "count.column.other": "columns",
    "count.box.one": "box",
    "count.box.other": "boxes",
    "bounds.heading": "bounds",
    "bounds.sigmaInterval": "Degree-two Artin invariant interval",
    "bounds.pexpInterval": "Domino p-exponent interval",
    "bounds.info": "info",
    "bounds.assumption": String.raw`geometric realization is assumed; the upper <span class="math-inline" data-tex="\sigma_{\mathrm{Art}}">σArt</span> endpoint also assumes a principal polarization.`,
    "bounds.min": "min {value}",
    "bounds.max": "max {value}{qualifier}",
    "bounds.inside": "inside the interval",
    "bounds.below": "below the lower bound",
    "bounds.above": "above the upper bound",
    "bounds.aria": "{name}: bounds {lower} to {upper}; actual value {actual}, {status}.",
    "bounds.pexpName": "Domino p-exponent",
    "bounds.sigmaName": "Degree-two Artin invariant",
    "bounds.ppQualifier": " / pp",
    "bounds.pexpFail": "p-exp {actual} outside [{lower}, {upper}]: geometric bound fails",
    "bounds.sigmaBelow": "σArt {actual} < geometric min {lower}",
    "bounds.sigmaAbove": "σArt {actual} > pp max {upper}: not principal polarizable",
    "bounds.aOnlyExact": "a-only / e≤{exponent} / σArt≤{sigma} pp",
    "bounds.aOnlyCurrent": "a-only / σArt≤{sigma} pp · e={actual} → {upper}",
    "validation.enterWord": "enter a binary cyclic word",
    "validation.even": "length must be even: 2g",
    "validation.binary": "entries must be 0 or 1",
    "validation.minG": "g ≥ {g} in the ui",
    "validation.maxG": "g ≤ {g} in the ui",
    "validation.ones": "need exactly {g} ones",
    "reconstruction.failed": "reconstruction failed",
  },
  zh: {
    "page.title": "多米诺森林",
    "page.description": "由超奇异循环 Frobenius 词生成加权根森林的交互可视化工具。",
    "brand.title": "多米诺<span>森林</span>",
    "language.label": "语言",
    "about.open": "关于此工具",
    "about.close": "关闭关于窗口",
    "about.title": "关于多米诺森林",
    "about.flow": String.raw`<span class="math-flow" data-tex="\boldsymbol{\varepsilon}\longrightarrow \bigwedge^2 H^1_{\mathrm{crys}}\longrightarrow \{\mathbf h^{(s)}\}\longrightarrow \mathcal F_U\longrightarrow (J,\lambda,e,\sigma_{\mathrm{Art}})">ε → Λ²H¹crys → 高度函数 → 森林 → 不变量</span>`,
    "about.flowLabel": "计算流程概览",
    "about.inputHeading": "输入",
    "about.inputBody": String.raw`输入一个含有 <span class="math-inline" data-tex="g">g</span> 个 0 和 <span class="math-inline" data-tex="g">g</span> 个 1 的平衡二进制循环词。它记录超奇异 <span class="math-inline" data-tex="F">F</span>-crystal 在循环基下的 Frobenius <span class="math-inline" data-tex="p">p</span> 进赋值，并按循环旋转取标准代表。`,
    "about.forestHeading": "森林",
    "about.forestBody": String.raw`工具先取外平方，再把标准化高度函数的超水平集转化为有根树。顶点 <span class="math-inline" data-tex="U_j">Uj</span> 表示基本多米诺类型，边 <span class="math-inline" data-tex="V^m">Vm</span> 表示相应的扩张权重。`,
    "about.outputHeading": "输出",
    "about.outputBody": String.raw`该森林决定页面显示的类型序列 <span class="math-inline" data-tex="J">J</span>、同源分拆 <span class="math-inline" data-tex="\lambda">λ</span>、Artin 不变量 <span class="math-inline" data-tex="\sigma_{\mathrm{Art}}">σArt</span>、<span class="math-inline" data-tex="p">p</span>-exponent 与 <span class="math-inline" data-tex="a">a</span>-number。区间图把当前例子与论文中的上下界进行比较。`,
    "about.scopeHeading": "范围",
    "about.scopeBody": "本工具处理循环组合情形。单位系数已被标准化；页面不检验几何可实现性，也不检验主极化是否存在。",
    "word.controls": "循环词输入",
    "word.label": "循环词",
    "word.inputLabel": "二进制循环词",
    "action.build": "生成",
    "action.building": "生成中…",
    "action.random": "随机生成",
    "action.close": "关闭",
    "status.ready": "就绪",
    "status.reconstructing": "g={g} / 重构中",
    "status.rendering": "正在绘制森林",
    "status.success": "{nodes} 个节点 / {trees} 棵树",
    "status.randomAny": "随机 / g={g} / a∈[1,{g}]",
    "status.randomA": "随机 / g={g} / a={a}",
    "random.label": "随机循环词",
    "random.placeholder": "随机",
    "random.hint": "输入 1 到 g 之间的整数；留空则随机选择。",
    "random.aRange": "a 必须是 [1, {g}] 内的整数，或留空",
    "random.setG": "请先设置 g",
    "random.invalidG": "g 必须是 [{min}, {max}] 内的整数",
    "random.failed": "随机生成失败",
    "forest.heading": "森林",
    "forest.layout": "森林排列方式",
    "forest.flip": "翻转森林的垂直方向",
    "forest.shuffle": "重新排列各棵树",
    "forest.zoomControls": "森林缩放控制",
    "forest.scale": "缩放",
    "forest.fit": "适配森林边界",
    "forest.awaiting": "等待输入",
    "forest.empty": "二次森林为空",
    "forest.rootUp": "根 ↑",
    "forest.rootDown": "根 ↓",
    "forest.canvasAria": "加权根森林：{nodes} 个顶点、{edges} 条边、{components} 个分量；根位于{orientation}",
    "forest.rootsAbove": "上方",
    "forest.rootsBelow": "下方",
    "layout.scatter": "自由",
    "layout.read": "列表",
    "invariant.typeSequence": "类型序列",
    "invariant.isogenyPartition": "同源分拆",
    "invariant.sigma": "二次 Artin 不变量",
    "invariant.pexp": "多米诺 p-exponent",
    "invariant.anumber": "a-number",
    "copy.typeSequence": "复制类型序列",
    "copy.isogenyPartition": "复制同源分拆",
    "copy.copied": "已复制",
    "copy.unavailable": "剪贴板不可用",
    "young.title": "杨图",
    "young.open": "打开杨图大图",
    "young.largeAria": "带有从 1 开始的行列坐标的放大杨图",
    "young.scaled": "已缩放以适配",
    "young.aria": "杨图共有{rows}，最宽处有{columns}，共{boxes}",
    "count.row.one": "行",
    "count.row.other": "行",
    "count.column.one": "列",
    "count.column.other": "列",
    "count.box.one": "格",
    "count.box.other": "格",
    "bounds.heading": "上下界",
    "bounds.sigmaInterval": "二次 Artin 不变量区间",
    "bounds.pexpInterval": "多米诺 p-exponent 区间",
    "bounds.info": "更多",
    "bounds.assumption": String.raw`假定几何可实现；<span class="math-inline" data-tex="\sigma_{\mathrm{Art}}">σArt</span> 上端点还假定存在主极化。`,
    "bounds.min": "下限 {value}",
    "bounds.max": "上限 {value}{qualifier}",
    "bounds.inside": "位于区间内",
    "bounds.below": "低于下界",
    "bounds.above": "高于上界",
    "bounds.aria": "{name}：上下界为 {lower} 到 {upper}；实际值 {actual}，{status}。",
    "bounds.pexpName": "多米诺 p-exponent",
    "bounds.sigmaName": "二次 Artin 不变量",
    "bounds.ppQualifier": " / 主极化",
    "bounds.pexpFail": "p-exp {actual} 不在 [{lower}, {upper}] 内：不满足几何上下界",
    "bounds.sigmaBelow": "σArt {actual} < 几何下限 {lower}",
    "bounds.sigmaAbove": "σArt {actual} > 主极化上限 {upper}：不可主极化",
    "bounds.aOnlyExact": "仅由 a 决定 / e≤{exponent} / σArt≤{sigma} 主极化",
    "bounds.aOnlyCurrent": "仅由 a 决定 / σArt≤{sigma} 主极化 · e={actual} → {upper}",
    "validation.enterWord": "请输入二进制循环词",
    "validation.even": "长度必须为偶数 2g",
    "validation.binary": "每一项必须是 0 或 1",
    "validation.minG": "界面要求 g ≥ {g}",
    "validation.maxG": "界面要求 g ≤ {g}",
    "validation.ones": "必须恰好含有 {g} 个 1",
    "reconstruction.failed": "重构失败",
  },
};

let currentLanguage = "en";

function t(key, values = {}) {
  const template = translations[currentLanguage][key] ?? translations.en[key] ?? key;
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

function renderMath(element, latex, { displayMode = false } = {}) {
  element.dataset.tex = latex;
  if (!window.katex || typeof window.katex.render !== "function") {
    element.textContent = latex;
    return;
  }
  window.katex.render(latex, element, {
    displayMode,
    output: "htmlAndMathml",
    strict: "ignore",
    throwOnError: false,
    trust: false,
  });
}

function renderStaticMath(root = document) {
  const elements = [];
  if (root instanceof Element && root.matches("[data-tex]")) {
    elements.push(root);
  }
  elements.push(...root.querySelectorAll("[data-tex]"));
  for (const element of elements) {
    renderMath(element, element.dataset.tex, {
      displayMode: element.hasAttribute("data-tex-display"),
    });
  }
}

const forestRenderer = new window.ForestRenderer({
  viewport: forestViewport,
  stage: forestStage,
  zoomRange,
  zoomLabel,
  fitButton: document.querySelector("#zoom-fit"),
});

let currentResult = null;
let layoutMode = "scatter";
let flipped = false;
let currentYoungPartition = [];
let youngDiagramFrame = null;
const sequenceCopyValues = new Map();
let busyState = false;

function updateFlipButtonText() {
  flipButton.textContent = t(flipped ? "forest.rootDown" : "forest.rootUp");
}

function updateForestAccessibility() {
  if (!currentResult) return;
  const canvas = forestStage.querySelector("canvas");
  if (!canvas) return;
  const forest = currentResult.weighted_forest;
  canvas.setAttribute(
    "aria-label",
    t("forest.canvasAria", {
      nodes: forest.vertices.length.toLocaleString(),
      edges: forest.edges.length.toLocaleString(),
      components: forest.roots.length.toLocaleString(),
      orientation: t(flipped ? "forest.rootsBelow" : "forest.rootsAbove"),
    }),
  );
}

function refreshLocalizedDynamicContent() {
  analyzeButton.querySelector("span").textContent = busyState
    ? t("action.building")
    : t("action.build");
  updateFlipButtonText();
  syncRandomANumberLimit();
  if (currentResult) {
    const forest = currentResult.weighted_forest;
    if (forest.vertices.length === 0) {
      forestEmpty.querySelector("p").textContent = t("forest.empty");
    }
    updateForestAccessibility();
    renderPaperBounds(currentResult.paper_bounds, currentResult.g);
    requestYoungDiagramDraw();
  }
  let parsed;
  try {
    parsed = parseClientWord(input.value);
  } catch (error) {
    setMessage(error.message, "error");
    return;
  }
  if (busyState) {
    setMessage(t("status.reconstructing", { g: parsed.g }));
    return;
  }
  const matchesCurrentResult =
    currentResult &&
    parsed.values.length === currentResult.input_word.length &&
    parsed.values.every(
      (value, index) => value === currentResult.input_word[index],
    );
  if (matchesCurrentResult) {
    const forest = currentResult.weighted_forest;
    setMessage(
      t("status.success", {
        nodes: currentResult.invariants.dimension.toLocaleString(),
        trees: forest.roots.length.toLocaleString(),
      }),
      "success",
    );
    return;
  }
  setMessage(`2g=${parsed.values.length} / g=${parsed.g}`);
}

function applyLanguage(language) {
  currentLanguage = language === "zh" ? "zh" : "en";
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
  document.title = t("page.title");
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", t("page.description"));
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll("[data-i18n-html]")) {
    element.innerHTML = t(element.dataset.i18nHtml);
  }
  for (const element of document.querySelectorAll("[data-i18n-aria]")) {
    element.setAttribute("aria-label", t(element.dataset.i18nAria));
  }
  for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  }
  for (const button of languageButtons) {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.language === currentLanguage),
    );
  }
  renderStaticMath();
  refreshLocalizedDynamicContent();
}

for (const button of languageButtons) {
  button.addEventListener("click", () => applyLanguage(button.dataset.language));
}

function closeAboutDialog() {
  if (typeof aboutDialog.close === "function") {
    aboutDialog.close();
  } else {
    aboutDialog.removeAttribute("open");
  }
}

aboutOpen.addEventListener("click", () => {
  if (typeof aboutDialog.showModal === "function") {
    aboutDialog.showModal();
  } else {
    aboutDialog.setAttribute("open", "");
  }
});

aboutClose.addEventListener("click", closeAboutDialog);

aboutDialog.addEventListener("click", (event) => {
  if (event.target === aboutDialog) closeAboutDialog();
});

function parseClientWord(raw) {
  const trimmed = raw.trim();
  let values;
  if (/^[01]+$/.test(trimmed)) {
    values = [...trimmed].map(Number);
  } else {
    const tokens = trimmed.match(/-?\d+/g);
    values = tokens ? tokens.map(Number) : [];
  }

  if (values.length === 0) {
    throw new Error(t("validation.enterWord"));
  }
  if (values.length % 2 !== 0) {
    throw new Error(t("validation.even"));
  }
  if (values.some((value) => value !== 0 && value !== 1)) {
    throw new Error(t("validation.binary"));
  }
  const g = values.length / 2;
  if (g < minG) {
    throw new Error(t("validation.minG", { g: minG }));
  }
  if (g > maxG) {
    throw new Error(t("validation.maxG", { g: maxG }));
  }
  const ones = values.reduce((sum, value) => sum + value, 0);
  if (ones !== g) {
    throw new Error(t("validation.ones", { g }));
  }
  return { values, g };
}

function setMessage(text, state = "", markWordInvalid = true) {
  message.textContent = text;
  message.className = `validation-message ${state}`.trim();
  input.classList.toggle("invalid", state === "error" && markWordInvalid);
}

function setBusy(busy) {
  busyState = busy;
  analyzeButton.disabled = busy;
  analyzeButton.querySelector("span").textContent = busy
    ? t("action.building")
    : t("action.build");
}

function syncRandomANumberLimit() {
  const g = Number(randomGInput.value);
  const validG = Number.isInteger(g) && g >= minG && g <= maxG;
  randomGInput.setAttribute("aria-invalid", String(!validG));
  randomAInput.max = String(validG ? g : maxG);

  const rawA = randomAInput.value.trim();
  const aNumber = Number(rawA);
  const validA =
    rawA === "" ||
    (validG && Number.isInteger(aNumber) && aNumber >= 1 && aNumber <= g);
  const error = validA
    ? ""
    : validG
      ? t("random.aRange", { g })
      : t("random.setG");
  randomAInput.setCustomValidity(error);
  randomAInput.setAttribute("aria-invalid", String(!validA));
  return { valid: validA, value: rawA === "" ? null : aNumber, error };
}

function formatPartition(values) {
  return values.length ? `(${values.join(", ")})` : "∅";
}

function formatCompactSequence(values) {
  if (values.length === 0) return "∅";
  const parts = [];
  for (let index = 0; index < values.length; ) {
    const value = values[index];
    let end = index + 1;
    while (end < values.length && values[end] === value) {
      end += 1;
    }
    const count = end - index;
    if (count >= 2) {
      parts.push(`${value}^${count.toLocaleString()}`);
    } else {
      for (let repeat = 0; repeat < count; repeat += 1) {
        parts.push(String(value));
      }
    }
    index = end;
  }
  return `(${parts.join(", ")})`;
}

function renderSequence(targetId, values) {
  const element = document.querySelector(`#${targetId}`);
  const compact = formatCompactSequence(values);
  renderMath(element, compact === "∅" ? String.raw`\varnothing` : compact);
  sequenceCopyValues.set(targetId, formatPartition(values));
}

function formatCount(count, noun) {
  const form = count === 1 ? "one" : "other";
  return `${count.toLocaleString()} ${t(`count.${noun}.${form}`)}`;
}

function requestYoungDiagramDraw() {
  if (youngDiagramFrame !== null) return;
  youngDiagramFrame = requestAnimationFrame(() => {
    youngDiagramFrame = null;
    drawYoungDiagram();
  });
}

function drawYoungDiagramCanvas(canvas, cssHeight, maximumCellSize) {
  const context = canvas.getContext("2d");
  if (!context) return null;
  const cssWidth = Math.max(
    240,
    Math.floor(
      canvas.getBoundingClientRect().width ||
        canvas.parentElement.clientWidth ||
        640,
    ),
  );
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.ceil(cssWidth * ratio);
  const pixelHeight = Math.ceil(cssHeight * ratio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  canvas.style.height = `${cssHeight}px`;

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);

  const rows = currentYoungPartition.length;
  const columns = Math.max(...currentYoungPartition);
  const boxCount = currentYoungPartition.reduce(
    (sum, part) => sum + part,
    0,
  );
  const padding = 12;
  const availableWidth = Math.max(1, cssWidth - padding * 2);
  const availableHeight = cssHeight - padding * 2;
  const cellSize = Math.min(
    maximumCellSize,
    availableWidth / columns,
    availableHeight / rows,
  );
  const dense = cellSize < 4;
  const rootStyles = getComputedStyle(document.documentElement);
  const fill =
    rootStyles.getPropertyValue("--diagram-fill").trim() || "#eee2a9";
  const stroke =
    rootStyles.getPropertyValue("--diagram-stroke").trim() || "#a98e2c";

  context.fillStyle = fill;
  context.strokeStyle = stroke;
  context.lineJoin = "miter";

  if (!dense) {
    context.beginPath();
    for (let row = 0; row < rows; row += 1) {
      for (
        let column = 0;
        column < currentYoungPartition[row];
        column += 1
      ) {
        context.rect(
          padding + column * cellSize,
          padding + row * cellSize,
          cellSize,
          cellSize,
        );
      }
    }
    context.fill();
    context.lineWidth = Math.max(0.55, Math.min(1, cellSize * 0.08));
    context.stroke();
  } else {
    const columnScale = availableWidth / columns;
    const rowScale = availableHeight / rows;
    context.beginPath();
    context.moveTo(padding, padding);
    context.lineTo(
      padding + currentYoungPartition[0] * columnScale,
      padding,
    );
    for (let row = 0; row < rows; row += 1) {
      const nextY = padding + (row + 1) * rowScale;
      context.lineTo(
        padding + currentYoungPartition[row] * columnScale,
        nextY,
      );
      const nextPart =
        row + 1 < rows ? currentYoungPartition[row + 1] : 0;
      context.lineTo(padding + nextPart * columnScale, nextY);
    }
    context.lineTo(padding, padding);
    context.closePath();
    context.fill();
    context.lineWidth = 1;
    context.stroke();
  }

  return { rows, columns, boxCount, dense };
}

function drawYoungDiagramLargeCanvas() {
  const context = youngDiagramLargeCanvas.getContext("2d");
  if (!context) return;
  const rows = currentYoungPartition.length;
  const columns = Math.max(...currentYoungPartition);
  const rowAxisWidth = 52;
  const columnAxisHeight = 36;
  const preferredCellSize = 44;
  const safeCanvasExtent = 15000;
  const cellSize = Math.max(
    12,
    Math.min(
      preferredCellSize,
      Math.floor(
        safeCanvasExtent / Math.max(rows, columns),
      ),
    ),
  );
  const viewport = youngDiagramLargeViewport;
  const cssWidth = Math.max(
    viewport.clientWidth - rowAxisWidth - 2,
    columns * cellSize,
  );
  const cssHeight = Math.max(
    viewport.clientHeight - columnAxisHeight - 2,
    rows * cellSize,
  );

  function sizeCanvas(canvas, width, height) {
    canvas.width = Math.ceil(width);
    canvas.height = Math.ceil(height);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  sizeCanvas(youngDiagramLargeCanvas, cssWidth, cssHeight);
  sizeCanvas(youngDiagramColumnAxis, cssWidth, columnAxisHeight);
  sizeCanvas(youngDiagramRowAxis, rowAxisWidth, cssHeight);
  youngDiagramLargeStage.style.setProperty(
    "--young-row-axis-width",
    `${rowAxisWidth}px`,
  );
  youngDiagramLargeStage.style.setProperty(
    "--young-column-axis-height",
    `${columnAxisHeight}px`,
  );
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);

  const rootStyles = getComputedStyle(document.documentElement);
  context.fillStyle =
    rootStyles.getPropertyValue("--diagram-fill").trim() || "#eee2a9";
  context.strokeStyle =
    rootStyles.getPropertyValue("--diagram-stroke").trim() || "#a98e2c";
  context.lineWidth = 1;

  for (let row = 0; row < rows; row += 1) {
    for (
      let column = 0;
      column < currentYoungPartition[row];
      column += 1
    ) {
      const x = column * cellSize;
      const y = row * cellSize;
      context.fillRect(x, y, cellSize, cellSize);
      context.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
    }
  }

  function coordinateLabelStep(count) {
    const labelWidth = String(count).length * 6.6 + 2;
    const rawStep = Math.max(1, Math.ceil(labelWidth / cellSize));
    if (rawStep <= 1) return 1;
    if (rawStep <= 2) return 2;
    if (rawStep <= 5) return 5;
    return Math.ceil(rawStep / 10) * 10;
  }

  function coordinateIndices(count) {
    const step = coordinateLabelStep(count);
    const indices = [];
    for (let index = 0; index < count; index += step) indices.push(index);
    const last = count - 1;
    if (indices.at(-1) !== last) {
      const previous = indices.at(-1);
      if (previous === undefined || (last - previous) * cellSize >= 28) {
        indices.push(last);
      }
    }
    return indices;
  }

  const axisBackground =
    rootStyles.getPropertyValue("--surface-raised").trim() || "#f5f3eb";
  const axisInk =
    rootStyles.getPropertyValue("--ink").trim() || "#20221e";
  const axisLine =
    rootStyles.getPropertyValue("--hairline").trim() || "#c9cac3";
  const axisFontSize = cellSize >= 20 ? 11 : 10;
  const axisFont =
    `${axisFontSize}px ui-monospace, SFMono-Regular, Consolas, monospace`;

  const columnContext = youngDiagramColumnAxis.getContext("2d");
  columnContext.clearRect(0, 0, cssWidth, columnAxisHeight);
  columnContext.fillStyle = axisBackground;
  columnContext.fillRect(0, 0, cssWidth, columnAxisHeight);
  columnContext.strokeStyle = axisLine;
  columnContext.beginPath();
  columnContext.moveTo(0, columnAxisHeight - 0.5);
  columnContext.lineTo(cssWidth, columnAxisHeight - 0.5);
  columnContext.stroke();
  columnContext.fillStyle = axisInk;
  columnContext.font = axisFont;
  columnContext.textAlign = "center";
  columnContext.textBaseline = "middle";
  for (const column of coordinateIndices(columns)) {
    columnContext.fillText(
      String(column + 1),
      (column + 0.5) * cellSize,
      columnAxisHeight / 2,
    );
  }

  const rowContext = youngDiagramRowAxis.getContext("2d");
  rowContext.clearRect(0, 0, rowAxisWidth, cssHeight);
  rowContext.fillStyle = axisBackground;
  rowContext.fillRect(0, 0, rowAxisWidth, cssHeight);
  rowContext.strokeStyle = axisLine;
  rowContext.beginPath();
  rowContext.moveTo(rowAxisWidth - 0.5, 0);
  rowContext.lineTo(rowAxisWidth - 0.5, cssHeight);
  rowContext.stroke();
  rowContext.fillStyle = axisInk;
  rowContext.font = axisFont;
  rowContext.textAlign = "right";
  rowContext.textBaseline = "middle";
  for (const row of coordinateIndices(rows)) {
    rowContext.fillText(
      String(row + 1),
      rowAxisWidth - 8,
      (row + 0.5) * cellSize,
    );
  }
}

function drawYoungDiagram() {
  if (currentYoungPartition.length === 0 || youngDiagramPanel.hidden) {
    return;
  }
  const stats = drawYoungDiagramCanvas(youngDiagramCanvas, 160, 24);
  if (!stats) return;

  const { rows, columns, boxCount, dense } = stats;
  const densityNote = dense ? ` · ${t("young.scaled")}` : "";
  youngDiagramMeta.textContent =
    `${formatCount(rows, "row")} · ${formatCount(columns, "column")} · ` +
    `${formatCount(boxCount, "box")}${densityNote}`;

  if (youngDiagramDialog.open) {
    drawYoungDiagramLargeCanvas();
    youngDiagramLargeCanvas.setAttribute(
      "aria-label",
      t("young.aria", {
        rows: formatCount(rows, "row"),
        columns: formatCount(columns, "column"),
        boxes: formatCount(boxCount, "box"),
      }),
    );
  }
}

function closeYoungDiagramDialog() {
  if (typeof youngDiagramDialog.close === "function") {
    youngDiagramDialog.close();
  } else {
    youngDiagramDialog.removeAttribute("open");
  }
}

function renderYoungDiagram(partition) {
  currentYoungPartition = [...partition];
  youngDiagramPanel.hidden = partition.length === 0;
  if (partition.length === 0) {
    youngDiagramMeta.textContent = "";
    for (const canvas of [
      youngDiagramCanvas,
      youngDiagramLargeCanvas,
      youngDiagramColumnAxis,
      youngDiagramRowAxis,
    ]) {
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    if (youngDiagramDialog.open) closeYoungDiagramDialog();
    return;
  }
  requestYoungDiagramDraw();
}

youngDiagramOpen.addEventListener("click", () => {
  youngDiagramLargeViewport.scrollTop = 0;
  youngDiagramLargeViewport.scrollLeft = 0;
  if (typeof youngDiagramDialog.showModal === "function") {
    youngDiagramDialog.showModal();
  } else {
    youngDiagramDialog.setAttribute("open", "");
  }
  requestYoungDiagramDraw();
});

youngDiagramClose.addEventListener("click", () => {
  closeYoungDiagramDialog();
});

youngDiagramDialog.addEventListener("click", (event) => {
  if (event.target === youngDiagramDialog) closeYoungDiagramDialog();
});

function formatInteger(value) {
  return Number(value).toLocaleString(currentLanguage === "zh" ? "zh-CN" : "en-US");
}

function paperFormulaToLatex(formula) {
  const formulas = new Map([
    ["⌈(g − 1)/a⌉", String.raw`\left\lceil\frac{g-1}{a}\right\rceil`],
    ["0 (degree two is trivial)", String.raw`0\quad\text{(degree two is trivial)}`],
    ["1 (surface case)", String.raw`1\quad\text{(surface case)}`],
    ["g − 1 (a = 1)", String.raw`g-1\quad(a=1)`],
    ["g − 2 (a = 2)", String.raw`g-2\quad(a=2)`],
    ["g − a + 1", String.raw`g-a+1`],
    ["g(g − 1) − C(a, 2)", String.raw`g(g-1)-\binom{a}{2}`],
    ["⌊e g(2g − 1)/2⌋", String.raw`\left\lfloor\frac{eg(2g-1)}{2}\right\rfloor`],
    [
      "⌊E_max(a) g(2g − 1)/2⌋",
      String.raw`\left\lfloor\frac{E_{\max}(a)g(2g-1)}{2}\right\rfloor`,
    ],
  ]);
  return formulas.get(formula) ?? String(formula).replaceAll("−", "-");
}

function localizePaperLatex(latex) {
  if (currentLanguage !== "zh") return latex;
  return latex
    .replace(
      String.raw`\text{(surface case)}`,
      String.raw`\text{（曲面情形）}`,
    )
    .replace(
      String.raw`\text{(degree two is trivial)}`,
      String.raw`\text{（二次情形平凡）}`,
    );
}

function boundPlotPositions(lower, upper, actual) {
  const visualStart = 8;
  const visualEnd = 92;
  const domainMinimum = Math.min(lower, actual);
  const domainMaximum = Math.max(upper, actual);
  if (domainMinimum === domainMaximum) {
    return {
      intervalStart: 50,
      intervalEnd: 50,
      marker: 50,
    };
  }
  const project = (value) =>
    visualStart +
    ((value - domainMinimum) / (domainMaximum - domainMinimum)) *
      (visualEnd - visualStart);
  return {
    intervalStart: project(lower),
    intervalEnd: project(upper),
    marker: project(actual),
  };
}

function renderBoundInterval({
  prefix,
  name,
  symbol,
  lower,
  upper,
  actual,
  upperQualifier = "",
}) {
  const row = document.querySelector(`#bound-${prefix}-row`);
  const plot = document.querySelector(`#bound-${prefix}-plot`);
  const markerLabel = document.querySelector(
    `#bound-${prefix}-marker-label`,
  );
  const lowerLabel = document.querySelector(`#bound-${prefix}-lower`);
  const upperLabel = document.querySelector(`#bound-${prefix}-upper`);
  const exact = lower === upper;
  let status = "inside";
  if (actual < lower) status = "below";
  if (actual > upper) status = "above";

  const positions = boundPlotPositions(lower, upper, actual);
  const position = positions.marker;

  row.classList.toggle("is-exact", exact);
  row.classList.toggle("is-outside", status !== "inside");
  row.classList.toggle("is-below", status === "below");
  row.classList.toggle("is-above", status === "above");
  row.classList.toggle("marker-at-lower", position <= 8);
  row.classList.toggle("marker-at-upper", position >= 92);
  row.classList.toggle("interval-at-left", positions.intervalStart <= 8);
  row.classList.toggle("interval-at-right", positions.intervalEnd >= 92);
  plot.style.setProperty("--marker-position", `${position}%`);
  plot.style.setProperty(
    "--interval-start",
    `${positions.intervalStart}%`,
  );
  plot.style.setProperty(
    "--interval-end",
    `${positions.intervalEnd}%`,
  );

  renderMath(markerLabel, `${symbol}=${actual}`);

  if (exact) {
    renderMath(lowerLabel, `=${lower}`);
    upperLabel.hidden = true;
  } else {
    lowerLabel.textContent = t("bounds.min", { value: formatInteger(lower) });
    upperLabel.textContent = t("bounds.max", {
      value: formatInteger(upper),
      qualifier: upperQualifier,
    });
    upperLabel.hidden = false;
  }

  const statusText =
    status === "inside"
      ? t("bounds.inside")
      : status === "below"
        ? t("bounds.below")
        : t("bounds.above");
  plot.setAttribute(
    "aria-label",
    t("bounds.aria", {
      name,
      lower: formatInteger(lower),
      upper: formatInteger(upper),
      actual: formatInteger(actual),
      status: statusText,
    }),
  );
  return status;
}

function renderBoundsObservation(bounds, sigmaStatus, exponentStatus) {
  const observation = document.querySelector("#bounds-observation");
  const messages = [];
  const exponent = bounds.p_exponent;
  const sigma = bounds.sigma_Art;

  if (exponentStatus !== "inside") {
    messages.push(
      t("bounds.pexpFail", {
        actual: formatInteger(exponent.actual),
        lower: formatInteger(exponent.lower),
        upper: formatInteger(exponent.upper),
      }),
    );
  }
  if (sigmaStatus === "below") {
    messages.push(
      t("bounds.sigmaBelow", {
        actual: formatInteger(sigma.actual),
        lower: formatInteger(sigma.lower),
      }),
    );
  } else if (sigmaStatus === "above") {
    messages.push(
      t("bounds.sigmaAbove", {
        actual: formatInteger(sigma.actual),
        upper: formatInteger(sigma.upper),
      }),
    );
  }

  observation.replaceChildren();
  if (messages.length === 0) {
    observation.hidden = true;
    return;
  }
  for (const text of messages) {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    observation.append(paragraph);
  }
  observation.hidden = false;
}

function renderPaperBounds(bounds, g) {
  const aNumber = bounds.a_number;
  const exponent = bounds.p_exponent;
  const sigma = bounds.sigma_Art;
  renderMath(
    document.querySelector("#value-anumber-range"),
    `${aNumber.lower}\\le a\\le ${aNumber.upper}`,
  );
  renderMath(
    document.querySelector("#bounds-parameters"),
    `g=${g},\\quad a=${aNumber.actual}`,
  );
  const exponentLowerLatex = localizePaperLatex(
    exponent.lower_latex ?? paperFormulaToLatex(exponent.lower_formula),
  );
  const exponentUpperLatex = localizePaperLatex(
    exponent.upper_latex ?? paperFormulaToLatex(exponent.upper_formula),
  );
  const sigmaLowerLatex = localizePaperLatex(
    sigma.lower_latex ?? paperFormulaToLatex(sigma.lower_formula),
  );
  const sigmaUpperLatex = localizePaperLatex(
    sigma.upper_latex ?? paperFormulaToLatex(sigma.upper_formula),
  );
  renderMath(
    document.querySelector("#bound-pexp-formula"),
    `${exponentLowerLatex}\\le e\\le ${exponentUpperLatex}`,
  );
  renderMath(
    document.querySelector("#bound-sigma-formula"),
    `${sigmaLowerLatex}\\le \\sigma_{\\mathrm{Art}}\\le ${sigmaUpperLatex}`,
  );

  const exponentStatus = renderBoundInterval({
    prefix: "pexp",
    name: t("bounds.pexpName"),
    symbol: "e",
    lower: exponent.lower,
    upper: exponent.upper,
    actual: exponent.actual,
  });
  const sigmaStatus = renderBoundInterval({
    prefix: "sigma",
    name: t("bounds.sigmaName"),
    symbol: String.raw`\sigma_{\mathrm{Art}}`,
    lower: sigma.lower,
    upper: sigma.upper,
    actual: sigma.actual,
    upperQualifier: t("bounds.ppQualifier"),
  });

  const envelope = document.querySelector("#bound-sigma-envelope");
  if (sigma.a_number_upper === sigma.upper) {
    envelope.textContent = t("bounds.aOnlyExact", {
      exponent: formatInteger(exponent.upper),
      sigma: formatInteger(sigma.a_number_upper),
    });
  } else {
    envelope.textContent = t("bounds.aOnlyCurrent", {
      sigma: formatInteger(sigma.a_number_upper),
      actual: formatInteger(exponent.actual),
      upper: formatInteger(sigma.upper),
    });
  }
  renderBoundsObservation(bounds, sigmaStatus, exponentStatus);
}

function renderResult(result) {
  currentResult = result;
  renderMath(
    wordSummary,
    String.raw`\boldsymbol{\varepsilon}=\mathtt{${result.canonical_word.join("")}}\quad g=${result.g}\quad a=${result.a_number}`,
  );

  const forest = result.weighted_forest;
  if (forest.vertices.length === 0) {
    forestRenderer.clear();
    forestToolbar.hidden = true;
    forestViewport.hidden = true;
    forestEmpty.hidden = false;
    forestEmpty.querySelector("p").textContent =
      t("forest.empty");
  } else {
    forestEmpty.hidden = true;
    forestToolbar.hidden = false;
    forestViewport.hidden = false;
    forestRenderer.render(forest, result.canonical_word, {
      layoutMode,
      shuffleRound: 0,
      flipped,
    });
  }
  updateForestAccessibility();

  const invariants = result.invariants;
  renderSequence("value-j", invariants.type_sequence);
  renderSequence("value-lambda", invariants.isogeny_partition);
  renderMath(
    document.querySelector("#count-j"),
    `n=${invariants.type_sequence.length}`,
  );
  renderMath(
    document.querySelector("#count-lambda"),
    `n=${invariants.isogeny_partition.length}`,
  );
  renderMath(
    document.querySelector("#value-sigma"),
    String(invariants.sigma_Art),
  );
  renderMath(
    document.querySelector("#value-pexp"),
    String(invariants.p_exponent),
  );
  renderMath(
    document.querySelector("#value-anumber"),
    String(invariants.a_number),
  );
  renderPaperBounds(result.paper_bounds, result.g);
  invariantGrid.hidden = false;
  renderYoungDiagram(invariants.isogeny_partition);
}

async function analyze(rawWord, scrollAfter = true) {
  let parsed;
  try {
    parsed = parseClientWord(rawWord);
  } catch (error) {
    setMessage(error.message, "error");
    return;
  }

  setBusy(true);
  setMessage(t("status.reconstructing", { g: parsed.g }));
  try {
    const result = globalThis.CyclicDomino.analyzePayload({ word: rawWord });
    setMessage(t("status.rendering"));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    renderResult(result);
    setMessage(
      t("status.success", {
        nodes: result.invariants.dimension.toLocaleString(),
        trees: result.weighted_forest.roots.length.toLocaleString(),
      }),
      "success",
    );
    if (scrollAfter) {
      resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    setBusy(false);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  analyze(input.value);
});

input.addEventListener("input", () => {
  try {
    const parsed = parseClientWord(input.value);
    setMessage(`2g=${parsed.values.length} / g=${parsed.g}`);
  } catch (error) {
    setMessage(error.message, "error");
  }
});

randomGInput.addEventListener("input", syncRandomANumberLimit);
randomAInput.addEventListener("input", syncRandomANumberLimit);

randomButton.addEventListener("click", async () => {
  const g = Number(randomGInput.value);
  if (!Number.isInteger(g) || g < minG || g > maxG) {
    setMessage(
      t("random.invalidG", { min: minG, max: maxG }),
      "error",
      false,
    );
    randomGInput.focus();
    return;
  }
  const aNumber = syncRandomANumberLimit();
  if (!aNumber.valid) {
    setMessage(aNumber.error, "error", false);
    randomAInput.focus();
    return;
  }

  randomButton.disabled = true;
  setMessage(
    aNumber.value === null
      ? t("status.randomAny", { g })
      : t("status.randomA", { g, a: aNumber.value }),
  );
  try {
    const result = globalThis.CyclicDomino.randomWordPayload({
      g,
      a_number: aNumber.value,
    });
    input.value = result.word;
    await analyze(input.value);
  } catch (error) {
    setMessage(error.message, "error", false);
  } finally {
    randomButton.disabled = false;
  }
});

for (const button of document.querySelectorAll("[data-layout]")) {
  button.addEventListener("click", () => {
    layoutMode = button.dataset.layout;
    for (const peer of document.querySelectorAll("[data-layout]")) {
      const active = peer === button;
      peer.classList.toggle("active", active);
      peer.setAttribute("aria-pressed", String(active));
    }
    shuffleButton.disabled = layoutMode !== "scatter";
    forestToolbar.classList.toggle("grid-mode", layoutMode === "grid");
    forestStage.className = `forest-stage layout-${layoutMode}`;
    forestRenderer.setLayout(layoutMode);
    updateForestAccessibility();
  });
}

shuffleButton.addEventListener("click", () => {
  forestRenderer.shuffle();
  updateForestAccessibility();
});

flipButton.addEventListener("click", () => {
  flipped = !flipped;
  flipButton.classList.toggle("active", flipped);
  flipButton.setAttribute("aria-pressed", String(flipped));
  updateFlipButtonText();
  forestRenderer.setFlipped(flipped);
  updateForestAccessibility();
});

for (const button of document.querySelectorAll("[data-copy-target]")) {
  button.addEventListener("click", async () => {
    const targetId = button.dataset.copyTarget;
    const target = document.querySelector(`#${targetId}`);
    const value = sequenceCopyValues.get(targetId) ?? target.textContent;
    try {
      await navigator.clipboard.writeText(value);
      button.classList.add("copied");
      button.setAttribute("aria-label", t("copy.copied"));
      setTimeout(() => {
        button.classList.remove("copied");
        button.setAttribute("aria-label", t(button.dataset.i18nAria));
      }, 1000);
    } catch (_error) {
      setMessage(
        t("copy.unavailable"),
        "error",
      );
    }
  });
}

window.addEventListener("resize", () => {
  if (!forestViewport.hidden && currentResult) {
    forestRenderer.resize();
  }
  if (currentYoungPartition.length > 0) {
    requestYoungDiagramDraw();
  }
});

applyLanguage("en");
syncRandomANumberLimit();
analyze(input.value, false);
