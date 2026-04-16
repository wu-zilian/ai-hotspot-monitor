import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Input, Button, List, Tag, Space, Typography, Modal, message, Empty, Tooltip, Progress, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ThunderboltOutlined, FireOutlined, SearchOutlined, FilterOutlined, SettingOutlined, BarChartOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../utils/axios';

const { Title, Text } = Typography;

interface Keyword {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Keywords: React.FC = () => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<Keyword | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });
  const [searchText, setSearchText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    try {
      const response = await api.get('/api/keywords');
      // 确保 response.data 是数组，如果不是则使用空数组
      const data = Array.isArray(response.data) ? response.data : [];
      setKeywords(data);
    } catch (error) {
      message.error('获取关键词失败');
      setKeywords([]); // 出错时设置为空数组
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingKeyword(null);
    setFormData({ name: '', description: '', isActive: true });
    setModalVisible(true);
  };

  const handleEdit = (keyword: Keyword) => {
    setEditingKeyword(keyword);
    setFormData({
      name: keyword.name,
      description: keyword.description || '',
      isActive: keyword.isActive
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    // 表单验证
    if (!formData.name.trim()) {
      message.warning('请输入关键词名称');
      return;
    }

    if (formData.name.trim().length < 2) {
      message.warning('关键词名称至少需要2个字符');
      return;
    }

    try {
      if (editingKeyword) {
        await api.put(`/api/keywords/${editingKeyword._id}`, formData);
        message.success('关键词更新成功');
      } else {
        await api.post('/api/keywords', formData);
        message.success('关键词添加成功');
      }

      setModalVisible(false);
      fetchKeywords();
    } catch (error) {
      message.error('操作失败，请重试');
    }
  };

  const handleDelete = async (_id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个关键词吗？',
      onOk: async () => {
        try {
          await api.delete(`/api/keywords/${_id}`);
          message.success('关键词删除成功');
          fetchKeywords();
        } catch (error) {
          message.error('删除失败，请重试');
        }
      }
    });
  };

  const filteredKeywords = keywords.filter(k =>
    k.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const activeCount = keywords.filter(k => k.isActive).length;

  // 触发扫描
  const handleScan = async () => {
    if (activeCount === 0) {
      message.warning('请先添加并启用至少一个关键词');
      return;
    }

    setScanning(true);
    setScanStatus('正在启动扫描...');

    try {
      message.loading({ content: '正在扫描热点...', key: 'scan', duration: 0 });

      const response = await api.post('/api/tasks/scan', {
        sources: ['hackernews', 'bing', 'sogou'],
        limit: 20,
        includeWechat: false,
        includeHotTrends: true
      });

      message.success({ content: `扫描完成！获取 ${response.data.saved || 0} 条新热点`, key: 'scan', duration: 3 });

      if (response.data.errors && response.data.errors.length > 0) {
        console.warn('部分信息源扫描失败:', response.data.errors);
      }

      setScanStatus(`扫描完成！获取 ${response.data.saved || 0} 条新热点`);

      // 3秒后清除状态
      setTimeout(() => setScanStatus(''), 3000);
    } catch (error: any) {
      console.error('扫描失败:', error);
      const errorMsg = error.response?.data?.message || '扫描失败，请重试';
      message.error({ content: errorMsg, key: 'scan', duration: 3 });
      setScanStatus(`扫描失败: ${errorMsg}`);
    } finally {
      setScanning(false);
    }
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
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '24px',
              borderRadius: '12px',
              color: 'white',
              marginBottom: 24
            }}>
              <Title level={3} style={{ color: 'white', marginBottom: 16 }}>
                <ThunderboltOutlined style={{ marginRight: 8 }} />
                关键词管理
              </Title>
              <Space size="large">
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                    总关键词: <Text strong style={{ fontSize: '20px', color: 'white' }}>{keywords.length}</Text>
                  </Text>
                </div>
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                    活跃监控: <Text strong style={{ fontSize: '20px', color: '#52c41a' }}>{activeCount}</Text>
                  </Text>
                </div>
                <div style={{ flex: 1 }} />
                <Button
                  type="primary"
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={handleScan}
                  loading={scanning}
                  disabled={activeCount === 0}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    height: 48
                  }}
                >
                  {scanning ? '扫描中...' : '立即扫描'}
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    height: 48
                  }}
                >
                  添加关键词
                </Button>
              </Space>
            </div>
          </Col>
        </Row>

        <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="搜索关键词..."
              prefix={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ borderRadius: '8px' }}
            />
          </div>

          {filteredKeywords.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text type="secondary">还没有添加关键词</Text>
                  <br />
                  <Text type="secondary">点击"添加关键词"按钮开始监控</Text>
                </div>
              }
            />
          ) : (
            <List
              dataSource={filteredKeywords}
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
                    <Tooltip title="编辑">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(item)}
                        style={{ color: '#1890ff' }}
                      />
                    </Tooltip>,
                    <Tooltip title="删除">
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(item._id)}
                        style={{ color: '#ff4d4f' }}
                      />
                    </Tooltip>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 48,
                        height: 48,
                        background: item.isActive ? '#52c41a' : '#d9d9d9',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        {item.isActive ? <FireOutlined /> : <SettingOutlined />}
                      </div>
                    }
                    title={
                      <div>
                        <Text strong style={{ fontSize: '16px', color: '#333' }}>{item.name}</Text>
                        {item.isActive && (
                          <Tag color="success" style={{ marginLeft: 8, marginTop: 4 }}>
                            监控中
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div>
                        {item.description && (
                          <Text type="secondary" style={{ marginBottom: 8 }}>
                            {item.description}
                          </Text>
                        )}
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            创建时间: {new Date(item.createdAt).toLocaleString()}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        {scanStatus && (
          <Alert
            message={scanStatus}
            type={scanStatus.includes('失败') ? 'error' : 'success'}
            showIcon
            closable
            onClose={() => setScanStatus('')}
            style={{ marginTop: 16 }}
          />
        )}

        <Modal
          title={editingKeyword ? '编辑关键词' : '添加关键词'}
          open={modalVisible}
          onOk={handleSubmit}
          onCancel={() => setModalVisible(false)}
          okText={editingKeyword ? '保存' : '添加'}
          cancelText="取消"
          width={600}
        >
          <div style={{ padding: '24px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ fontSize: '14px', color: '#333' }}>
                关键词名称 *
              </Text>
              <Input
                size="large"
                placeholder="输入要监控的关键词"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ marginTop: 8, borderRadius: '8px' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ fontSize: '14px', color: '#333' }}>
                描述
              </Text>
              <Input.TextArea
                rows={4}
                placeholder="描述这个关键词的用途（可选）"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ marginTop: 8, borderRadius: '8px' }}
              />
            </div>

            <div>
              <Text strong style={{ fontSize: '14px', color: '#333' }}>
                状态
              </Text>
              <div style={{ marginTop: 8 }}>
                <Tag
                  color={formData.isActive ? 'success' : 'default'}
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  style={{ cursor: 'pointer', padding: '8px 16px', fontSize: '14px' }}
                >
                  {formData.isActive ? '✓ 已启用' : '○ 已暂停'}
                </Tag>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Keywords;