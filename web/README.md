# WonderCard Studio v0.3

这是 WonderCard Toolkit 图形化前端的**首个实际提交版本**，Windows/Chrome/Edge 浏览器离线使用。

## 启动
- 下载并双击 [standalone.html](standalone.html)：单个文件，无需安装 Python 或联网。
- 或者下载仓库，打开 [index.html](index.html)（同目录保留 manifest.js、i18n.js、app.js、style.css）。

## 当前功能与边界
- 已实现：WC6/WC7、WC6Full/WC7Full 打开、批量拖放、基础字段编辑、HEX/DIFF、无损 JSON、批量 CSV 审计、深浅色切换。
- UI i18n：简体中文 / 繁體中文 / English / 日本語（语言模块 169 个键、四种语言完备）。
- 目前不支持直接编辑和导出未经校验的 Full 文件，原样导出不受影响。
- **不代表全世代读写已实现**：Gen 4/5/8/9 与 BCAT 等见 docs/FORMAT_MATRIX.md 和 Issues。
- 内置演示文件为**合成测试卡**，不是官方配信。请自行导入拥有的配信文件。
- 切换 UI 语言不会修改任何 WC 字节，也不会改配信 `language`/OT/Title/JSON baseline。

## 质量检查
```sh
node scripts/check_locales.js
node --check web/i18n.js
python scripts/build_standalone.py
```
`docs/I18N.md` 约定翻译扩展和安全约束；Python CLI 的 v0.2 代码尚未并入此 GitHub 分支，参考跟踪 Issue #2。
