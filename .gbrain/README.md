# windmoon-Lotus 项目 GBrain

这个目录保存 `windmoon-Lotus` 发布站自己的本地 gbrain 脑库。

- 脑库路径：`.\.gbrain\brain.pglite`
- 稳定导入入口：`.\.gbrain-pages`
- 启动脚本：`.\gbrain.ps1`
- 离线 gbrain 工具来源：`F:\播客相关\tools\gbrain`
- 离线 Bun 运行时：`F:\播客相关\tools\bun\bun.exe`

## 使用命令

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\gbrain.ps1 import .\.gbrain-pages --no-embed
powershell -NoProfile -ExecutionPolicy Bypass -File .\gbrain.ps1 stats
powershell -NoProfile -ExecutionPolicy Bypass -File .\gbrain.ps1 list -n 30
powershell -NoProfile -ExecutionPolicy Bypass -File .\gbrain.ps1 search "人生五年 流年 失业两年"
```

## 职责边界

这个 gbrain 只服务 `windmoon-Lotus` 发布项目：

- 记录发布站的信息架构、人物档案、栏目关系和维护规则。
- 记录「人生五年」当前主线与「职业共享」已归档状态。
- 帮助后续同步内容、生成人物页、梳理文章关系。

它不直接导入 `F:\播客相关` 的定稿前素材、原始音频、粗剪时间码和播客工作稿。
