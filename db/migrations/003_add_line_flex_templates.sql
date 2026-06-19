-- Create table for LINE Flex Message templates
CREATE TABLE IF NOT EXISTS line_flex_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_line_flex_templates_name ON line_flex_templates(name);

-- Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_line_flex_templates_created_at ON line_flex_templates(created_at DESC);

-- Insert sample template
INSERT INTO line_flex_templates (name, description, template)
VALUES (
  'Welcome Message',
  'ข้อความต้อนรับสำหรับผู้ใช้ใหม่',
  '{
    "type": "bubble",
    "hero": {
      "type": "image",
      "url": "https://via.placeholder.com/1040x1040",
      "size": "full",
      "aspectRatio": "1:1",
      "aspectMode": "cover"
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "ยินดีต้อนรับ!",
          "weight": "bold",
          "size": "xl",
          "color": "#6366F1"
        },
        {
          "type": "text",
          "text": "Happy Kids Family",
          "size": "md",
          "color": "#64748B",
          "margin": "md"
        },
        {
          "type": "separator",
          "margin": "lg"
        },
        {
          "type": "text",
          "text": "ขอบคุณที่เพิ่มเราเป็นเพื่อน! 🎉",
          "size": "sm",
          "wrap": true,
          "margin": "lg"
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "button",
          "action": {
            "type": "uri",
            "label": "เข้าสู่ระบบ",
            "uri": "https://liff.line.me/YOUR_LIFF_ID"
          },
          "style": "primary",
          "color": "#6366F1"
        }
      ]
    }
  }'::jsonb
)
ON CONFLICT DO NOTHING;
