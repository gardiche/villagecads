-- Create history tables for complete tracking

-- Alignment score history
CREATE TABLE IF NOT EXISTS alignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  idea_id UUID NOT NULL,
  previous_score INTEGER,
  new_score INTEGER NOT NULL,
  previous_details JSONB,
  new_details JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Gauge history (for individual dimensions)
CREATE TABLE IF NOT EXISTS gauge_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  idea_id UUID NOT NULL,
  gauge_name TEXT NOT NULL,
  previous_value INTEGER,
  new_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attention zones history
CREATE TABLE IF NOT EXISTS attention_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  idea_id UUID NOT NULL,
  label TEXT NOT NULL,
  previous_severity INTEGER,
  new_severity INTEGER,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Micro-commitments history
CREATE TABLE IF NOT EXISTS commitment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  idea_id UUID NOT NULL,
  text TEXT NOT NULL,
  status_before TEXT,
  status_after TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Update journal_entries to support AI responses
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS sender TEXT NOT NULL DEFAULT 'user';
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS ai_context JSONB DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alignment_history_idea ON alignment_history(idea_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gauge_history_idea ON gauge_history(idea_id, gauge_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attention_history_idea ON attention_history(idea_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commitment_history_idea ON commitment_history(idea_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_idea_sender ON journal_entries(idea_id, sender, created_at DESC);

-- Enable RLS
ALTER TABLE alignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gauge_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE attention_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their alignment history"
  ON alignment_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their gauge history"
  ON gauge_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their attention history"
  ON attention_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their commitment history"
  ON commitment_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);