import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Switch, Button, Typography, Divider, Space, message, Tabs, Row, Col, Select, InputNumber, Slider } from 'antd';
import { SaveOutlined, MailOutlined, BellOutlined, ClockCircleOutlined, SecurityScanOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api from '../utils/axios';

const { Title, Text } = Typography;

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [originalEmail, setOriginalEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  // 邮箱配置状态
  const [emailConfig, setEmailConfig] = useState({
    prefix: '',
    domain: 'qq.com' as 'qq.com' | 'gmail.com' | '163.com' | '126.com' | 'outlook.com' | 'yahoo.com' | 'hotmail.com' | '',
    authCode: ''
  });
  const [settings, setSettings] = useState({
    email: '',
    notificationEmail: true,
    notificationWeb: true,
    notificationSlack: false,
    scanInterval: 30,
    maxArticles: 100,
    confidenceThreshold: 70,
    autoDelete: false,
    retentionDays: 90
  });
  const [activeTab, setActiveTab] = useState('notification');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/settings');
      // 确保 response.data 是对象，如果不是则保持当前设置不变
      if (response.data && typeof response.data === 'object') {
        setSettings(response.data);
        setOriginalEmail(response.data.email || '');

        // 加载邮箱配置
        if (response.data.emailConfig) {
          setEmailConfig({
            prefix: response.data.emailConfig.prefix || '',
            domain: response.data.emailConfig.domain || 'qq.com',
            authCode: ''  // 不加载授权码，安全考虑
          });
        }
      }
    } catch (error) {
      console.error('获取设置失败:', error);
    }
  };

  const handleSaveEmail = async () => {
    // 允许清空邮箱（保存为空字符串表示使用注册邮箱）
    // 如果填写了邮箱，需要验证格式
    const emailToSave = settings.email || '';  // 空字符串表示使用注册邮箱

    // 如果填写了邮箱，验证格式
    if (emailToSave && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(emailToSave)) {
      message.warning('请输入有效的邮箱地址');
      return;
    }

    setEmailLoading(true);
    try {
      await api.put('/api/settings', {
        email: emailToSave,
        emailConfig: {
          prefix: emailConfig.prefix,
          domain: emailConfig.domain || null,
          authCode: emailConfig.authCode || null
        }
      });

      if (emailToSave) {
        message.success(`通知邮箱已保存: ${emailToSave}`);
      } else {
        message.success('已恢复使用注册邮箱');
      }

      setOriginalEmail(emailToSave);
      // 清空授权码（安全考虑）
      setEmailConfig({ ...emailConfig, authCode: '' });
    } catch (error) {
      message.error('设置保存失败，请重试');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSaveScanSettings = async () => {
    setLoading(true);
    try {
      const response = await api.put('/api/settings', {
        scanInterval: settings.scanInterval,
        maxArticles: settings.maxArticles,
        confidenceThreshold: settings.confidenceThreshold,
        autoDelete: settings.autoDelete,
        retentionDays: settings.retentionDays,
        notificationEmail: settings.notificationEmail,
        notificationWeb: settings.notificationWeb,
        notificationSlack: settings.notificationSlack
      });

      // 使用后端返回的数据更新本地状态
      if (response.data) {
        setSettings(response.data);
      }

      message.success('扫描设置已保存');
    } catch (error) {
      message.error('设置保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      // 使用填写的邮箱地址，如果没有则让后端使用用户的邮箱
      const emailToSend = settings.email || undefined;

      message.loading({ content: '正在测试邮件配置...', key: 'testEmail', duration: 0 });
      const response = await api.post('/api/settings/test-email', {
        email: emailToSend
      });

      if (response.data.success) {
        const targetEmail = response.data.email;
        const isNotificationEmail = response.data.isNotificationEmail;

        let successMessage = '邮件测试成功！';
        if (isNotificationEmail) {
          successMessage += `\n\n已发送到配置的通知邮箱: ${targetEmail}`;
        } else {
          successMessage += `\n\n已发送到注册邮箱: ${targetEmail}\n(因为未配置通知邮箱)`;
        }

        message.success({ content: successMessage, key: 'testEmail', duration: 5 });
      } else {
        message.error({ content: response.data.message || '邮件测试失败', key: 'testEmail', duration: 3 });
      }
    } catch (error: any) {
      message.error({ content: error.response?.data?.message || '邮件测试失败，请检查配置', key: 'testEmail', duration: 3 });
    }
  };

  const handleTestWebNotification = async () => {
    try {
      setLoading(true);

      // 调用后端API创建测试通知
      await api.post('/api/notifications/test', {
        type: 'success',
        title: '🔔 Web推送通知测试',
        content: '这是一条测试通知，说明您的Web推送通知功能正常工作！当系统发现新的AI热点时，您将在通知中心收到类似的通知。'
      });

      message.success('测试通知已发送到通知中心，请查看顶部铃铛图标！');

      // 触发通知刷新
      window.dispatchEvent(new CustomEvent('notification-refresh'));
    } catch (error: any) {
      message.error(`创建测试通知失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderNotificationSettings = () => (
    <div style={{ padding: '24px' }}>
      <Title level={4} style={{ marginBottom: 24 }}>
        <BellOutlined style={{ marginRight: 8, color: '#1890ff' }} />
        通知设置
      </Title>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>邮件通知</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <MailOutlined style={{ color: '#1890ff', fontSize: 20 }} />
              <Switch
                checked={settings.notificationEmail}
                onChange={(checked) => setSettings({ ...settings, notificationEmail: checked })}
              />
            </div>
          </div>
        </Col>

        <Col span={12}>
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Web推送通知</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BellOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <Switch
                checked={settings.notificationWeb}
                onChange={(checked) => setSettings({ ...settings, notificationWeb: checked })}
              />
            </div>
          </div>
        </Col>

        <Col span={12}>
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>Slack集成</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#4a154b' }}>
                #
              </div>
              <Switch
                checked={settings.notificationSlack}
                onChange={(checked) => setSettings({ ...settings, notificationSlack: checked })}
              />
            </div>
          </div>
        </Col>

        <Col span={24}>
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              📬 通知邮箱地址
              <Text type="secondary" style={{ fontWeight: 'normal', marginLeft: 8 }}>
                （接收热点通知的邮箱，留空使用注册邮箱）
              </Text>
            </Text>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                prefix={<MailOutlined />}
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="输入接收通知的邮箱地址，或留空使用注册邮箱"
                style={{ flex: 1 }}
                onPressEnter={handleSaveEmail}
                allowClear
              />
              <Button
                type="primary"
                size="small"
                onClick={handleSaveEmail}
                loading={emailLoading}
              >
                保存邮箱
              </Button>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              💡 当前通知邮箱: {
                settings.email
                  ? settings.email
                  : (JSON.parse(localStorage.getItem('user') || '{}')?.email || '未设置')
              }
            </Text>
          </div>
        </Col>

        {/* 邮箱服务配置 */}
        <Col span={24}>
          <div style={{
            marginBottom: 24,
            padding: 16,
            background: '#f6f8fa',
            borderRadius: 8,
            border: '1px dashed #d9d9d9'
          }}>
            <Text strong style={{ display: 'block', marginBottom: 12 }}>
              ⚙️ 邮箱服务配置
              <Text type="secondary" style={{ fontWeight: 'normal', marginLeft: 8 }}>
                （用于发送通知邮件，需配置授权码）
              </Text>
            </Text>

            {/* 邮箱前缀和后缀 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <Input
                placeholder="邮箱账号"
                value={emailConfig.prefix}
                onChange={(e) => setEmailConfig({ ...emailConfig, prefix: e.target.value })}
                style={{ flex: 2 }}
              />
              <Select
                value={emailConfig.domain}
                onChange={(value) => setEmailConfig({ ...emailConfig, domain: value })}
                style={{ flex: 1 }}
              >
                <Select.Option value="">选择邮箱服务商</Select.Option>
                <Select.Option value="qq.com">@qq.com</Select.Option>
                <Select.Option value="gmail.com">@gmail.com</Select.Option>
                <Select.Option value="163.com">@163.com</Select.Option>
                <Select.Option value="126.com">@126.com</Select.Option>
                <Select.Option value="outlook.com">@outlook.com</Select.Option>
                <Select.Option value="yahoo.com">@yahoo.com</Select.Option>
                <Select.Option value="hotmail.com">@hotmail.com</Select.Option>
              </Select>
              <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                完整邮箱: {emailConfig.prefix}{emailConfig.domain ? `@${emailConfig.domain}` : ''}
              </Text>
            </div>

            {/* 授权码输入 */}
            <div style={{ marginBottom: 8 }}>
              <Input.Password
                prefix={<SecurityScanOutlined />}
                placeholder="邮箱授权码（非登录密码）"
                value={emailConfig.authCode}
                onChange={(e) => setEmailConfig({ ...emailConfig, authCode: e.target.value })}
                onPressEnter={handleSaveEmail}
              />
            </div>

            <Text type="secondary" style={{ fontSize: 12 }}>
              💡 如何获取授权码：
              <a href="https://service.mail.qq.com/cgi-bin/help?subtype=1&id=28&no=1001256" target="_blank" rel="noopener noreferrer">
                QQ邮箱
              </a>
              {' | '}
              <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer">
                Gmail
              </a>
              {' | '}
              <a href="https://help.mail.163.com/help/help_spam_16.htm" target="_blank" rel="noopener noreferrer">
                网易邮箱
              </a>
            </Text>
          </div>
        </Col>

        <Col span={24}>
          <Button
            type="primary"
            icon={<MailOutlined />}
            onClick={handleTestEmail}
            style={{ marginTop: 8, marginRight: 8 }}
          >
            测试邮件通知
          </Button>
          <Button
            type="default"
            icon={<BellOutlined />}
            onClick={handleTestWebNotification}
            style={{ marginTop: 8 }}
          >
            测试Web推送通知
          </Button>
        </Col>
      </Row>
    </div>
  );

  const renderScanSettings = () => (
    <div style={{ padding: '24px' }}>
      <Title level={4} style={{ marginBottom: 24 }}>
        <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
        扫描配置
      </Title>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              扫描间隔: <Text type="secondary">{settings.scanInterval}分钟</Text>
            </Text>
            <Slider
              min={5}
              max={120}
              value={settings.scanInterval}
              onChange={(value) => setSettings({ ...settings, scanInterval: value })}
              marks={{
                5: '5分钟',
                15: '15分钟',
                30: '30分钟',
                60: '60分钟',
                120: '2小时'
              }}
            />
          </div>
        </Col>

        <Col span={12}>
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              单次最大文章数: <Text type="secondary">{settings.maxArticles}</Text>
            </Text>
            <InputNumber
              min={10}
              max={500}
              value={settings.maxArticles}
              onChange={(value) => setSettings({ ...settings, maxArticles: value || 100 })}
              style={{ width: '100%' }}
            />
          </div>
        </Col>

        <Col span={12}>
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              置信度阈值: <Text type="secondary">{settings.confidenceThreshold}%</Text>
            </Text>
            <Slider
              min={50}
              max={100}
              value={settings.confidenceThreshold}
              onChange={(value) => setSettings({ ...settings, confidenceThreshold: value })}
              marks={{
                50: '50%',
                70: '70%',
                90: '90%',
                100: '100%'
              }}
            />
          </div>
        </Col>

        <Col span={12}>
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              自动删除: <Text type="secondary">{settings.autoDelete ? '启用' : '禁用'}</Text>
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Switch
                checked={settings.autoDelete}
                onChange={(checked) => setSettings({ ...settings, autoDelete: checked })}
              />
              <Select
                value={settings.retentionDays}
                onChange={(value) => setSettings({ ...settings, retentionDays: value })}
                style={{ width: 150 }}
                disabled={!settings.autoDelete}
              >
                <Select.Option value={30}>30天</Select.Option>
                <Select.Option value={90}>90天</Select.Option>
                <Select.Option value={180}>180天</Select.Option>
                <Select.Option value={365}>365天</Select.Option>
              </Select>
            </div>
          </div>
        </Col>

        <Col span={24}>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleSaveScanSettings}
            loading={loading}
            style={{ marginTop: 16, height: 40, fontSize: 16 }}
          >
            {loading ? '保存中...' : '保存设置'}
          </Button>
        </Col>
      </Row>
    </div>
  );

  const renderAccountSettings = () => (
    <div style={{ padding: '24px' }}>
      <Title level={4} style={{ marginBottom: 24 }}>
        <SecurityScanOutlined style={{ marginRight: 8, color: '#1890ff' }} />
        账户设置
      </Title>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <div style={{ padding: 16, background: '#f0f5f0', borderRadius: 8, marginBottom: 24 }}>
            <Text strong style={{ fontSize: 16, marginBottom: 8 }}>当前账户信息</Text>
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">用户名:</Text>
                <Text strong style={{ marginLeft: 8 }}>{JSON.parse(localStorage.getItem('user') || '{}')?.username || '-'}</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary">邮箱:</Text>
                <Text strong style={{ marginLeft: 8 }}>{JSON.parse(localStorage.getItem('user') || '{}')?.email || '-'}</Text>
              </div>
              <div>
                <Text type="secondary">注册时间:</Text>
                <Text strong style={{ marginLeft: 8 }}>{new Date().toLocaleDateString()}</Text>
              </div>
            </div>
          </div>
        </Col>

        <Col span={24}>
          <Button
            type="default"
            danger
            onClick={() => message.info('账户删除功能暂未开放')}
            style={{ marginTop: 16 }}
          >
            删除账户
          </Button>
        </Col>
      </Row>
    </div>
  );

  const tabItems = [
    {
      key: 'notification',
      label: '通知设置',
      children: renderNotificationSettings()
    },
    {
      key: 'scan',
      label: '扫描配置',
      children: renderScanSettings()
    },
    {
      key: 'account',
      label: '账户设置',
      children: renderAccountSettings()
    }
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px',
            borderRadius: '12px',
            color: 'white',
            marginBottom: 24
          }}>
            <Title level={3} style={{ color: 'white', marginBottom: 0 }}>
              <SaveOutlined style={{ marginRight: 8 }} />
              系统设置
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              配置您的监控偏好和通知方式
            </Text>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as string)}
            items={tabItems}
            tabBarExtraContent={
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveScanSettings}
                loading={loading}
              >
                保存设置
              </Button>
            }
          />
        </Card>

        <Divider style={{ margin: '24px 0' }} />

        <Card
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <div style={{ padding: '24px' }}>
            <Title level={4} style={{ marginBottom: 16 }}>💡 设置说明</Title>
            <div style={{ lineHeight: 1.8, color: '#666' }}>
              <p>• <strong>通知设置</strong>：选择您希望接收通知的方式（邮件、Web推送、Slack等）</p>
              <p>• <strong>扫描配置</strong>：设置自动扫描的频率和每次扫描的文章数量限制</p>
              <p>• <strong>置信度阈值</strong>：设置AI分析的最低置信度要求，低于此阈值的内容将被过滤</p>
              <p>• <strong>自动删除</strong>：启用后会自动删除超过指定天数的历史数据</p>
              <p style={{ color: '#999', fontSize: 12 }}>修改设置后请记得保存才能生效</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;