/* 课题组工作台 · 后端接口契约
 * 本文件只描述契约，不发起任何网络请求。
 * 当前原型由浏览器内的 Demo 适配器驱动；上服务器时只需替换三层适配器，UI 层不用改。
 */
window.LabContract = {
  version: '1.0.0',
  title: '服务器对接蓝图',
  summary: '联网 MVP 已接入 bdyy 上的 Node 服务：真实注册/登录、邀请码归组、项目/任务/日报/周报和服务端 AI。存储层当前使用服务器 JSON 文件，记录带 workspace_id，后续可迁移 PostgreSQL 并扩展多课题组订阅。',

  adapters: [
    {
      layer: '数据层',
      name: 'LabStore',
      contract: 'list(collection) / get(collection,id) / create(collection,item) / update(collection,id,patch) / remove(collection,id)',
      now: 'DemoStore：仅 file:// 演示模式使用 localStorage',
      server: 'HttpStore：HTTP 页面通过 fetch 调用服务器接口，按会话返回可见数据',
      file: 'js/store.js'
    },
    {
      layer: '认证层',
      name: 'AuthAdapter',
      contract: 'current() / members() / switchTo(id) / signIn(credentials) / signOut()',
      now: 'DemoAuth：下拉切换成员，仅用于 file:// 演示',
      server: '邮箱 + 密码注册登录，HttpOnly 会话 Cookie；后续可接机构 SSO',
      file: 'js/app.js 顶部 AuthAdapter'
    },
    {
      layer: 'AI 层',
      name: 'LabAI',
      contract: 'summarize(payload) → Promise<SummaryResult>',
      now: 'MockSummarizer：本地规则生成结构化摘要，标注为演示',
      server: 'HttpSummarizer：日报/周报 POST 到服务器，国模 Key 只放服务端环境变量',
      file: 'js/ai.js'
    }
  ],

  tables: [
    {
      name: 'members',
      comment: '课题组成员',
      columns: [
        { name: 'id', type: 'text', note: '主键' },
        { name: 'name', type: 'text', note: '姓名' },
        { name: 'email', type: 'text', note: '机构邮箱，唯一' },
        { name: 'phone', type: 'text', note: '可选，用于通知与找回账号' },
        { name: 'role', type: 'text', note: 'pi / member' },
        { name: 'academic_role', type: 'text', note: '博士生 / 硕士生 / 博士后等' },
        { name: 'status', type: 'text', note: 'active / disabled' },
        { name: 'color', type: 'text', note: '头像底色' },
        { name: 'created_at', type: 'timestamptz', note: '' }
      ]
    },
    {
      name: 'projects',
      comment: '论文与课题项目',
      columns: [
        { name: 'id', type: 'text', note: '主键' },
        { name: 'title', type: 'text', note: '项目名' },
        { name: 'kind', type: 'text', note: '论文 / 课题' },
        { name: 'goal', type: 'text', note: '目标' },
        { name: 'start_date', type: 'date', note: '' },
        { name: 'deadline', type: 'date', note: '关键节点' },
        { name: 'progress', type: 'int', note: '0-100，AI 汇总可回写' },
        { name: 'lead_id', type: 'text', note: '负责人 → members.id' },
        { name: 'milestones', type: 'jsonb', note: '[{title,due,done}]' },
        { name: 'notes', type: 'text', note: '' }
      ]
    },
    {
      name: 'tasks',
      comment: '科研任务',
      columns: [
        { name: 'id', type: 'text', note: '主键' },
        { name: 'title', type: 'text', note: '' },
        { name: 'project_id', type: 'text', note: '→ projects.id' },
        { name: 'assignee_id', type: 'text', note: '→ members.id' },
        { name: 'priority', type: 'text', note: '高 / 中 / 低' },
        { name: 'status', type: 'text', note: 'todo / doing / done / delayed' },
        { name: 'due_date', type: 'date', note: '' },
        { name: 'tags', type: 'jsonb', note: '字符串数组' },
        { name: 'completed_at', type: 'timestamptz', note: '看板与复盘统计依据' }
      ]
    },
    {
      name: 'papers',
      comment: '文献库',
      columns: [
        { name: 'id', type: 'text', note: '' },
        { name: 'title', type: 'text', note: '' },
        { name: 'authors', type: 'text', note: '' },
        { name: 'year', type: 'int', note: '' },
        { name: 'venue', type: 'text', note: '期刊 / 会议' },
        { name: 'tags', type: 'jsonb', note: '分类与关键词' },
        { name: 'project_id', type: 'text', note: '关联项目' },
        { name: 'read_state', type: 'text', note: '待读 / 略读 / 精读' },
        { name: 'rating', type: 'int', note: '1-5' },
        { name: 'note', type: 'text', note: '阅读笔记与摘要' },
        { name: 'url', type: 'text', note: '' }
      ]
    },
    {
      name: 'events',
      comment: '科研日历',
      columns: [
        { name: 'id', type: 'text', note: '' },
        { name: 'title', type: 'text', note: '' },
        { name: 'date', type: 'date', note: '' },
        { name: 'type', type: 'text', note: '实验 / 写作 / 组会 / 文献 / 答辩' },
        { name: 'project_id', type: 'text', note: '' },
        { name: 'reminder', type: 'bool', note: '是否提醒' },
        { name: 'done', type: 'bool', note: '' }
      ]
    },
    {
      name: 'analyses',
      comment: '数据分析记录',
      columns: [
        { name: 'id', type: 'text', note: '' },
        { name: 'title', type: 'text', note: '' },
        { name: 'tool', type: 'text', note: 'Python / Stata / R' },
        { name: 'dataset', type: 'text', note: '数据集' },
        { name: 'script', type: 'text', note: '清洗与统计脚本路径或内容' },
        { name: 'result', type: 'text', note: '关键结论' },
        { name: 'project_id', type: 'text', note: '' },
        { name: 'created_at', type: 'timestamptz', note: '' }
      ]
    },
    {
      name: 'daily_logs',
      comment: '每日工作上报 + AI 汇总结果',
      columns: [
        { name: 'id', type: 'text', note: '' },
        { name: 'date', type: 'date', note: '' },
        { name: 'author_id', type: 'text', note: '→ members.id' },
        { name: 'project_id', type: 'text', note: '主关联项目' },
        { name: 'content', type: 'text', note: '成员原始上报内容' },
        { name: 'hours', type: 'numeric', note: '投入时长' },
        { name: 'summary', type: 'jsonb', note: 'SummaryResult，AI 结构化输出' },
        { name: 'applied', type: 'bool', note: '是否已回写任务/项目' },
        { name: 'created_at', type: 'timestamptz', note: '' }
      ]
    },
    {
      name: 'reviews',
      comment: '定期复盘',
      columns: [
        { name: 'id', type: 'text', note: '' },
        { name: 'period', type: 'text', note: '如 2026-W45' },
        { name: 'content', type: 'text', note: '' },
        { name: 'created_at', type: 'timestamptz', note: '' }
      ]
    },
    {
      name: 'protocols',
      comment: 'PI 维护、成员查看的课题组规范',
      columns: [
        { name: 'id', type: 'text', note: '' },
        { name: 'title', type: 'text', note: '' },
        { name: 'purpose', type: 'text', note: '适用范围' },
        { name: 'content', type: 'text', note: '规范正文' },
        { name: 'owner_id', type: 'text', note: '维护人' },
        { name: 'status', type: 'text', note: 'active / archived' },
        { name: 'version', type: 'int', note: '' }
      ]
    },
    {
      name: 'nudges',
      comment: '组内互相催办与处理状态',
      columns: [
        { name: 'id', type: 'text', note: '' },
        { name: 'created_by', type: 'text', note: '发起人' },
        { name: 'recipient_id', type: 'text', note: '接收人' },
        { name: 'task_id', type: 'text', note: '可选关联任务' },
        { name: 'project_id', type: 'text', note: '可选关联项目' },
        { name: 'message', type: 'text', note: '' },
        { name: 'due_date', type: 'date', note: '' },
        { name: 'priority', type: 'text', note: '高 / 中 / 低' },
        { name: 'status', type: 'text', note: 'open / acknowledged / done / dismissed' },
        { name: 'channels', type: 'jsonb', note: 'in_app / email / sms；邮件短信需配置服务商' }
      ]
    }
  ],

  endpoints: [
    { method: 'POST', path: '/api/auth/login', purpose: '邮箱验证码 / SSO 登录，签发会话' },
    { method: 'POST', path: '/api/auth/register', purpose: '创建课题组成为 PI，或使用邀请码加入已有课题组' },
    { method: 'POST', path: '/api/auth/logout', purpose: '注销会话' },
    { method: 'GET', path: '/api/auth/me', purpose: '当前登录成员' },
    { method: 'GET', path: '/api/members', purpose: '成员列表（组内可见）' },
    { method: 'GET/PATCH', path: '/api/workspace', purpose: '读取或修改当前课题组名称与时区' },
    { method: 'POST', path: '/api/workspace/join-code/rotate', purpose: 'PI 更新课题组邀请码' },
    { method: 'GET', path: '/api/dashboard?range=14d', purpose: '总览聚合：任务分布、项目进度、近 N 天活跃度' },
    { method: 'GET', path: '/api/:collection', purpose: '通用列表，支持 project_id / assignee_id / status / date 过滤' },
    { method: 'POST', path: '/api/:collection', purpose: '新建一条' },
    { method: 'PATCH', path: '/api/:collection/:id', purpose: '局部更新（看板拖拽、状态推进、项目进度）' },
    { method: 'DELETE', path: '/api/:collection/:id', purpose: '删除' },
    { method: 'POST', path: '/api/ai/daily-summary', purpose: '每日上报 → 结构化进度汇总（服务端保管模型 Key）' },
    { method: 'POST', path: '/api/ai/daily-summary/apply', purpose: '确认后回写任务状态与项目进度，需幂等' },
    { method: 'POST', path: '/api/ai/weekly-summary', purpose: '最近 7 天日报 → 周报摘要、亮点、阻塞点与下周建议' },
    { method: 'POST', path: '/api/ai/test', purpose: '测试服务端模型连通性，不返回模型密钥' },
    { method: 'GET/POST/PATCH/DELETE', path: '/api/protocols', purpose: 'PI 维护、成员查看课题组 Protocol' },
    { method: 'GET/POST/PATCH/DELETE', path: '/api/nudges', purpose: '组内互相催办；默认站内与浏览器通知，邮件短信预留适配器' },
    { method: 'GET/PATCH', path: '/api/settings/ai', purpose: 'PI 保存服务商、Base URL、请求路径和模型名；Key 只读服务器环境变量' },
    { method: 'GET/PATCH', path: '/api/notifications/preferences', purpose: '晚间日报、早间任务、延期任务提醒偏好' },
    { method: 'POST', path: '/api/notifications/subscriptions', purpose: '保存浏览器 Push Subscription，供后续 VAPID 推送' },
    { method: 'GET', path: '/api/billing/plans', purpose: '免费版 / PI 月付 / PI 年付套餐占位' },
    { method: 'POST', path: '/api/billing/checkout', purpose: '支付渠道接入占位，当前安全返回未配置' },
    { method: 'GET', path: '/api/reviews/stats?range=12w', purpose: '复盘图表数据：文献阅读量、任务完成量、时间分布' }
  ],

  ai: {
    note: 'AI 只输出结构化建议，必须经成员确认后才写库；服务端做频率限制与内容审核。',
    request: {
      date: '2026-11-11',
      member: '{ id, name, role }',
      content: '成员当天原始上报文本',
      hours: 6,
      context: {
        projects: '[{ id, title, progress, milestones }]',
        tasks: '[{ id, title, status, project_id, assignee_id }]'
      }
    },
    response: {
      summary: '一段式当日进度摘要',
      progress: '[{ projectId, title, delta }]',
      taskUpdates: '[{ taskId, title, from, to }]',
      suggestions: 'string[] 下一步建议',
      tags: 'string[] 工作类型标签'
    },
    errors: [
      '未登录 / 无权限 → 401、403',
      '模型不可用或超时 → 保留原文，提供重试，不生成假数据',
      '超出配额 → 429，前端展示提示',
      'JSON 解析失败 → 服务端重试一次后降级为纯文本摘要'
    ]
  },

  security: [
    '模型 API Key 只存在服务端环境变量，绝不进入前端代码或浏览器存储',
    '按 members.project_id 或组成员关系做行级权限：成员只见本组数据，PI 可见全组',
    'daily_logs 原文仅作者与 PI 可读；AI 汇总结果组内可见',
    '所有 AI 回写走 /apply 端点，服务端校验 taskId 归属并记录审计日志',
    '用户上报文本送模型前做长度限制与提示词注入过滤'
  ],

  checklist: [
    '1. 在服务器 .env 配置国模兼容接口的 URL、请求路径、模型名和 API Key',
    '2. 服务器启动 Node 服务，PI 选择创建课题组并把邀请码发给成员',
    '3. 通过 HTTPS 部署并把 COOKIE_SECURE=true，开启浏览器后台通知能力',
    '4. 定期备份 server/data/lab-workbench.json；规模扩大后迁移 PostgreSQL',
    '5. 接入支付渠道后实现 /api/billing/checkout 月付 / 年付',
    '6. 将 JSON 存储迁移为 workspaces + memberships 表即可支持多课题组与订阅计费'
  ]
};
