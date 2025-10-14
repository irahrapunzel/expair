"""
Simple in-memory cache for embeddings
Keeps embeddings consistent across multiple calls
"""
import time
import numpy as np

# Global cache dictionaries
_user_embedding_cache = {}
_trade_embedding_cache = {}

# Cache expiration (in seconds) - 1 hour
CACHE_TTL = 3600

def get_user_embedding(user_id: int):
    """Get cached user embedding"""
    if user_id in _user_embedding_cache:
        embedding, timestamp = _user_embedding_cache[user_id]
        if time.time() - timestamp < CACHE_TTL:
            # Return a copy to prevent modification
            return np.array(embedding) if embedding is not None else None
    return None

def set_user_embedding(user_id: int, embedding):
    """Cache user embedding - ONLY if not None"""
    if embedding is not None:
        # Store as numpy array
        _user_embedding_cache[user_id] = (np.array(embedding), time.time())

def get_trade_embedding(trade_id: int):
    """Get cached trade embedding"""
    if trade_id in _trade_embedding_cache:
        embedding, timestamp = _trade_embedding_cache[trade_id]
        if time.time() - timestamp < CACHE_TTL:
            # Return a copy to prevent modification
            return np.array(embedding) if embedding is not None else None
    return None

def set_trade_embedding(trade_id: int, embedding):
    """Cache trade embedding - ONLY if not None"""
    if embedding is not None:
        # Store as numpy array
        _trade_embedding_cache[trade_id] = (np.array(embedding), time.time())

def clear_cache():
    """Clear all cached embeddings"""
    global _user_embedding_cache, _trade_embedding_cache
    _user_embedding_cache.clear()
    _trade_embedding_cache.clear()
    print("✅ Embedding cache cleared")

def cache_stats():
    """Print cache statistics"""
    print(f"📊 Cache Stats:")
    print(f"   Users cached: {len(_user_embedding_cache)}")
    print(f"   Trades cached: {len(_trade_embedding_cache)}")