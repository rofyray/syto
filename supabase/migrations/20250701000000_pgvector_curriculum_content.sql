/*
  # Enable pgvector and create curriculum_content table

  Replaces Milvus/Zilliz Cloud with Supabase pgvector for curriculum search.
  Stores Ghana curriculum content with structured metadata + vector embeddings.
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Structured curriculum content with embeddings
CREATE TABLE curriculum_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL CHECK (subject IN ('english', 'mathematics')),
  grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 4 AND 6),
  strand TEXT,
  sub_strand TEXT,
  content_standard TEXT,
  learning_indicator TEXT,
  content TEXT NOT NULL,
  element_type TEXT CHECK (element_type IN ('title', 'heading', 'list', 'paragraph', 'objective', 'standard')),
  source TEXT,
  page_number INTEGER,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Structured query indexes
CREATE INDEX curriculum_content_subject_grade_idx ON curriculum_content (subject, grade_level);
CREATE INDEX curriculum_content_strand_idx ON curriculum_content (strand, sub_strand);

-- RLS: Authenticated users can read
ALTER TABLE curriculum_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read curriculum"
  ON curriculum_content FOR SELECT TO authenticated USING (true);

-- Allow service role to insert (for ingestion script)
CREATE POLICY "Service role can insert curriculum"
  ON curriculum_content FOR INSERT TO service_role WITH CHECK (true);

-- RPC function for vector similarity search
CREATE OR REPLACE FUNCTION search_curriculum_content(
  query_embedding vector(1536),
  filter_subject TEXT,
  filter_grade INTEGER,
  match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  subject TEXT,
  grade_level INTEGER,
  strand TEXT,
  sub_strand TEXT,
  element_type TEXT,
  source TEXT,
  page_number INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.content,
    cc.subject,
    cc.grade_level,
    cc.strand,
    cc.sub_strand,
    cc.element_type,
    cc.source,
    cc.page_number,
    1 - (cc.embedding <=> query_embedding) AS similarity
  FROM curriculum_content cc
  WHERE cc.subject = filter_subject
    AND cc.grade_level = filter_grade
  ORDER BY cc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
