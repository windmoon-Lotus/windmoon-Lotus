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
      <div class="person-tags">${(person.tags || []).slice(0, 4).map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
      <a class="person-cta" href="${personUrl(person.id)}">进入人物介绍</a>
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

async function bootPeopleList() {
  const target = document.querySelector("[data-people-list]");
  if (!target) return;

  const count = document.querySelector("[data-people-count]");
  const search = document.querySelector("[data-people-search]");

  try {
    const { people } = await loadJson("data/people.json");

    const render = () => {
      const query = (search?.value || "").trim().toLowerCase();
      const visible = people.filter((person) => {
        if (!query) return true;
        return [person.displayName, person.role, person.headline, person.bio, ...(person.tags || [])]
          .join(" ")
          .toLowerCase()
          .includes(query);
      });

      if (count) count.textContent = `${visible.length} 人`;

      const groups = ["lifeInterviewee", "careerInterviewee", "contributor"];
      target.innerHTML = groups.map((group) => {
        const rows = visible.filter((person) => personBucket(person) === group);
        if (!rows.length) return "";
        return `
          <section class="people-group">
            <h2>${groupTitle(group)}</h2>
            <div class="people-grid">${rows.map(card).join("")}</div>
          </section>
        `;
      }).join("") || `<div class="library-empty">没有找到匹配的人物。</div>`;
    };

    search?.addEventListener("input", render);
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
    const [{ people }, articleData] = await Promise.all([
      loadJson("data/people.json"),
      loadJson("data/articles.json")
    ]);
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
                <a class="person-article" href="${articleUrl(article.id)}">
                  <span>${esc(article.sectionLabel)}</span>
                  <strong>${esc(article.title)}</strong>
                  <em>${esc(article.excerpt || "")}</em>
                </a>
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
