# 上游同步（EhBilingual ← EhSyringe）

## 一、共享与区别

**共享（两边保持一致，本分支不修改）**

- 标签翻译数据库：`EhTagTranslation/Database`（脚本内自动更新）
- UI 翻译词典：`src/services/ui-translation/data/**`
- 标签介绍、搜索提示、数据库更新等核心功能

**区别（本分支独有）**

- 仅用户脚本产物（无浏览器扩展）
- UI 与标签支持「原始 / 翻译 / 双语」三态（默认 UI=翻译、标签=双语）
- 版本号 = 上游版本 + `-a`（如 `3.4.9-a`）
- 身份：EhBilingual / GitRuozhi

## 二、更新方式

**1. 词典等共享更新：直接同步上游**

```bash
git fetch upstream master
git checkout upstream/master -- src/services/ui-translation/data/
git add -A && git commit -m "sync: 同步上游翻译词典"
```

**2. 其他更新（核心逻辑、新功能）：人工或 Agent 手动合入**

不直接 merge/rebase——本分支删除了扩展代码并大改核心逻辑，直接合并会复活已删文件、覆盖双语逻辑。逐文件核对，保留本分支的双语与精简改动。

## 三、注意事项

- 同步是单向的：只从上游拉取，不向上游推送
- 上游发布新版本后，本分支版本号随之提升（如 `3.4.10-a`）
- 同步后运行 `pnpm lint && pnpm build:monkey` 并人工回归
- 身份元数据变化时，老用户需重新安装脚本
