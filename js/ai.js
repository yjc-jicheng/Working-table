/* AI 层适配器 · 当前实现：本地演示生成器（不调用任何模型）
 * 上服务器后：把模式切到 'http'，由服务端 /api/ai/daily-summary 保管模型 Key 并返回同结构 JSON。
 * 契约见 js/contract.js → ai.request / ai.response
 */
window.LabAI = (function () {
  const KWS = {
    done: ['完成', '做完', '收尾', '定稿', '提交', '通过', '发布', '结束', '补齐', '修正后重跑'],
    doing: ['推进', '改造', '开始', '启动', '跑', '整理', '检索', '撰写', '写', '讨论', '制备', '核对', '复现', '实验'],
    literature: ['文献', '检索', '精读', '略读', '综述', '笔记'],
    writing: ['写', '撰写', '大纲', '初稿', '文档', '说明', '综述'],
    experiment: ['实验', '样品', '表征', '基线', '跑', '验证', '制备'],
    analysis: ['统计', '回归', '检验', '归一化', '清洗', '分析', '数据']
  };
  function has(text, words) { return words.some(w => text.indexOf(w) >= 0); }

  function pickTags(text) {
    const tags = [];
    if (has(text, KWS.literature)) tags.push('文献阅读');
    if (has(text, KWS.experiment)) tags.push('实验');
    if (has(text, KWS.writing)) tags.push('写作');
    if (has(text, KWS.analysis)) tags.push('数据分析');
    if (!tags.length) tags.push('研究推进');
    return tags.slice(0, 3);
  }

  function mockSummarize(payload) {
    const text = String(payload.content || '').trim();
    const context = payload.context || {};
    const tasks = (context.tasks || []).filter(t => t.assignee_id === payload.member.id && t.status !== 'done');
    const projects = context.projects || [];
    const project = projects.find(p => p.id === payload.projectId) || projects[0];
    const hours = Number(payload.hours || 0);

    const taskUpdates = [];
    if (text && tasks.length) {
      const strong = has(text, KWS.done);
      const primary = tasks.find(t => t.project_id === (project && project.id)) || tasks[0];
      const target = strong ? 'done' : 'doing';
      if (primary.status !== target) {
        taskUpdates.push({ taskId: primary.id, title: primary.title, from: primary.status, to: target });
      }
      if (strong && tasks.length > 1) {
        const second = tasks.find(t => t.id !== primary.id && t.status === 'todo');
        if (second) taskUpdates.push({ taskId: second.id, title: second.title, from: second.status, to: 'doing' });
      }
    }

    const delta = Math.max(2, Math.min(9, Math.round((hours || 4) / 1.6) + (has(text, KWS.done) ? 2 : 0)));
    const progress = project ? [{ projectId: project.id, title: project.title, delta: delta }] : [];

    const short = text.length > 58 ? text.slice(0, 58) + '…' : text;
    const summary = text
      ? `${payload.member.name} 今日投入 ${hours || '—'} 小时：${short} AI 判定本日工作归属于「${project ? project.title : '未关联项目'}」，建议进度 +${delta}%。`
      : '未填写工作内容，无法生成有效摘要。';

    const suggestions = [];
    if (taskUpdates.some(t => t.to === 'done')) suggestions.push('把完成项的结论补进项目记录，并在下次组会同步。');
    if (has(text, KWS.experiment)) suggestions.push('实验结果建议同步登记到「数据分析」，保留脚本与原始数据路径。');
    if (has(text, KWS.literature)) suggestions.push('新增文献归入「文献管理」，关联到对应项目形成知识积累。');
    if (!suggestions.length) suggestions.push('继续推进当前主线任务，明天上报时补充可量化的结果。');
    if (text.length < 25) suggestions.push('上报内容偏短，建议补充数据、结论或阻塞点，AI 汇总会更准确。');

    return Promise.resolve({
      summary: summary,
      progress: progress,
      taskUpdates: taskUpdates,
      suggestions: suggestions.slice(0, 3),
      tags: pickTags(text),
      source: 'demo',
      model: '本地演示生成器（未接入大模型）'
    });
  }

  /* 服务器实现参考（当前未启用）：
   * 前端不保存任何模型密钥，只把上报内容与上下文 POST 给自己的服务端。
   */
  function httpSummarize(payload) {
    return fetch('/api/ai/daily-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(async function (res) {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || ('汇总服务返回 ' + res.status + '，请检查服务器配置'));
      }
      const out = await res.json();
      if (!out || typeof out.summary !== 'string') throw new Error('汇总结果格式不正确');
      // 服务端会标明 ai（模型生成）或 fallback（规则降级），界面据此提示来源
      if (!out.source) out.source = 'http';
      return out;
    });
  }

  function summarize(payload) {
    if (window.LabStore.aiMode() === 'http') return httpSummarize(payload);
    return mockSummarize(payload);
  }

  return { summarize: summarize, mockSummarize: mockSummarize, httpSummarize: httpSummarize, mode: function () { return window.LabStore.aiMode(); } };
})();
