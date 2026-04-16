const nodemailer = require('nodemailer');

// 从 .env 读取配置
require('dotenv').config();

async function testEmail() {
  console.log('开始测试邮件发送...');
  console.log('SMTP配置:');
  console.log('  Host:', process.env.SMTP_HOST);
  console.log('  Port:', process.env.SMTP_PORT);
  console.log('  Secure:', process.env.SMTP_SECURE);
  console.log('  User:', process.env.SMTP_USER);
  console.log('  To:', process.env.SMTP_USER);
  console.log('');

  try {
    // 创建邮件传输器
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // 验证配置
    console.log('正在验证SMTP配置...');
    await transporter.verify();
    console.log('✅ SMTP配置验证成功！\n');

    // 生成测试邮件
    const testHotspot = {
      title: '【测试】AI热点监控系统邮件通知测试',
      content: '这是一封测试邮件，用于验证邮件通知功能是否正常工作。如果您收到此邮件，说明邮件配置成功！系统会在发现新热点时自动发送类似的通知邮件。',
      source: '系统测试',
      timestamp: new Date(),
      url: 'http://localhost:3000',
      confidence: 95,
      keywords: ['测试', '邮件通知', 'AI热点']
    };

    // 发送测试邮件
    console.log('正在发送测试邮件...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: `🔥 ${testHotspot.title}`,
      html: generateEmailTemplate(testHotspot)
    });

    console.log('✅ 测试邮件发送成功！');
    console.log('  消息ID:', info.messageId);
    console.log('  收件人:', process.env.SMTP_USER);
    console.log('\n请检查邮箱 ' + process.env.SMTP_USER + ' 查看测试邮件。');

  } catch (error) {
    console.error('❌ 邮件发送失败！');
    console.error('  错误代码:', error.code);
    console.error('  错误信息:', error.message);
    if (error.response) {
      console.error('  SMTP响应:', error.response);
    }
  }
}

function generateEmailTemplate(hotspot) {
  const confidence = hotspot.confidence || 0;
  const confidenceColor = confidence >= 90 ? '#52c41a' : confidence >= 70 ? '#faad14' : '#ff4d4f';
  const confidenceLevel = confidence >= 90 ? '高可信度' : confidence >= 70 ? '中等可信度' : '低可信度';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .hotspot-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .hotspot-meta { color: #666; font-size: 14px; margin-bottom: 15px; }
        .confidence-bar { background: #f0f0f0; height: 8px; border-radius: 4px; margin: 10px 0; }
        .confidence-fill { background: ${confidenceColor}; height: 100%; border-radius: 4px; }
        .keywords { margin: 15px 0; }
        .keyword { display: inline-block; background: #1890ff; color: white; padding: 4px 8px; border-radius: 4px; margin: 2px; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background: #1890ff; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
        .test-badge { background: #ff4d4f; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔥 发现新的AI热点 <span class="test-badge">测试邮件</span></h2>
          <p>AI热点监控系统为您发现以下相关内容</p>
        </div>
        <div class="content">
          <div class="hotspot-title">${hotspot.title}</div>
          <div class="hotspot-meta">
            📌 来源: ${hotspot.source}<br>
            🕒 时间: ${new Date(hotspot.timestamp).toLocaleString('zh-CN')}
          </div>

          <div>
            <strong>可信度:</strong>
            <div class="confidence-bar">
              <div class="confidence-fill" style="width: ${confidence}%"></div>
            </div>
            <div style="font-size: 12px; margin-top: 5px; color: ${confidenceColor};">
              ${confidenceLevel} - ${confidence}%
            </div>
          </div>

          <div style="margin: 15px 0;">
            <strong>内容摘要:</strong>
            <p style="color: #666; font-size: 14px;">${hotspot.content}</p>
          </div>

          ${hotspot.keywords && hotspot.keywords.length > 0 ? `
            <div class="keywords">
              <strong>匹配关键词:</strong><br>
              ${hotspot.keywords.map(k => `<span class="keyword">${k}</span>`).join('')}
            </div>
          ` : ''}

          ${hotspot.url ? `
            <a href="${hotspot.url}" class="button" target="_blank">查看原文 →</a>
          ` : ''}
        </div>
        <div class="footer">
          <p>AI热点监控系统 - 让您走在科技前沿</p>
          <p style="font-size: 11px;">如不想接收此类邮件，请在系统设置中关闭邮件通知</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

testEmail();
