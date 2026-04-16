import React, { useEffect, useState } from 'react';
import { Modal, Progress, Steps, List, Tag, Spin, Statistic, Row, Col, Alert, Button, Result } from 'antd';
import {
  CheckCircleOutlined,
  LoadingOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

const { Step } = Steps;

interface ScanProgressModalProps {
  visible: boolean;
  taskId?: string;
  onClose: () => void;
  onComplete?: (summary: ScanSummary) => void;
  // 新增：接收外部传入的任务状态
  taskStatus?: {
    status: string;
    progress?: {
      total: number;
      saved: number;
      crawled: number;
      analyzed: number;
      percentage?: number;
    };
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

interface ProgressData {
  status: string;
  message: string;
  phase?: string;
  result?: {
    totalFetched?: number;
    totalUnique?: number;
    saved?: number;
    crawled?: number;
    skipped?: number;
    sources?: Array<{ name: string; count: number; success: boolean }>;
  };
}

interface AnalysisResult {
  hotspot: {
    id: string;
    title: string;
    source: string;
  };
  verification: {
    status: string;
    isAuthentic: boolean;
    confidence: number;
    level: string;
  };
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  success: boolean;
}

const ScanProgressModal: React.FC<ScanProgressModalProps> = ({
  visible,
  taskId,
  onClose,
  onComplete
}) => {
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  // WebSocket连接状态
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!visible || !taskId) return;

    // 重置状态
    setCurrentPhase(0);
    setProgressData(null);
    setAnalysisResults([]);
    setScanSummary(null);
    setIsComplete(false);
    setWsConnected(false);

    // 立即从API获取当前状态，确保显示最新进度
    const fetchCurrentStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001/api/tasks/scan/${taskId}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.success && data.data) {
          console.log('[扫描进度] 获取当前状态:', data.data);
          const status = data.data;

          // 根据当前状态设置进度
          setProgressData({
            status: status.status,
            message: getTaskStatusMessage(status.status),
            phase: status.status,
            result: {
              totalFetched: status.progress?.total || 0,
              saved: status.progress?.saved || 0,
              crawled: status.progress?.crawled || 0
            }
          });

          // 设置当前阶段
          switch (status.status) {
            case 'started':
              setCurrentPhase(0);
              break;
            case 'crawling':
              setCurrentPhase(1);
              break;
            case 'crawled':
              setCurrentPhase(2);
              break;
            case 'saved':
              setCurrentPhase(3);
              break;
            case 'analyzing':
              setCurrentPhase(4);
              break;
            case 'completed':
              setCurrentPhase(5);
              setIsComplete(true);
              break;
            case 'failed':
              setCurrentPhase(-1);
              setIsComplete(true);
              break;
          }
        }
      } catch (error) {
        console.error('[扫描进度] 获取当前状态失败:', error);
      }
    };

    // 获取当前状态
    fetchCurrentStatus();

    // 然后连接WebSocket接收后续更新
    const token = localStorage.getItem('token');
    const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id || 'unknown';

    const wsUrl = `ws://localhost:5001/ws?userId=${userId}&token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[扫描进度] WebSocket连接成功');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[扫描进度] 收到消息:', message);

        switch (message.type) {
          case 'connected':
            console.log('[扫描进度] WebSocket已连接');
            break;

          case 'scanProgress':
            handleScanProgress(message);
            break;

          case 'analysisResult':
            handleAnalysisResult(message);
            break;

          case 'scanComplete':
            handleScanComplete(message);
            break;

          case 'scanError':
            handleScanError(message);
            break;
        }
      } catch (error) {
        console.error('[扫描进度] 消息解析失败:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[扫描进度] WebSocket错误:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      console.log('[扫描进度] WebSocket连接关闭');
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [visible, taskId]);

  // 获取任务状态消息
  const getTaskStatusMessage = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': '任务已创建，等待开始',
      'started': '扫描已启动',
      'crawling': '正在爬取数据...',
      'crawled': '数据爬取完成',
      'saved': '数据已保存',
      'analyzing': 'AI分析中...',
      'completed': '扫描完成',
      'failed': '扫描失败'
    };
    return statusMap[status] || status;
  };

  const handleScanProgress = (message: any) => {
    setProgressData(message);

    // 更新阶段
    switch (message.status) {
      case 'started':
        setCurrentPhase(0);
        break;
      case 'crawling':
        setCurrentPhase(1);
        break;
      case 'crawled':
        setCurrentPhase(2);
        break;
      case 'saved':
        setCurrentPhase(3);
        break;
      case 'analyzing':
        setCurrentPhase(4);
        break;
    }
  };

  const handleAnalysisResult = (message: any) => {
    setAnalysisResults(prev => [...prev, message]);
  };

  const handleScanComplete = (message: any) => {
    console.log('[扫描进度] 扫描完成:', message);
    setScanSummary(message.summary);
    setIsComplete(true);
    setCurrentPhase(5);

    if (onComplete) {
      onComplete(message.summary);
    }

    // 3秒后自动关闭
    setTimeout(() => {
      onClose();
    }, 5000);
  };

  const handleScanError = (message: any) => {
    console.error('[扫描进度] 扫描错误:', message);
    setIsComplete(true);
    setCurrentPhase(-1); // 错误状态
  };

  // 获取阶段进度百分比
  const getPhaseProgress = () => {
    if (!progressData) return 0;

    switch (progressData.status) {
      case 'started':
        return 10;
      case 'crawling':
        return 30;
      case 'crawled':
        return 50;
      case 'saved':
        return 70;
      case 'analyzing':
        if (analysisResults.length > 0) {
          const latest = analysisResults[analysisResults.length - 1];
          return 70 + (latest.progress.percentage * 0.3);
        }
        return 75;
      default:
        return 0;
    }
  };

  // 获取当前阶段文本
  const getPhaseText = () => {
    if (isComplete && scanSummary) {
      return '扫描完成！';
    }
    if (!progressData) return '准备中...';
    return progressData.message || '处理中...';
  };

  // 格式化持续时间
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}分${remainingSeconds}秒`
      : `${remainingSeconds}秒`;
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isComplete ? (
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
          ) : (
            <LoadingOutlined spin style={{ color: '#1890ff', fontSize: '20px' }} />
          )}
          <span>{isComplete ? '扫描完成' : '正在扫描...'}</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {isComplete ? '关闭' : '后台运行'}
        </Button>,
        isComplete && (
          <Button
            key="refresh"
            type="primary"
            onClick={() => window.location.reload()}
          >
            刷新数据
          </Button>
        )
      ]}
      width={700}
      closable={!isComplete}
      maskClosable={false}
    >
      {/* 扫描完成结果 */}
      {isComplete && scanSummary ? (
        <Result
          status="success"
          title="扫描完成！"
          subTitle={getPhaseText()}
          extra={[
            <Row gutter={16} key="stats">
              <Col span={8}>
                <Statistic
                  title="爬取总数"
                  value={scanSummary.crawled || scanSummary.total}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="新增热点"
                  value={scanSummary.success}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="重复跳过"
                  value={scanSummary.skipped || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          ]}
        />
      ) : (
        /* 扫描进度 */
        <div>
          {/* 总体进度 */}
          <div style={{ marginBottom: 24 }}>
            <Progress
              percent={Math.round(getPhaseProgress())}
              status={isComplete ? 'success' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <Tag color={wsConnected ? 'success' : 'error'}>
                {wsConnected ? '● 已连接' : '● 未连接'}
              </Tag>
              <span style={{ marginLeft: 8, color: '#666' }}>{getPhaseText()}</span>
            </div>
          </div>

          {/* 步骤显示 */}
          <Steps current={currentPhase} size="small" style={{ marginBottom: 24 }}>
            <Step title="启动" icon={<ThunderboltOutlined />} />
            <Step title="爬取" icon={<DatabaseOutlined />} />
            <Step title="保存" icon={<ClockCircleOutlined />} />
            <Step title="分析" icon={<RobotOutlined />} />
            <Step title="完成" icon={<CheckCircleOutlined />} />
          </Steps>

          {/* 详细进度信息 */}
          {progressData?.result && (
            <Alert
              message={
                <div>
                  {progressData.result.totalFetched !== undefined && (
                    <div>📊 爬取总数: <strong>{progressData.result.totalFetched}</strong> 条</div>
                  )}
                  {progressData.result.saved !== undefined && (
                    <div>✅ 新增保存: <strong>{progressData.result.saved}</strong> 条</div>
                  )}
                  {progressData.result.skipped !== undefined && (
                    <div>⏭️ 重复跳过: <strong>{progressData.result.skipped}</strong> 条</div>
                  )}
                </div>
              }
              type="info"
              style={{ marginBottom: 16 }}
            />
          )}

          {/* AI分析结果列表 (显示最新5条) */}
          {analysisResults.length > 0 && (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#333' }}>
                AI分析进度 ({analysisResults.length} 条已完成)
              </div>
              <List
                size="small"
                dataSource={analysisResults.slice(-5).reverse()}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <div style={{ fontSize: '13px' }}>
                          {item.hotspot.title.substring(0, 40)}...
                        </div>
                      }
                      description={
                        <div>
                          <Tag color={item.verification.confidence >= 70 ? 'success' : 'warning'}>
                            {item.verification.status}
                          </Tag>
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            可信度: {item.verification.confidence}% | 来源: {item.hotspot.source}
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          {/* 分析总进度 */}
          {analysisResults.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Progress
                percent={analysisResults[analysisResults.length - 1].progress.percentage}
                size="small"
                status="active"
                format={(percent) => `${percent}% (${analysisResults.length}条)`}
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ScanProgressModal;
