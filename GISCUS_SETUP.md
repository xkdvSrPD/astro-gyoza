# Giscus 评论系统集成说明

## 概述

本项目已成功将 Waline 评论系统替换为 Giscus 评论系统。Giscus 是一个基于 GitHub Discussions 的评论系统，具有以下优势：

- 🔒 **隐私友好**：不追踪用户，无广告
- 🎨 **主题支持**：支持亮色/暗色主题自动切换
- 🌍 **多语言**：支持多种语言界面
- ⚡ **性能优秀**：轻量级，加载速度快
- 🔧 **高度可配置**：丰富的配置选项

## 配置说明

### 当前配置

在 `src/config.json` 中的 `giscus` 配置：

```json
{
  "giscus": {
    "repo": "xkdvSrPD/astro-gyoza",
    "repoId": "R_kgDOPW4tbw",
    "category": "Announcements",
    "categoryId": "DIC_kwDOPW4tb84Ctvvm",
    "mapping": "title",
    "strict": "0",
    "reactionsEnabled": "1",
    "emitMetadata": "0",
    "inputPosition": "top",
    "theme": "preferred_color_scheme",
    "lang": "zh-CN",
    "loading": "lazy"
  }
}
```

### 配置参数说明

- `repo`: GitHub 仓库地址
- `repoId`: 仓库 ID
- `category`: 讨论分类
- `categoryId`: 分类 ID
- `mapping`: 页面与讨论的映射方式（title/pathname/url等）
- `strict`: 严格模式
- `reactionsEnabled`: 是否启用反应表情
- `emitMetadata`: 是否发送元数据
- `inputPosition`: 输入框位置（top/bottom）
- `theme`: 主题（支持自动切换）
- `lang`: 界面语言
- `loading`: 加载方式（lazy/eager）

## 主题切换

组件已实现自动主题切换功能：

- 监听 `data-theme` 属性变化
- 自动在亮色/暗色主题间切换
- 与网站主题保持同步

## 使用方法

评论系统会自动在以下页面显示：

1. 博客文章页面（当 `comments: true` 时）
2. 特殊页面（如关于页面，当 `comments: true` 时）

## 技术实现

- 使用 `@giscus/react` 组件
- React Hook 监听主题变化
- CSS 样式适配不同主题
- Astro 组件封装

## 文件结构

```
src/
├── components/comment/
│   ├── Giscus.tsx          # Giscus React 组件
│   ├── Comments.astro      # Astro 包装组件
│   └── index.ts           # 导出文件
├── styles/
│   └── giscus.css         # Giscus 样式文件
└── config.json            # 配置文件
```

## 注意事项

1. 确保 GitHub 仓库已启用 Discussions 功能
2. 确保 Giscus 应用已安装到对应仓库
3. 仓库必须是公开的
4. 用户需要登录 GitHub 才能评论

## 迁移完成

✅ 已删除 Waline 相关文件和配置  
✅ 已安装 @giscus/react 依赖  
✅ 已创建 Giscus 组件  
✅ 已配置主题切换  
✅ 已添加样式文件  
✅ 已更新配置文件
