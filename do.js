/* 人生五年 · 「写你的五年」页交互
   - 引子卡变体切换（截图安全：每个状态为静态文本）
   - 标签一键复制
   - 滚动显现
*/

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 引子卡变体 ---------- */

const variants = [
  { line: "写下此刻的你。", spark: "五年后，再读一次。" },
  { line: "你想对五年后的自己，说什么？", spark: "选一个路口，写下来。" },
  { line: "哪件事，悄悄改变了你？", spark: "不必完整，一句也算。" },
];

const cardLine = document.querySelector("[data-card-line]");
const cardSpark = document.querySelector("[data-card-spark]");
const variantButtons = document.querySelectorAll("[data-variant]");

function applyVariant(index) {
  const variant = variants[index];
  if (!variant || !cardLine || !cardSpark) return;
  variantButtons.forEach((button) =>
    button.classList.toggle("active", Number(button.dataset.variant) === index)
  );
  if (prefersReduced) {
    cardLine.textContent = variant.line;
    cardSpark.textContent = variant.spark;
    return;
  }
  cardLine.style.opacity = "0";
  cardSpark.style.opacity = "0";
  window.setTimeout(() => {
    cardLine.textContent = variant.line;
    cardSpark.textContent = variant.spark;
    cardLine.style.opacity = "1";
    cardSpark.style.opacity = "1";
  }, 200);
}

variantButtons.forEach((button) =>
  button.addEventListener("click", () => applyVariant(Number(button.dataset.variant)))
);

/* ---------- 标签复制 ---------- */

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) { /* ignore */ }
  document.body.removeChild(ta);
}

function flash(button) {
  const hint = button.querySelector(".copy-hint");
  if (hint) {
    const original = hint.textContent;
    hint.textContent = "已复制 ✓";
    window.setTimeout(() => { hint.textContent = original; }, 1300);
  } else {
    const tag = button.dataset.copy;
    button.textContent = `${tag} 已复制 ✓`;
    window.setTimeout(() => { button.textContent = tag; }, 1300);
  }
}

function copyText(text, button) {
  const done = () => flash(button);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => { fallbackCopy(text); done(); });
  } else {
    fallbackCopy(text);
    done();
  }
}

document.querySelectorAll("[data-copy]").forEach((button) =>
  button.addEventListener("click", () => copyText(button.dataset.copy, button))
);

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
