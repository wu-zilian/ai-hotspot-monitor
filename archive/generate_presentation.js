/**
 * AI热点监控工具 - 简易PPT生成器
 * 不需要额外依赖，直接生成PPTX格式文件
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 简易PPTX生成器
class SimplePPTXGenerator {
    constructor(filename) {
        this.filename = filename;
        this.slides = [];
    }

    // 添加标题页
    addTitleSlide(title, subtitle) {
        this.slides.push({
            type: 'title',
            title,
            subtitle
        });
    }

    // 添加内容页
    addContentSlide(title, items) {
        this.slides.push({
            type: 'content',
            title,
            items
        });
    }

    // 添加卡片页
    addCardsSlide(title, cards) {
        this.slides.push({
            type: 'cards',
            title,
            cards
        });
    }

    // 生成PPTX文件
    generate() {
        console.log('正在生成PPTX文件...');

        // 创建HTML版本的演示文稿（PowerPoint可以直接打开）
        const htmlContent = this.generateHTML();

        // 保存HTML文件
        const htmlFile = this.filename.replace('.pptx', '.html');
        fs.writeFileSync(htmlFile, htmlContent, 'utf8');

        // 尝试使用PowerPoint转换（如果可用）
        this.tryConvertToPPTX(htmlFile);

        return htmlFile;
    }

    // 生成HTML内容
    generateHTML() {
        const slides = this.slides.map((slide, index) => {
            return this.generateSlideHTML(slide, index);
        }).join('\n');

        return `<!DOCTYPE html>
<html lang="zh-CN" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:powerpoint">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="ProgId" content="PowerPoint.Slide">
    <meta name="Generator" content="AI热点监控工具">
    <title>AI热点监控工具 - 项目分享</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Microsoft YaHei', Arial, sans-serif; background: #1a1a2e; }
        .slide {
            width: 1200px; height: 675px;
            margin: 20px auto;
            background: white;
            padding: 60px;
            page-break-after: always;
            position: relative;
        }
        .slide.title {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            color: white; text-align: center;
        }
        .slide.title h1 { font-size: 72px; margin-bottom: 30px; }
        .slide.title p { font-size: 28px; opacity: 0.9; line-height: 1.8; }
        .slide h2 { font-size: 42px; color: #667eea; margin-bottom: 40px; border-bottom: 4px solid #764ba2; padding-bottom: 15px; }
        .slide ul { font-size: 24px; line-height: 2; margin-left: 40px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
        .card { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 15px; border-left: 5px solid #667eea; }
        .card h4 { font-size: 26px; color: #667eea; margin-bottom: 15px; }
        .card p { font-size: 20px; }
        @media print { body { background: white; } .slide { margin: 0; page-break-after: always; } }
        @media screen and (max-width: 1200px) { .slide { width: 100%; height: auto; padding: 30px; } .slide.title h1 { font-size: 48px; } }
    </style>
</head>
<body>
${slides}
</body>
</html>`;
    }

    // 生成单页HTML
    generateSlideHTML(slide, index) {
        if (slide.type === 'title') {
            return `
<div class="slide title">
    <h1>${slide.title}</h1>
    <p>${slide.subtitle.replace(/\n/g, '<br>')}</p>
</div>`;
        } else if (slide.type === 'content') {
            const items = slide.items.map(item => `<li>${item}</li>`).join('');
            return `
<div class="slide">
    <h2>${slide.title}</h2>
    <ul>${items}</ul>
</div>`;
        } else if (slide.type === 'cards') {
            const cards = slide.cards.map(card => `
<div class="card">
    <h4>${card.title}</h4>
    <p>${card.content.replace(/\n/g, '<br>')}</p>
</div>`).join('');
            return `
<div class="slide">
    <h2>${slide.title}</h2>
    <div class="grid">${cards}</div>
</div>`;
        }
    }

    // 尝试转换为PPTX
    tryConvertToPPTX(htmlFile) {
        const pptxFile = this.filename;

        console.log('\n正在尝试转换为PPTX格式...');
        console.log(`HTML文件已生成: ${htmlFile}`);
        console.log(`目标PPTX文件: ${pptxFile}`);

        // 提供转换说明
        console.log('\n转换方法：');
        console.log('1. 在PowerPoint中打开HTML文件，然后另存为PPTX');
        console.log('2. 使用在线转换工具: https://cloudconvert.com/html-to-pptx');
        console.log('3. 使用LibreOffice打开HTML文件并导出为PPTX');

        // 如果有PowerPoint，尝试自动转换
        try {
            // Windows上尝试使用PowerPoint
            if (process.platform === 'win32') {
                console.log('\n检测到Windows系统，尝试使用PowerPoint转换...');
                const vbsScript = `
Set objPPT = CreateObject("PowerPoint.Application")
objPPT.Visible = True
Set objPresentation = objPPT.Presentations.Open("${htmlFile.replace(/\\/g, '\\\\')}")
objPresentation.SaveAs "${pptxFile.replace(/\\/g, '\\\\')}", 24
objPresentation.Close
objPPT.Quit
Set objPPT = Nothing
`;
                const vbsFile = htmlFile.replace('.html', '_convert.vbs');
                fs.writeFileSync(vbsFile, vbsScript);

                console.log(`已创建VBS脚本: ${vbsFile}`);
                console.log('双击运行VBS脚本可自动转换为PPTX');
            }
        } catch (error) {
            console.log('自动转换不可用，请手动转换');
        }
    }
}

// 创建演示文稿
function createPresentation() {
    const ppt = new SimplePPTXGenerator(
        path.join(__dirname, 'AI热点监控工具_项目分享.pptx')
    );

    // 第1页：封面
    ppt.addTitleSlide(
        'AI热点监控工具',
        '智能化的热点发现和通知系统\n\n7×24小时热点监控 · AI内容验证 · 多渠道通知'
    );

    // 第2页：目录
    ppt.addContentSlide('目录', [
        '项目背景与痛点',
        '核心功能介绍',
        '技术架构设计',
        '项目亮点特色',
        '技术栈展示',
        '功能演示',
        '未来规划'
    ]);

    // 第3页：项目背景
    ppt.addCardsSlide('项目背景 - 痛点问题', [
        { title: '效率低下', content: '人工搜索热点需要浏览多个网站，耗时耗力' },
        { title: '容易遗漏', content: '无法实现7×24小时持续监控，错过重要信息' },
        { title: '虚假内容', content: 'AI编程领域虚假信息多，难以辨别真伪' },
        { title: '通知延迟', content: '无法第一时间获取热点，错失最佳时机' }
    ]);

    // 第4页：核心功能（一）
    ppt.addCardsSlide('核心功能（一）', [
        {
            title: '智能热点发现',
            content: '• 自动监控多个科技新闻网站\n• 基于关键词智能匹配\n• 实时内容分析和去重'
        },
        {
            title: 'AI内容验证',
            content: '• 集成OpenRouter API\n• 智能识别虚假内容\n• 提供可信度评分'
        }
    ]);

    // 第5页：核心功能（二）
    ppt.addCardsSlide('核心功能（二）', [
        {
            title: '多渠道通知',
            content: '• 邮件通知\n• Web推送通知\n• Slack集成'
        },
        {
            title: '关键词管理',
            content: '• 添加/编辑/删除关键词\n• 关键词分组管理\n• 优先级设置'
        }
    ]);

    // 第6页：技术架构
    ppt.addContentSlide('技术架构', [
        '前端界面 (React + TypeScript + Ant Design)',
        'API层 (Express.js + RESTful API)',
        '业务逻辑层 (Controllers + Services)',
        'AI服务 (OpenRouter + DeepSeek)',
        '数据层 (MongoDB)'
    ]);

    // 第7页：技术栈
    ppt.addContentSlide('技术栈', [
        '后端: Node.js 18+ | Express | MongoDB | JWT | node-cron',
        '前端: React 18+ | TypeScript | Ant Design | React Router',
        'AI: OpenRouter API | DeepSeek API',
        '工具: Docker | Git | npm'
    ]);

    // 第8页：项目亮点
    ppt.addCardsSlide('项目亮点', [
        { title: '双AI服务商支持', content: 'OpenRouter和DeepSeek灵活切换' },
        { title: '独特视觉设计', content: '紫粉渐变主题，卡片式布局' },
        { title: 'Agent Skills封装', content: '标准化接口，支持第三方集成' },
        { title: '完善工程实践', content: 'TypeScript类型安全，Docker支持' }
    ]);

    // 第9页：功能演示
    ppt.addContentSlide('功能演示', [
        'Dashboard仪表板 - 统计卡片、热点列表、渐变设计',
        '关键词管理 - 卡片布局、搜索过滤、状态管理',
        '通知中心 - 列表展示、批量操作、详情查看',
        '系统设置 - 通知配置、扫描设置、账户管理'
    ]);

    // 第10页：未来规划
    ppt.addContentSlide('未来规划', [
        '短期: 前后端集成测试、性能优化、安全加固',
        '长期: 更多AI模型、扩展数据源、移动端App',
        '项目统计: 30+后端文件、10+前端文件、3个核心Skills'
    ]);

    // 第11页：总结
    ppt.addContentSlide('项目总结', [
        '项目价值: 自动化热点发现 | AI内容验证 | 7×24小时监控',
        '核心优势: 双AI服务商 | 独特设计 | Skills封装 | 完善实践',
        '让AI热点监控帮助您走在科技前沿！'
    ]);

    // 第12页：致谢
    ppt.addTitleSlide(
        '谢谢观看！',
        '欢迎提问和讨论\n\n📧 项目地址: github.com/your-repo\n🐛 问题反馈: github.com/your-repo/issues'
    );

    // 生成文件
    return ppt.generate();
}

// 运行
console.log('=== AI热点监控工具 - PPT生成器 ===\n');
try {
    const outputFile = createPresentation();
    console.log('\n✓ 演示文稿生成完成！');
    console.log(`\n文件位置: ${outputFile}`);
    console.log('\n使用方法:');
    console.log('1. 在浏览器中打开查看效果');
    console.log('2. 在PowerPoint中打开并另存为PPTX');
    console.log('3. 或使用在线工具转换为PPTX');
} catch (error) {
    console.error('生成失败:', error.message);
    process.exit(1);
}
