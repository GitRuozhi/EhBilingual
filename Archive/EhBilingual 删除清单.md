# EhBilingual 精简删除清单

目标：只保留油猴脚本（UserScript）形态，移除浏览器扩展相关的一切。

删除完成后验证：

```bash
pnpm install
pnpm lint
pnpm build:monkey
```

---

## 一、源码删除

### 整个目录删除

| 路径                       | 说明                                              |
| -------------------------- | ------------------------------------------------- |
| `src/web-ext/`             | 扩展入口（background / page / popup / popup.html） |
| `src/providers/web-ext/`   | 扩展版平台实现（storage / messaging / menu / utils） |

### 单个文件删除

| 路径                              | 说明                                       |
| --------------------------------- | ------------------------------------------ |
| `src/plugin/omnibox.ts`           | 地址栏 `ex` 关键词搜索，仅 background 引用  |
| `src/plugin/extension-updater.ts` | 扩展版本更新检查，仅 background 引用        |
| `src/services/notification.ts`    | 仅被 extension-updater 使用，连带死代码     |
| `src/providers/common/notification.ts` | `NotificationInfo` 接口，随上一条一起失效 |

### 局部代码清理

- `src/providers/user-script/utils.ts`：删除 `sendNotification` 函数及 `NotificationInfo` 相关 import（**保留 `setBadge`**，数据库下载进度在用）
- `src/providers/utils.ts`：删除 `sendNotification` 声明（**保留 `setBadge` 声明**）
- `src/providers/common/badge.ts`：保留（`setBadge` 的类型）
- `src/services/storage.ts`：可选——删除 `StorageItems.origin` 及 defaults 中的对应项（仅 omnibox 使用；`migrate()` 会自动清理用户旧数据）

---

## 二、package.json 修改

### scripts 删除

只保留 `start:monkey`、`build:monkey`、`lint`、`format`、`clean`，删除：

```text
start:ext
start:chrome
start:firefox
build:ext
build:chrome
build:firefox
pack:chrome
pack:firefox
```

### devDependencies 删除

```text
@types/chrome
@types/webextension-polyfill
@webextension-toolbox/webpack-webextension-plugin
crx
web-ext
html-webpack-plugin
copy-webpack-plugin
```

### dependencies 删除

```text
webextension-polyfill
```

---

## 三、webpack.config.js 修改

- 删除 `type === 'user-script'` 的 `else` 分支（web-ext 构建逻辑，约 265–299 行）
- 删除顶部对应 import：`CopyPlugin`（copy-webpack-plugin）、`HtmlWebpackPlugin`（html-webpack-plugin）、`WebextensionPlugin`（@webextension-toolbox/webpack-webextension-plugin）
- 可将配置简化：`type` 固定为 user-script，去掉 `env.type` 判断

### 必须保留

- `NormalModuleReplacementPlugin`（把 `providers/xxx` 路由到 `providers/user-script/xxx`）
- `DefinePlugin __type`
- `BannerPlugin`（生成 `==UserScript==` 头）

---

## 四、CI / 其他

| 路径                          | 操作                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `.github/workflows/ci.yml`    | 删除 CRX key 下载、build/pack chrome、build/pack firefox 步骤 |
| `.github/assets/chrome.svg`   | 删除（README 徽章图）                                        |
| `.github/assets/firefox.svg`  | 删除（README 徽章图）                                        |

`README.md` 暂不动，随开发计划第 8 步「项目身份切换」一起处理。

---

## 五、容易误删、必须保留

| 路径                                     | 原因                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| `manifest.json`                          | 油猴构建从它读 `matches`/`exclude_matches` 生成 `@match`，devServer 也读 `host_permissions` |
| `src/providers/user-script/`、`common/`  | 油猴的全部平台能力                                                        |
| `src/providers/menu|messaging|storage|utils.ts` | 构建时按 `type` 路由到 user-script 实现                            |
| `src/plugin/popup/`                      | 油猴通过 `user-script/popup-host.ts` 复用（页内悬浮按钮 + 设置面板）       |
| `src/services/badge-loading.ts`          | 数据库下载进度显示                                                        |
| `src/providers/user-script/utils.ts` 的 `setBadge` | 悬浮按钮上的进度角标                                              |
| `src/plugin/auto-update.ts`              | 油猴脚本自身更新检查                                                      |
| `src/plugin/database-updater.ts`、`tag-database.ts` | 标签数据库核心功能                                                |
| `idb-keyval`（dependency）               | 油猴存储的降级方案（无 GM_* 环境时用）                                    |
| `@types/tampermonkey`（devDependency）   | GM_* API 类型定义                                                         |

---

## 六、执行顺序建议

1. 删源码（第一节）
2. 改 webpack.config.js（第三节）
3. 改 package.json（第二节），`pnpm install` 更新 lockfile
4. 改 ci.yml（第四节）
5. `pnpm lint && pnpm build:monkey` 验证
6. 提交
