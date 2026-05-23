const profiles = {
  yamu: {
    order: "01",
    topic: "自由职业 / 一人公司 / 连续创业",
    name: "Yamu",
    kicker: "第一期人物",
    summary:
      "00后自由职业者，一人公司，连续创业者，曾做过摄影化妆工作室等创业项目，现做新媒体代运营。",
    line: "相信人生的意义藏在风、雨、阳光和每一餐饭里。",
    promo:
      "她把年轻、独立、创业和生活热爱揉在一起，让“自由职业”不只是一个标签，而是一段具体的自我负责。",
    tags: ["独立背后的重量", "创业挣扎", "社交与消费逻辑", "五年后的生活"],
    question: "她是否仍在事业、自律与自由之间找到自己的节奏？睡眠和关系会不会有新的变化？",
    personUrl: "people/profile.html?id=Yamu",
    articles: [
      {
        type: "访谈成稿",
        title: "人生五年V1——破茧成蝶的自由职业者Yamu",
        desc: "第一期人生五年访谈主稿，集中呈现她的成长、创业、关系和五年后的想象。",
        url: "articles/view.html?id=life-cc8cf6a30eb1"
      },
      {
        type: "人物故事",
        title: "Yamu的故事",
        desc: "更偏故事化的公开稿，适合快速进入她的生命经历和当下状态。",
        url: "articles/view.html?id=life-501d2e48a882"
      }
    ]
  },
  liujinbu: {
    order: "02",
    topic: "保险代理 / 基建投资 / 职业转型",
    name: "刘进步",
    kicker: "第二期人物",
    summary:
      "85后保险代理人，曾在基建投资领域工作十年。转入商业保险行业后，她在理解家庭风险与生活规划的过程中重新认识工作、关系与自我。",
    line: "一生努力，一生被爱。",
    promo:
      "她的故事不只是在讲一次转行，也是在讲一个人如何在时代、家庭、亲密关系和自我选择之间重新站稳。",
    tags: ["职业转型", "时代周期", "情绪与控制感", "35岁之后的自我选择"],
    question: "她会如何继续理解保险事业的价值？自主选择、亲密关系和城市归属会不会出现新的答案？",
    personUrl: "people/profile.html?id=liujinbu",
    articles: [
      {
        type: "访谈成稿",
        title: "人生五年V2——访谈保险代理人刘进步",
        desc: "第二期人生五年访谈主稿，围绕职业转型、关系、城市归属和自我选择展开。",
        url: "articles/view.html?id=life-a3c5298224a1"
      },
      {
        type: "人物故事",
        title: "刘进步的故事",
        desc: "更完整的人物故事稿，从成长、大学、基建投资、保险代理写到五年后的追问。",
        url: "articles/view.html?id=life-e60f5bd3bbb1"
      }
    ]
  },
  liunian: {
    order: "03",
    topic: "离职两年后 / 游戏 / 生活暂停",
    name: "流年",
    kicker: "第三期人物",
    summary:
      "离职两年多、暂时没有重新进入职场的95后男性。游戏、存款、找工作、减肥、婚姻期待和五年后的自己，都在这次聊天里被自然地聊到。",
    line: "不上班是为了什么？肯定不是为了委屈自己。",
    promo:
      "他让“暂停工作”这件事变得具体：不是简单躺平，而是一个普通人在压力、快乐、存款和未来之间摸索节奏。",
    tags: ["离职两年后", "工作暂停", "游戏与生活", "五年后的自己"],
    question: "他会重新进入怎样的工作节奏？是否能保持开心，也收获自己期待的幸福小家？",
    personUrl: "people/profile.html?id=%E6%B5%81%E5%B9%B4",
    articles: [
      {
        type: "访谈成稿",
        title: "人生五年V3-感觉不上班真养人的流年",
        desc: "第三期人生五年访谈主稿，保留访谈人的观察、选择他的原因和访谈后的自我照见。",
        url: "articles/view.html?id=life-4c03b7637a91"
      },
      {
        type: "人物故事",
        title: "流年的故事",
        desc: "更偏故事化的公开稿，集中呈现离职后的生活状态、游戏、工作暂停和五年后的想象。",
        url: "articles/view.html?id=life-67e5e130a54f"
      },
      {
        type: "职业共享旧稿",
        title: "首次访谈-玩了一年多的功能测试",
        desc: "职业共享阶段的旧稿，作为流年早期功能测试岗位经历的项目归档材料。",
        url: "articles/view.html?id=career-0e10ddf9e1f1"
      }
    ]
  },
};

const profileCard = document.querySelector("[data-profile-card]");
const profileTabs = document.querySelectorAll("[data-profile]");

function renderProfileArticle(profile, articleIndex = 0) {
  const articles = profile.articles || [];
  const article = articles[articleIndex] || articles[0];
  if (!article || !profileCard) return;

  profileCard.querySelector("[data-profile-article-type]").textContent = article.type;
  profileCard.querySelector("[data-profile-article-title]").textContent = article.title;
  profileCard.querySelector("[data-profile-article-desc]").textContent = article.desc;
  profileCard.querySelector("[data-profile-link]").setAttribute("href", article.url);

  profileCard.querySelectorAll("[data-profile-article]").forEach((item) => {
    const active = Number(item.dataset.profileArticle) === articleIndex;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function renderProfile(profileId, articleIndex = 0) {
  const profile = profiles[profileId];
  if (!profile || !profileCard) return;

  profileCard.querySelector("[data-profile-order]").textContent = profile.order;
  profileCard.querySelector("[data-profile-topic]").textContent = profile.topic;
  profileCard.querySelector("[data-profile-kicker]").textContent = profile.kicker;
  profileCard.querySelector("[data-profile-name]").textContent = profile.name;
  profileCard.querySelector("[data-profile-summary]").textContent = profile.summary;
  profileCard.querySelector("[data-profile-line]").textContent = profile.line;
  profileCard.querySelector("[data-profile-promo]").textContent = profile.promo;
  profileCard.querySelector("[data-profile-question]").textContent = profile.question;
  profileCard.querySelector("[data-profile-person-link]").setAttribute("href", profile.personUrl);

  const tagList = profileCard.querySelector("[data-profile-tags]");
  tagList.innerHTML = "";
  profile.tags.forEach((tag) => {
    const item = document.createElement("li");
    item.textContent = tag;
    tagList.appendChild(item);
  });

  const articleList = profileCard.querySelector("[data-profile-article-list]");
  articleList.innerHTML = "";
  profile.articles.forEach((article, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.profileArticle = String(index);
    button.setAttribute("aria-pressed", index === articleIndex ? "true" : "false");
    button.innerHTML = `<span>${article.type}</span>${article.title}`;
    button.addEventListener("click", () => renderProfileArticle(profile, index));
    articleList.appendChild(button);
  });

  renderProfileArticle(profile, articleIndex);
}

profileTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    profileTabs.forEach((item) => {
      item.classList.toggle("active", item === tab);
      item.setAttribute("aria-selected", item === tab ? "true" : "false");
    });
    renderProfile(tab.dataset.profile);
  });
});

const filterButtons = document.querySelectorAll("[data-filter]");
const essayCards = document.querySelectorAll("[data-category]");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    essayCards.forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
});

const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const sections = navLinks
  .filter((link) => link.getAttribute("href")?.startsWith("#"))
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function activateNav() {
  const active = sections
    .slice()
    .reverse()
    .find((section) => section.getBoundingClientRect().top <= 120);

  navLinks.forEach((link) => {
    link.classList.toggle("active", active && link.getAttribute("href") === `#${active.id}`);
  });
}

activateNav();
window.addEventListener("scroll", activateNav, { passive: true });
