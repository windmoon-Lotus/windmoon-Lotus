const peopleRoot = document.documentElement.dataset.root || ".";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadJson(path) {
  const response = await fetch(`${peopleRoot}/${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} 加载失败`);
  return response.json();
}

function personUrl(id) {
  return `${peopleRoot}/people/profile.html?id=${encodeURIComponent(id)}`;
}

function articleUrl(id) {
  return `${peopleRoot}/articles/view.html?id=${encodeURIComponent(id)}`;
}

function mergeLifeIssuePeople(people, issues, articles) {
  const articlesBySource = new Map(articles.map((article) => [article.sourcePath, article]));
  const peopleById = new Map(people.map((person) => [person.id, person]));

  for (const issue of issues) {
    const existing = people.find((person) => person.lifeOrder === issue.order);
    if (!existing && !issue.profile) continue;
    const sources = [
      [issue.storySourcePath, issue.storyLabel || "人物故事"],
      [issue.afterwordSourcePath, issue.afterwordLabel || "访谈后记"]
    ].filter(([sourcePath]) => sourcePath);
    const lifeArticles = sources
      .map(([sourcePath, label]) => {
        const article = articlesBySource.get(sourcePath);
        return article ? { id: article.id, label } : null;
      })
      .filter(Boolean);
    const generated = {
      ...existing,
      ...issue.profile,
      id: issue.profile?.id || existing.id,
      displayName: issue.name || existing.displayName,
      group: "interviewee",
      lifeOrder: issue.order,
      lifeArticles,
      articleIds: [
        ...(existing?.articleIds || []).filter((id) => !id.startsWith("life-")),
        ...lifeArticles.map((item) => item.id)
      ]
    };
    peopleById.set(generated.id, { ...peopleById.get(generated.id), ...generated });
  }

  return [...peopleById.values()];
}

function sourceUrl(article) {
  return article.sourceUrl
    ? `<a href="${esc(article.sourceUrl)}" target="_blank" rel="noreferrer">原始素材</a>`
    : "";
}

function avatar(name) {
  const text = [...String(name || "人")][0] || "人";
  return `<span class="person-avatar">${esc(text)}</span>`;
}

function groupTitle(group) {
  return {
    lifeInterviewee: "人生五年受访者",
    careerInterviewee: "职业共享受访者（已归档）",
    contributor: "项目贡献人"
  }[group] || "人物";
}

function personBucket(person) {
  const hasLifeArticle = (person.articleIds || []).some((id) => id.startsWith("life-"));
  const hasCareerArticle = (person.articleIds || []).some((id) => id.startsWith("career-"));
  const isInterviewee = person.group === "interviewee" || person.group === "both";

  if (person.role?.includes("人生五年受访者") || hasLifeArticle && isInterviewee) {
    return "lifeInterviewee";
  }
  if (isInterviewee || hasCareerArticle) {
    return "careerInterviewee";
  }
  return "contributor";
}

function projectBadge(person) {
  const bucket = personBucket(person);
  return {
    lifeInterviewee: "人生五年 · 当前主线",
    careerInterviewee: "职业共享项目 · 已归档",
    contributor: "项目贡献 · 长期致谢"
  }[bucket];
}

function card(person) {
  return `
    <article class="person-card">
      <a class="person-head" href="${personUrl(person.id)}">
        ${avatar(person.displayName)}
        <span>
          <strong>${esc(person.displayName)}</strong>
          <em>${esc(person.role)}</em>
        </span>
      </a>
      <div class="person-project">${esc(projectBadge(person))}</div>
      <p>${esc(person.headline || person.bio)}</p>
      ${currentWorkBlock(person, true)}
      <div class="person-tags">${(person.tags || []).slice(0, 4).map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
      <a class="person-cta" href="${personUrl(person.id)}">进入人物介绍</a>
    </article>
  `;
}

function lifeIndexRow(person, articlesById) {
  const order = String(person.lifeOrder || "").padStart(2, "0");
  const articleLinks = (person.lifeArticles || [])
    .map(({ id, label }) => {
      const article = articlesById.get(id);
      if (!article) return "";
      return `
        <a class="life-person-article" href="${articleUrl(article.id)}">
          <span>${esc(label)}</span>
          <strong>${esc(article.displayTitle || article.title)}</strong>
        </a>
      `;
    })
    .filter(Boolean)
    .join("");

  return `
    <article class="life-person-row">
      <a class="life-person-identity" href="${personUrl(person.id)}">
        <span class="life-person-order">${esc(order)}</span>
        <span>
          <strong>${esc(person.displayName)}</strong>
          <em>${esc(person.role)}</em>
        </span>
      </a>
      <div class="life-person-tags">
        ${(person.tags || []).slice(0, 3).map((tag) => `<span>${esc(tag)}</span>`).join("")}
      </div>
      <div class="life-person-articles">${articleLinks}</div>
    </article>
  `;
}

function infoRows(person, articles) {
  return [
    ["姓名", person.displayName],
    ["身份", person.role],
    ["所属栏目", groupTitle(personBucket(person))],
    ["项目关系", projectBadge(person)],
    ["关键词", (person.tags || []).join(" / ")],
    ["关联文章", articles.length ? `${articles.length} 篇` : "暂无"]
  ].filter(([, value]) => value);
}

function contactLinks(person) {
  const links = (person.links || []).filter((link) => link.url);
  if (!links.length) {
    return `<span class="contact-empty">暂未公开联系方式</span>`;
  }
  return links.map((link) => `<a href="${esc(link.url)}" target="_blank" rel="noreferrer">${esc(link.label)}</a>`).join("");
}

function currentWorkBlock(person, compact = false) {
  if (!person.currentWork) return "";
  if (compact) {
    return `<div class="person-current"><strong>正在做</strong><span>${esc(person.currentWork)}</span></div>`;
  }
  return `
    <section class="person-info-card person-work-card">
      <h2>TA 正在做的事</h2>
      <p>${esc(person.currentWork)}</p>
      <div class="person-contact person-work-links">
        <strong>公开入口</strong>
        <div>${contactLinks(person)}</div>
      </div>
      <p class="person-contact-note">${esc(person.collaboration || "如果你读完故事，也想了解 TA 正在做的事，请先尊重本人公开边界。")}</p>
    </section>
  `;
}

async function bootPeopleList() {
  const target = document.querySelector("[data-people-list]");
  if (!target) return;

  const count = document.querySelector("[data-people-count]");
  const search = document.querySelector("[data-people-search]");

  try {
    const [peopleData, articleData, issueData] = await Promise.all([
      loadJson("data/people.json"),
      loadJson("data/articles.json"),
      loadJson("data/life-issues.json")
    ]);
    const people = mergeLifeIssuePeople(peopleData.people, issueData.issues || [], articleData.articles || []);
    const articlesById = new Map(articleData.articles.map((article) => [article.id, article]));
    const peoplePageSize = 12;
    const pageState = {
      lifeInterviewee: 1,
      careerInterviewee: 1,
      contributor: 1
    };

    const paginate = (group, rows) => {
      const totalPages = Math.max(1, Math.ceil(rows.length / peoplePageSize));
      const currentPage = Math.min(pageState[group] || 1, totalPages);
      pageState[group] = currentPage;
      const start = (currentPage - 1) * peoplePageSize;
      return {
        rows: rows.slice(start, start + peoplePageSize),
        currentPage,
        totalPages
      };
    };

    const pagination = (group, currentPage, totalPages) => {
      if (totalPages <= 1) return "";
      return `
        <nav class="people-pagination" aria-label="${esc(groupTitle(group))}分页">
          <button type="button" data-people-page="${group}" data-page-step="-1"${currentPage === 1 ? " disabled" : ""}>上一页</button>
          <span>第 ${currentPage} / ${totalPages} 页</span>
          <button type="button" data-people-page="${group}" data-page-step="1"${currentPage === totalPages ? " disabled" : ""}>下一页</button>
        </nav>
      `;
    };

    const render = () => {
      const query = (search?.value || "").trim().toLowerCase();
      const visible = people.filter((person) => {
        if (!query) return true;
        const articleTitles = (person.articleIds || [])
          .map((id) => articlesById.get(id))
          .filter(Boolean)
          .flatMap((article) => [article.title, article.displayTitle]);
        return [person.displayName, person.role, person.headline, person.bio, ...(person.tags || []), ...articleTitles]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });

      const lifeRows = visible
        .filter((person) => personBucket(person) === "lifeInterviewee")
        .sort((a, b) => (a.lifeOrder || 999) - (b.lifeOrder || 999));
      const careerRows = visible.filter((person) => personBucket(person) === "careerInterviewee");
      const contributorRows = visible.filter((person) => personBucket(person) === "contributor");

      if (count) {
        count.textContent = query
          ? `${visible.length} 个匹配结果`
          : `${people.length} 人 · ${lifeRows.length} 位人生五年受访者`;
      }

      if (!visible.length) {
        target.innerHTML = `<div class="library-empty">没有找到匹配的人物或文章。</div>`;
        return;
      }

      const secondaryGroup = (group, rows) => {
        if (!rows.length) return "";
        const page = paginate(group, rows);
        return `
          <section class="people-group people-secondary-group" data-people-group="${group}">
            <div class="people-group-heading">
              <h2>${groupTitle(group)}</h2>
              <p>${rows.length} 人</p>
            </div>
            <div class="people-grid">${page.rows.map(card).join("")}</div>
            ${pagination(group, page.currentPage, page.totalPages)}
          </section>
        `;
      };

      const lifePage = paginate("lifeInterviewee", lifeRows);
      target.innerHTML = `
        ${lifeRows.length ? `
          <section class="people-group people-life-group" data-people-group="lifeInterviewee">
            <div class="people-group-heading">
              <div>
                <p class="eyebrow">Life in Five Years</p>
                <h2>人生五年受访者</h2>
              </div>
              <p>按受访顺序排列，直接进入人物故事与访谈后记。</p>
            </div>
            <div class="life-people-index">${lifePage.rows.map((person) => lifeIndexRow(person, articlesById)).join("")}</div>
            ${pagination("lifeInterviewee", lifePage.currentPage, lifePage.totalPages)}
          </section>
        ` : ""}
        ${secondaryGroup("careerInterviewee", careerRows)}
        ${secondaryGroup("contributor", contributorRows)}
      `;

      target.querySelectorAll("[data-people-page]").forEach((button) => {
        button.addEventListener("click", () => {
          const group = button.dataset.peoplePage;
          pageState[group] += Number(button.dataset.pageStep);
          render();
          target.querySelector(`[data-people-group="${group}"]`)?.scrollIntoView({ block: "start" });
        });
      });
    };

    search?.addEventListener("input", () => {
      Object.keys(pageState).forEach((group) => {
        pageState[group] = 1;
      });
      render();
    });
    render();
  } catch (error) {
    target.innerHTML = `<div class="library-empty">${esc(error.message)}</div>`;
  }
}

async function bootPersonProfile() {
  const target = document.querySelector("[data-person-profile]");
  if (!target) return;

  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    target.innerHTML = `<div class="library-empty">缺少人物 id。</div>`;
    return;
  }

  try {
    const [peopleData, articleData, issueData] = await Promise.all([
      loadJson("data/people.json"),
      loadJson("data/articles.json"),
      loadJson("data/life-issues.json")
    ]);
    const people = mergeLifeIssuePeople(peopleData.people, issueData.issues || [], articleData.articles || []);
    const person = people.find((item) => item.id === id);
    if (!person) {
      target.innerHTML = `<div class="library-empty">没有找到这个人物。</div>`;
      return;
    }

    const articles = (person.articleIds || [])
      .map((articleId) => articleData.articles.find((article) => article.id === articleId))
      .filter(Boolean);

    const notes = person.notes || [];
    const primaryArticle = articles[0];

    document.title = `${person.displayName} | 个人介绍`;
    target.innerHTML = `
      <section class="person-profile-layout">
        <aside class="person-sidebar">
          ${avatar(person.displayName)}
          <h1>${esc(person.displayName)}</h1>
          <p>${esc(person.role)}</p>
          <div class="person-tags">${(person.tags || []).map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
          <div class="person-contact">
            <strong>联系方式</strong>
            <div>${contactLinks(person)}</div>
          </div>
          <a class="button ghost" href="${peopleRoot}/people/">返回人物档案</a>
        </aside>

        <div class="person-main">
          <section class="person-intro-card">
            <p class="eyebrow">Personal Profile</p>
          <h1>${esc(person.displayName)}</h1>
            <p class="lead">${esc(person.headline)}</p>
            <p>${esc(person.bio)}</p>
            <div class="person-main-actions">
              ${primaryArticle ? `<a class="button primary" href="${articleUrl(primaryArticle.id)}">阅读代表故事</a>` : ""}
            </div>
          </section>

          ${currentWorkBlock(person)}

          <section class="person-info-card">
            <h2>基本信息</h2>
            <dl class="person-info-list">
              ${infoRows(person, articles).map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}
            </dl>
          </section>

          <section class="person-info-card">
            <h2>个人说明</h2>
            <ul class="person-note-list">${notes.map((note) => `<li>${esc(note)}</li>`).join("") || "<li>暂无补充说明。</li>"}</ul>
          </section>

          <section class="person-info-card">
            <h2>相关内容</h2>
            <div class="person-articles">
              ${articles.length ? articles.map((article) => `
                <article class="person-article">
                  <span>${esc(article.sectionLabel)}</span>
                  <strong><a href="${articleUrl(article.id)}">${esc(article.displayTitle || article.title)}</a></strong>
                  <em>${esc(article.excerpt || "")}</em>
                  <small>${sourceUrl(article)}</small>
                </article>
              `).join("") : "<p>暂无已关联文章。</p>"}
            </div>
          </section>
        </div>
      </section>
    `;
  } catch (error) {
    target.innerHTML = `<div class="library-empty">${esc(error.message)}</div>`;
  }
}

bootPeopleList();
bootPersonProfile();
