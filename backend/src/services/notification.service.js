const nodemailer = require('nodemailer');
const User = require('../models/User');

// 邮箱服务商SMTP配置映射
const SMTP_CONFIGS = {
  'qq.com': { host: 'smtp.qq.com', port: 587, secure: false },
  'gmail.com': { host: 'smtp.gmail.com', port: 587, secure: false },
  '163.com': { host: 'smtp.163.com', port: 465, secure: true },
  '126.com': { host: 'smtp.126.com', port: 465, secure: true },
  'outlook.com': { host: 'smtp-mail.outlook.com', port: 587, secure: false },
  'yahoo.com': { host: 'smtp.mail.yahoo.com', port: 587, secure: false },
  'hotmail.com': { host: 'smtp.live.com', port: 587, secure: false }
};

/**
 * 创建邮件传输器
 * @param {Object} userConfig - 用户邮箱配置 { prefix, domain, authCode }
 * @returns {Object} nodemailer transporter
 */
const createTransporter = (userConfig = null) => {
  let config;

  if (userConfig && userConfig.prefix && userConfig.domain && userConfig.authCode) {
    // 使用用户配置的邮箱服务
    const smtpConfig = SMTP_CONFIGS[userConfig.domain];
    if (!smtpConfig) {
      console.error(`不支持的邮箱服务商: ${userConfig.domain}`);
      return null;
    }

    config = {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: `${userConfig.prefix}@${userConfig.domain}`,
        pass: userConfig.authCode
      },
      tls: {
        rejectUnauthorized: false
      }
    };
    console.log(`[邮件服务] 使用用户配置: ${userConfig.prefix}@${userConfig.domain}`);
  } else {
    // 使用全局SMTP配置（向后兼容）
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = port === 465;

    config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    };
    console.log('[邮件服务] 使用全局SMTP配置');
  }

  return nodemailer.createTransport(config);
};

// 缓存传输器（key为配置hash）
const transporterCache = new Map();

const getTransporter = (userConfig = null) => {
  // 生成缓存key
  const cacheKey = userConfig
    ? `${userConfig.prefix}@${userConfig.domain}:${userConfig.authCode?.slice(-4)}`
    : 'global';

  if (!transporterCache.has(cacheKey)) {
    const transporter = createTransporter(userConfig);
    if (transporter) {
      transporterCache.set(cacheKey, transporter);
    }
  }

  return transporterCache.get(cacheKey);
};

exports.getTransporter = getTransporter;

/**
 * 发送邮件通知
 */
exports.sendEmail = async (to, subject, html, text) => {
  try {
    const transport = getTransporter();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    await transport.sendMail(mailOptions);

    console.log(`邮件发送成功: ${subject}`);
    return { success: true, message: '邮件发送成功' };
  } catch (error) {
    console.error('邮件发送失败:', error);
    return { success: false, message: '邮件发送失败', error: error.message };
  }
};

/**
 * 发送热点通知给用户
 */
exports.sendNotification = async (userId, hotspot) => {
  try {
    // 发送邮件通知
    await exports.sendEmailNotification(userId, hotspot);
  } catch (error) {
    console.error('发送通知失败:', error);
  }
};

/**
 * 发送邮件通知
 */
exports.sendEmailNotification = async (userId, hotspot) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      console.log('用户不存在，跳过邮件发送');
      return;
    }

    // 检查是否配置了邮箱服务
    const hasUserEmailConfig = user.emailConfig?.prefix && user.emailConfig?.domain && user.emailConfig?.authCode;
    const hasGlobalSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

    if (!hasUserEmailConfig && !hasGlobalSmtp) {
      console.log('未配置邮件服务，跳过邮件发送');
      return;
    }

    // 确定接收邮箱
    const targetEmail = user.notificationEmail || user.email;

    if (!targetEmail) {
      console.log(`用户 ${user.username} 未配置接收邮箱，跳过邮件发送`);
      return;
    }

    // 使用用户配置的邮箱服务（如果有）
    const transport = getTransporter(user.emailConfig || null);

    if (!transport) {
      console.error('创建邮件传输器失败');
      return;
    }

    // 确定发件人邮箱
    const fromEmail = hasUserEmailConfig
      ? `${user.emailConfig.prefix}@${user.emailConfig.domain}`
      : process.env.SMTP_USER;

    await transport.sendMail({
      from: fromEmail,
      to: targetEmail,
      subject: `热点发现: ${hotspot.title}`,
      html: exports.buildHotspotEmailHTML(hotspot),
      text: exports.buildHotspotEmailText(hotspot)
    });

    console.log(`邮件已发送给用户 ${user.username} → ${targetEmail}`);
  } catch (error) {
    console.error('发送邮件通知失败:', error);
  }
};

/**
 * 构建热点邮件HTML
 */
exports.buildHotspotEmailHTML = (hotspot) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #f9f9f9;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    .content {
      padding: 24px;
    }
    .footer {
      background: #f0f0f0;
      padding: 16px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔥 热点发现</h1>
    </div>
    <div class="content">
      <h2>${hotspot.title}</h2>
      <p><strong>来源:</strong> ${hotspot.source}</p>
      <p><strong>可信度:</strong> ${hotspot.isVerified ? '已验证' : '待验证'}</p>
      ${hotspot.url ? `<p><a href="${hotspot.url}">查看详情</a></p>` : ''}
    </div>
    <div class="footer">
      <p>来源：AI热点监控工具</p>
      <p>时间：${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * 构建热点邮件文本
 */
exports.buildHotspotEmailText = (hotspot) => {
  return `
热点发现

标题: ${hotspot.title}
来源: ${hotspot.source}
可信度: ${hotspot.isVerified ? '已验证' : '待验证'}
${hotspot.url ? `链接: ${hotspot.url}` : ''}

来源：AI热点监控工具
时间：${new Date().toLocaleString()}
  `;
};
