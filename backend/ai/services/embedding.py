"""
Embedding generation for users and trades using Gemini API
"""
from google import genai
from django.conf import settings
import numpy as np
from typing import Any, Optional

from ai.cache import (
    get_user_embedding,
    set_user_embedding,
    get_trade_embedding,
    set_trade_embedding
)

# Global client instance
_client = None

def _get_client():
    """Lazy load the Gemini client"""
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client

def _extract_embedding(obj: Any) -> Optional[Any]:
    """Robustly extract the raw embedding (list/iterable of floats) from various SDK response shapes."""
    if obj is None:
        return None

    # Already a numpy array / list / tuple of numbers
    if isinstance(obj, (np.ndarray, list, tuple)):
        return obj

    # dict-like responses
    if isinstance(obj, dict):
        if 'values' in obj:
            return obj['values']
        if 'embedding' in obj:
            return obj['embedding']
        if 'embeddings' in obj and obj['embeddings']:
            return _extract_embedding(obj['embeddings'][0])
        if 'data' in obj and obj['data']:
            return _extract_embedding(obj['data'][0])

    # Objects from SDK that expose a .values attribute (ContentEmbedding)
    if hasattr(obj, 'values'):
        try:
            return getattr(obj, 'values')
        except Exception:
            pass

    # If object has .embedding attr
    if hasattr(obj, 'embedding'):
        emb_attr = getattr(obj, 'embedding')
        return _extract_embedding(emb_attr)

    # If object has .data (list-like), inspect first element
    if hasattr(obj, 'data'):
        data = getattr(obj, 'data')
        try:
            if data:
                return _extract_embedding(data[0])
        except Exception:
            # data might be an iterator; attempt to convert
            try:
                first = next(iter(data))
                return _extract_embedding(first)
            except Exception:
                pass

    # If object has .embeddings
    if hasattr(obj, 'embeddings'):
        emb_list = getattr(obj, 'embeddings')
        try:
            if emb_list:
                return _extract_embedding(emb_list[0])
        except Exception:
            pass

    # Fallback: return object itself (caller will handle conversion / error)
    return obj

def _generate_embedding(text: str) -> np.ndarray:
    """
    Generate embedding using Gemini API
    
    Args:
        text: Text to embed
        
    Returns:
        1-D numpy array embedding vector
    """
    client = _get_client()
    # Try older SDK shape first, fallback to newer
    try:
        result = client.models.embed_content(model='models/gemini-embedding-001', contents=text)
    except TypeError:
        result = client.embeddings.create(model='text-embedding-005', input=text)
    except Exception:
        # last-resort attempt (some SDKs differ)
        try:
            result = client.embeddings.create(model='textembedding-gecko-001', input=text)
        except Exception as e:
            raise

    emb = _extract_embedding(result)

    # Attempt to coerce to a 1-D numpy float array
    try:
        arr = np.asarray(emb, dtype=float)
    except Exception:
        # If emb is still an SDK object with .values, try that explicitly
        if hasattr(emb, 'values'):
            arr = np.asarray(list(getattr(emb, 'values')), dtype=float)
        else:
            # If we cannot convert, raise a clearer error
            raise TypeError(f"Unable to convert embedding object to numeric array: {type(emb)}")

    # Normalize shape to 1-D
    if arr.ndim == 0:
        arr = np.atleast_1d(arr)
    elif arr.ndim > 1:
        arr = arr.reshape(-1)
    return arr

def get_user_vec(user_id: int, text_fn):
    """
    Get user embedding vector (cached).
    
    Args:
        user_id: User ID
        text_fn: Function that takes user_id and returns text to embed
        
    Returns:
        numpy array embedding vector or None
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
    
    embedding = _generate_embedding(text)
    
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
        numpy array embedding vector or None
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
    
    embedding = _generate_embedding(text)
    
    # Cache it
    set_trade_embedding(trade_id, embedding)
    
    print(f"✅ Generated trade {trade_id} embedding: {len(embedding)} dimensions")
    return embedding

def _cos(vec1, vec2):
    """Calculate cosine similarity between two vectors"""
    if vec1 is None or vec2 is None:
        return 0.0
    
    # Ensure they're numpy arrays
    v1 = np.array(vec1, dtype=float)
    v2 = np.array(vec2, dtype=float)
    
    # Calculate cosine similarity
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    
    return float(dot_product / (norm_v1 * norm_v2))

class EmbeddingService:
    """
    Lightweight wrapper around the module-level embedding functions.
    Provides common method names that callers often expect.
    """
    def __init__(self):
        pass

    def embed(self, text: str) -> np.ndarray:
        """Return numpy embedding for text (alias)."""
        return _generate_embedding(text)

    # alternative common name
    def generate(self, text: str) -> np.ndarray:
        return _generate_embedding(text)

    # onboarding expects get_embedding(...)
    def get_embedding(self, text: str) -> np.ndarray:
        """Alias used by onboarding service."""
        return _generate_embedding(text)

    # expose cosine similarity with expected name
    def cosine_similarity(self, vec1, vec2) -> float:
        """Alias for cosine similarity used by onboarding."""
        return _cos(vec1, vec2)

    def get_user_vec(self, user_id: int, text_fn):
        """Delegate to module-level get_user_vec."""
        return get_user_vec(user_id, text_fn)

    def get_trade_vec(self, trade_id: int, text_fn):
        """Delegate to module-level get_trade_vec."""
        return get_trade_vec(trade_id, text_fn)

# make explicit export
__all__ = ["EmbeddingService", "get_user_vec", "get_trade_vec"]