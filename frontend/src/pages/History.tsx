import React, { useEffect, useState } from 'react';
import { Card, List, Typography, Tag, Space, Button, Empty, DatePicker, Select, Row, Col, Statistic, Progress, Input, Modal, message } from 'antd';
import { HistoryOutlined, FireOutlined, SearchOutlined, FilterOutlined, CalendarOutlined, EyeOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import api from '../utils/axios';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Hotspot {
  _id: string;
  title: string;
  content: string;
  source: string;
  url?: string;
  publishedAt: string;
  confidence: number;
  keywords: string[];
  verified: boolean;
  createdAt: string;
}

const History: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [filtered, setFiltered] = useState<Hotspot[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [keywordFilter, setKeywordFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'confidence'>('date');
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    avgConfidence: 0
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [hotspots, dateRange, keywordFilter, sortBy]);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/api/content/hotspots');
      const data = Array.isArray(response.data) ? response.data : [];
      setHotspots(data);

      // 计算统计数据
      const verified = data.filter((h: Hotspot) => h.verified).length;
      const avgConfidence = data.length > 0
        ? Math.round(data.reduce((sum: number, h: Hotspot) => sum + h.confidence, 0) / data.length)
        : 0;

      setStats({
        total: data.length,
        verified,
        avgConfidence
      });
    } catch (error) {
      console.error('获取历史记录失败:', error);
      setHotspots([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...hotspots];

    // 日期过滤
    if (dateRange) {
      result = result.filter(h => {
        const date = dayjs(h.publishedAt);
        return date.isAfter(dateRange[0]) && date.isBefore(dateRange[1]);
      });
    }

    // 关键词过滤
    if (keywordFilter) {
      result = result.filter(h =>
        h.keywords.some(k => k.toLowerCase().includes(keywordFilter.toLowerCase()))
      );
    }

    // 排序
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return dayjs(b.publishedAt).unix() - dayjs(a.publishedAt).unix();
      } else {
        return b.confidence - a.confidence;
      }
    });

    setFiltered(result);
  };

  const handleDelete = async (_id: string) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这条热点记录吗？删除后无法恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/api/content/hotspots/${_id}`);
          message.success('删除成功');
          setHotspots(hotspots.filter(h => h._id !== _id));
        } catch (error) {
          console.error('删除失败:', error);
          message.error('删除失败，请重试');
        }
      }
    });
  };

  const handleViewDetail = (item: Hotspot) => {
    setSelectedHotspot(item);
    setDetailVisible(true);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return '#52c41a';
    if (confidence >= 70) return '#fa8c16';
    return '#ff4d4f';
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      'TechCrunch': '#ff6b6b',
      'VentureBeat': '#4ecdc4',
      'Hacker News': '#ff6348',
      'GitHub': '#24292e',
      'Medium': '#121212',
    };
    return colors[source] || '#1890ff';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <div className="loader" style={{
          width: 60,
          height: 60,
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #1890ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        padding: '24px',
        borderRadius: '12px',
        color: 'white',
        marginBottom: 24
      }}>
        <Title level={3} style={{ color: 'white', marginBottom: 8 }}>
          <HistoryOutlined style={{ marginRight: 8 }} />
          历史热点记录
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
          查看所有已发现的热点内容和历史数据
        </Text>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="总热点数"
              value={stats.total}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="已验证"
              value={stats.verified}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <Statistic
              title="平均置信度"
              value={stats.avgConfidence}
              suffix="%"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          marginBottom: 24
        }}
      >
        <Space size="middle" style={{ marginBottom: 16 }}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
            placeholder={['开始日期', '结束日期']}
          />
          <Select
            style={{ width: 120 }}
            value={sortBy}
            onChange={setSortBy}
            options={[
              { label: '按日期', value: 'date' },
              { label: '按置信度', value: 'confidence' },
            ]}
          />
          <Input
            placeholder="筛选关键词"
            prefix={<SearchOutlined />}
            value={keywordFilter}
            onChange={(e) => setKeywordFilter(e.target.value)}
            style={{ width: 200 }}
          />
          <Button icon={<FilterOutlined />} onClick={applyFilters}>
            应用筛选
          </Button>
        </Space>
      </Card>

      {filtered.length === 0 ? (
        <Card
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">暂无历史记录</Text>
                <br />
                <Text type="secondary">开始监控关键词后，热点数据将显示在这里</Text>
              </div>
            }
          />
        </Card>
      ) : (
        <List
          dataSource={filtered}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '20px',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                marginBottom: '12px',
                background: 'white',
                transition: 'all 0.3s ease'
              }}
              actions={[
                <Button
                  key="view"
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDetail(item)}
                  style={{ color: '#1890ff' }}
                >
                  查看详情
                </Button>,
                <Button
                  key="delete"
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(item._id)}
                  style={{ color: '#ff4d4f' }}
                />
              ]}
            >
              <List.Item.Meta
                title={
                  <div>
                    <Text strong style={{ fontSize: '16px', color: '#333' }}>
                      {item.title}
                    </Text>
                    {item.verified && (
                      <Tag color="success" style={{ marginLeft: 8 }}>
                        ✓ 已验证
                      </Tag>
                    )}
                    <div style={{ marginTop: 4 }}>
                      <Progress
                        percent={item.confidence}
                        size="small"
                        showInfo={false}
                        strokeColor={getConfidenceColor(item.confidence)}
                      />
                    </div>
                  </div>
                }
                description={
                  <div>
                    <Space size="middle" style={{ marginBottom: 8 }}>
                      <Tag color={getSourceColor(item.source)}>
                        {item.source}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        {dayjs(item.publishedAt).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    </Space>
                    <div style={{ marginTop: 8, color: '#666' }}>
                      {item.content.substring(0, 150)}...
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

      {/* 详情Modal */}
      <Modal
        title="热点详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          selectedHotspot?.url && (
            <Button
              key="original"
              type="link"
              onClick={() => window.open(selectedHotspot.url, '_blank')}
            >
              查看原文
            </Button>
          ),
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedHotspot && (
          <div>
            <Title level={4}>{selectedHotspot.title}</Title>
            <Space size="middle" style={{ marginBottom: 16 }}>
              <Tag color={getSourceColor(selectedHotspot.source)}>
                {selectedHotspot.source}
              </Tag>
              {selectedHotspot.verified && (
                <Tag color="success">✓ 已验证</Tag>
              )}
              <Text type="secondary">
                {dayjs(selectedHotspot.publishedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
            </Space>
            <div style={{ marginBottom: 16 }}>
              <Text strong>置信度: </Text>
              <Progress
                percent={selectedHotspot.confidence}
                strokeColor={getConfidenceColor(selectedHotspot.confidence)}
                style={{ width: 200 }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>关键词: </Text>
              <div style={{ marginTop: 8 }}>
                {selectedHotspot.keywords.map((keyword, index) => (
                  <Tag key={index} color="blue" style={{ marginRight: 8 }}>
                    {keyword}
                  </Tag>
                ))}
              </div>
            </div>
            <div>
              <Text strong>内容摘要: </Text>
              <div style={{
                marginTop: 8,
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 8
              }}>
                <Text>{selectedHotspot.content}</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default History;
