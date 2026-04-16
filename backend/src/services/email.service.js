const nodemailer = require('nodemailer');
const User = require('../models/User');

// 邮件传输器缓存
const transporterCache = new Map();

/**
 * 获取用户的邮件传输器
 */
async function getUserTransporter(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查用户是否配置了邮件服务
    if (!user.emailConfig || !user.emailConfig.prefix || !user.emailConfig.domain || !user.emailConfig.authCode) {
      return null;
    }

    const cacheKey = `${userId}_${user.emailConfig.prefix}_${user.emailConfig.domain}`;

    // 检查缓存
    if (transporterCache.has(cacheKey)) {
      return transporterCache.get(cacheKey);
    }

    // 根据邮箱服务商创建传输器
    const transporter = createTransporter(user.emailConfig);

    if (transporter) {
      transporterCache.set(cacheKey, transporter);
    }

    return transporter;
  } catch (error) {
    console.error('获取邮件传输器失败:', error);
    return null;
  }
}

/**
 * 创建邮件传输器
 */
function createTransporter(emailConfig) {
  const { prefix, domain, authCode } = emailConfig;

  switch (domain) {
    case 'qq.com':
      return nodemailer.createTransport({
        host: 'smtp.qq.com',
        port: 587,
        secure: false,
        auth: {
          user: `${prefix}@qq.com`,
          pass: authCode
        }
      });

    case '163.com':
      return nodemailer.createTransport({
        host: 'smtp.163.com',
        port: 465,
        secure: true,
        auth: {
          user: `${prefix}@163.com`,
          pass: authCode
        }
      });

    case '126.com':
      return nodemailer.createTransport({
        host: 'smtp.126.com',
        port: 465,
        secure: true,
        auth: {
          user: `${prefix}@126.com`,
          pass: authCode
        }
      });

    case 'gmail.com':
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: `${prefix}@gmail.com`,
          pass: authCode
        }
      });

    case 'outlook.com':
      return nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: `${prefix}@outlook.com`,
          pass: authCode
        }
      });

    default:
      console.log(`不支持的邮箱服务商: ${domain}`);
      return null;
  }
}

/**
 * 发送热点邮件通知
 */
async function sendHotspotEmail(toEmail, hotspot) {
  try {
    // 使用全局SMTP配置（如果配置了）
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const globalTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await globalTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: toEmail,
        subject: `🔥 发现新热点: ${hotspot.title}`,
        html: generateHotspotEmailTemplate(hotspot)
      });

      console.log(`✅ 使用全局SMTP配置发送邮件到: ${toEmail}`);
      return true;
    }

    console.log('未配置全局SMTP，邮件发送失败');
    return false;
  } catch (error) {
    console.error('发送热点邮件失败:', error.message);
    throw error;
  }
}

/**
 * 生成热点邮件模板
 */
function generateHotspotEmailTemplate(hotspot) {
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔥 发现新的AI热点</h2>
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
            <p style="color: #666; font-size: 14px;">${(hotspot.content || '').substring(0, 200)}...</p>
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

module.exports = {
  sendHotspotEmail,
  getUserTransporter
};
