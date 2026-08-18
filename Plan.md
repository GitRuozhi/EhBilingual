# EhBilingual 开发计划

基于 EhSyringe v3.4.9 fork 改造，为 E 站（E-Hentai / ExHentai / EHWiki）增加双语显示能力。
本文档是唯一权威计划。历史文档已归档至 `Archive/`（仅供参考，不再执行）：

- `Archive/EhBilingual 简化开发计划.md` — 初版方案
- `Archive/EhBilingual 删除清单.md` — 油猴单产物精简（已执行完毕）

---

## 一、现状基线

精简工作已完成，当前状态：

- **只保留油猴脚本（UserScript）一种产物**。浏览器扩展（web-ext）相关源码、依赖、CI 步骤已全部移除
- 构建：`pnpm build:monkey` → `releases/ehsyringe.user.js`（meta 头由 `webpack.config.js` 的 BannerPlugin 生成）
- 调试：`pnpm start:monkey` → dev server 端口 48792，安装生成的 `ehsyringe.debug.user.js` 热调试
- `pnpm lint`、`pnpm build:monkey` 均已验证通过
- 项目无单元测试，验证手段 = lint + 构建 + E 站人工回归

关键架构事实（改造依赖这些）：

- 核心翻译逻辑在 `src/plugin/syringe/index.ts`，`document_start` 注入，MutationObserver 监听 `childList` + `title/placeholder/label/value` 属性，**不监听 characterData**
- 标签翻译由 `TagNodeRef`（`src/plugin/syringe/index.ts:123`）负责，`original` 原文已保存在 ref 中，`ehs-tag` 属性防重复
- UI 翻译由 `translateUiText()`（`src/plugin/syringe/index.ts:511`）查 `uiData.plainReplacements` / `regexReplacements` 返回译文字符串
- 配置定义在 `src/services/storage.ts` 的 `ConfigData`，默认值在 `defaults.config`；页面内通过 `SyncStorage` 同步读取
- Popup 在 `src/plugin/popup/index.ts`（lit-html），油猴经 `src/user-script/popup-host.ts` 挂载；保存入口是 `saveConfig()`

---

## 二、目标冻结

最终只有两个三态设置：

| 功能    | 原始 | 翻译 | 双语        | 默认     |
| ------- | ---- | ---- | ----------- | -------- |
| 全站 UI | 英文 | 中文 | 英文 + 中文 | **翻译** |
| 标签    | 英文 | 中文 | 英文 + 中文 | **双语** |

双语格式（遵循 Github-Bilingual）：

```text
短文本（原文 < 40 字符）：
English | 中文

长文本（原文 ≥ 40 字符）：
English
中文
```

模式修改后**不做当前页面即时切换**，保存配置后刷新页面生效。

其他 EhSyringe 功能（标签介绍、搜索提示、数据库更新、时间戳翻译等）保持原样。

### 已确认的决策（2026-08，取代旧计划对应条目）

1. **默认值统一新方案**：所有用户（含旧用户升级）默认 `UI=翻译`、`标签=双语`。不做新旧用户区分，不加迁移代码。旧用户升级后标签会从翻译变为双语——这是已接受的取舍
2. **Popup 三态控件**：分段按钮（`[原始] [翻译] [双语]` 三并排，选中态高亮）
3. **身份切换**（EhSyringe → EhBilingual）列为**最后的人工阶段**，不交给 AI 执行
4. 旧计划文档归档至 `Archive/`，以本文档为准

---

## 三、配置层改动

文件：`src/services/storage.ts`

`ConfigData` 新增两个字段：

```ts
export interface ConfigData {
    translateUi: boolean;
    translateTag: boolean;
    bilingualUi: boolean;   // 新增
    bilingualTag: boolean;  // 新增
    // ...其余不变
}
```

三态与底层的映射（Popup 也按此操作）：

```text
原始：translateX = false（bilingualX 值无关，约定写 false）
翻译：translateX = true,  bilingualX = false
双语：translateX = true,  bilingualX = true
```

`defaults.config` 更新为：

```ts
translateUi: true,
bilingualUi: false,
translateTag: true,
bilingualTag: true,
```

### 实现要点：旧配置的缺省合并

旧用户 storage 中已有 `config` 对象（不含 bilingual 字段），`storage.get('config')` 返回旧对象时新字段为 `undefined`，会被当作 `false`——与"统一新默认"矛盾。

处理：读取 `config` 时与 `defaults.config` 做浅合并，保证缺省字段回落到默认值。涉及两处：

- `Storage.get('config')`（`src/services/storage.ts`）：对 config 返回 `{ ...this.defaults.config, ...stored }`
- `SyncStorage`（`src/services/sync-storage.ts`）：同步缓存层同样保证合并语义（Popup 的 `loadConfig` 已有 spread 合并，无需改）

---

## 四、核心 helper

文件：`src/plugin/syringe/index.ts`（就近放置，不新建 Service）

```ts
/** 短文本阈值：原文长度小于此值用 ` | ` 拼接，否则换行 */
const BILINGUAL_SHORT_MAX = 40;

function formatBilingualText(original: string, translated: string): string {
    if (!original || !translated || original === translated) {
        return translated || original;
    }
    return original.length < BILINGUAL_SHORT_MAX ? `${original} | ${translated}` : `${original}\n${translated}`;
}

/** 判断文本是否已是双语结果，防止 MutationObserver 重复加工（属性场景用） */
function hasBilingualDisplay(text: string): boolean {
    const sep = text.indexOf(' | ');
    if (sep <= 0) return false;
    const original = text.slice(0, sep);
    const translated = text.slice(sep + 3);
    // 后段恰为前段的词典译文 → 视为已双语化
    return uiData.plainReplacements.get(original) === translated;
}
```

明确不做：WeakMap、原文缓存系统、DOM 状态管理器、可逆渲染。

---

## 五、UI 双语

文件：`src/plugin/syringe/index.ts`

`translateUiText()` **签名与内部逻辑不变**，仍返回纯译文（或 `undefined`）。双语逻辑放在调用方 `translateUi()` 的各写回点，保证：

- `bilingualUi = false` 时行为与现在完全一致
- 只有 `translateUi = true && bilingualUi = true` 才走双语分支

### 1. 文本节点（`isText(node)` 分支）

双语模式**保留原文本节点不改动**，把译文作为注入物追加到原文之后：

```text
短文本：English + [注入 " | 中文"]
长文本：English + [注入 <br> + "中文"]
```

实现：用 `node.after(...)` 插入，注入内容包裹在 `<span class="eh-syringe-ignore">` 中（长文本时 span 内含 `<br>`）。

防重复原理（本方案的核心取舍）：

- 原文本节点未被修改 → 不产生新 mutation，不会被重译
- 注入的 span 带 `eh-syringe-ignore`，命中现有 `skipElementMatcher` → MutationObserver 天然跳过
- 中文译文本身查不到词典，即使被扫描也不会再加工

### 2. 属性场景（`title` / `placeholder` / `optgroup.label`）

属性值无法追加兄弟节点、也不支持换行，统一用 ` | ` 拼接（长文本同样降级为 ` | `）：

```ts
node.title = formatBilingualText(node.title, translation).replace('\n', ' | ');
```

属性变更会被 `attributeFilter` 再次捕获 → 用 `hasBilingualDisplay()` 判断已双语则跳过。

### 3. 按钮与导航（element textContent 场景）

- `input[submit/button/reset]` → 现有替换为 `button[ehs-input]` 的机制原样保留，双语只改显示文本（`Apply | 应用`），不改表单提交值。button 内容写回改用追加注入（同文本节点）或直接 `textContent = 短格式`，因其在 `ehs-input` 分支内自行处理
- 导航链接（`#nb` 下的 `a`）：文本短，直接 `English | 中文` 拼接，配合 `hasBilingualDisplay` 防重复

### 4. 时间戳翻译

`translateTimestamp` 与 UI 翻译在 `translateUiText` 内串联。双语模式下时间戳替换基于原文进行即可，不做双语（时间戳本地化结果本身就是替换式，保留现状）。

---

## 六、标签双语

文件：`src/plugin/syringe/index.ts` 的 `TagNodeRef.translate()`

`TagNodeRef` 已保存 `original` / `fullKey`，无需原文恢复机制。`translate()` 扩展为三分支：

```text
translateTag = false            → original（现状保留）
translateTag = true, 双语 = false → translated（现状）
translateTag = true, 双语 = true  → original | translated
```

实现要点：

- 现有 `value` 计算（查 `tagMap`、Wiki 命名空间回退、`markImagesAndEmoji()`、命名空间前缀拼接）全部保留，得到的是带 HTML 的译文
- 双语时最终写回：

  ```ts
  this.node.innerHTML = `${escapeHtml(this.original)} | ${value}`;
  ```

  （`escape-html` 已是项目依赖；英文原文必须转义作为文本，中文译文继续使用现有处理后的 HTML）

- 效果：`big breasts | 巨乳`、`female:big breasts | 女性:巨乳`
- 标签均为短文本，不做长文本换行
- `ehs-tag` 属性防重复机制不变，天然覆盖双语结果
- `lang` 属性：双语时设 `zh-hans`（与翻译态一致）

不改：`src/services/tagging.ts`、`src/plugin/tag-database.ts`、`tag-tip`、`introduce`——它们读取的是 `ehs-tag` 属性里的原文，不受 innerHTML 变化影响。

---

## 七、Popup 改造

文件：`src/plugin/popup/index.ts`、`src/plugin/popup/index.less`

### 1. 设置面板

`checkboxList`（popup/index.ts:247）中移除 `translateUi`、`translateTag` 两项，替换为两个分段按钮组：

```text
全站 UI    [ 原始 ] [ 翻译 ] [ 双语 ]
标签       [ 原始 ] [ 翻译 ] [ 双语 ]
```

- 控件内部按第三节的映射读写 `translateUi/bilingualUi`、`translateTag/bilingualTag` 四个 boolean，不重构成 enum
- 当前态由 `state.configValue` 推导：`!translateX → 原始`；`translateX && !bilingualX → 翻译`；`translateX && bilingualX → 双语`
- 新增分段按钮样式（参考现有 `.action` / checkbox 风格，选中态高亮）
- 其余设置项（时间戳、标签介绍、图标、搜索提示、自动更新、图片级别、外部数据库）全部保持现状

### 2. 保存后刷新

`saveConfig()`（popup/index.ts:237）末尾、关闭面板后执行 `location.reload()`。

用一次刷新换掉全部运行时重绘/状态恢复代码——双语 → 原始、翻译 → 双语等一切切换都从服务器原始 DOM 重新开始。

注意： reload 前确保 `storage.set` 已写入完成（现有 await 链已保证）。

---

## 八、EhWiki CSS 特例

不做专门设计，只做最小检查：

- 现有 Wiki CSS 会在中文标签后追加英文原标签（`src/plugin/syringe/index.less` 相关规则）
- 双语模式下若造成英文重复（`English | 中文 English`），删除或限制该条 CSS（例如仅在非双语类名下生效，可借助 `setRootAttrs()` 加 `ehs-bilingual-tag` 类控制）
- 无影响则不扩展 Wiki 逻辑

---

## 九、改动文件清单

### 必改

| 文件                          | 内容                                                     |
| ----------------------------- | -------------------------------------------------------- |
| `src/services/storage.ts`     | `ConfigData` + `defaults` + config 读取缺省合并          |
| `src/services/sync-storage.ts` | 同步层 config 缺省合并（视实现，可能与上行合并为一处）    |
| `src/plugin/syringe/index.ts` | 两个 helper、UI 双语分支、标签双语分支                    |
| `src/plugin/popup/index.ts`   | 两个分段按钮组、保存后 reload                            |

### 大概率少量修改

| 文件                           | 内容                                |
| ------------------------------ | ----------------------------------- |
| `src/plugin/popup/index.less`  | 分段按钮样式                        |
| `src/plugin/syringe/index.less` | 注入 span 样式、EhWiki CSS 特例修补 |

### 原则上不碰

```text
src/services/ui-translation/**   （词典数据层）
src/services/tagging.ts
src/plugin/tag-database.ts / database-updater.ts / tag-tip/** / introduce/**
src/providers/**
webpack.config.js / manifest.json
```

---

## 十、实施顺序

1. **配置层**：`ConfigData` 加 `bilingualUi` / `bilingualTag`，更新 defaults，做 config 读取缺省合并
2. **helper**：`formatBilingualText()` + `hasBilingualDisplay()`
3. **UI 双语**：`translateUi()` 各写回点加 bilingual 分支（文本节点追加注入、属性拼接 + 防重复）
4. **标签双语**：`TagNodeRef.translate()` 加双语分支
5. **Popup**：checkbox ×2 → 分段按钮组 ×2，保存后 `location.reload()`
6. **修补**：测试发现的 CSS / Wiki / 动态 DOM 问题
7. **验证**：lint + 构建 + 人工回归（见第十一节）
8. **身份切换（人工，见第十二节）**

每步完成后运行 `pnpm lint && pnpm build:monkey` 保持可构建状态。

---

## 十一、测试与验证

无单元测试框架，采用 `pnpm start:monkey` 热调试 + 人工回归。覆盖清单：

**UI 三态：**

- 原始 → English；翻译 → 中文；双语 → `English | 中文`
- 长文本（≥ 40 字符）→ 原文换行后中文
- 检查点：普通文本、`title`、`placeholder`、提交按钮（验证表单提交值未被污染）、`optgroup`、顶部导航
- 动态加载内容（翻页、无限滚动）正确双语化
- MutationObserver 不重复追加：`Favorites` 不会变成 `Favorites | 收藏夹 | 收藏夹`

**标签三态：**

- 原始 → `big breasts`；翻译 → `巨乳`；双语 → `big breasts | 巨乳`
- 命名空间标签 → `female:big breasts | 女性:巨乳`
- 带 emoji / 图标的翻译（`markImagesAndEmoji` 输出）双语正常
- 标签介绍（tag-tip / introduce）功能不受影响
- EhWiki 页面无重复英文

**配置：**

- 新装默认：UI=翻译、标签=双语
- 旧配置（无 bilingual 字段）升级后：按统一新默认生效（UI=翻译、标签=双语）
- 三态切换保存 → 页面自动刷新 → 新模式生效
- 其余设置项回归无异常

**最终门禁：**

```bash
pnpm lint
pnpm build:monkey
```

---

## 十二、人工阶段：项目身份切换（不交给 AI）

功能开发、测试全部完成后，由开发者人工执行：

```text
package.json
- name / displayName / description
- repository / bugs / homepage

README.md / README.userscript.md / CHANGELOG.md
- 仍含 EhSyringe 与扩展安装说明，整体改写

CI / Release 地址
- .github/workflows/ci.yml 中 release 附件名（ehsyringe.*）

Userscript 身份（派生自 package.json + webpack.config.js）
- @name / @namespace / updateURL / downloadURL
- 产物文件名 ehsyringe.user.js → ehbilingual.user.js（webpack fileName 函数）

项目相关链接、图标、MIT License 信息
```

注意：userscript 的名称、namespace、更新地址从 `package.json` 和 `webpack.config.js` 派生，改动后老用户的自动更新链路会断开，需在发布说明中提示重新安装。
