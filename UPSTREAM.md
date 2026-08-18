# 上游同步（EhBilingual ← EhSyringe）

EhBilingual 是 [EhSyringe](https://github.com/EhTagTranslation/EhSyringe)（`EhTagTranslation/EhSyringe`）的 fork。
本文档说明**本分支（EhBilingual）**与**主分支（上游 EhSyringe）**的区别，以及主分支更新后如何把更新同步到本分支。

## 一、本分支与主分支的区别

| 项目 | 主分支 EhSyringe | 本分支 EhBilingual |
| ---- | ---------------- | ------------------ |
| 仓库 | `EhTagTranslation/EhSyringe` | `GitRuozhi/EhBilingual` |
| 产物 | 浏览器扩展（web-ext）+ 用户脚本 | **仅用户脚本**（`ehbilingual.user.js`） |
| 全站 UI | 原始 / 翻译 两态 | 原始 / 翻译 / **双语** 三态 |
| 标签翻译 | 原始 / 翻译 两态 | 原始 / 翻译 / **双语** 三态 |
| 默认配置 | UI=翻译、标签=翻译 | UI=**翻译**、标签=**双语** |
| 版本号 | 如 `3.4.9` | 上游版本 + `-a`（如 `3.4.9-a`），CI 发布为 prerelease |
| 身份 | EhSyringe / EhTagTranslation | EhBilingual / GitRuozhi |
| 更新日志 | 维护 `CHANGELOG.md` | 已移除，历史见上游仓库 |
| 双语格式 | 无 | 短文本 `English | 中文`，长文本换行 |

**共享、不修改的部分**（两边保持一致）：

- 标签翻译数据库：`EhTagTranslation/Database`
- UI 翻译词典：`src/services/ui-translation/data/**`
- 标签介绍、搜索提示、数据库更新、时间戳翻译等核心功能

## 二、主分支更新后如何同步

### 1. 添加上游远程（仅首次配置）

```bash
git remote add upstream https://github.com/EhTagTranslation/EhSyringe.git
```

### 2. 拉取上游更新

```bash
git fetch upstream master
```

### 3. 合并到本分支

推荐 merge（保留合并记录，冲突好回溯）：

```bash
git merge upstream/master
```

或使用 rebase（保持线性历史，改写本分支提交）：

```bash
git rebase upstream/master
```

### 4. 解决冲突

- 冲突集中在 `src/services/ui-translation/data/**`（翻译词典）时：通常是上游新增/修改翻译，**直接采用上游版本**，随后跑 `pnpm lint` 确认
- 冲突涉及双语逻辑（`src/plugin/syringe/index.ts`、`src/services/storage.ts`）时：需要**人工合并**，本分支的 `bilingualUi` / `bilingualTag` 字段与三态分支逻辑必须保留
- 不确定时：以上游为准取新内容，再人工核对本分支双语改动是否被覆盖

### 5. 同步后验证

```bash
pnpm install       # 上游依赖有变化时执行
pnpm lint
pnpm build:monkey  # 确认产物 ehbilingual.user.js 正常生成
```

随后人工回归：E 站三态切换、双语显示（短文本 / 长文本 / 属性 / 按钮）、标签介绍、搜索提示。

### 6. 更新版本号

上游发布新版本（如 `3.4.10`）并同步完成后，本分支版本号随之提升：

- 修改 `package.json` 的 `version` 为 `3.4.10-a`

### 7. 提交并推送

```bash
git add -A
git commit -m "sync: 合并上游 EhSyringe v3.4.10"
git push
```

## 三、注意事项

- 同步是**单向**的：只从上游拉取到本分支，**不要**向 `EhTagTranslation/EhSyringe` 推送本分支改动
- 上游不包含本分支的改动（双语、精简），合并时需确认这些改动未被覆盖
- 上游更新通常集中在翻译词典，冲突概率低；涉及架构重构的更新需重点回归测试
- 同步后若脚本身份元数据变化（`@namespace` / `@updateURL` 等），老用户需重新安装脚本
