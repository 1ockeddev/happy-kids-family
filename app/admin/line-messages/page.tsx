'use client';
import { useState, useEffect } from 'react';
import './styles.css';

interface FlexMessageTemplate {
  id: string;
  name: string;
  description: string;
  template: any;
  created_at: string;
}

interface Recipient {
  id: string;
  label: string;
  type: 'user' | 'group';
  role?: string;
  groupType?: string;
}

export default function LineMessagesPage() {
  const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'webhook'>('send');
  const [templates, setTemplates] = useState<FlexMessageTemplate[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [testUserId, setTestUserId] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [customFlexJson, setCustomFlexJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Template form
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateJson, setTemplateJson] = useState('');

  useEffect(() => {
    loadTemplates();
    loadRecipients();
  }, []);

  useEffect(() => {
    // Filter recipients based on input
    if (testUserId.trim() === '') {
      setFilteredRecipients(recipients);
    } else {
      const search = testUserId.toLowerCase();
      setFilteredRecipients(
        recipients.filter(r => 
          r.id.toLowerCase().includes(search) || 
          r.label.toLowerCase().includes(search)
        )
      );
    }
  }, [testUserId, recipients]);

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/line/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadRecipients = async () => {
    try {
      const res = await fetch('/api/line/recipients');
      if (res.ok) {
        const data = await res.json();
        setRecipients(data.recipients || []);
        setFilteredRecipients(data.recipients || []);
      }
    } catch (error) {
      console.error('Failed to load recipients:', error);
    }
  };

  const selectRecipient = (recipient: Recipient) => {
    setTestUserId(recipient.id);
    setShowRecipientDropdown(false);
  };

  const sendFlexMessage = async () => {
    if (!testUserId) {
      setMessage({ type: 'error', text: 'กรุณาระบุ LINE User ID' });
      return;
    }

    if (!testUserId.trim()) {
      setMessage({ type: 'error', text: 'LINE User ID ไม่ถูกต้อง' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      let flexData;
      
      if (selectedTemplate) {
        const template = templates.find(t => t.id === selectedTemplate);
        if (!template) {
          setMessage({ type: 'error', text: 'ไม่พบ template ที่เลือก' });
          setLoading(false);
          return;
        }
        
        // Handle both string and object format
        if (typeof template.template === 'string') {
          try {
            flexData = JSON.parse(template.template);
          } catch (e) {
            console.error('Failed to parse template:', e);
            setMessage({ type: 'error', text: 'Template JSON ไม่ถูกต้อง' });
            setLoading(false);
            return;
          }
        } else {
          flexData = template.template;
        }
      } else if (customFlexJson) {
        try {
          flexData = JSON.parse(customFlexJson);
        } catch (e) {
          setMessage({ type: 'error', text: 'JSON ไม่ถูกต้อง' });
          setLoading(false);
          return;
        }
      } else {
        setMessage({ type: 'error', text: 'กรุณาเลือก template หรือใส่ JSON' });
        setLoading(false);
        return;
      }

      if (!flexData) {
        setMessage({ type: 'error', text: 'ไม่สามารถอ่านข้อมูล Flex Message ได้' });
        setLoading(false);
        return;
      }

      console.log('Sending flex message:', { userId: testUserId, flexData });

      const res = await fetch('/api/line/send-flex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUserId.trim(),
          flexMessage: flexData
        })
      });

      const result = await res.json();
      console.log('Response:', result);

      if (res.ok) {
        setMessage({ type: 'success', text: 'ส่งข้อความสำเร็จ!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'ส่งข้อความไม่สำเร็จ' });
      }
    } catch (error: any) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: error.message || 'เกิดข้อผิดพลาด' });
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!templateName || !templateJson) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const flexData = JSON.parse(templateJson);
      
      const url = '/api/line/templates';
      const method = editingTemplateId ? 'PUT' : 'POST';
      const body = editingTemplateId
        ? { id: editingTemplateId, name: templateName, description: templateDescription, template: flexData }
        : { name: templateName, description: templateDescription, template: flexData };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await res.json();

      if (res.ok) {
        setMessage({ 
          type: 'success', 
          text: editingTemplateId ? 'อัปเดต template สำเร็จ!' : 'บันทึก template สำเร็จ!' 
        });
        setTemplateName('');
        setTemplateDescription('');
        setTemplateJson('');
        setEditingTemplateId(null);
        loadTemplates();
      } else {
        setMessage({ type: 'error', text: result.error || 'บันทึกไม่สำเร็จ' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'JSON ไม่ถูกต้อง: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const editTemplate = (template: FlexMessageTemplate) => {
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    
    // Handle both string and object format
    const jsonStr = typeof template.template === 'string' 
      ? template.template 
      : JSON.stringify(template.template, null, 2);
    setTemplateJson(jsonStr);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingTemplateId(null);
    setTemplateName('');
    setTemplateDescription('');
    setTemplateJson('');
    setMessage(null);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('ต้องการลบ template นี้?')) return;

    try {
      const res = await fetch(`/api/line/templates?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'ลบ template สำเร็จ!' });
        loadTemplates();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'ลบไม่สำเร็จ' });
    }
  };

  return (
    <div className="line-messages-container">
      <div className="page-header">
        <h1>📱 LINE Flex Messages</h1>
        <p>จัดการ Flex Messages และ Templates สำหรับ LINE Official Account</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="alert-close">×</button>
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          📤 ส่งข้อความ
        </button>
        <button 
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          📋 Templates
        </button>
        <button 
          className={`tab ${activeTab === 'webhook' ? 'active' : ''}`}
          onClick={() => setActiveTab('webhook')}
        >
          🔗 Webhook Info
        </button>
      </div>

      {activeTab === 'send' && (
        <div className="tab-content">
          <div className="card">
            <h2>ส่ง Flex Message</h2>
            
            <div className="form-group" style={{ position: 'relative' }}>
              <label>LINE User ID / Group ID</label>
              <input
                type="text"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                onFocus={() => setShowRecipientDropdown(true)}
                onBlur={() => {
                  // Delay to allow click on dropdown
                  setTimeout(() => setShowRecipientDropdown(false), 200);
                }}
                placeholder="พิมพ์หรือเลือกจากรายการ..."
                className="form-input"
              />
              <small>
                User ID (U...) สำหรับส่งถึงผู้ใช้ หรือ Group ID (C...) สำหรับส่งถึงกลุ่ม
              </small>
              
              {showRecipientDropdown && filteredRecipients.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  marginTop: '4px'
                }}>
                  {filteredRecipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      onClick={() => selectRecipient(recipient)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <span style={{
                        fontSize: '16px',
                        flexShrink: 0
                      }}>
                        {recipient.type === 'user' ? '👤' : '👥'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#1F2937',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {recipient.label}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          fontFamily: 'monospace',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {recipient.id}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: recipient.type === 'user' ? '#DBEAFE' : '#D1FAE5',
                        color: recipient.type === 'user' ? '#1E40AF' : '#065F46',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        {recipient.type === 'user' ? 'USER' : 'GROUP'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>เลือก Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="form-select"
              >
                <option value="">-- เลือก template หรือใส่ custom JSON --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="divider">หรือ</div>

            <div className="form-group">
              <label>Custom Flex Message JSON</label>
              <textarea
                value={customFlexJson}
                onChange={(e) => setCustomFlexJson(e.target.value)}
                placeholder='{"type": "bubble", "body": {...}}'
                className="form-textarea"
                rows={12}
              />
              <small>
                <a 
                  href="https://developers.line.biz/flex-simulator/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  🔗 ใช้ LINE Flex Message Simulator
                </a>
              </small>
            </div>

            <button
              onClick={sendFlexMessage}
              disabled={loading || (!selectedTemplate && !customFlexJson)}
              className="btn btn-primary"
            >
              {loading ? 'กำลังส่ง...' : '📤 ส่งข้อความ'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="tab-content">
          <div className="card">
            <h2>{editingTemplateId ? '✏️ แก้ไข Template' : 'สร้าง Template ใหม่'}</h2>
            
            {editingTemplateId && (
              <div style={{ 
                padding: '12px', 
                background: '#fef3c7', 
                border: '1px solid #fcd34d',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#b45309', fontWeight: 600 }}>
                  🔄 กำลังแก้ไข template
                </span>
                <button
                  onClick={cancelEdit}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid #fcd34d',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            )}
            
            <div className="form-group">
              <label>ชื่อ Template *</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Weekly Schedule"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>คำอธิบาย</label>
              <input
                type="text"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="ตารางกิจกรรมประจำสัปดาห์"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Flex Message JSON *</label>
              <textarea
                value={templateJson}
                onChange={(e) => setTemplateJson(e.target.value)}
                placeholder='{"type": "bubble", "body": {...}}'
                className="form-textarea"
                rows={12}
              />
            </div>

            <button
              onClick={saveTemplate}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'กำลังบันทึก...' : (editingTemplateId ? '💾 อัปเดต Template' : '💾 บันทึก Template')}
            </button>
          </div>

          <div className="card" style={{ marginTop: '20px' }}>
            <h2>Templates ที่บันทึกไว้</h2>
            
            {templates.length === 0 ? (
              <p className="empty-state">ยังไม่มี template</p>
            ) : (
              <div className="templates-list">
                {templates.map(t => (
                  <div key={t.id} className="template-item">
                    <div className="template-info">
                      <h3>{t.name}</h3>
                      {t.description && <p>{t.description}</p>}
                      <small>สร้างเมื่อ: {new Date(t.created_at).toLocaleString('th-TH')}</small>
                    </div>
                    <div className="template-actions">
                      <button
                        onClick={() => editTemplate(t)}
                        className="btn btn-sm"
                        title="แก้ไข"
                      >
                        ✏️ แก้ไข
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTemplate(t.id);
                          setActiveTab('send');
                        }}
                        className="btn btn-sm"
                        title="ใช้"
                      >
                        📤 ใช้
                      </button>
                      <button
                        onClick={() => deleteTemplate(t.id)}
                        className="btn btn-sm btn-danger"
                        title="ลบ"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'webhook' && (
        <div className="tab-content">
          <div className="card">
            <h2>Webhook Configuration</h2>
            
            <div className="info-box">
              <h3>📍 Webhook URL</h3>
              <code className="code-block">
                {typeof window !== 'undefined' ? 
                  `${window.location.origin}/api/webhook/line` : 
                  '/api/webhook/line'
                }
              </code>
              <p>ตั้งค่า Webhook URL นี้ใน LINE Developers Console</p>
            </div>

            <div className="info-box">
              <h3>🔐 Environment Variables Required</h3>
              <ul>
                <li><code>LINE_CHANNEL_SECRET</code> - Channel secret จาก LINE</li>
                <li><code>LINE_CHANNEL_ACCESS_TOKEN</code> - Channel access token</li>
                <li><code>GDRIVE_ACTIVITY_FOLDER_ID</code> - (Optional) Google Drive folder ID</li>
                <li><code>GDRIVE_API_KEY</code> - (Optional) Google Drive API key</li>
              </ul>
            </div>

            <div className="info-box">
              <h3>✅ Webhook Events Supported</h3>
              <ul>
                <li><strong>follow</strong> - เมื่อมีผู้ใช้ add เพื่อน</li>
                <li><strong>unfollow</strong> - เมื่อผู้ใช้บล็อกหรือลบเพื่อน</li>
                <li><strong>message</strong> - เมื่อได้รับข้อความ (ตอบกลับอัตโนมัติสำหรับคำว่า "activity")</li>
              </ul>
            </div>

            <div className="info-box">
              <h3>📚 Resources</h3>
              <ul>
                <li>
                  <a href="https://developers.line.biz/flex-simulator/" target="_blank" rel="noopener noreferrer">
                    LINE Flex Message Simulator
                  </a>
                </li>
                <li>
                  <a href="https://developers.line.biz/en/docs/messaging-api/" target="_blank" rel="noopener noreferrer">
                    LINE Messaging API Documentation
                  </a>
                </li>
                <li>
                  <a href="https://developers.line.biz/en/docs/messaging-api/using-flex-messages/" target="_blank" rel="noopener noreferrer">
                    Flex Message Specification
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
