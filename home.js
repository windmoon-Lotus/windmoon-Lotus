/* 人生五年 · 首页交互
   - 访谈摘录轮换：纯手动（按钮 + 刻度条），不自动播放，让读者停下来
   - 滚动显现
*/

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 访谈摘录轮换（手动） ---------- */

const voices = [
  {
    order: "07",
    issue: "第七期访谈",
    name: "小鱼",
    situation: "高校教师 · 心理学博士在读 · 第七期",
    quote: "我希望五年后的自己，重新成为一个有坚定目标的人。",
    url: "articles/view.html?id=life-018155f04bad",
    read: "读她的故事",
  },
  {
    order: "03",
    issue: "第三期访谈",
    name: "流年",
    situation: "离职两年 · 功能测试出身 · 第三期",
    quote: "不上班是为了什么？肯定不是为了委屈自己。",
    url: "articles/view.html?id=life-4c03b7637a91",
    read: "读他的故事",
  },
  {
    order: "06",
    issue: "第六期访谈",
    name: "重新成为创作者的她",
    situation: "美术教师 · 母亲 · 第六期",
    quote: "我想给自己一个交代。",
    url: "articles/view.html?id=life-aff7e01fd6d0",
    read: "读她的故事",
  },
  {
    order: "04",
    issue: "第四期访谈",
    name: "好想养李",
    situation: "视频监控部署工程师 · 年轻父亲 · 第四期",
    quote: "人生并不总是在一个人想清楚以后才开始。",
    url: "articles/view.html?id=life-e473fc8264e0",
    read: "读他的故事",
  },
  {
    order: "02",
    issue: "第二期访谈",
    name: "刘进步",
    situation: "保险代理 · 前基建投资 · 第二期",
    quote: "一生努力，一生被爱。",
    url: "articles/view.html?id=life-a3c5298224a1",
    read: "读她的故事",
  },
  {
    order: "05",
    issue: "第五期访谈",
    name: "一个幸福的家庭",
    situation: "爱情 · 共同生活 · 第五期",
    quote: "幸福不是被讲出来的，而是在一顿饭、一次接住、一个家里长出来的。",
    url: "articles/view.html?id=life-f5136c0f1784",
    read: "读这个家的故事",
  },
  {
    order: "01",
    issue: "第一期访谈",
    name: "Yamu",
    situation: "自由职业 · 一人公司 · 第一期",
    quote: "相信人生的意义藏在风、雨、阳光和每一餐饭里。",
    url: "articles/view.html?id=life-cc8cf6a30eb1",
    read: "读她的故事",
  },
];

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

if (el.quote) {
  buildTicks();
  apply(current);
  if (el.next) el.next.addEventListener("click", () => show(current + 1));
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
