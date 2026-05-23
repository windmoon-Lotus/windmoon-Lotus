import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const siteRoot = path.resolve("F:/笔记汇总/git/windmoon-Lotus");
const sources = [
  {
    key: "life",
    label: "人生五年",
    root: path.resolve("F:/笔记汇总/git/人生五年")
  },
  {
    key: "career",
    label: "百家职业共享",
    root: path.resolve("F:/笔记汇总/git/百家职业共享大全")
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

function titleFromMarkdown(markdown, filePath) {
  const heading = markdown.match(/^#\s+(.+)$/m);
  if (heading) return heading[1].trim();
  return path.basename(filePath, ".md");
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

async function listMarkdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function makeId(sourceKey, relativePath) {
  return `${sourceKey}-${createHash("sha1").update(normalizeSlash(relativePath)).digest("hex").slice(0, 12)}`;
}

async function main() {
  await rm(contentRoot, { recursive: true, force: true });
  await mkdir(contentRoot, { recursive: true });
  await mkdir(dataRoot, { recursive: true });

  const articles = [];

  for (const source of sources) {
    const files = await listMarkdownFiles(source.root);

    for (const fullPath of files) {
      const relativePath = path.relative(source.root, fullPath);
      const normalizedRelative = normalizeSlash(relativePath);
      const markdown = await readFile(fullPath, "utf8");
      const [section, sectionLabel] = sectionFor(source.key, normalizedRelative);
      const id = makeId(source.key, normalizedRelative);
      const outputDir = path.join(contentRoot, section);
      const outputPath = path.join(outputDir, `${id}.md`);
      const text = stripMarkdown(markdown);
      const title = titleFromMarkdown(markdown, fullPath);

      await mkdir(outputDir, { recursive: true });
      await writeFile(outputPath, markdown, "utf8");

      articles.push({
        id,
        title,
        sourceProject: source.key,
        sourceProjectLabel: source.label,
        section,
        sectionLabel,
        sourcePath: normalizedRelative,
        contentPath: normalizeSlash(path.relative(siteRoot, outputPath)),
        excerpt: text.slice(0, 180),
        wordCount: text.length,
        updatedAt: new Date().toISOString()
      });
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

  console.log(`Migrated ${articles.length} markdown articles into ${contentRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
