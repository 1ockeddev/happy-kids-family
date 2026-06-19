-- Create table for LINE groups
CREATE TABLE IF NOT EXISTS line_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_group_id VARCHAR(255) UNIQUE NOT NULL,
  group_name VARCHAR(500),
  group_type VARCHAR(50) DEFAULT 'group', -- 'group' or 'room'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive'
  picture_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for group members
CREATE TABLE IF NOT EXISTS line_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES line_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
  line_user_id VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  picture_url TEXT,
  role VARCHAR(50) DEFAULT 'member', -- 'member', 'admin', 'owner'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'left'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, line_user_id)
);

-- Create table for group events/messages
CREATE TABLE IF NOT EXISTS line_group_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES line_groups(id) ON DELETE CASCADE,
  line_user_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL, -- 'message', 'join', 'leave', 'memberJoined', 'memberLeft'
  message_type VARCHAR(100), -- 'text', 'image', 'video', 'audio', 'file', 'sticker'
  message_text TEXT,
  message_data JSONB, -- store full event data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_line_groups_line_group_id ON line_groups(line_group_id);
CREATE INDEX IF NOT EXISTS idx_line_groups_status ON line_groups(status);
CREATE INDEX IF NOT EXISTS idx_line_group_members_group_id ON line_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_line_group_members_line_user_id ON line_group_members(line_user_id);
CREATE INDEX IF NOT EXISTS idx_line_group_members_status ON line_group_members(status);
CREATE INDEX IF NOT EXISTS idx_line_group_events_group_id ON line_group_events(group_id);
CREATE INDEX IF NOT EXISTS idx_line_group_events_created_at ON line_group_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_line_group_events_event_type ON line_group_events(event_type);

-- Add comment
COMMENT ON TABLE line_groups IS 'LINE group chats that the bot has joined';
COMMENT ON TABLE line_group_members IS 'Members in each LINE group';
COMMENT ON TABLE line_group_events IS 'Events and messages in LINE groups';
