# 内容迁移与新增一期

网站正文由相邻的两个内容仓库迁移而来：

- `../人生五年`
- `../百家职业共享大全`

执行：

```powershell
node scripts/migrate-content.mjs
```

脚本会重新生成 `content/` 和 `data/articles.json`。如源仓库不在默认位置，可设置 `LIFE5_SOURCE_ROOT` 或 `CAREER_SOURCE_ROOT` 为对应仓库的完整路径。

## 新增一期

1. 将公开 Markdown 文章放入“人生五年”源仓库。
2. 在 `data/life-issues.json` 追加一期配置，填写 `storySourcePath` 和可选的 `afterwordSourcePath`。
3. 执行迁移命令。
4. 打开首页、文章页和人物页检查链接。

首页轮播、处境索引和人生五年人物列表都会读取这份配置，不需要再手写文章 ID 或重复修改页面。

## 公开边界

- 迁移器只处理 Markdown，以及直接放在单期目录下、没有 Markdown 定稿可替代的 HTML；不会迁移音频或视频。
- 内部素材、封面提示词、修订稿和重复后记会进入归档状态，不出现在公开文章列表。
- 第八期只公开整理文章。源目录中的人物名称不会写入公开索引，访谈音频不会进入网站。
