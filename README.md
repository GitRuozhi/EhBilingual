# EhBilingual - E 站中英双语标签+双语页面

这是一个 E 站（E-Hentai / ExHentai / EHWiki）中英双语用户脚本，基于 [EhSyringe](https://github.com/EhTagTranslation/EhSyringe)。它在保留英文原文的同时显示中文翻译，支持「原始 / 翻译 / 双语」三态切换。<br><sub>This is a Chinese-English bilingual userscript for E-Hentai / ExHentai / EHWiki based on EhSyringe. It does not completely replace the site with Chinese, but shows Chinese translation while retaining the original English text, with Original / Translated / Bilingual modes for both the UI and tags.</sub>

## 安装 | Install

1. 第一步：[安装用户脚本管理器 | Install a userscript manager](https://greasyfork.org/)

2. 第二步：[安装脚本 | Install the script](https://sleazyfork.org/zh-CN/scripts/591845-ehbilingual)

> 此外，您还可以：[访问 GitHub 获取源码 | Visit GitHub for Code](https://github.com/GitRuozhi/EhBilingual/)

## 预览 | Preview

<table style="font-weight: bold; text-align: center;">
    <tr>
        <td><strong>搜索列表 | Search list</strong></td>
    </tr>
    <tr>
        <td><img src="https://raw.githubusercontent.com/GitRuozhi/EhBilingual/master/Preview/search-list.jpeg?v=20260818b" width="400"></td>
    </tr>
    <tr>
        <td><strong>详情页 | Gallery detail</strong></td>
    </tr>
    <tr>
        <td><img src="https://raw.githubusercontent.com/GitRuozhi/EhBilingual/master/Preview/gallery-detail.jpeg?v=20260818b" width="400"></td>
    </tr>
    <tr>
        <td><strong>设置页 | Settings</strong></td>
    </tr>
    <tr>
        <td><img src="https://raw.githubusercontent.com/GitRuozhi/EhBilingual/master/Preview/settings.jpeg" width="400"></td>
    </tr>
</table>

## 说明 | Description

- 全站 UI 支持「原始 / 翻译 / 双语」三态切换，默认翻译。<br><sub>The site UI supports Original / Translated / Bilingual modes, default: Translated.</sub>

- 标签翻译支持「原始 / 翻译 / 双语」三态切换，默认双语。<br><sub>Tag translations support Original / Translated / Bilingual modes, default: Bilingual.</sub>

- 标签介绍。<br><sub>Tag introduction / description.</sub>

- 短文本显示为 `English | 中文`，长文本显示为两行：第一行原文，第二行译文。<br><sub>The short text is displayed as `English | 中文`, the long text is displayed as two lines: the first line of the original text and the second line of the translation.</sub>

- 针对不同页面专门调整了双语标签的布局：搜索列表（Compact / Extended / Minimal 等）与画廊详情页的标签上下两行显示，表格与标签容器会自动增高以容纳两行；EHWiki、generic 标签链接以及「我的标签」编辑网格保持单行 `English | 中文`，避免破坏原站固定行高。<br><sub>The bilingual tag layout is specially adjusted per page: on the search list (Compact / Extended / Minimal, etc.) and the gallery detail page, tags are shown as two lines and the table/tag container auto-expands to fit them; EHWiki, generic tag links, and the "My Tags" editing grid remain single-line `English | 中文` to avoid breaking the site's fixed row height.</sub>

- 标签翻译数据库（42000+ 条）自动更新，无需手动同步上游。<br><sub>The tag translation database (42000+ entries) auto-updates; no manual upstream sync needed.</sub>

- 兼容 E-Hentai-Downloader、熊猫书签、ExResurrect 等第三方脚本，支持 Via、Alook 等手机浏览器。<br><sub>Compatible with E-Hentai-Downloader, Panda bookmarklet, ExResurrect and other third-party scripts, and supports mobile browsers such as Via and Alook.</sub>

- 修改基于版本：`3.4.9`，本分支版本号：`3.4.9-20260818b`。<br><sub>Revised based on version: `3.4.9`, this branch version number: `3.4.9-20260818b`.</sub>

## 感谢 | Thanks

感谢各位绅士，感谢 EhSyringe 的各位贡献者。<br><sub>Thanks to all gentlemen and the contributors of EhSyringe.</sub>
