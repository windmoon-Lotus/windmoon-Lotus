# windmoon-Lotus 发布站

## 定位

`windmoon-Lotus` 是「人生五年」个人介绍与文章发布站。

它承担公开展示职责：

- 首页呈现「人生五年」作为当前主线。
- 文章库展示已定稿 Markdown。
- 人物档案展示受访者与贡献者。
- 职业共享项目作为已结束项目归档，不再作为当前主线。

## 数据来源

当前同步源：

- `F:\笔记汇总\git\人生五年`
- `F:\笔记汇总\git\百家职业共享大全`

不从 `F:\播客相关` 自动同步内容，因为该目录主要是播客成稿前的素材、剪辑与待修改版本。

## 关键页面

- `index.html`：首页
- `articles/index.html`：文章库
- `articles/view.html`：文章详情页
- `people/index.html`：人物档案
- `people/profile.html`：人物详情页

## 维护命令

同步定稿内容：

```powershell
node scripts\migrate-content.mjs
```

同步 gbrain 稳定页：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\gbrain.ps1 import .\.gbrain-pages --no-embed
```
