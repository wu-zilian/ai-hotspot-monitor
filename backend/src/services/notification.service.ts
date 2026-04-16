import nodemailer from 'nodemailer';
import webpush from 'web-push';
import { Hotspot } from '../models/Hotspot'; // 假设已创建Hotspot模型

interface NotificationOptions {
  userId: string;
  title: string;
  body: string;
  data?: any;
}

export const sendNotification = async (userId: string, hotspot: any) => {
  try {
    // 1. 发送邮件通知
    await sendEmailNotification(userId, hotspot);

    // 2. 发送Web推送通知
    await sendWebPushNotification(userId, hotspot);

    // 3. 可以添加其他通知方式（如Slack、微信等）
  } catch (error) {
    console.error('发送通知失败:', error);
  }
};

const sendEmailNotification = async (userId: string, hotspot: any) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const user = await getUserEmail(userId); // 需要实现获取用户邮箱的函数

    if (user && user.email) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: `热点发现: ${hotspot.title}`,
        html: `
          <h2>热点发现</h2>
          <p><strong>标题:</strong> ${hotspot.title}</p>
          <p><strong>来源:</strong> ${hotspot.source}</p>
          <p><strong>时间:</strong> ${hotspot.timestamp}</p>
          <p><strong>可信度:</strong> ${hotspot.isVerified ? '已验证' : '待验证'}</p>
          <p><a href="${hotspot.url}">查看详情</a></p>
        `
      });
    }
  } catch (error) {
    console.error('发送邮件通知失败:', error);
  }
};

const sendWebPushNotification = async (userId: string, hotspot: any) => {
  try {
    // 获取用户的订阅信息
    const subscription = await getUserSubscription(userId); // 需要实现获取用户订阅的函数

    if (subscription) {
      const payload = JSON.stringify({
        title: '热点发现',
        body: hotspot.title,
        data: {
          url: hotspot.url,
          source: hotspot.source,
          isVerified: hotspot.isVerified
        }
      });

      await webpush.sendNotification(
        subscription,
        payload,
        {
          vapidDetails: {
            subject: 'mailto:your-email@example.com',
            publicKey: process.env.VAPID_PUBLIC_KEY!,
            privateKey: process.env.VAPID_PRIVATE_KEY!
          }
        }
      );
    }
  } catch (error) {
    console.error('发送Web推送通知失败:', error);
  }
};

// 辅助函数（需要根据实际数据库结构实现）
const getUserEmail = async (userId: string) => {
  // 从数据库获取用户邮箱
  return { email: 'user@example.com' }; // 示例返回
};

const getUserSubscription = async (userId: string) => {
  // 从数据库获取用户的Web Push订阅信息
  return null; // 示例返回
};