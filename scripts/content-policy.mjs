const titleOverrides = new Map([
  ["人生五年V1——破茧成蝶的自由职业者Yamu", "Yamu：把自由一步步接住"],
  ["人生五年V2——访谈保险代理人刘进步-发布公众号等公开平台", "刘进步：在职业转型中重新站稳"],
  ["人生五年V3-感觉不上班真养人的流年", "流年：不上班真的养人吗？"],
  ["人生五年V4-幸福的一种模样和我的阴暗面", "幸福的一种模样，也照见我的阴暗面"],
  ["人生五年v5后记——在朋友家里，看见一个家庭的支点", "在朋友家里，看见一个家庭的支点"],
  ["Yamu的故事-发布公众号等公开平台", "Yamu 的故事"],
  ["人生五年V6-她说自己完成了世俗对女人的期待我却听见了难过", "她完成了世俗对女人的期待，我却听见了难过"]
]);

const featuredIds = new Set([
  "life-f5136c0f1784",
  "life-e473fc8264e0",
  "life-e60f5bd3bbb1",
  "life-67e5e130a54f",
  "life-cc8cf6a30eb1",
  "life-a3c5298224a1",
  "life-0bad2f00e4d4",
  "life-aff7e01fd6d0"
]);

const draftPattern = /(^|[\\/_\s-])todo([\\/_.\s-]|$)|听改记录|主题级剪辑说明/i;
const archivePattern = /(^|[\\/])readme\.md$|AI精炼|人工修改版|职业信息共享问卷|个人创业者职业信息问卷|问卷问题|播客单集介绍|家长讲义|公众号宣传|构思AI完善/i;

export function cleanDisplayTitle(title) {
  const normalized = String(title || "")
    .replace(/\s*[-—_]*(发布公众号等公开平台|发布公开平台|公众号发布版|对外发布版)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return titleOverrides.get(title) || titleOverrides.get(normalized) || normalized;
}

export function publicationStatus(article) {
  const haystack = `${article.title || ""} ${article.sourcePath || ""}`;
  if (draftPattern.test(haystack)) return "draft";
  if (["lab", "policy", "about"].includes(article.section) || archivePattern.test(haystack)) {
    return "archive";
  }
  return "published";
}

export function isFeaturedArticle(article) {
  return featuredIds.has(article.id);
}

export function cleanExcerpt(article) {
  const displayTitle = cleanDisplayTitle(article.title);
  let excerpt = String(article.excerpt || "").trim();
  for (const title of [article.title, displayTitle]) {
    if (title && excerpt.startsWith(title)) excerpt = excerpt.slice(title.length).trim();
  }
  if (excerpt.includes(" 摘要 ")) excerpt = excerpt.split(" 摘要 ").slice(1).join(" 摘要 ").trim();
  excerpt = excerpt
    .replace(/^《人生五年》访谈文章初稿\s*v\d+\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const limit = 150;
  if (excerpt.length <= limit) return excerpt;
  const candidate = excerpt.slice(0, limit + 1);
  const sentenceEnd = Math.max(
    candidate.lastIndexOf("。"),
    candidate.lastIndexOf("！"),
    candidate.lastIndexOf("？")
  );
  return sentenceEnd >= 60 ? candidate.slice(0, sentenceEnd + 1) : `${excerpt.slice(0, limit).trim()}……`;
}

export function enrichArticle(article) {
  return {
    ...article,
    displayTitle: cleanDisplayTitle(article.title),
    excerpt: cleanExcerpt(article),
    status: publicationStatus(article),
    featured: isFeaturedArticle(article)
  };
}
