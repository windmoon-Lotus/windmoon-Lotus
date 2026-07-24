const rootPrefix = document.documentElement.dataset.root || ".";
const pageSize = 12;

const statusLabels = {
  published: "公开阅读",
  archive: "资料归档",
  draft: "内部草稿"
};

const sectionConfig = {
  "life-interview": { title: "人生五年访谈", intro: "以长期追踪为目标的人物访谈主线。", href: `${rootPrefix}/life/` },
  "career-interview": { title: "职业访谈", intro: "百家职业共享阶段积累的职业与人生样本。", href: `${rootPrefix}/career/` },
  essay: { title: "随笔", intro: "访谈背后的问题意识、阅读与生活观察。", href: `${rootPrefix}/essays/` },
  topic: { title: "人生话题", intro: "围绕婚姻、意义、人生坑点等主题的整理。", href: `${rootPrefix}/topics/` },
  template: { title: "共创模板", intro: "访谈、问卷、职业百科等可复用模板。", href: `${rootPrefix}/templates/` },
  encyclopedia: { title: "职业百科", intro: "结构化职业条目与行业目录。", href: `${rootPrefix}/encyclopedia/` },
  project: { title: "项目故事", intro: "项目发展、规划、复盘与前史。", href: `${rootPrefix}/projects/` },
  lab: { title: "项目实验", intro: "进行中的项目构思和实践材料。", href: `${rootPrefix}/projects/` },
  tool: { title: "探索工具", intro: "行业、自我方向与知识库工具。", href: `${rootPrefix}/tools/` },
  knowledge: { title: "趣味知识", intro: "辅助理解职业与社会的小知识。", href: `${rootPrefix}/tools/` },
  policy: { title: "管理规范", intro: "授权、贡献、脱敏等规则。", href: `${rootPrefix}/projects/` },
  about: { title: "项目说明", intro: "项目定位、愿景和参与方式。", href: `${rootPrefix}/projects/` }
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadArticles() {
  const response = await fetch(`${rootPrefix}/data/articles.json`, { cache: "no-store" });
  if (!response.ok) throw new Error("文章索引加载失败");
  const data = await response.json();
  return data.articles || [];
}

function articleUrl(id) {
  return `${rootPrefix}/articles/view.html?id=${encodeURIComponent(id)}`;
}

function articleTitle(article) {
  return article.displayTitle || article.title;
}

function readingMinutes(article) {
  return Math.max(1, Math.round((article.wordCount || 0) / 500));
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function sourceLink(article) {
  if (!article.sourceUrl) return "";
  return `<a class="reader-source-link" href="${escapeHtml(article.sourceUrl)}" target="_blank" rel="noreferrer">查看 GitHub 原始素材</a>`;
}

function renderArticleCard(article) {
  const rawLink = article.sourceUrl
    ? `<a class="source-text-link" href="${escapeHtml(article.sourceUrl)}" target="_blank" rel="noreferrer">原始素材</a>`
    : "";

  return `
    <article class="library-card${article.featured ? " is-featured" : ""}">
      <div class="library-meta">
        <span>${escapeHtml(article.sectionLabel)}</span>
        <span>${escapeHtml(article.sourceProjectLabel)}</span>
        ${article.featured ? "<span>编辑精选</span>" : ""}
      </div>
      <h3><a href="${articleUrl(article.id)}">${escapeHtml(articleTitle(article))}</a></h3>
      <p>${escapeHtml(article.excerpt || "暂无摘要。")}</p>
      <div class="library-card-foot">
        <span>${readingMinutes(article)} 分钟读完</span>
        <div class="library-card-actions">
          <a href="${articleUrl(article.id)}">阅读文章</a>
          ${rawLink}
        </div>
      </div>
    </article>
  `;
}

function renderEmpty(target, message) {
  target.innerHTML = `<div class="library-empty">${escapeHtml(message)}</div>`;
}

function filterArticles(articles, { sectionList, query, status, category }) {
  const sections = sectionList.filter(Boolean);
  const normalizedQuery = query.trim().toLowerCase();
  return articles.filter((article) => {
    const sectionMatched = sections.length === 0 || sections.includes(article.section);
    if (!sectionMatched) return false;
    if (status && article.status !== status) return false;
    if (category && article.section !== category) return false;
    if (!normalizedQuery) return true;
    return [articleTitle(article), article.title, article.excerpt, article.sectionLabel, article.sourcePath]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

async function bootArticleList() {
  const target = document.querySelector("[data-article-list]");
  if (!target) return;

  const countTarget = document.querySelector("[data-article-count]");
  const searchInput = document.querySelector("[data-article-search]");
  const categorySelect = document.querySelector("[data-article-category]");
  const sortSelect = document.querySelector("[data-article-sort]");
  const statusButtons = [...document.querySelectorAll("[data-status-filter]")];
  const sections = (document.documentElement.dataset.sections || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowedStatuses = (document.documentElement.dataset.statuses || "published")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  let selectedStatus = statusButtons.find((button) => button.classList.contains("active"))?.dataset.statusFilter
    || allowedStatuses[0]
    || "published";
  let visibleCount = pageSize;

  const loadMore = document.createElement("button");
  loadMore.type = "button";
  loadMore.className = "button button-secondary library-load-more";
  loadMore.textContent = "加载更多";
  target.insertAdjacentElement("afterend", loadMore);

  try {
    const articles = await loadArticles();

    const render = ({ reset = false } = {}) => {
      if (reset) visibleCount = pageSize;
      const status = statusButtons.length ? selectedStatus : null;
      const category = categorySelect?.value || "";
      const visible = filterArticles(articles, {
        sectionList: sections,
        query: searchInput?.value || "",
        status,
        category
      })
        .filter((article) => status || allowedStatuses.includes(article.status || "published"))
        .sort((a, b) => {
          if (sortSelect?.value === "title") {
            return articleTitle(a).localeCompare(articleTitle(b), "zh-CN");
          }
          if (sortSelect?.value === "newest") {
            return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
          }
          return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
        });
      if (countTarget) {
        countTarget.textContent = `${visible.length} 篇${selectedStatus ? ` · ${statusLabels[selectedStatus] || ""}` : ""}`;
      }
      if (visible.length === 0) {
        renderEmpty(target, "没有找到匹配的文章。");
        loadMore.hidden = true;
        return;
      }
      target.innerHTML = visible.slice(0, visibleCount).map(renderArticleCard).join("");
      loadMore.hidden = visibleCount >= visible.length;
    };

    searchInput?.addEventListener("input", () => render({ reset: true }));
    categorySelect?.addEventListener("change", () => render({ reset: true }));
    sortSelect?.addEventListener("change", () => render({ reset: true }));
    statusButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectedStatus = button.dataset.statusFilter;
        statusButtons.forEach((item) => {
          const active = item === button;
          item.classList.toggle("active", active);
          item.setAttribute("aria-pressed", active ? "true" : "false");
        });
        render({ reset: true });
      });
    });
    loadMore.addEventListener("click", () => {
      visibleCount += pageSize;
      render();
    });
    render();
  } catch (error) {
    renderEmpty(target, error.message);
  }
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let list = [];
  let inCode = false;
  let code = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list.length) {
      html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      code.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length + 1, 4);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      flushList();
      html.push(`<blockquote>${inlineMarkdown(trimmed.replace(/^>\s?/, ""))}</blockquote>`);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return html.join("\n");
}

async function bootArticleView() {
  const target = document.querySelector("[data-article-content]");
  if (!target) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  if (!id) {
    renderEmpty(target, "缺少文章 id。");
    return;
  }

  try {
    const articles = await loadArticles();
    const article = articles.find((item) => item.id === id);
    if (!article) {
      renderEmpty(target, "没有找到这篇文章。");
      return;
    }

    const displayTitle = articleTitle(article);
    document.title = `${displayTitle} | 人生五年`;
    document.querySelector("[data-article-title]").textContent = displayTitle;
    document.querySelector("[data-article-source]").textContent = article.sourceProjectLabel;
    document.querySelector("[data-article-section]").textContent = article.sectionLabel;
    document.querySelector("[data-article-path]").textContent = article.sourcePath;
    document.querySelector("[data-article-source-link]").innerHTML = sourceLink(article);
    const description = article.excerpt || `${displayTitle}，来自人生五年长期访谈计划。`;
    document.querySelector("[data-article-summary]").textContent = description;
    document.querySelector("[data-article-reading-time]").textContent = `${readingMinutes(article)} 分钟阅读`;
    document.querySelector("[data-article-updated]").textContent = formatDate(article.updatedAt);
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", displayTitle);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);

    const response = await fetch(`${rootPrefix}/${article.contentPath}`, { cache: "no-store" });
    if (!response.ok) throw new Error("文章内容加载失败");
    const sourceText = await response.text();
    if (article.contentFormat === "html") {
      const parsed = new DOMParser().parseFromString(sourceText, "text/html");
      const imported = parsed.querySelector("main > section") || parsed.querySelector("main") || parsed.body;
      imported.querySelectorAll("script, style").forEach((node) => node.remove());
      target.classList.add("reader-imported-html");
      target.innerHTML = imported.innerHTML;
    } else {
      target.innerHTML = markdownToHtml(sourceText);
    }

    const relatedTarget = document.querySelector("[data-related-articles]");
    const related = articles
      .filter((item) => item.id !== article.id && item.status === "published" && item.section === article.section)
      .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
      .slice(0, 3);
    if (relatedTarget) {
      relatedTarget.innerHTML = related.length
        ? related.map((item) => `
          <a class="reader-related-card" href="${articleUrl(item.id)}">
            <span>${escapeHtml(item.sectionLabel)}</span>
            <strong>${escapeHtml(articleTitle(item))}</strong>
            <small>${readingMinutes(item)} 分钟阅读</small>
          </a>
        `).join("")
        : "";
    }
  } catch (error) {
    renderEmpty(target, error.message);
  }
}

function renderSectionCards() {
  const target = document.querySelector("[data-section-cards]");
  if (!target) return;
  const sections = [
    "life-interview",
    "career-interview",
    "essay",
    "topic",
    "template",
    "encyclopedia",
    "project",
    "tool"
  ];
  target.innerHTML = sections.map((section) => {
    const item = sectionConfig[section];
    return `
      <a class="module-card" href="${item.href}">
        <span>${escapeHtml(section)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.intro)}</p>
      </a>
    `;
  }).join("");
}

bootArticleList();
bootArticleView();
renderSectionCards();
