-- Add Template Message (Buttons) sample to line_flex_templates
-- This demonstrates that the system supports both Flex Messages and Template Messages

-- Insert Buttons Template sample
INSERT INTO line_flex_templates (name, description, template)
VALUES (
  'Daily Report Button',
  'Template Message แบบ buttons สำหรับเปิด Daily Report',
  '{
    "type": "template",
    "altText": "กดเพื่อดู Daily Report",
    "template": {
      "type": "buttons",
      "thumbnailImageUrl": "https://happy-kids-family.vercel.app/favicon.png",
      "imageAspectRatio": "square",
      "imageSize": "contain",
      "imageBackgroundColor": "#F6B1F3",
      "title": "Happy Kids Family",
      "text": "ดูรายงานประจำวันของลูกน้อย",
      "actions": [
        {
          "type": "uri",
          "label": "Daily Report",
          "uri": "https://miniapp.line.me/2009973794-LiM7FUcn"
        }
      ]
    }
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Insert Confirm Template sample
INSERT INTO line_flex_templates (name, description, template)
VALUES (
  'Confirm Template',
  'Template Message แบบ confirm สำหรับยืนยันการกระทำ',
  '{
    "type": "template",
    "altText": "กรุณายืนยัน",
    "template": {
      "type": "confirm",
      "text": "ต้องการดูรายงานประจำวันหรือไม่?",
      "actions": [
        {
          "type": "uri",
          "label": "ดูรายงาน",
          "uri": "https://miniapp.line.me/2009973794-LiM7FUcn"
        },
        {
          "type": "message",
          "label": "ไว้ทีหลัง",
          "text": "ขอบคุณ"
        }
      ]
    }
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Insert Carousel Template sample
INSERT INTO line_flex_templates (name, description, template)
VALUES (
  'Menu Carousel',
  'Template Message แบบ carousel สำหรับเมนูหลายตัวเลือก',
  '{
    "type": "template",
    "altText": "เลือกเมนู",
    "template": {
      "type": "carousel",
      "columns": [
        {
          "thumbnailImageUrl": "https://via.placeholder.com/1040x1040/4F46E5/FFFFFF?text=Daily+Report",
          "imageBackgroundColor": "#4F46E5",
          "title": "Daily Report",
          "text": "ดูรายงานประจำวัน",
          "actions": [
            {
              "type": "uri",
              "label": "เปิดดู",
              "uri": "https://miniapp.line.me/2009973794-LiM7FUcn"
            }
          ]
        },
        {
          "thumbnailImageUrl": "https://via.placeholder.com/1040x1040/10B981/FFFFFF?text=Attendance",
          "imageBackgroundColor": "#10B981",
          "title": "Attendance",
          "text": "เช็คการเข้าเรียน",
          "actions": [
            {
              "type": "uri",
              "label": "เปิดดู",
              "uri": "https://miniapp.line.me/2009973794-LiM7FUcn"
            }
          ]
        },
        {
          "thumbnailImageUrl": "https://via.placeholder.com/1040x1040/F59E0B/FFFFFF?text=Behavior",
          "imageBackgroundColor": "#F59E0B",
          "title": "Behavior",
          "text": "ดูคะแนนพฤติกรรม",
          "actions": [
            {
              "type": "uri",
              "label": "เปิดดู",
              "uri": "https://miniapp.line.me/2009973794-LiM7FUcn"
            }
          ]
        }
      ]
    }
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE line_flex_templates IS 'Stores both LINE Flex Messages and Template Messages (buttons, confirm, carousel, etc.)';

