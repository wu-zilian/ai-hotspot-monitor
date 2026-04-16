/**
 * 通知发送Skill
 *
 * 负责发送各类通知
 */

const axios = require('axios');

class NotificationSender {
  constructor(config) {
    this.config = config;
    this.name = 'notification-sender';
    this.version = '1.0.0';
    this.notificationHistory = [];
  }

  /**
   * 发送通知
   * @param {Object} notification - 通知对象
   * @returns {Promise<Object>} 发送结果
   */
  async send(notification) {
    console.log(`[NotificationSender] 发送通知: ${notification.title}`);

    try {
      const results = [];

      // 并发发送多种通知方式
      const promises = [];

      if (notification.channels) {
        for (const channel of notification.channels) {
          promises.push(this.sendViaChannel(channel, notification));
        }
      } else {
        // 默认发送所有配置的通道
        promises.push(this.sendViaEmail(notification));
        promises.push(this.sendViaWebPush(notification));
      }

      const channelResults = await Promise.all(promises);

      // 记录发送历史
      const sentNotification = {
        ...notification,
        sentAt: new Date().toISOString(),
        channels: channelResults.map((r, index) => ({
          channel: notification.channels?.[index] || 'unknown',
          success: r.success,
          error: r.error
        })),
        overallSuccess: channelResults.every(r => r.success)
      };

      this.notificationHistory.push(sentNotification);

      return {
        success: true,
        data: sentNotification,
        channels: channelResults
      };
    } catch (error) {
      console.error('[NotificationSender] 发送失败:', error);
      return {
        success: false,
        error: error.message,
        notification: notification
      };
    }
  }

  /**
   * 发送邮件通知
   */
  async sendViaEmail(notification) {
    try {
      if (!this.config.emailService) {
        return { success: true, channel: 'email', skipped: true, reason: '邮件服务未配置' };
      }

      const response = await axios({
        method: 'post',
        url: `${this.config.apiUrl}/api/notifications/email`,
        data: {
          to: notification.recipients || [],
          subject: notification.title,
          body: this.buildEmailBody(notification),
          html: this.buildEmailHTML(notification)
        },
        headers: {
          'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : undefined
        }
      });

      return {
        success: response.data.success,
        channel: 'email',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        channel: 'email',
        error: error.message
      };
    }
  }

  /**
   * 发送Web推送通知
   */
  async sendViaWebPush(notification) {
    try {
      if (!this.config.webPushService) {
        return { success: true, channel: 'webpush', skipped: true, reason: 'Web推送服务未配置' };
      }

      const response = await axios({
        method: 'post',
        url: `${this.config.apiUrl}/api/notifications/webpush`,
        data: {
          title: notification.title,
          body: notification.content,
          icon: notification.icon || '🔥',
          url: notification.url || null,
          requireInteraction: notification.requireInteraction || true
        },
        headers: {
          'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : undefined
        }
      });

      return {
        success: response.data.success,
        channel: 'webpush',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        channel: 'webpush',
        error: error.message
      };
    }
  }

  /**
   * 发送Slack通知
   */
  async sendViaSlack(notification) {
    try {
      if (!this.config.slackWebhook) {
        return { success: true, channel: 'slack', skipped: true, reason: 'Slack Webhook未配置' };
      }

      const response = await axios.post(this.config.slackWebhook, {
        text: `🔥 *${notification.title}*`,
        attachments: [{
          color: this.getSlackColor(notification.type || 'info'),
          fields: [
            {
              title: '内容',
              value: notification.content?.substring(0, 200) || '...'
            },
            {
              title: '来源',
              value: notification.source || 'AI Hotspot Monitor'
            },
            {
              title: '时间',
              value: new Date().toLocaleString()
            }
          ]
        }]
      });

      return {
        success: true,
        channel: 'slack',
        data: { sent: true }
      };
    } catch (error) {
      return {
        success: false,
        channel: 'slack',
        error: error.message
      };
    }
  }

  /**
   * 构建邮件正文
   */
  buildEmailBody(notification) {
    return `
${notification.title}

${notification.content}

---
来源: ${notification.source || 'AI Hotspot Monitor'}
时间: ${new Date().toLocaleString()}
详情: ${notification.url || '请登录查看详情'}

如需停止接收此类通知，请回复"退订"。
    `;
  }

  /**
   * 构建邮件HTML
   */
  buildEmailHTML(notification) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
    .footer { margin-top: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🔥 ${notification.title}</h2>
    </div>
    <div class="content">
      <p>${notification.content || ''}</p>
      ${notification.url ? `<a href="${notification.url}" class="button">查看详情</a>` : ''}
    </div>
    <div class="footer">
      <p>来源: ${notification.source || 'AI Hotspot Monitor'}</p>
      <p>时间: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * 获取Slack颜色
   */
  getSlackColor(type) {
    const colors = {
      success: '36a64f',
      warning: 'ffad42',
      error: 'd62728',
      info: '36a64f'
    };
    return colors[type] || '36a64f';
  }

  /**
   * 批量发送
   */
  async batchSend(notifications, options = {}) {
    const { concurrent = 5, delay = 1000 } = options;

    console.log(`[NotificationSender] 批量发送 ${notifications.length} 条通知`);

    const results = [];
    const batches = [];

    // 分批处理
    for (let i = 0; i < notifications.length; i += concurrent) {
      const batch = notifications.slice(i, i + concurrent);
      batches.push(batch);
    }

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(notification => this.send(notification))
      );
      results.push(...batchResults);

      // 避免请求过于频繁
      if (batch !== batches[batches.length - 1]) {
        await this.sleep(delay);
      }
    }

    console.log(`[NotificationSender] 批量发送完成，成功 ${results.filter(r => r.success).length}/${results.length}`);

    return results;
  }

  /**
   * 发送紧急通知
   */
  async sendEmergency(notification, channels = ['email', 'webpush']) {
    const emergencyNotification = {
      ...notification,
      priority: 'emergency',
      channels,
      requireInteraction: true,
      expireAfter: 3600 // 1小时后过期
    };

    return await this.send(emergencyNotification);
  }

  /**
   * 获取发送历史
   */
  getHistory(options = {}) {
    const {
      limit = 100,
      filter = null
    } = options;

    let history = [...this.notificationHistory];

    if (limit) {
      history = history.slice(-limit);
    }

    if (filter) {
      history = history.filter(filter);
    }

    return {
      success: true,
      data: history,
      total: history.length
    };
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    const checks = [];

    // 检查各个通道的健康状态
    const channels = ['email', 'webpush', 'slack'];
    for (const channel of channels) {
      try {
        if (channel === 'email' && this.config.emailService) {
          checks.push({ channel, status: 'healthy' });
        } else if (channel === 'webpush' && this.config.webPushService) {
          checks.push({ channel, status: 'healthy' });
        } else if (channel === 'slack' && this.config.slackWebhook) {
          checks.push({ channel, status: 'healthy' });
        } else {
          checks.push({ channel, status: 'not_configured' });
        }
      } catch (error) {
        checks.push({ channel, status: 'unhealthy', error: error.message });
      }
    }

    return {
      status: checks.every(c => c.status === 'healthy' || c.status === 'not_configured') ? 'healthy' : 'degraded',
      name: this.name,
      version: this.version,
      capabilities: ['邮件通知', 'Web推送', 'Slack集成', '批量发送'],
      channels: checks,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 延迟函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = NotificationSender;