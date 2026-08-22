import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enrichArticle } from "./content-policy.mjs";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptRoot, "..");
const workspaceRoot = path.resolve(siteRoot, "..");
const sources = [
  {
    key: "life",
    label: "人生五年",
    root: process.env.LIFE5_SOURCE_ROOT
      ? path.resolve(process.env.LIFE5_SOURCE_ROOT)
      : path.resolve(workspaceRoot, "人生五年"),
    sourceBaseUrl: "https://github.com/windmoon-Lotus/life5years/blob/main"
  },
  {
    key: "career",
    label: "百家职业共享",
    root: process.env.CAREER_SOURCE_ROOT
      ? path.resolve(process.env.CAREER_SOURCE_ROOT)
      : path.resolve(workspaceRoot, "百家职业共享大全"),
    sourceBaseUrl: "https://github.com/windmoon-Lotus/Career-Information-Sharing/blob/main"
  }
];

const contentRoot = path.join(siteRoot, "content");
const dataRoot = path.join(siteRoot, "data");

function normalizeSlash(value) {
  return value.split(path.sep).join("/");
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, (match) => match.replace(/^\[/, "").replace(/\]\([^)]+\)$/, ""))
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/[*_`>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function stripHtml(html) {
  return decodeHtml(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromMarkdown(markdown, filePath) {
  const heading = markdown.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  return path.basename(filePath, ".md");
}

function titleFromHtml(html, filePath) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
    || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  return title ? stripHtml(title) : path.basename(filePath, path.extname(filePath));
}

function sectionFor(sourceKey, relativePath) {
  const rel = normalizeSlash(relativePath);

  if (sourceKey === "life") {
    if (rel.startsWith("人生五年/")) return ["life-interview", "人生五年访谈"];
    if (rel.startsWith("随笔/")) return ["essay", "随笔"];
    if (rel.startsWith("人生话题/")) return ["topic", "人生话题"];
    if (rel.startsWith("访谈准备资料/")) return ["project", "项目资料"];
    return ["about", "项目说明"];
  }

  if (rel.startsWith("职业访谈/")) return ["career-interview", "职业访谈"];
  if (rel.startsWith("职业百科/")) return ["encyclopedia", "职业百科"];
  if (rel.startsWith("共创专区/模板/")) return ["template", "共创模板"];
  if (rel.startsWith("共创专区/进行中的项目/")) return ["lab", "项目实验"];
  if (rel.startsWith("探索工具/")) return ["tool", "探索工具"];
  if (rel.startsWith("项目故事/")) return ["project", "项目故事"];
  if (rel.startsWith("管理规范/")) return ["policy", "管理规范"];
  if (rel.startsWith("趣味知识/")) return ["knowledge", "趣味知识"];
  return ["about", "项目说明"];
}

function shouldIncludeFile(sourceKey, fullPath, sourceRoot) {
  const extension = path.extname(fullPath).toLowerCase();
  if (extension === ".md") return true;
  if (extension !== ".html" || sourceKey !== "life") return false;

  // 仅兼容直接放在单期目录中的公众号定稿；嵌套的排版稿通常已有同名 Markdown。
  const relativePath = normalizeSlash(path.relative(sourceRoot, fullPath));
  return /^人生五年\/[^/]+\/[^/]+\.html$/i.test(relativePath);
}

function isSupersededSource(relativePath) {
  return /人生五年\/20260722-[^/]+\/第八期-暂不公开的一期访谈\.md$/i.test(relativePath);
}

function publicSourceInfo(relativePath, source) {
  if (/人生五年\/20260722-[^/]+\/第八期-五年后在决定是否公开的一场访谈\.md$/i.test(relativePath)) {
    return {
      sourcePath: "人生五年/第八期/公开文章.md",
      sourceUrl: null
    };
  }
  return {
    sourcePath: relativePath,
    sourceUrl: githubSourceUrl(source, relativePath)
  };
}

async function listContentFiles(source) {
  const dir = source.root;
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listContentFiles({ ...source, root: fullPath, sourceRoot: source.sourceRoot || dir }));
    } else if (entry.isFile() && shouldIncludeFile(source.key, fullPath, source.sourceRoot || dir)) {
      files.push(fullPath);
    }
  }

  return files;
}

function makeId(sourceKey, relativePath) {
  return `${sourceKey}-${createHash("sha1").update(normalizeSlash(relativePath)).digest("hex").slice(0, 12)}`;
}

function githubSourceUrl(source, relativePath) {
  return `${source.sourceBaseUrl}/${normalizeSlash(relativePath).split("/").map(encodeURIComponent).join("/")}`;
}

async function main() {
  await rm(contentRoot, { recursive: true, force: true });
  await mkdir(contentRoot, { recursive: true });
  await mkdir(dataRoot, { recursive: true });

  const articles = [];

  for (const source of sources) {
    const files = await listContentFiles({ ...source, sourceRoot: source.root });

    for (const fullPath of files) {
      const relativePath = path.relative(source.root, fullPath);
      const normalizedRelative = normalizeSlash(relativePath);
      if (isSupersededSource(normalizedRelative)) continue;

      const sourceText = await readFile(fullPath, "utf8");
      const extension = path.extname(fullPath).toLowerCase();
      const contentFormat = extension === ".html" ? "html" : "markdown";
      const [section, sectionLabel] = sectionFor(source.key, normalizedRelative);
      const id = makeId(source.key, normalizedRelative);
      const outputDir = path.join(contentRoot, section);
      const outputPath = path.join(outputDir, `${id}${extension}`);
      const text = contentFormat === "html" ? stripHtml(sourceText) : stripMarkdown(sourceText);
      const title = contentFormat === "html"
        ? titleFromHtml(sourceText, fullPath)
        : titleFromMarkdown(sourceText, fullPath);
      const sourceStat = await stat(fullPath);
      const publicSource = publicSourceInfo(normalizedRelative, source);

      await mkdir(outputDir, { recursive: true });
      await writeFile(outputPath, sourceText, "utf8");

      articles.push(enrichArticle({
        id,
        title,
        sourceProject: source.key,
        sourceProjectLabel: source.label,
        section,
        sectionLabel,
        sourcePath: publicSource.sourcePath,
        sourceUrl: publicSource.sourceUrl,
        contentPath: normalizeSlash(path.relative(siteRoot, outputPath)),
        excerpt: text.slice(0, 180),
        wordCount: text.length,
        updatedAt: sourceStat.mtime.toISOString(),
        contentFormat
      }));
    }
  }

  articles.sort((a, b) => {
    const priority = {
      "life-interview": 1,
      "career-interview": 2,
      essay: 3,
      topic: 4,
      template: 5,
      encyclopedia: 6,
      tool: 7,
      project: 8,
      lab: 9,
      knowledge: 10,
      policy: 11,
      about: 12
    };
    return (priority[a.section] ?? 99) - (priority[b.section] ?? 99) || a.title.localeCompare(b.title, "zh-CN");
  });

  await writeFile(
    path.join(dataRoot, "articles.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), articleCount: articles.length, articles }, null, 2),
    "utf8"
  );

  console.log(`Migrated ${articles.length} articles into ${contentRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
