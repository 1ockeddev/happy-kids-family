-- Create user_analytics table for tracking user behavior
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(50) NOT NULL, -- 'page_view', 'click', 'navigation'
  page_path VARCHAR(255) NOT NULL, -- '/summary-behavior', '/admin/children', etc.
  
  -- Navigation tracking
  from_path VARCHAR(255), -- Previous page
  to_path VARCHAR(255),   -- Next page (for navigation events)
  
  -- Click tracking
  element_type VARCHAR(100), -- 'button', 'link', 'tab', etc.
  element_label VARCHAR(255), -- Button text, link text, etc.
  
  -- Time tracking
  duration_seconds INTEGER, -- Time spent on page (for page_view events)
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Session tracking
  session_id VARCHAR(100), -- Browser session ID
  
  -- Device/Browser info (optional)
  user_agent TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_timestamp ON user_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_page_path ON user_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_user_analytics_session_id ON user_analytics(session_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_timestamp ON user_analytics(user_id, timestamp DESC);

COMMENT ON TABLE user_analytics IS 'User behavior analytics and tracking';
COMMENT ON COLUMN user_analytics.event_type IS 'Type of event: page_view, click, navigation';
COMMENT ON COLUMN user_analytics.duration_seconds IS 'Time spent on page in seconds (for page_view events)';
