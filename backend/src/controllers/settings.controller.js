const User = require('../models/User');

// 简单的内存存储设置（生产环境应该存储在数据库中）
let defaultSettings = {
  email: '',
  notificationEmail: true,
  notificationWeb: true,
  notificationSlack: false,
  scanInterval: 30,
  maxArticles: 100,
  confidenceThreshold: 70,
  autoDelete: false,
  retentionDays: 90
};

// 获取设置
exports.getSettings = async (req, res) => {
  try {
    // 如果用户已登录，返回用户的设置
    if (req.user?.userId) {
      const User = require('../models/User');
      const user = await User.findById(req.user.userId);

      if (user) {
        // 只返回邮箱相关数据和扫描间隔，不覆盖开关状态
        const userEmailData = {
          email: user.notificationEmail || '',
          emailConfig: user.emailConfig ? {
            prefix: user.emailConfig.prefix || '',
            domain: user.emailConfig.domain || '',
            authCode: ''  // 不返回授权码，安全考虑
          } : { prefix: '', domain: '', authCode: '' },
          // 从用户设置中获取扫描间隔
          scanInterval: user.settings?.scanInterval || defaultSettings.scanInterval
        };

        return res.json({
          ...defaultSettings,  // 先使用内存存储的设置（包含开关状态）
          ...userEmailData     // 只覆盖邮箱相关字段和扫描间隔
        });
      }
    }

    res.json(defaultSettings);
  } catch (error) {
    res.status(500).json({ message: '获取设置失败' });
  }
};

// 更新设置
exports.updateSettings = async (req, res) => {
  try {
    const { email, emailConfig, scanInterval, ...otherSetting } = req.body;
    const userId = req.user?.userId;

    console.log('[更新设置] 请求数据:', {
      email,
      emailConfig: { ...emailConfig, authCode: emailConfig?.authCode ? '***' : undefined },
      scanInterval,
      ...otherSetting
    });

    // 用户特定的邮箱数据（不覆盖开关状态）
    let userEmailData = {};

    // 如果用户已登录，更新用户的邮箱相关设置
    if (userId) {
      const User = require('../models/User');
      const updateData = {};
      let needUpdateScheduler = false;

      // 处理通知邮箱（允许清空）
      if (email !== undefined) {
        updateData.notificationEmail = email || null;  // 空字符串转为null
        console.log('[更新设置] 将更新 notificationEmail:', updateData.notificationEmail);
      }

      // 处理扫描间隔变化
      if (scanInterval !== undefined) {
        // 确保用户的 settings 对象存在
        updateData.settings = {};
        updateData.settings.scanInterval = scanInterval;
        needUpdateScheduler = true;
        console.log('[更新设置] 将更新 scanInterval:', scanInterval);
      }

      // 处理邮箱服务配置
      if (emailConfig) {
        updateData.emailConfig = {};

        // 只更新提供的字段
        if (emailConfig.prefix !== undefined) {
          updateData.emailConfig.prefix = emailConfig.prefix;
        }
        if (emailConfig.domain !== undefined) {
          updateData.emailConfig.domain = emailConfig.domain || null;
        }
        // 只有提供了新的授权码才更新
        if (emailConfig.authCode && emailConfig.authCode.trim()) {
          updateData.emailConfig.authCode = emailConfig.authCode.trim();
        }

        console.log('[更新设置] 将更新 emailConfig:', updateData.emailConfig);

        // 如果emailConfig为空，删除它
        if (Object.keys(updateData.emailConfig).length === 0) {
          delete updateData.emailConfig;
        }
      }

      console.log('[更新设置] 最终用户更新数据:', updateData);

      // 如果有用户数据更新，执行更新
      if (Object.keys(updateData).length > 0) {
        const user = await User.findByIdAndUpdate(
          userId,
          updateData,
          { new: true }
        );

        if (user) {
          console.log('[更新设置] 更新后的用户数据:', {
            notificationEmail: user.notificationEmail,
            hasEmailConfig: !!user.emailConfig,
            emailConfigPrefix: user.emailConfig?.prefix,
            emailConfigDomain: user.emailConfig?.domain,
            scanInterval: user.settings?.scanInterval
          });

          userEmailData = {
            email: user.notificationEmail || '',
            emailConfig: user.emailConfig ? {
              prefix: user.emailConfig.prefix || '',
              domain: user.emailConfig.domain || '',
              authCode: ''  // 不返回授权码
            } : { prefix: '', domain: '', authCode: '' }
          };

          // 更新自动扫描调度器
          if (needUpdateScheduler) {
            const autoScanScheduler = require('../services/autoScan.scheduler');
            await autoScanScheduler.updateUserScanInterval(userId, scanInterval);
            console.log(`[更新设置] 已更新用户 ${userId} 的自动扫描间隔: ${scanInterval}分钟`);
          }
        }
      } else {
        // 没有用户数据更新，获取现有数据
        const user = await User.findById(userId);
        if (user) {
          userEmailData = {
            email: user.notificationEmail || '',
            emailConfig: user.emailConfig ? {
              prefix: user.emailConfig.prefix || '',
              domain: user.emailConfig.domain || '',
              authCode: ''
            } : { prefix: '', domain: '', authCode: '' }
          };
        }
      }
    }

    // 更新内存存储（用于其他设置项：notificationEmail开关、notificationWeb、notificationSlack等）
    const updates = otherSetting;
    defaultSettings = { ...defaultSettings, ...updates };

    console.log('[更新设置] 内存存储已更新:', updates);

    // 返回合并后的结果：defaultSettings + userEmailData
    // 注意：userEmailData 只包含 email 和 emailConfig，不包含 notificationEmail 开关
    res.json({
      ...defaultSettings,
      ...userEmailData
    });
  } catch (error) {
    console.error('[更新设置] 错误:', error);
    res.status(500).json({ message: '更新设置失败' });
  }
};

// 测试邮件
exports.testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user?.userId;

    console.log('[测试邮件] 请求参数:', { email, userId });

    // 确定发送目标邮箱
    let targetEmail = email;

    // 如果请求中提供了邮箱，使用该邮箱
    // 否则从用户信息获取（优先使用notificationEmail）
    if (!targetEmail && userId) {
      const user = await User.findById(userId);

      console.log('[测试邮件] 从数据库获取的用户信息:', {
        id: user?._id,
        notificationEmail: user?.notificationEmail,
        email: user?.email,
        finalEmail: user?.notificationEmail || user?.email
      });

      if (user) {
        // 优先使用配置的通知邮箱，如果没有则使用注册邮箱
        targetEmail = user.notificationEmail || user.email;
      }
    }

    console.log('[测试邮件] 最终目标邮箱:', targetEmail);

    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        message: '未找到邮箱地址，请在设置中配置通知邮箱'
      });
    }

    // 导入邮件服务
    const notificationService = require('../services/notification.service');

    // 构建测试邮件内容（提前定义，避免作用域问题）
    const testHTML = `
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
      background: white;
    }
    .success-box {
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
      text-align: center;
    }
    .success-icon {
      font-size: 48px;
      margin-bottom: 12px;
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
      <h1>🔥 AI热点监控 - 邮件测试</h1>
    </div>
    <div class="content">
      <h2>邮件配置测试成功！</h2>
      <div class="success-box">
        <div class="success-icon">✅</div>
        <p><strong>恭喜！</strong>您的邮件服务配置正确。</p>
        <p>系统已成功向 <strong>${targetEmail}</strong> 发送测试邮件。</p>
      </div>
      <h3>测试信息：</h3>
      <ul style="list-style: none; padding: 0;">
        <li>📬 收件人: <strong>${targetEmail}</strong></li>
        <li>🕒 发送时间: <strong>${new Date().toLocaleString('zh-CN')}</strong></li>
        <li>✅ 测试状态: <strong>成功</strong></li>
      </ul>
      <p style="color: #666; font-size: 14px; margin-top: 24px;">
        💡 当系统发现新的AI热点时，将向此邮箱发送通知。
      </p>
      <p style="color: #999; font-size: 13px; margin-top: 16px;">
        注：这是您在系统设置中配置的通知邮箱。
      </p>
    </div>
    <div class="footer">
      <p>AI热点监控系统 ©2024</p>
      <p>此邮件由系统自动发送，请勿回复</p>
    </div>
  </div>
</body>
</html>
    `;

    const testText = `
AI热点监控系统 - 邮件配置测试

恭喜！邮件服务配置正确。

系统已成功向以下邮箱发送测试邮件：
收件人: ${targetEmail}
发送时间: ${new Date().toLocaleString('zh-CN')}
测试状态: 成功

💡 当系统发现新的AI热点时，将向此邮箱发送通知。

注：这是您在系统设置中配置的通知邮箱。

AI热点监控系统 ©2024
此邮件由系统自动发送，请勿回复
    `;

    // 获取用户配置的邮箱服务
    let transport = null;
    let fromEmail = null;

    if (userId) {
      const user = await User.findById(userId);
      if (user && user.emailConfig?.prefix && user.emailConfig?.domain && user.emailConfig?.authCode) {
        // 使用用户配置的邮箱服务
        const { getTransporter } = notificationService;
        transport = getTransporter(user.emailConfig);
        fromEmail = `${user.emailConfig.prefix}@${user.emailConfig.domain}`;
        console.log(`[测试邮件] 使用用户配置的邮箱服务: ${fromEmail}`);
      }
    }

    // 如果没有用户配置，使用全局配置
    if (!transport) {
      const { sendEmail } = notificationService;
      const result = await sendEmail(
        targetEmail,
        'AI热点监控 - 邮件配置测试',
        testHTML,
        testText
      );

      if (result.success) {
        return res.json({
          success: true,
          message: '测试邮件已发送',
          email: targetEmail,
          sentAt: new Date(),
          isNotificationEmail: !!email
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.message,
          error: result.error
        });
      }
    }

    // 使用用户配置的传输器发送邮件
    await transport.sendMail({
      from: fromEmail,
      to: targetEmail,
      subject: 'AI热点监控 - 邮件配置测试',
      html: testHTML,
      text: testText
    });

    res.json({
      success: true,
      message: '测试邮件已发送',
      email: targetEmail,
      sentAt: new Date(),
      isNotificationEmail: !!email,
      fromEmail: fromEmail
    });
  } catch (error) {
    console.error('[测试邮件] 发送失败:', error);
    res.status(500).json({
      success: false,
      message: '邮件测试失败',
      error: error.message
    });
  }
};
