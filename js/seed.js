/* 演示数据：上服务器后整体替换为 API 返回值 */
(function () {
  function d(offset) {
    const t = new Date();
    t.setHours(12, 0, 0, 0);
    t.setDate(t.getDate() + offset);
    return t.toISOString().slice(0, 10);
  }
  function ts(offset) {
    const t = new Date();
    t.setDate(t.getDate() + offset);
    return t.toISOString();
  }
  function uid(prefix, n) { return prefix + '-' + String(n).padStart(3, '0'); }

  const members = [
    { id: 'u1', name: '林知远', email: 'lin@lab.edu.cn', role: 'PI · 导师', color: '#6366F1' },
    { id: 'u2', name: '陈曦', email: 'chenxi@lab.edu.cn', role: '博士生 · 四年级', color: '#3B82F6' },
    { id: 'u3', name: '王梓涵', email: 'wangzh@lab.edu.cn', role: '硕士生 · 二年级', color: '#F59E0B' },
    { id: 'u4', name: '赵一鸣', email: 'zhaoym@lab.edu.cn', role: '博士生 · 二年级', color: '#10B981' }
  ];

  const projects = [
    {
      id: 'p1', title: '基于图神经网络的分子性质预测', kind: '论文', goal: '投 NeurIPS 2027', start_date: d(-120), deadline: d(45), progress: 62, lead_id: 'u2',
      milestones: [
        { title: '完成基线复现', due: d(-60), done: true },
        { title: '模型结构改进与消融', due: d(-12), done: true },
        { title: '大规模数据集实验', due: d(14), done: false },
        { title: '初稿撰写', due: d(38), done: false }
      ],
      notes: '当前瓶颈在 QM9 扩展集上的泛化，需补充跨数据集验证。'
    },
    {
      id: 'p2', title: '国家自然科学基金面上项目 · 实验验证', kind: '课题', goal: '中期检查材料', start_date: d(-200), deadline: d(75), progress: 38, lead_id: 'u4',
      milestones: [
        { title: '实验方案定稿', due: d(-90), done: true },
        { title: '第一轮样品制备', due: d(-5), done: true },
        { title: '表征数据与重复实验', due: d(28), done: false },
        { title: '中期报告', due: d(70), done: false }
      ],
      notes: '光谱数据需要统一归一化口径，已安排王梓涵整理。'
    },
    {
      id: 'p3', title: '多模态表征学习综述', kind: '论文', goal: '投 自动化学报', start_date: d(-45), deadline: d(96), progress: 25, lead_id: 'u3',
      milestones: [
        { title: '文献检索与分类框架', due: d(10), done: false },
        { title: '主体章节初稿', due: d(55), done: false },
        { title: '导师审阅与修订', due: d(88), done: false }
      ],
      notes: '按模态对齐方式而非时间线组织，突出近三年方法。'
    },
    {
      id: 'p4', title: '实验室数据集建设与开放', kind: '课题', goal: '内部 v1.0 发布', start_date: d(-160), deadline: d(21), progress: 80, lead_id: 'u1',
      milestones: [
        { title: '元数据规范', due: d(-80), done: true },
        { title: '清洗脚本与校验', due: d(-20), done: true },
        { title: '文档与使用说明', due: d(8), done: false },
        { title: '组内评审', due: d(20), done: false }
      ],
      notes: '复用价值高，建议每个项目统一引用该数据集版本号。'
    }
  ];

  const tasks = [
    { id: 't01', title: '复现 GIN 基线并整理结果表', project_id: 'p1', assignee_id: 'u2', priority: '高', status: 'done', due_date: d(-8), tags: ['实验', '基线'], completed_at: ts(-8) },
    { id: 't02', title: '改进消息传递层，加入边特征', project_id: 'p1', assignee_id: 'u2', priority: '高', status: 'doing', due_date: d(2), tags: ['建模'], completed_at: null },
    { id: 't03', title: 'QM9 扩展集跨数据集验证', project_id: 'p1', assignee_id: 'u2', priority: '中', status: 'todo', due_date: d(11), tags: ['实验'], completed_at: null },
    { id: 't04', title: '绘制方法框架图与消融图', project_id: 'p1', assignee_id: 'u3', priority: '低', status: 'delayed', due_date: d(-3), tags: ['写作', '作图'], completed_at: null },
    { id: 't05', title: '第二轮样品制备与编号', project_id: 'p2', assignee_id: 'u4', priority: '高', status: 'doing', due_date: d(4), tags: ['实验'], completed_at: null },
    { id: 't06', title: '光谱数据归一化口径统一', project_id: 'p2', assignee_id: 'u3', priority: '中', status: 'doing', due_date: d(6), tags: ['数据清洗'], completed_at: null },
    { id: 't07', title: '整理中期检查所需原始记录', project_id: 'p2', assignee_id: 'u4', priority: '低', status: 'todo', due_date: d(24), tags: ['材料'], completed_at: null },
    { id: 't08', title: '检索近三年多模态对齐文献', project_id: 'p3', assignee_id: 'u3', priority: '高', status: 'doing', due_date: d(3), tags: ['文献'], completed_at: null },
    { id: 't09', title: '确定综述分类框架', project_id: 'p3', assignee_id: 'u3', priority: '中', status: 'todo', due_date: d(12), tags: ['写作'], completed_at: null },
    { id: 't10', title: '数据集使用说明与示例 notebook', project_id: 'p4', assignee_id: 'u1', priority: '中', status: 'doing', due_date: d(7), tags: ['文档'], completed_at: null },
    { id: 't11', title: '元数据字段校验规则补齐', project_id: 'p4', assignee_id: 'u2', priority: '低', status: 'done', due_date: d(-15), tags: ['数据清洗'], completed_at: ts(-15) },
    { id: 't12', title: '组内数据集 v1.0 评审', project_id: 'p4', assignee_id: 'u1', priority: '中', status: 'todo', due_date: d(20), tags: ['组会'], completed_at: null }
  ];

  const papers = [
    { id: 'l01', title: 'How Powerful are Graph Neural Networks?', authors: 'Xu K. et al.', year: 2019, venue: 'ICLR', tags: ['图神经网络', '表达能力'], project_id: 'p1', read_state: '精读', rating: 5, note: 'GIN 的理论基础，解释了为何均值聚合会丢失结构信息；本文模型设计的直接依据。', url: '' },
    { id: 'l02', title: 'MoleculeNet: A Benchmark for Molecular Machine Learning', authors: 'Wu Z. et al.', year: 2018, venue: 'Chemical Science', tags: ['数据集', '基准'], project_id: 'p1', read_state: '精读', rating: 4, note: '数据集划分方式对结果影响很大，注意 scaffold split 的实现细节。', url: '' },
    { id: 'l03', title: 'Geometric Deep Learning on Molecular Representations', authors: 'Atz K. et al.', year: 2021, venue: 'WIREs Comput Mol Sci', tags: ['综述', '分子表示'], project_id: 'p1', read_state: '略读', rating: 4, note: '可作为引言部分的脉络参考。', url: '' },
    { id: 'l04', title: 'Learning Transferable Visual Models From Natural Language Supervision', authors: 'Radford A. et al.', year: 2021, venue: 'ICML', tags: ['多模态', '对比学习'], project_id: 'p3', read_state: '精读', rating: 5, note: '对比式对齐的代表工作，综述中单独一节。', url: '' },
    { id: 'l05', title: 'A Survey of Multimodal Representation Learning', authors: 'Baltrušaitis T. et al.', year: 2019, venue: 'IEEE TPAMI', tags: ['综述', '多模态'], project_id: 'p3', read_state: '略读', rating: 4, note: '早期分类法，用于对比近三年方法的演进。', url: '' },
    { id: 'l06', title: 'Best Practices for Scientific Data Management', authors: 'Wilkinson M. et al.', year: 2016, venue: 'Scientific Data', tags: ['FAIR', '数据管理'], project_id: 'p4', read_state: '待读', rating: 0, note: 'FAIR 原则原文，数据集文档需要对齐。', url: '' }
  ];

  const events = [
    { id: 'e1', title: '组会 · 本周进展汇报', date: d(0), type: '组会', project_id: '', reminder: true, done: false },
    { id: 'e2', title: 'QM9 扩展集实验启动', date: d(1), type: '实验', project_id: 'p1', reminder: true, done: false },
    { id: 'e3', title: '综述框架讨论（与林老师）', date: d(2), type: '写作', project_id: 'p3', reminder: true, done: false },
    { id: 'e4', title: '第二轮样品表征送检', date: d(4), type: '实验', project_id: 'p2', reminder: false, done: false },
    { id: 'e5', title: '文献精读分享：CLIP', date: d(5), type: '文献', project_id: 'p3', reminder: true, done: false },
    { id: 'e6', title: '数据集 v1.0 文档截止', date: d(8), type: '写作', project_id: 'p4', reminder: true, done: false },
    { id: 'e7', title: '月度复盘会', date: d(11), type: '组会', project_id: '', reminder: true, done: false }
  ];

  const analyses = [
    { id: 'a1', title: 'QM9 基线结果统计与显著性检验', tool: 'Python', dataset: 'qm9_baseline_v3.csv', script: 'scripts/baseline_ttest.py', result: '改进模型在 8/12 个目标上显著优于 GIN（p<0.05），HOMO-LUMO gap 提升 11.4%。', project_id: 'p1', created_at: ts(-9) },
    { id: 'a2', title: '光谱数据清洗与归一化', tool: 'Python', dataset: 'spectra_raw_2026.parquet', script: 'scripts/spectra_clean.py', result: '剔除 37 条异常谱线；采用 SNV 后组间批次效应明显下降。', project_id: 'p2', created_at: ts(-4) },
    { id: 'a3', title: '样品批次效应回归分析', tool: 'Stata', dataset: 'batch_effects.dta', script: 'do/batch_fe.do', result: '批次变量系数不显著（p=0.31），可合并分析。', project_id: 'p2', created_at: ts(-2) },
    { id: 'a4', title: '数据集字段完整率核查', tool: 'Python', dataset: 'lab_dataset_v1.parquet', script: 'scripts/completeness.py', result: '整体完整率 96.2%，缺失集中在 sample_source 字段。', project_id: 'p4', created_at: ts(-1) }
  ];

  const logTexts = [
    '完成消息传递层的边特征改造，跑了三组超参，验证集 MAE 从 0.142 降到 0.128。整理了消融实验表格。',
    '检索并精读 4 篇多模态对齐文献，补齐综述分类框架的第三类方法，写了 800 字笔记。',
    '第二轮样品制备完成 12 个，编号入册；开始整理光谱数据的归一化口径。',
    '复现基线并核对结果表，发现 scaffold split 实现有偏差，已修正后重跑。',
    '补充数据集元数据校验规则，写了示例 notebook 的读取部分。',
    '和林老师讨论综述框架，决定按对齐粒度组织而非时间线；修改了大纲。',
    '做了批次效应的回归检验，结果不显著，可以合并分析。',
    '整理近两周实验记录，把 QM9 扩展集的实验方案写成清单。'
  ];
  const tagPool = [['建模', '实验'], ['文献', '写作'], ['实验', '数据清洗'], ['实验', '基线'], ['数据清洗', '文档'], ['写作', '组会'], ['数据分析'], ['实验', '写作']];
  const logs = [];
  for (let i = 13; i >= 0; i--) {
    const count = i % 4 === 0 ? 1 : (i % 3 === 0 ? 3 : 2);
    for (let k = 0; k < count; k++) {
      const idx = (i * 3 + k * 5) % logTexts.length;
      const authorIds = ['u2', 'u3', 'u4', 'u1'];
      const author = authorIds[(i + k) % 4];
      const proj = ['p1', 'p2', 'p3', 'p4'][(i + k) % 4];
      logs.push({
        id: uid('log', 100 + i * 10 + k),
        date: d(-i),
        author_id: author,
        project_id: proj,
        content: logTexts[idx],
        hours: [4, 5.5, 6, 7][(i + k) % 4],
        summary: {
          summary: logTexts[idx].replace(/。$/, '') + '；已同步到项目进度。',
          progress: [{ projectId: proj, title: '项目推进', delta: (i % 3) + 2 }],
          taskUpdates: [],
          suggestions: ['继续推进当前主线任务，并在下次组会同步结果。'],
          tags: tagPool[idx]
        },
        applied: true,
        created_at: ts(-i)
      });
    }
  }

  const reviews = [
    { id: 'r1', period: '第 45 周', content: '论文项目实验推进顺利，但作图类任务连续两周延期，需要提前排期。文献阅读量较上周 +3 篇。', created_at: ts(-7) },
    { id: 'r2', period: '第 44 周', content: '数据集建设接近收尾，建议把元数据规范推广到所有在研项目，减少后期对齐成本。', created_at: ts(-14) }
  ];

  window.LabSeed = { members, projects, tasks, papers, events, analyses, logs, reviews };
})();
