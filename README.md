# EhBilingual

[![Build Status](https://github.com/GitRuozhi/EhBilingual/workflows/ci/badge.svg)](../../actions)

[![GitHub All Releases](https://img.shields.io/github/downloads/GitRuozhi/EhBilingual/total)](../../releases)
[![GitHub Releases (by Asset)](https://img.shields.io/github/downloads/GitRuozhi/EhBilingual/latest/ehbilingual.user.js)](../../releases/latest/download/ehbilingual.user.js)

E 站（E-Hentai / ExHentai / EHWiki）中英双语用户脚本，基于 [EhSyringe](https://github.com/EhTagTranslation/EhSyringe) 改造。

全站 UI 与标签均支持 **原始 / 翻译 / 双语** 三态切换：

| 功能    | 原始 | 翻译 | 双语            | 默认     |
| ------- | ---- | ---- | --------------- | -------- |
| 全站 UI | 英文 | 中文 | 英文 + 中文     | **翻译** |
| 标签    | 英文 | 中文 | 英文 + 中文     | **双语** |

双语显示示例：`big breasts | 巨乳`、`female:big breasts | 女性:巨乳`。

> 模式修改后不做当前页面即时切换，保存配置后刷新页面生效。

## 安装

1. [安装一个用户脚本管理器](https://sleazyfork.org/help/installing-user-scripts)（Tampermonkey、Violentmonkey 等）
2. 前往 [GitHub Release](../../releases/latest/download/ehbilingual.user.js) 安装最新版本

> 如果你使用的是 Via、Alook 等对用户脚本支持不完善的浏览器，可以考虑使用以下代码加载插件
>
> ```js
> (function () {
>     if (/(^|\.)e[-x]hentai\.org$/i.test(location.hostname) && !document.getElementById('EhBilingual-Script')) {
>         var script = document.createElement('script');
>         script.id = 'EhBilingual-Script';
>         script.src = 'https://github.com/GitRuozhi/EhBilingual/releases/latest/download/ehbilingual.user.js';
>         document.documentElement.append(script);
>     }
> })();
> ```

## 功能

- 全站翻译（大部分）
- 标签翻译
- 全站 UI 与标签双语显示
- 标签介绍
- 标签翻译数据更新（当前[数据库](https://ehtt.vercel.app/list/all)包含 [![all](https://img.shields.io/endpoint?label=&color=brightgreen&url=https://ehtt.fly.dev/database/all/~badge)](https://ehtt.vercel.app/list/all) 条标签翻译）
- 搜索框标签输入提示
- 支持 Via、Alook 等支持自定义脚本的手机浏览器

## 特点

- 兼容 E-Hentai-Downloader 及熊猫书签
- 在加载 DOM 过程替换翻译, 页面加载完直接是中文不会闪烁

## 截图预览

<table style="font-weight: bold; text-align: center;">
    <tr>
        <td><strong>搜索列表</strong></td>
        <td><strong>详情页（标签描述）</strong></td>
    </tr>
    <tr>
        <td><img src="https://user-images.githubusercontent.com/13471233/110159103-356a9800-7e25-11eb-9335-233c051b3ea5.png"></td>
        <td><img src="https://user-images.githubusercontent.com/13471233/110159105-37345b80-7e25-11eb-89d6-a16ae2e8edd3.png"></td>
    </tr>
    <tr>
        <td><strong>搜索提示/补全</strong></td>
        <td><strong>标签数据更新</strong></td>
    </tr>
    <tr>
        <td><img src="https://user-images.githubusercontent.com/5716100/60812493-310b5900-a1c4-11e9-85f7-1d4212765156.gif"></td>
        <td><img src="https://user-images.githubusercontent.com/5716100/62783460-10019500-baef-11e9-8368-a48fa40dc47d.gif"></td>
    </tr>
</table>

## 小工具

- 用户脚本脚本小工具合集 [EhTagTranslation/UserScripts](https://github.com/EhTagTranslation/UserScripts)

## [更新日志](CHANGELOG.md)

## 开发

### 开发指南

- UI 翻译位于 `src/services/ui-translation/data`
- 双语逻辑位于 `src/plugin/syringe/index.ts`

### 发布新版本

1. 编辑 `CHANGELOG.md` 并加入暂存区
2. 运行 `pnpm version --no-git-checks <new-version>` 更新版本号
3. 运行 `git push --follow-tags` 推送新版本
4. 等待 GitHub Actions 自动编译并发布新版本
