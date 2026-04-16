/**
 * AI热点监控工具 - PPT生成脚本
 * 运行方式: node generate_ppt.js
 * 需要先安装: npm install officegen
 */

const fs = require('fs');
const path = require('path');

// 尝试使用officegen库
let officegen;
try {
    officegen = require('officegen');
} catch (e) {
    console.error('错误: 需要先安装 officegen 库');
    console.log('请运行: npm install officegen');
    process.exit(1);
}

function createPPT() {
    console.log('正在生成AI热点监控工具项目演示PPT...');

    // 创建PPT对象
    const pptx = officegen({
        type: 'pptx',
        orientation: 'landscape',
        size: 'screen16x9' // 16:9比例
    });

    // 设置元数据
    pptx.setAuthor('AI热点监控工具');
    pptx.setTitle('AI热点监控工具 - 项目分享');
    pptx.setSubject('项目演示');

    // 定义颜色
    const PRIMARY_COLOR = '667eea';
    const SECONDARY_COLOR = '764ba2';
    const ACCENT_COLOR = 'f093fb';

    // 辅助函数：添加标题页
    function addTitleSlide(title, subtitle) {
        const slide = pptx.makeNewSlide();

        // 设置背景色
        slide.back = '667eea';
        slide.back = '764ba2';

        // 添加标题
        slide.addText(title, {
            x: '10%',
            y: '35%',
            w: '80%',
            h: '20%',
            font_face: 'Microsoft YaHei',
            font_size: 54,
            bold: true,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle'
        });

        // 添加副标题
        slide.addText(subtitle, {
            x: '10%',
            y: '58%',
            w: '80%',
            h: '15%',
            font_face: 'Microsoft YaHei',
            font_size: 24,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle'
        });
    }

    // 辅助函数：添加内容页
    function addContentSlide(title, items, isTwoColumn = false) {
        const slide = pptx.makeNewSlide();
        slide.back = 'FFFFFF';

        // 添加标题
        slide.addText(title, {
            x: '5%',
            y: '5%',
            w: '90%',
            h: '10%',
            font_face: 'Microsoft YaHei',
            font_size: 36,
            bold: true,
            color: PRIMARY_COLOR
        });

        // 添加内容
        const startX = isTwoColumn ? '8%' : '8%';
        const width = isTwoColumn ? '40%' : '85%';

        items.forEach((item, index) => {
            const row = isTwoColumn ? Math.floor(index / 2) : index;
            const col = isTwoColumn ? (index % 2) : 0;
            const x = parseFloat(startX) + (col * 48) + '%';
            const y = 18 + (row * 12) + '%';

            slide.addText(`• ${item}`, {
                x: x,
                y: y,
                w: width,
                h: '10%',
                font_face: 'Microsoft YaHei',
                font_size: 20,
                color: '333333'
            });
        });
    }

    // 辅助函数：添加卡片页
    function addCardsSlide(title, cards) {
        const slide = pptx.makeNewSlide();
        slide.back = 'FFFFFF';

        // 添加标题
        slide.addText(title, {
            x: '5%',
            y: '5%',
            w: '90%',
            h: '10%',
            font_face: 'Microsoft YaHei',
            font_size: 36,
            bold: true,
            color: PRIMARY_COLOR
        });

        // 添加卡片
        cards.forEach((card, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = 6 + (col * 48) + '%';
            const y = 18 + (row * 35) + '%';

            // 卡片背景
            slide.addText('', {
                x: x,
                y: y,
                w: '44%',
                h: '30%',
                fill: { color: 'F5F7FA' },
                line: { color: PRIMARY_COLOR, width: 2 }
            });

            // 卡片标题
            slide.addText(card.title, {
                x: parseFloat(x) + 2 + '%',
                y: parseFloat(y) + 3 + '%',
                w: '40%',
                h: '8%',
                font_face: 'Microsoft YaHei',
                font_size: 24,
                bold: true,
                color: PRIMARY_COLOR
            });

            // 卡片内容
            slide.addText(card.content, {
                x: parseFloat(x) + 2 + '%',
                y: parseFloat(y) + 12 + '%',
                w: '40%',
                h: '16%',
                font_face: 'Microsoft YaHei',
                font_size: 16,
                color: '333333'
            });
        });
    }

    // 第1页：封面
    addTitleSlide(
        'AI热点监控工具',
        '智能化的热点发现和通知系统\n\n7×24小时热点监控 · AI内容验证 · 多渠道通知'
    );

    // 第2页：目录
    addContentSlide('目录', [
        '项目背景与痛点',
        '核心功能介绍',
        '技术架构设计',
        '项目亮点特色',
        '技术栈展示',
        '功能演示',
        '未来规划'
    ]);

    // 第3页：项目背景
    addCardsSlide('项目背景 - 痛点问题', [
        { title: '效率低下', content: '人工搜索热点需要浏览多个网站，耗时耗力' },
        { title: '容易遗漏', content: '无法实现7×24小时持续监控，错过重要信息' },
        { title: '虚假内容', content: 'AI编程领域虚假信息多，难以辨别真伪' },
        { title: '通知延迟', content: '无法第一时间获取热点，错失最佳时机' }
    ]);

    // 第4页：核心功能（一）
    addCardsSlide('核心功能（一）', [
        {
            title: '智能热点发现',
            content: '• 自动监控多个科技新闻网站\n• 基于关键词智能匹配\n• 实时内容分析和去重\n• 支持自定义搜索范围'
        },
        {
            title: 'AI内容验证',
            content: '• 集成OpenRouter API\n• 智能识别虚假内容\n• 提供可信度评分\n• 生成详细分析报告'
        }
    ]);

    // 第5页：核心功能（二）
    addCardsSlide('核心功能（二）', [
        {
            title: '多渠道通知',
            content: '• 邮件通知\n• Web推送通知\n• Slack集成\n• 通知历史记录'
        },
        {
            title: '关键词管理',
            content: '• 添加/编辑/删除关键词\n• 关键词分组管理\n• 优先级设置\n• 实时监控状态'
        }
    ]);

    // 第6页：技术架构
    const archSlide = pptx.makeNewSlide();
    archSlide.back = 'FFFFFF';
    archSlide.addText('技术架构', {
        x: '5%',
        y: '5%',
        w: '90%',
        h: '10%',
        font_face: 'Microsoft YaHei',
        font_size: 36,
        bold: true,
        color: PRIMARY_COLOR
    });
    archSlide.addText(
        '┌─────────────────────────────────────────┐\n' +
        '│         前端界面 (React)                 │\n' +
        '├─────────────────────────────────────────┤\n' +
        '│         API层 (Express)                  │\n' +
        '├─────────────────────────────────────────┤\n' +
        '│  业务逻辑层 (Services + Controllers)     │\n' +
        '├─────────────────────────────────────────┤\n' +
        '│ AI服务  爬虫服务  通知服务               │\n' +
        '├─────────────────────────────────────────┤\n' +
        '│         数据层 (MongoDB)                 │\n' +
        '└─────────────────────────────────────────┘',
        {
            x: '10%',
            y: '20%',
            w: '80%',
            h: '60%',
            font_face: 'Courier New',
            font_size: 18,
            color: '333333',
            align: 'center'
        }
    );

    // 第7页：技术栈
    addContentSlide('技术栈', [
        '后端技术: Node.js 18+ | Express.js | MongoDB | JWT | node-cron | axios + cheerio',
        '前端技术: React 18+ | TypeScript | Ant Design | React Router | Recharts',
        'AI服务: OpenRouter API | DeepSeek API',
        '开发工具: Git | Docker | npm | TypeScript ESLint',
        '部署方案: Docker容器化 | 传统Node.js部署 | 环境变量配置'
    ]);

    // 第8页：项目亮点
    addCardsSlide('项目亮点', [
        {
            title: '双AI服务商支持',
            content: 'OpenRouter: GPT-4、Claude等\nDeepSeek: 国内稳定服务\n环境变量一键切换'
        },
        {
            title: '独特视觉设计',
            content: '紫粉渐变现代设计\n卡片式布局\n完美响应式适配'
        },
        {
            title: 'Agent Skills封装',
            content: '标准化接口设计\n支持第三方AI集成\n三大核心Skill'
        },
        {
            title: '完善工程实践',
            content: 'TypeScript类型安全\nDocker容器化\n完整项目文档'
        }
    ]);

    // 第9页：功能演示
    addContentSlide('功能演示', [
        'Dashboard仪表板 - 统计卡片、热点列表、渐变设计风格',
        '关键词管理 - 卡片式布局、搜索过滤、状态管理',
        '通知中心 - 列表展示、批量操作、详情查看',
        '系统设置 - 通知配置、扫描设置、账户管理'
    ], true);

    // 第10页：未来规划
    addContentSlide('未来规划', [
        '短期目标: 前后端集成测试 | 性能优化 | 安全加固 | 监控告警',
        '长期规划: 更多AI模型支持 | 扩展数据源 | 移动端App | 国际化支持',
        '项目统计: 30+后端文件 | 10+前端文件 | 3个核心Skills'
    ]);

    // 第11页：总结
    addContentSlide('项目总结', [
        '项目价值: 自动化热点发现 | AI内容验证 | 7×24小时监控 | 灵活架构设计',
        '核心优势: 双AI服务商支持 | 独特视觉设计 | 完整Skills封装 | 完善工程实践',
        '',
        '让AI热点监控帮助您走在科技前沿！'
    ]);

    // 第12页：致谢页
    addTitleSlide(
        '谢谢观看！',
        '欢迎提问和讨论\n\n📧 项目地址: github.com/your-repo\n🐛 问题反馈: github.com/your-repo/issues'
    );

    // 保存文件
    const outputFile = path.join(__dirname, 'AI热点监控工具_项目分享.pptx');
    const out = fs.createWriteStream(outputFile);

    out.on('error', function(err) {
        console.error('错误: 无法写入文件', err);
    });

    pptx.generate(out);

    out.on('finish', function() {
        console.log(`✓ PPT已生成: ${outputFile}`);
        console.log(`✓ 共 12 页`);
        console.log('\n生成完成！');
    });
}

// 运行
createPPT();
