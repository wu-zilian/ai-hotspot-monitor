import React, { useEffect, useState, useRef } from 'react';
import { Card, Row, Col, Statistic, List, Typography, Spin, Alert, Button, Tag, Progress, Empty, Modal, Space, message, Popconfirm } from 'antd';
import {
  BellOutlined,
  RiseOutlined,
  FireOutlined,
  PlusOutlined,
  EyeOutlined,
  LinkOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import ScanProgressModal from '../components/ScanProgressModal';

const { Title, Text } = Typography;

// 时间格式化函数
const formatTime = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = now.getTime() - time.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天前`;
  } else if (hours > 0) {
    return `${hours}小时前`;
  } else {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}分钟前`;
  }
};

// 热点数据类型定义（匹配后端返回结构）
interface Hotspot {
  _id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  timestamp: string;
  isVerified: boolean;
  confidence: number;
  keywords: string[];
  verification?: {
    status: string;
    isAuthentic: boolean;
    confidence: number;
    level: string;
  };
}

interface ScanSummary {
  total: number;
  success: number;
  failed: number;
  duration: number;
  crawled?: number;
  skipped?: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string>();
  const [currentTaskStatus, setCurrentTaskStatus] = useState<any>(null);
  const [showTaskStatusCard, setShowTaskStatusCard] = useState(false);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [lastScanSummary, setLastScanSummary] = useState<ScanSummary | null>(null);
  const [stats, setStats] = useState({
    totalKeywords: 0,
    todayHotspots: 0,
    verifiedContent: 0,
    monitoring: true
  });

  // WebSocket连接引用
  const wsRef = useRef<WebSocket | null>(null);

  // 建立WebSocket连接监听任务进度
  useEffect(() => {
    if (!currentTaskId) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id || user?._id || 'unknown';

    if (!token) return;

    const wsUrl = `ws://localhost:5001/ws?userId=${userId}&token=${token}`;
    console.log('Dashboard连接WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Dashboard WebSocket连接成功');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Dashboard收到WebSocket消息:', message.type, message);

        switch (message.type) {
          case 'connected':
            console.log('WebSocket服务器确认连接');
            break;

          case 'scanProgress':
            // 实时更新任务状态
            if (message.taskId === currentTaskId) {
              console.log('更新扫描进度:', message.progress);
              setCurrentTaskStatus((prev: any) => ({
                taskId: message.taskId,
                status: message.status || 'crawling',
                progress: {
                  ...prev?.progress,
                  ...message.progress
                }
              }));
            }
            break;

          case 'analysisResult':
            // 更新分析进度
            if (message.taskId === currentTaskId) {
              console.log('更新分析进度:', message.progress);
              setCurrentTaskStatus((prev: any) => {
                const newProgress = message.progress || {};
                return {
                  taskId: message.taskId,
                  status: 'analyzing',
                  progress: {
                    total: newProgress.total || prev?.progress?.total || 0,
                    saved: newProgress.total || prev?.progress?.total || 0,
                    crawled: newProgress.total || prev?.progress?.total || 0,
                    analyzed: newProgress.current || 0
                  }
                };
              });
            }
            break;

          case 'scanComplete':
            // 扫描完成
            if (message.taskId === currentTaskId && message.summary) {
              console.log('扫描完成:', message.summary);
              handleScanComplete({
                total: message.summary.total,
                success: message.summary.success,
                failed: message.summary.failed || 0,
                duration: message.summary.duration || 0
              });
            }
            break;

          case 'scanError':
            // 扫描失败
            if (message.taskId === currentTaskId) {
              console.error('扫描失败');
              message.error('扫描任务失败');
              localStorage.removeItem('currentScanTaskId');
              setCurrentTaskId(undefined);
              setScanning(false);
              setShowTaskStatusCard(false);
            }
            break;

          case 'pong':
            // 心跳响应
            break;

          default:
            console.log('未处理的消息类型:', message.type);
        }
      } catch (error) {
        console.error('处理WebSocket消息失败:', error);
      }
    };

    ws.onclose = () => {
      console.log('Dashboard WebSocket连接关闭');
    };

    ws.onerror = (error) => {
      console.error('Dashboard WebSocket错误:', error);
    };

    wsRef.current = ws;

    // 发送心跳
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [currentTaskId]);

  // 从localStorage恢复任务状态
  useEffect(() => {
    const savedTaskId = localStorage.getItem('currentScanTaskId');
    if (savedTaskId) {
      console.log('从localStorage恢复任务:', savedTaskId);
      setCurrentTaskId(savedTaskId);
      setScanning(true);
      setShowTaskStatusCard(true);

      // 立即获取一次任务状态作为初始值
      checkTaskStatus(savedTaskId).catch(err => {
        console.error('获取初始任务状态失败:', err);
      });
      // WebSocket连接会在currentTaskId变化时自动建立，后续更新通过WebSocket
    }
  }, []);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const keywordsRes = await api.get('/api/keywords');
      const keywords = Array.isArray(keywordsRes.data) ? keywordsRes.data : [];
      const activeKeywords = keywords.filter((k: any) => k.isActive !== false);

      // 获取今日热点数
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      setStats({
        totalKeywords: activeKeywords.length,
        todayHotspots: 0, // 将从热点数据中计算
        verifiedContent: 0, // 将从热点数据中计算
        monitoring: true
      });

      return { activeKeywords, today };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return { activeKeywords: [], today: new Date() };
    }
  };

  // 获取热点数据
  const fetchHotspots = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/content/hotspots', {
        params: { limit: 50, offset: 0 }
      });

      const hotspotsData = response.data?.data || [];

      // 计算今日热点和已验证内容
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayHotspots = hotspotsData.filter((h: any) =>
        new Date(h.timestamp) >= today
      ).length;
      const verifiedContent = hotspotsData.filter((h: any) => h.isVerified).length;

      setStats(prev => ({
        ...prev,
        todayHotspots,
        verifiedContent
      }));

      setHotspots(hotspotsData);
    } catch (error) {
      console.error('获取热点数据失败:', error);
      setHotspots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchHotspots();
  }, []);

  // 触发扫描
  const handleScan = async () => {
    // 检查是否有活跃关键词
    if (stats.totalKeywords === 0) {
      message.warning('请先添加监控关键词！');
      navigate('/keywords');
      return;
    }

    setScanning(true);
    try {
      // 调用异步扫描API
      const response = await api.post('/api/tasks/scan', {
        sources: ['hackernews', 'bing', 'sogou'],
        limit: 20,
        includeWechat: false,
        includeHotTrends: true,
        enableAI: true
      });

      if (response.data.success) {
        const taskId = response.data.taskId;
        setCurrentTaskId(taskId);

        // 保存任务ID到localStorage
        localStorage.setItem('currentScanTaskId', taskId);

        // 初始化任务状态
        setCurrentTaskStatus({
          taskId: taskId,
          status: 'pending',
          progress: {
            total: 0,
            saved: 0,
            crawled: 0,
            analyzed: 0
          }
        });

        // 显示扫描进度Modal
        setScanModalVisible(true);

        message.success({
          content: '扫描任务已启动，正在后台执行...',
          duration: 3,
          icon: <ThunderboltOutlined />
        });
      }
    } catch (error: any) {
      console.error('扫描启动失败:', error);
      const errorMsg = error.response?.data?.message || '启动扫描任务失败，请重试';
      message.error({ content: errorMsg, duration: 3 });
      setScanning(false);
    }
  };

  // 扫描完成回调
  const handleScanComplete = (summary: ScanSummary) => {
    console.log('扫描完成:', summary);
    setLastScanSummary(summary);
    setScanning(false);

    // 清除localStorage中的任务ID
    localStorage.removeItem('currentScanTaskId');
    setCurrentTaskId(undefined);
    setCurrentTaskStatus(null);
    setShowTaskStatusCard(false);

    // 重新加载热点数据
    setTimeout(() => {
      fetchHotspots();
      fetchStats();
    }, 1000);
  };

  // 关闭扫描Modal
  const handleScanModalClose = () => {
    setScanModalVisible(false);
    // 如果任务还在进行中，显示任务状态卡片
    const isComplete = currentTaskStatus?.status === 'completed' || currentTaskStatus?.status === 'failed';
    if (currentTaskId && !isComplete) {
      setShowTaskStatusCard(true);
      // WebSocket会自动更新状态，不需要轮询
    } else {
      setScanning(false);
    }
  };

  // 检查任务状态（只在需要时手动调用）
  const checkTaskStatus = async (taskId: string) => {
    try {
      const response = await api.get(`/api/tasks/scan/${taskId}/status`);
      if (response.data.success) {
        const status = response.data.data;
        setCurrentTaskStatus(status);

        // 如果任务完成或失败
        if (status.status === 'completed') {
          handleScanComplete({
            total: status.progress.total,
            success: status.progress.analyzed,
            failed: 0,
            duration: 0,
            crawled: status.progress.crawled,
            skipped: status.progress.total - status.progress.saved
          });
        } else if (status.status === 'failed') {
          localStorage.removeItem('currentScanTaskId');
          setCurrentTaskId(undefined);
          setScanning(false);
          setShowTaskStatusCard(false);
          message.error('扫描任务失败');
        } else {
          // 任务还在进行中，显示状态卡片
          setShowTaskStatusCard(true);
        }
      }
    } catch (error) {
      console.error('获取任务状态失败:', error);
      // 如果任务不存在，清除localStorage
      localStorage.removeItem('currentScanTaskId');
      setCurrentTaskId(undefined);
    }
  };

  // 移除轮询函数，完全依赖WebSocket

  // 重新打开进度Modal
  const handleReopenProgressModal = () => {
    setScanModalVisible(true);
    setShowTaskStatusCard(false);

    // 立即从服务器获取最新状态，确保Modal显示最新进度
    if (currentTaskId) {
      checkTaskStatus(currentTaskId);
    }
  };

  // 获取任务状态文本
  const getTaskStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '等待中',
      'crawling': '正在爬取数据...',
      'crawled': '爬取完成',
      'analyzing': 'AI分析中...',
      'completed': '已完成',
      'failed': '失败'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" tip="正在加载热点数据..." />
      </div>
    );
  }

  return (
    <div>
      {/* 顶部横幅 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        borderRadius: '12px',
        color: 'white',
        marginBottom: 24
      }}>
        <Title level={3} style={{ color: 'white', marginBottom: 8 }}>
          <RiseOutlined style={{ marginRight: 8 }} />
          热点监控仪表板
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
          实时监控AI领域的最新热点动态
        </Text>
      </div>

      {/* 上次扫描结果提示 */}
      {lastScanSummary && (
        <Alert
          message={
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    上次扫描完成
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    爬取 {lastScanSummary.crawled || lastScanSummary.total} 条，
                    新增 {lastScanSummary.success} 条，
                    跳过 {lastScanSummary.skipped || 0} 条重复数据
                  </div>
                </div>
                <Button
                  size="small"
                  type="link"
                  onClick={() => setLastScanSummary(null)}
                >
                  关闭
                </Button>
              </div>
            </div>
          }
          type="success"
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setLastScanSummary(null)}
        />
      )}

      {/* 当前扫描任务状态卡片 */}
      {showTaskStatusCard && currentTaskStatus && currentTaskStatus.status !== 'completed' && currentTaskStatus.status !== 'failed' && (
        <Alert
          message={
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ReloadOutlined spin style={{ color: '#1890ff', fontSize: '18px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    扫描任务进行中
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    状态: {getTaskStatusText(currentTaskStatus.status)}
                    {currentTaskStatus.progress && currentTaskStatus.progress.total > 0 && (
                      <span style={{ marginLeft: '12px' }}>
                        已完成: {currentTaskStatus.progress.analyzed || 0} / {currentTaskStatus.progress.total}
                        ({Math.round(((currentTaskStatus.progress.analyzed || 0) / currentTaskStatus.progress.total) * 100)}%)
                      </span>
                    )}
                  </div>
                  {currentTaskStatus.progress && currentTaskStatus.progress.total > 0 && (
                    <Progress
                      percent={Math.round(((currentTaskStatus.progress.analyzed || 0) / currentTaskStatus.progress.total) * 100)}
                      size="small"
                      style={{ marginTop: 8 }}
                      status={currentTaskStatus.status === 'analyzing' ? 'active' : 'normal'}
                    />
                  )}
                </div>
                <Button
                  size="small"
                  type="primary"
                  onClick={handleReopenProgressModal}
                >
                  查看详情
                </Button>
              </div>
            </div>
          }
          type="info"
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setShowTaskStatusCard(false)}
        />
      )}

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="监控关键词"
              value={stats.totalKeywords}
              prefix={<BellOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="今日热点"
              value={stats.todayHotspots}
              prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="已验证内容"
              value={stats.verifiedContent}
              prefix={<FireOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="监控状态"
              value={stats.monitoring ? '运行中' : '已暂停'}
              prefix={stats.monitoring ?
                <span style={{ color: '#52c41a' }}>●</span> :
                <span style={{ color: '#ff4d4f' }}>●</span>
              }
              valueStyle={{ color: stats.monitoring ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 热点列表 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>最新热点</span>
            {scanning && (
              <Tag color="processing" icon={<ReloadOutlined spin />}>
                扫描中...
              </Tag>
            )}
            {showTaskStatusCard && currentTaskStatus && currentTaskStatus.status !== 'completed' && !scanning && (
              <Tag
                color="blue"
                icon={<ReloadOutlined spin />}
                style={{ cursor: 'pointer' }}
                onClick={handleReopenProgressModal}
              >
                后台扫描中 (点击查看)
              </Tag>
            )}
          </div>
        }
        extra={
          <Popconfirm
            title="开始扫描热点"
            description={
              stats.totalKeywords > 0
                ? `将使用 ${stats.totalKeywords} 个关键词进行扫描`
                : '请先添加关键词'
            }
            onConfirm={handleScan}
            okText="开始扫描"
            cancelText="取消"
          >
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              loading={scanning}
              size="large"
            >
              {scanning ? '扫描中...' : '立即扫描'}
            </Button>
          </Popconfirm>
        }
        style={{
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          marginBottom: 24
        }}
      >
        {hotspots.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">暂无热点数据</Text>
                <br />
                <Text type="secondary">
                  {stats.totalKeywords === 0
                    ? '添加关键词后系统将自动监控相关热点'
                    : '点击"立即扫描"开始获取热点数据'
                  }
                </Text>
              </div>
            }
          />
        ) : (
          <List
            itemLayout="vertical"
            size="large"
            dataSource={hotspots}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: '20px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  background: 'white'
                }}
                actions={[
                  <Button
                    key="view-detail"
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => setSelectedHotspot(item)}
                  >
                    查看详情
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div>
                      <Text strong style={{ fontSize: '16px', color: '#333' }}>
                        {item.title}
                      </Text>
                      {item.isVerified && (
                        <Tag color="success" style={{ marginLeft: 8 }}>
                          ✓ 已验证
                        </Tag>
                      )}
                      {item.verification && (
                        <Tag
                          color={
                            item.verification.level === 'high' ? 'success' :
                            item.verification.level === 'medium' ? 'warning' : 'error'
                          }
                          style={{ marginLeft: 4 }}
                        >
                          {item.verification.level === 'high' ? '高可信' :
                           item.verification.level === 'medium' ? '中可信' : '低可信'}
                        </Tag>
                      )}
                      <div style={{ marginTop: 4 }}>
                        <Progress
                          percent={item.confidence}
                          size="small"
                          showInfo={false}
                          strokeColor={
                            item.confidence >= 90 ? '#52c41a' :
                            item.confidence >= 70 ? '#fa8c16' : '#ff4d4f'
                          }
                        />
                      </div>
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary">
                        {item.source} · {formatTime(item.timestamp)}
                      </Text>
                      <div style={{ marginTop: 8, color: '#666' }}>
                        {item.content.substring(0, 100)}...
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {item.keywords.map((keyword, index) => (
                          <Tag key={index} color="blue" style={{ marginRight: 8 }}>
                            {keyword}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 系统状态提示 */}
      <Alert
        message="系统状态"
        description={
          <div>
            <p>系统正在24小时监控热点内容，发现新热点将立即通知您。</p>
            <p style={{ marginBottom: 0 }}>
              <InfoCircleOutlined /> 点击"立即扫描"可手动触发热点获取
            </p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 添加关键词按钮 */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ borderRadius: '8px' }}
          onClick={() => navigate('/keywords')}
        >
          添加监控关键词
        </Button>
      </div>

      {/* 热点详情Modal */}
      <Modal
        title="热点详情"
        open={!!selectedHotspot}
        onCancel={() => setSelectedHotspot(null)}
        footer={[
          selectedHotspot?.url && (
            <Button
              key="view-original"
              type="primary"
              icon={<LinkOutlined />}
              onClick={() => window.open(selectedHotspot.url, '_blank')}
            >
              查看原文
            </Button>
          ),
          <Button key="close" onClick={() => setSelectedHotspot(null)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedHotspot && (
          <div>
            <Title level={4} style={{ marginBottom: 16 }}>
              {selectedHotspot.title}
            </Title>

            <div style={{ marginBottom: 16 }}>
              <Space size="middle">
                <Tag color={selectedHotspot.isVerified ? 'success' : 'default'}>
                  {selectedHotspot.isVerified ? '✓ 已验证' : '未验证'}
                </Tag>
                {selectedHotspot.verification && (
                  <Tag
                    color={
                      selectedHotspot.verification.level === 'high' ? 'success' :
                      selectedHotspot.verification.level === 'medium' ? 'warning' : 'error'
                    }
                  >
                    {selectedHotspot.verification.level === 'high' ? '高可信' :
                     selectedHotspot.verification.level === 'medium' ? '中可信' : '低可信'}
                  </Tag>
                )}
                <Tag color="blue">{selectedHotspot.source}</Tag>
                <Text type="secondary">{formatTime(selectedHotspot.timestamp)}</Text>
              </Space>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>置信度：</Text>
              <Progress
                percent={selectedHotspot.confidence}
                strokeColor={
                  selectedHotspot.confidence >= 90 ? '#52c41a' :
                  selectedHotspot.confidence >= 70 ? '#fa8c16' : '#ff4d4f'
                }
                style={{ marginLeft: 8, width: 200 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>关键词：</Text>
              <div style={{ marginTop: 8 }}>
                {selectedHotspot.keywords.map((keyword, index) => (
                  <Tag key={index} color="blue" style={{ marginRight: 8 }}>
                    {keyword}
                  </Tag>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>内容摘要：</Text>
              <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
                <Text>{selectedHotspot.content}</Text>
              </div>
            </div>

            <div style={{ padding: 12, background: '#e6f7ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                热点ID: {selectedHotspot._id} · 发现时间: {formatTime(selectedHotspot.timestamp)}
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* 扫描进度Modal */}
      <ScanProgressModal
        visible={scanModalVisible}
        taskId={currentTaskId}
        onClose={handleScanModalClose}
        onComplete={handleScanComplete}
      />
    </div>
  );
};

export default Dashboard;
