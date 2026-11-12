# 课题组工作台

一个可自行部署的联网课题组工作台 MVP。前端使用原生 HTML、CSS 和 JavaScript，后端使用 Node.js 内置模块，无第三方运行依赖。

## 功能

- 账号注册与登录；注册者可以创建课题组成为 PI，也可以使用邀请码加入已有课题组。
- 成员、项目、任务、文献、日历、数据分析、可视化复盘、实验记录和附件管理。
- 每日上报、周报整理与 AI 摘要；成员确认后才会应用摘要内容。
- 浏览器通知提醒每日上报、当天任务和逾期任务。
- PI 可配置 AI 服务商、接口 URL、请求路径和模型；API Key 仅由服务器环境变量读取。
- 工作区数据保存在 JSON 文件中，记录按课题组隔离；付费订阅接口已预留，当前不处理支付。

## 本地启动

需要 Node.js 18 或更新版本。

```bash
cp .env.example .env
# 编辑 .env，填写 AI_BASE_URL、AI_CHAT_PATH、AI_MODEL 和 AI_API_KEY
set -a
. ./.env
set +a
npm start
```

打开 <http://127.0.0.1:9013>。首次注册时创建课题组；其他成员选择加入并填写 PI 提供的邀请码。`.env` 只在服务器配置，切勿提交真实密钥。

运行 `npm run check` 可检查 JavaScript 语法。数据写入 `server/data/`，该目录已从 Git 忽略。首次上线前可在停止服务后删除 `server/data/lab-workbench.json`；正式使用后请先备份，删除会清空账号与业务数据。

## Linux 服务器部署

将代码放到服务器目录并配置环境变量：

```bash
cp .env.example .env
chmod 600 .env
# 编辑 .env 后，在当前 shell 中启动：
set -a
. ./.env
set +a
npm start
```

`deploy/lab-workbench.service` 提供了 systemd 用户服务模板。生产环境应使用 HTTPS 反向代理，并设置 `COOKIE_SECURE=true`；不要将 9013 端口直接暴露到公网。浏览器通知需要 HTTPS 和用户授权，当前提醒在工作台页面打开时触发。

持久化数据位于 `server/data/lab-workbench.json`，附件位于 `server/data/attachments/`。请为这两个内容配置定期备份。MVP 使用单机 JSON 文件；需要多实例部署或更大规模时，应迁移到 PostgreSQL 和对象存储。

## AI 配置

服务器 `.env` 中的 `AI_API_KEY` 是密钥来源。PI 可在工作台中配置服务商名称、Base URL、请求路径和模型名；密钥不会返回到浏览器。接口需兼容 OpenAI Chat Completions 格式。

## 说明

这是尚未接入支付的 MVP。创建账号后请 PI 分享课题组邀请码；邀请码属于加入凭据，应通过可信渠道发送。支付与月付、年付订阅接口目前只是预留。
