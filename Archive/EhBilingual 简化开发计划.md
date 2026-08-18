
## EhBilingual 简化开发计划

### 一、目标冻结

最终只有两个三态设置：

| 功能    | 原始 | 翻译 | 双语      | 默认     |
| ----- | -- | -- | ------- | ------ |
| 全站 UI | 英文 | 中文 | 英文 + 中文 | **翻译** |
| 标签    | 英文 | 中文 | 英文 + 中文 | **双语** |

双语格式完全按照 Github-Bilingual：

```text
短文本：
English | 中文

长文本：
English
中文
```

模式修改后**不做当前页面即时切换**。保存配置后刷新页面生效。

其他 EhSyringe 功能保持原样。

---

## 二、配置层：最小改动

保留现在已有的：

```ts
translateUi: boolean;
translateTag: boolean;
```

新增：

```ts
bilingualUi: boolean;
bilingualTag: boolean;
```

最终对应关系：

```text
UI 原始
translateUi = false

UI 翻译
translateUi = true
bilingualUi = false

UI 双语
translateUi = true
bilingualUi = true
```

标签完全相同。

### 新安装默认值

```ts
translateUi: true,
bilingualUi: false,

translateTag: true,
bilingualTag: true,
```

即：

```text
UI = 翻译
标签 = 双语
```

### 旧配置兼容

旧用户没有：

```text
bilingualUi
bilingualTag
```

时统一视为：

```ts
false
```

因此旧用户原来的：

```text
translateUi = true
translateTag = true
```

升级以后仍然是：

```text
UI = 翻译
标签 = 翻译
```

不会突然变成双语。

当前配置确实正是 `translateUi` / `translateTag` 两个 boolean，因此这种兼容方式对现有结构侵入很小。

---

## 三、只增加一个双语格式函数

不建立新的 Service、不做状态系统。

在 Syringe 附近增加简单 helper 即可，例如：

```ts
function formatBilingualText(original: string, translated: string): string {
    if (!original || !translated || original === translated) {
        return translated || original;
    }

    return original.length < 40
        ? `${original} | ${translated}`
        : `${original}\n${translated}`;
}
```

再增加一个轻量判断：

```ts
function hasBilingualDisplay(text: string): boolean {
    // 参考 Github-Bilingual 的判断方式
}
```

它的职责只有：

> MutationObserver 再碰到已经生成的双语文本时，不要重复翻译。

Github-Bilingual 本身就是通过 `formatBilingualText()` + `hasBilingualDisplay()` 这类轻量机制防止重复加工。

不做：

* WeakMap；
* UiNodeRef；
* 原文缓存系统；
* DOM 状态管理器；
* 可逆渲染。

---

# 四、UI 双语

主要改：

```text
src/plugin/syringe/index.ts
```

保留现有：

```ts
translateUiText()
translateUi()
```

总体流程不变。

现在：

```text
英文
 ↓
查词典
 ↓
中文
 ↓
写回 DOM
```

改成：

```text
英文
 ↓
查词典
 ↓
判断 bilingualUi
 ├─ false → 中文
 └─ true  → 英文 | 中文
```

也就是说，重点修改 `translateUiText()` 最后的显示结果，而不是改 `UiTranslation`。

现有 UI Translation 服务只是负责提供：

```text
English → 中文
```

的 replacement 数据，这一层完全没必要碰。

---

## 五、现有 UI 特殊处理继续保留

EhSyringe 已经处理了：

* 文本节点；
* `title`；
* `placeholder`；
* `optgroup.label`；
* 导航；
* input button；
* textarea；
* MutationObserver 动态节点；
* 一些第三方脚本兼容。

这些逻辑继续原样运行。

区别只在于：

```text
translation
```

以前是：

```text
中文
```

现在双语模式可以是：

```text
English | 中文
```

### 表单按钮

现有：

```text
<input value="Apply">
```

为了避免修改真正提交值，EhSyringe 会生成一个显示用 button。这个机制必须原样保留。

因此双语只改变显示：

```text
Apply | 应用
```

不改变表单真正提交的数据。

---

# 六、MutationObserver 只做轻量防重复

不保存原始 DOM。

处理方式：

```text
MutationObserver
      ↓
发现文本
      ↓
是否已经属于双语结果？
      ├─ 是 → 跳过
      └─ 否 → 正常查翻译
```

配合现有 EhSyringe 已经存在的：

```text
eh-syringe-ignore
ehs-tag
```

等标记即可。

目标只防止：

```text
Favorites
→ Favorites | 收藏夹
→ Favorites | 收藏夹 | 收藏夹
```

不试图解决“切换模式后把 DOM 恢复原状”，因为模式切换本身已经规定为**刷新后生效**。

这是整个简化方案最关键的取舍。

---

# 七、标签双语

仍然主要改：

```text
src/plugin/syringe/index.ts
```

当前 `TagNodeRef` 已经保存：

```ts
original
fullKey
```

所以标签甚至不需要轻量原文恢复机制。

只把现在：

```ts
translate(tagMap)
```

内部扩展为：

```text
translateTag = false
→ original

translateTag = true
bilingualTag = false
→ translated

translateTag = true
bilingualTag = true
→ original | translated
```

例如：

```text
big breasts
巨乳

→

big breasts | 巨乳
```

带 namespace：

```text
female:big breasts | 女性:巨乳
```

---

## 八、标签 HTML 保持现有机制

当前中文标签会经过：

```ts
markImagesAndEmoji()
```

所以有些翻译结果可能含图标/emoji markup。

这里不做大规模 DOM 重构。

建议最小处理：

```ts
node.innerHTML = `${escape(original)} | ${translatedHtml}`;
```

其中英文原始标签必须作为文本安全转义，中文翻译继续使用现有经过处理后的 HTML。

也就是说：

* 不重写 Tagging；
* 不改数据库；
* 不改 emoji/image 功能；
* 只改变最终拼接结果。

---

# 九、EhWiki CSS 特例

按照你的意见：

**不把这部分列为主要重构目标。**

当前 Wiki 确实有一个 CSS 会在中文标签后追加英文原标签。

实际开发时只做最小检查：

* 如果明显造成英文重复，就删掉/限制这一条 CSS；
* 如果没有影响当前目标，就不扩展 Wiki 专门逻辑。

也就是把它当成一个很小的兼容修补，而不是单独设计 Wiki 三态系统。

---

# 十、Popup 改成两个三态选择器

主要修改：

```text
src/plugin/popup/index.ts
```

可能少量修改：

```text
src/plugin/popup/index.less
```

当前：

```text
☑ 翻译界面
☑ 翻译标签
```

改成：

```text
全站 UI
[ 原始 ] [ 翻译 ] [ 双语 ]

标签
[ 原始 ] [ 翻译 ] [ 双语 ]
```

但内部仍然操作那四个 boolean。

例如：

```ts
setUiMode('original')
→ translateUi = false
  bilingualUi = false

setUiMode('translated')
→ translateUi = true
  bilingualUi = false

setUiMode('bilingual')
→ translateUi = true
  bilingualUi = true
```

这样 UI 有清晰的三态，但底层配置不需要重构成 enum。

其他 Popup 设置全部保持现状。当前两个翻译项确实就在现有 checkbox 列表里，所以改动范围很集中。

---

# 十一、保存后刷新

这里明确不实现运行时重绘。

设置保存：

```text
保存
 ↓
写入 config
 ↓
关闭设置
 ↓
刷新页面
```

我建议直接在保存成功之后：

```ts
location.reload();
```

这样：

```text
双语 → 原始
翻译 → 双语
双语 → 翻译
```

全部天然从服务器原始 DOM 重新开始。

这是用一次刷新换掉大量状态管理代码。

---

# 十二、预计修改文件

### 必改

```text
src/services/storage.ts

src/plugin/syringe/index.ts

src/plugin/popup/index.ts
```

### 大概率少量修改

```text
src/plugin/syringe/index.less
src/plugin/popup/index.less
```

### 原则上不碰

```text
src/services/ui-translation/**
src/services/tagging.ts
src/plugin/tag-database.ts
src/plugin/database-updater.ts
src/plugin/tag-tip/**
src/plugin/introduce/**
src/providers/**
```

也就是说，这次应该能控制成一个**局部功能修改**。

---

# 十三、测试重点

不需要建立很大的测试矩阵，先覆盖最重要的行为。

**UI：**

```text
原始 → English
翻译 → 中文
双语 → English | 中文
```

长文本：

```text
English sentence
中文句子
```

检查：

* 普通文本；
* title；
* placeholder；
* button；
* 动态加载内容；
* MutationObserver 不重复追加。

**标签：**

```text
原始 → big breasts
翻译 → 巨乳
双语 → big breasts | 巨乳
```

检查：

* 普通标签；
* namespace 标签；
* 带 emoji / icon 的翻译；
* 动态标签；
* EhWiki 是否出现重复英文。

**设置：**

```text
UI 默认 = 翻译
标签默认 = 双语
```

旧配置：

```text
旧 translateUi=true
→ 仍然翻译

旧 translateTag=true
→ 仍然翻译
```

保存模式后刷新并正确生效。

---

# 十四、构建验证

最后运行：

```bash
pnpm lint
pnpm run build:monkey
```

由于 Syringe 是扩展和 Userscript 共用代码，再补：

```bash
pnpm run build:chrome
pnpm run build:firefox
```

现有项目本身已经提供这些构建命令。

---

# 十五、项目身份切换：开发者人工执行

这一阶段**不交给 AI / Agent**。

代码功能完成、测试完成之后，只生成清单给开发者自行处理：

```text
package.json
- name
- displayName
- description
- repository
- bugs
- homepage

README.md
README.userscript.md
CHANGELOG.md

CI / Release 地址
Userscript namespace / updateURL / downloadURL
项目相关链接
MIT License 信息
```

因为当前 Userscript 的名称、namespace、更新下载地址等会从 `package.json` 和 webpack 配置派生，所以这些身份信息适合最后统一人工切换。

---

## 最终实施顺序

可以压缩成 **7 步**：

1. 给配置增加 `bilingualUi`、`bilingualTag`，做好旧配置默认 `false`。
2. 加 `formatBilingualText()` 和轻量 `hasBilingualDisplay()`。
3. 给 UI 翻译增加 bilingual 分支。
4. 给标签翻译增加 bilingual 分支。
5. Popup 两个 checkbox 改成三态选择器，保存后刷新。
6. 修掉测试中出现的少量 CSS / Wiki / 动态 DOM 重复问题。
7. lint + monkey/chrome/firefox 构建与人工回归。

**到这里功能开发结束。**

然后单独交给开发者做第 8 步：**EhSyringe → EhBilingual 项目身份切换。**
