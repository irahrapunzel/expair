"""
Embedding generation for users and trades
"""
import numpy as np
from sentence_transformers import SentenceTransformer

from ai.cache import (
    get_user_embedding,
    set_user_embedding,
    get_trade_embedding,
    set_trade_embedding
)

# Load model once globally
_model = None

def _get_model():
    """Lazy load the embedding model"""
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def get_user_vec(user_id: int, text_fn):
    """
    Get user embedding vector (cached).
    
    Args:
        user_id: User ID
        text_fn: Function that takes user_id and returns text to embed
        
    Returns:
        numpy array embedding vector
    """
    # Check cache first
    cached = get_user_embedding(user_id)
    if cached is not None:
        print(f"✅ User {user_id} embedding from cache")
        return cached
    
    # Generate new embedding
    text = text_fn(user_id)
    if not text:
        print(f"⚠️ No text for user {user_id}")
        return None
    
    print(f"🔄 Generating embedding for user {user_id}: '{text[:50]}...'")
    
    model = _get_model()
    embedding = model.encode(text)
    
    # Cache it
    set_user_embedding(user_id, embedding)
    
    print(f"✅ Generated user {user_id} embedding: {len(embedding)} dimensions")
    return embedding


def get_trade_vec(trade_id: int, text_fn):
    """
    Get trade embedding vector (cached).
    
    Args:
        trade_id: Trade request ID
        text_fn: Function that takes trade_id and returns text to embed
        
    Returns:
        numpy array embedding vector
    """
    # Check cache first
    cached = get_trade_embedding(trade_id)
    if cached is not None:
        print(f"✅ Trade {trade_id} embedding from cache")
        return cached
    
    # Generate new embedding
    text = text_fn(trade_id)
    if not text:
        print(f"⚠️ No text for trade {trade_id}")
        return None
    
    print(f"🔄 Generating embedding for trade {trade_id}: '{text[:50]}...'")
    
    model = _get_model()
    embedding = model.encode(text)
    
    # Cache it
    set_trade_embedding(trade_id, embedding)
    
    print(f"✅ Generated trade {trade_id} embedding: {len(embedding)} dimensions")
    return embedding


def _cos(vec1, vec2):
    """Calculate cosine similarity between two vectors"""
    if vec1 is None or vec2 is None:
        return 0.0
    
    # Ensure they're numpy arrays
    v1 = np.array(vec1)
    v2 = np.array(vec2)
    
    # Calculate cosine similarity
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    
    return float(dot_product / (norm_v1 * norm_v2))