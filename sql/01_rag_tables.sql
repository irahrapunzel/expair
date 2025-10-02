-- Embedding dimension must match env.PGVECTOR_DIM (default 768)
create table if not exists rag_docs (
  doc_id uuid primary key,
  title text,
  tags text
);

create table if not exists rag_chunks (
  doc_id uuid references rag_docs(doc_id) on delete cascade,
  chunk_id uuid primary key,
  content text not null,
  embedding vector(768) not null
);

-- HNSW index for fast ANN
create index if not exists idx_rag_chunks_hnsw on rag_chunks using hnsw (embedding vector_cosine_ops);