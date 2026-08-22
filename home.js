/* 人生五年 · 首页交互
   - 访谈摘录轮换：纯手动（按钮 + 刻度条），不自动播放，让读者停下来
   - 滚动显现
*/

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 访谈摘录轮换（手动） ---------- */

let voices = [];

const chineseOrders = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

function issueLabel(order) {
  return `第${chineseOrders[order] || order}期`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function articleUrl(article) {
  return `articles/view.html?id=${encodeURIComponent(article.id)}`;
}

const el = {
  ghost: document.querySelector("[data-stage-ghost]"),
  issue: document.querySelector("[data-stage-issue]"),
  quoteWrap: document.querySelector("[data-stage-quote-wrap]"),
  quote: document.querySelector("[data-stage-quote]"),
  byline: document.querySelector(".stage-byline"),
  name: document.querySelector("[data-stage-name]"),
  situation: document.querySelector("[data-stage-situation]"),
  link: document.querySelector("[data-stage-link]"),
  next: document.querySelector("[data-stage-next]"),
  ticks: document.querySelector("[data-stage-ticks]"),
};

let current = 0;

function buildTicks() {
  if (!el.ticks) return;
  el.ticks.innerHTML = "";
  voices.forEach((voice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `摘录 ${index + 1}：${voice.name}`);
    button.addEventListener("click", () => show(index));
    el.ticks.appendChild(button);
  });
}

function markTicks() {
  if (!el.ticks) return;
  el.ticks.querySelectorAll("button").forEach((button, index) => {
    button.classList.toggle("active", index === current);
  });
}

function apply(index) {
  const voice = voices[index];
  if (!voice) return;
  el.ghost.textContent = voice.order;
  el.issue.textContent = voice.issue;
  el.quote.textContent = voice.quote;
  el.name.textContent = voice.name;
  el.situation.textContent = voice.situation;
  el.link.textContent = voice.read;
  el.link.setAttribute("href", voice.url);
  markTicks();
}

function show(index) {
  if (!voices.length) return;
  current = (index + voices.length) % voices.length;
  if (prefersReduced) {
    apply(current);
    return;
  }
  el.quoteWrap.classList.add("is-out");
  el.byline.classList.add("is-out");
  window.setTimeout(() => {
    apply(current);
    el.quoteWrap.classList.remove("is-out");
    el.byline.classList.remove("is-out");
  }, 380);
}

function renderLifeIndex(issues, articlesBySource) {
  const target = document.querySelector("[data-life-index]");
  if (!target) return;

  target.innerHTML = [...issues]
    .sort((a, b) => b.order - a.order)
    .map((issue) => {
      const article = articlesBySource.get(issue.storySourcePath);
      const quote = issue.quote || issue.publicNote || "这期记录仍在等待合适的公开时刻。";
      const content = `
        <span class="index-top">
          <span class="index-sit">${escapeHtml(issue.indexTitle)}</span>
          <span class="index-who mono">${escapeHtml(issue.name)} · ${escapeHtml(issueLabel(issue.order))}</span>
          <span class="index-arrow" aria-hidden="true">→</span>
        </span>
        <span class="index-quote">「${escapeHtml(quote)}」</span>`;

      return article && article.status === "published"
        ? `<li class="index-row"><a href="${articleUrl(article)}">${content}</a></li>`
        : `<li class="index-row index-row--withheld"><div class="index-entry">${content}</div></li>`;
    })
    .join("");
}

async function bootLifeIssues() {
  try {
    const [issueResponse, articleResponse] = await Promise.all([
      fetch("data/life-issues.json", { cache: "no-store" }),
      fetch("data/articles.json", { cache: "no-store" })
    ]);
    if (!issueResponse.ok || !articleResponse.ok) throw new Error("访谈索引加载失败");

    const [{ issues }, articleData] = await Promise.all([
      issueResponse.json(),
      articleResponse.json()
    ]);
    const articlesBySource = new Map(
      (articleData.articles || []).map((article) => [article.sourcePath, article])
    );
    const publishedIssues = issues
      .filter((issue) => issue.visibility === "published")
      .map((issue) => ({ issue, article: articlesBySource.get(issue.storySourcePath) }))
      .filter(({ issue, article }) => issue.quote && article?.status === "published")
      .sort((a, b) => b.issue.order - a.issue.order);

    voices = publishedIssues.map(({ issue, article }) => ({
      order: String(issue.order).padStart(2, "0"),
      issue: `${issueLabel(issue.order)}访谈`,
      name: issue.name,
      situation: issue.stageSituation,
      quote: issue.quote,
      url: articleUrl(article),
      read: issue.readLabel || "读这期故事"
    }));

    renderLifeIndex(issues, articlesBySource);
    const latest = publishedIssues[0]?.issue;
    if (latest) {
      document.querySelector("[data-latest-issue]").textContent = issueLabel(latest.order);
      document.querySelector("[data-latest-question]").textContent = `「${latest.question}」`;
    }

    if (el.quote && voices.length) {
      current = 0;
      buildTicks();
      apply(current);
    }
  } catch (error) {
    const target = document.querySelector("[data-life-index]");
    if (target) target.innerHTML = `<li class="index-row index-row--loading">${escapeHtml(error.message)}</li>`;
  }
}

if (el.quote) {
  if (el.next) el.next.addEventListener("click", () => show(current + 1));
  bootLifeIssues();
}

/* ---------- 滚动显现 ---------- */

const revealTargets = document.querySelectorAll("[data-reveal]");

if (prefersReduced || !("IntersectionObserver" in window)) {
  revealTargets.forEach((node) => node.classList.add("is-in"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  revealTargets.forEach((node) => observer.observe(node));
}
