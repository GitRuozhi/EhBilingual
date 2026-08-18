<!-- 这个文件因为是用来做 GreasyFork 外链的简介的，所以不能用相对地址 -->

# EhBilingual

[![Build Status](https://github.com/GitRuozhi/EhBilingual/workflows/ci/badge.svg)](https://github.com/GitRuozhi/EhBilingual/actions)

E 站（E-Hentai / ExHentai / EHWiki）中英双语用户脚本，基于 [EhSyringe](https://github.com/EhTagTranslation/EhSyringe) 改造。

全站 UI 与标签支持「原始 / 翻译 / 双语」三态切换，双语显示示例：`big breasts | 巨乳`。

## 安装

> 也可以从 [GitHub Release](https://github.com/GitRuozhi/EhBilingual/releases/latest/download/ehbilingual.user.js) 安装

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
        <td><img src="https://user-images.githubusercontent.com/13471233/110159090-31d71100-7e25-11eb-9b48-71720eb319f2.gif"></td>
    </tr>
</table>

## 反馈

为便于追踪问题，请勿使用 GreasyFork 的评论系统，请直接到[项目页面](https://github.com/GitRuozhi/EhBilingual/issues)进行反馈。

## 小工具

- 用户脚本脚本小工具合集 <https://github.com/EhTagTranslation/UserScripts>

## [上游同步](https://github.com/GitRuozhi/EhBilingual/blob/master/UPSTREAM.md)
