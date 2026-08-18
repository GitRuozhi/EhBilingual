# 上游同步（EhBilingual ← EhSyringe）

EhBilingual 是 [EhSyringe](https://github.com/EhTagTranslation/EhSyringe)（`EhTagTranslation/EhSyringe`）的 fork。
本文档说明**本分支（EhBilingual）**与**主分支（上游 EhSyringe）**的区别，以及主分支更新后如何安全地把更新同步到本分支。

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

- 标签翻译数据库：`EhTagTranslation/Database`（脚本内自动更新，**无需手动同步**）
- UI 翻译词典：`src/services/ui-translation/data/**`
- 标签介绍、搜索提示、数据库更新、时间戳翻译等核心功能

## 二、⚠️ 为什么不能直接合并主分支

本分支与上游差异巨大：删除了浏览器扩展（web-ext）全部代码、`omnibox`、`extension-updater`、通知等文件，并大改了核心逻辑（双语模式）。
直接 `git merge upstream/master` 或 `git rebase upstream/master` 会出问题：

1. **已删除的文件被"复活"**：上游改动过本分支已删除的文件时产生 `modify/delete` 冲突；即使不冲突，上游对扩展相关文件的改动也可能让 web-ext 代码重新出现，破坏"仅用户脚本"的精简身份
2. **核心文件大冲突**：上游改动 `src/plugin/syringe/index.ts`、`src/services/storage.ts`、`webpack.config.js`、`package.json` 时会产生大冲突，本分支的双语逻辑（`bilingualUi` / `bilingualTag` 三态）极易被覆盖
3. **大量手工清理**：merge 后需要逐个重新删除上游带来的扩展代码，成本高且容易漏

上游的更新绝大多数是翻译词典（`src/services/ui-translation/data/**`）——这些文件本分支从未修改，**完全不需要用 merge 同步**。

## 三、推荐的同步方式（按需选择）

### 方式一：同步翻译词典（最常见，覆盖上游绝大多数更新）

只把上游的 UI 翻译词典同步过来，不碰其他任何文件：

```bash
git fetch upstream master

# 只更新翻译词典目录，其余文件一概不动
git checkout upstream/master -- src/services/ui-translation/data/

git add -A
git commit -m "sync: 同步上游 UI 翻译词典"
```

> 更精细的做法：先 `git log --oneline HEAD..upstream/master` 查看上游新提交，再用
> `git cherry-pick <提交sha>` 只挑选涉及 `data/**` 的翻译提交。

### 方式二：同步单个文件

上游某次更新只改了少量安全文件（如某个 `data/*.ts`）：

```bash
git checkout upstream/master -- <文件路径>
git add -A
git commit -m "sync: 更新 <文件路径>"
```

### 方式三：全量同步（高风险，不推荐，仅结构性大更新时考虑）

只有上游做了结构性更新（如新增整块页面翻译模块、新功能依赖核心文件）才考虑。流程：

1. **先备份本分支**：`git branch backup-bilingual`
2. `git merge upstream/master`（预期大量冲突）
3. 冲突处理原则：
   - `modify/delete` 冲突：一律选择**删除**（本分支已删的文件保持删除）
   - `src/plugin/syringe/index.ts`、`src/services/storage.ts` 等核心文件：**以本分支双语逻辑为主**，手工合入上游新功能
   - `src/services/ui-translation/data/**`：直接采用上游
4. 检查 `src/web-ext/`、`src/providers/web-ext/`、`omnibox`、`extension-updater`、通知相关文件是否被上游"复活"，逐个重新删除
5. 验证（见第四节），确认产物仍是纯用户脚本 `ehbilingual.user.js`

## 四、同步后收尾

```bash
pnpm install       # 上游依赖有变化时执行
pnpm lint
pnpm build:monkey  # 确认产物 ehbilingual.user.js 正常生成
```

随后人工回归：E 站三态切换、双语显示（短文本 / 长文本 / 属性 / 按钮）、标签介绍、搜索提示。

**版本号**：上游发布新版本（如 `3.4.10`）并同步完成后，修改 `package.json` 的 `version` 为 `3.4.10-a`。

## 五、注意事项

- 同步是**单向**的：只从上游拉取到本分支，**不要**向 `EhTagTranslation/EhSyringe` 推送本分支改动
- 上游不包含本分支的改动（双语、精简），同步时需确认这些改动未被覆盖
- 标签翻译数据库（`EhTagTranslation/Database`）由脚本内自动更新，**无需**在同步流程中处理
- 同步后若脚本身份元数据变化（`@namespace` / `@updateURL` 等），老用户需重新安装脚本
