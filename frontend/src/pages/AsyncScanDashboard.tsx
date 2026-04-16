import React, { useEffect, useState } from 'react';
import { Card, Button, Progress, List, Tag, Space, Alert, Statistic, Row, Col } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import api from '../utils/axios';
import wsClient, {
  WebSocketOptions,
  WebSocketMessage,
  AnalysisResult
} from '../utils/websocketClient';

interface ScanProgress {
  current: number;
  total: number;
  percentage: number;
}

const AsyncScanDashboard: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress>({ current: 0, total: 0, percentage: 0 });
  const [scanStatus, setScanStatus] = useState<string>('');
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    // 连接WebSocket
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (user._id && token) {
      const options: WebSocketOptions = {
        onConnected: () => {
          console.log('WebSocket已连接');
          setWsConnected(true);
        },
        onDisconnected: () => {
          console.log('WebSocket已断开');
          setWsConnected(false);
        },
        onError: (error: Event) => {
          console.error('WebSocket错误:', error);
          setWsConnected(false);
        },
        onMessage: (message: WebSocketMessage) => {
          handleMessage(message);
        }
      };

      wsClient.connect(user._id, token, options);

      return () => {
        wsClient.disconnect();
      };
    }
  }, []);

  // 处理WebSocket消息
  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'scanProgress':
        handleScanProgress(message);
        break;
      case 'analysisResult':
        // 安全地转换为AnalysisResult
        handleAnalysisResult(message as any);
        break;
      case 'scanComplete':
        handleScanComplete(message);
        break;
      case 'scanError':
        handleScanError(message);
        break;
      default:
        break;
    }
  };

  // 处理扫描进度
  const handleScanProgress = (message: WebSocketMessage) => {
    const { status, message: msg, phase, result } = message;
    setScanStatus(`${status}: ${msg}`);

    if (phase === 'crawl' && status === 'crawled') {
      // 爬取完成
      const totalFetched = (result as any)?.totalFetched || 0;
      setProgress(prev => ({ ...prev, total: totalFetched }));
    }
  };

  // 处理AI分析结果
  const handleAnalysisResult = (message: AnalysisResult) => {
    const { taskId: msgTaskId, progress: msgProgress, success } = message;

    // 只处理当前任务的结果
    if (msgTaskId !== taskId) return;

    // 更新进度
    if (msgProgress) {
      setProgress({
        current: msgProgress.current,
        total: msgProgress.total,
        percentage: msgProgress.percentage
      });
    }

    // 添加结果（只在成功时）
    if (success) {
      setResults(prev => [...prev, message]);
    }
  };

  // 处理扫描完成
  const handleScanComplete = (message: WebSocketMessage) => {
    const { taskId: msgTaskId, summary } = message;

    if (msgTaskId === taskId) {
      setScanning(false);
      const summaryData = summary as any;
      const total = summaryData?.total || 0;
      const success = summaryData?.success || 0;
      setScanStatus(`扫描完成！共分析 ${total} 条，成功 ${success} 条`);
      setProgress(prev => ({ ...prev, percentage: 100 }));
    }
  };

  // 处理扫描错误
  const handleScanError = (message: WebSocketMessage) => {
    const { taskId: msgTaskId, error } = message;

    if (msgTaskId === taskId) {
      setScanning(false);
      const errorData = error as any;
      setScanStatus(`扫描出错: ${errorData?.message || '未知错误'}`);
    }
  };

  // 启动扫描
  const handleScan = async () => {
    try {
      setScanning(true);
      setScanStatus('正在启动扫描...');
      setResults([]);
      setProgress({ current: 0, total: 0, percentage: 0 });

      const response = await api.post('/api/tasks/scan', {
        sources: ['hackernews', 'bing', 'sogou', 'google', 'ddg'],
        limit: 20,
        enableAI: true
      });

      if (response.data.success) {
        setTaskId(response.data.taskId);
        setScanStatus('扫描任务已启动，正在爬取数据...');
      } else {
        setScanning(false);
        setScanStatus('启动扫描失败');
      }
    } catch (error: any) {
      console.error('启动扫描失败:', error);
      setScanning(false);
      setScanStatus(`启动失败: ${error.response?.data?.message || error.message}`);
    }
  };

  // 获取验证状态的标签颜色
  const getVerificationTag = (status: string, confidence: number) => {
    switch (status) {
      case 'verified':
        return confidence >= 90 ? 'success' : 'processing';
      case 'unverified':
        return 'default';
      case 'suspicious':
        return 'error';
      case 'unknown':
        return 'warning';
      default:
        return 'default';
    }
  };

  // 获取验证状态文本
  const getVerificationText = (status: string, confidence: number) => {
    switch (status) {
      case 'verified':
        return `✓ 已验证 (${confidence}%)`;
      case 'unverified':
        return '未验证';
      case 'suspicious':
        return '⚠ 可疑';
      case 'unknown':
        return '? 未知';
      default:
        return status;
    }
  };

  return (
    <div>
      {/* WebSocket连接状态 */}
      {!wsConnected && (
        <Alert
          message="WebSocket未连接"
          description="实时通知功能不可用，请刷新页面重试"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 控制面板 */}
      <Card
        title="异步扫描控制"
        extra={
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleScan}
            loading={scanning}
            disabled={!wsConnected}
            size="large"
          >
            {scanning ? '扫描中...' : '启动扫描'}
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* 扫描状态 */}
          {scanStatus && (
            <Alert
              message={scanStatus}
              type={scanning ? 'info' : results.length > 0 ? 'success' : 'warning'}
              showIcon
            />
          )}

          {/* 进度条 */}
          {scanning && progress.total > 0 && (
            <div>
              <div style={{ marginBottom: 8 }}>
                <Progress
                  percent={progress.percentage}
                  status={scanning ? 'active' : 'success'}
                  format={(percent) => `${percent}% (${progress.current}/${progress.total})`}
                />
              </div>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="已分析"
                    value={progress.current}
                    suffix={`/ ${progress.total}`}
                    prefix={<SyncOutlined spin={scanning} />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="验证通过"
                    value={results.filter(r => r.verification.isAuthentic).length}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="待验证"
                    value={results.filter(r => !r.verification.isAuthentic).length}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Col>
              </Row>
            </div>
          )}
        </Space>
      </Card>

      {/* 实时结果 */}
      {results.length > 0 && (
        <Card
          title={`实时分析结果 (${results.length})`}
          style={{ marginTop: 16 }}
        >
          <List
            dataSource={results.slice().reverse()}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      {item.hotspot?.title}
                      <Tag color={getVerificationTag(item.verification.status, item.verification.confidence)}>
                        {getVerificationText(item.verification.status, item.verification.confidence)}
                      </Tag>
                      <Tag color="blue">{item.hotspot?.source}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div>置信度: {item.verification.confidence}% | 级别: {item.verification.level}</div>
                      <Progress
                        percent={item.verification.confidence}
                        size="small"
                        showInfo={false}
                        strokeColor={
                          item.verification.confidence >= 90 ? '#52c41a' :
                          item.verification.confidence >= 70 ? '#faad14' : '#ff4d4f'
                        }
                      />
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* 使用说明 */}
      <Card
        title="使用说明"
        style={{ marginTop: 16 }}
      >
        <Space direction="vertical">
          <div>
            <strong>验证状态说明：</strong>
            <ul>
              <li><Tag color="success">✓ 已验证</Tag> - 内容真实可信，可以直接使用</li>
              <li><Tag color="processing">未验证</Tag> - 需要进一步确认</li>
              <li><Tag color="error">⚠ 可疑</Tag> - 存在虚假信息迹象，建议谨慎使用</li>
              <li><Tag color="warning">? 未知</Tag> - 无法判断，需要进一步调查</li>
            </ul>
          </div>
          <div>
            <strong>注意事项：</strong>
            <ul>
              <li>扫描任务会在后台异步执行，您可以继续操作其他功能</li>
              <li>AI分析结果会实时通过WebSocket推送显示</li>
              <li>分析完成后的热点会自动保存到数据库</li>
              <li>请保持WebSocket连接以接收实时通知</li>
            </ul>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default AsyncScanDashboard;
