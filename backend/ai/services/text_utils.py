# ...existing code...
"""Text processing utilities for AI matching."""
import re
from collections import Counter
from typing import List, Iterable

def _user_text(user):
    """Generate text representation of user for embedding"""
    text_parts = []
    
    # Basic info
    if hasattr(user, 'first_name') and user.first_name:
        text_parts.append(f"Name: {user.first_name}")
    if hasattr(user, 'last_name') and user.last_name:
        text_parts.append(f" {user.last_name}")
    
    # Interests
    try:
        interests = user.userinterest_set.select_related('genSkills_id').all()
        if interests:
            interest_names = [i.genSkills_id.genCateg for i in interests if i.genSkills_id]
            text_parts.append(f"Interests: {', '.join(interest_names)}")
    except:
        pass
    
    # Skills
    try:
        skills = user.userskill_set.select_related('specSkills__genSkills_id').all()
        if skills:
            skill_names = [s.specSkills.specName for s in skills if s.specSkills]
            text_parts.append(f"Skills: {', '.join(skill_names)}")
    except:
        pass
    
    # Location
    if hasattr(user, 'location') and user.location:
        text_parts.append(f"Location: {user.location}")
    
    result = ". ".join(text_parts)
    print(f"📝 User {user.pk} text: '{result}'")
    return result


def _trade_text(trade):
    """Generate text representation of trade for embedding"""
    text_parts = []
    
    # Basic trade info
    if hasattr(trade, 'reqname') and trade.reqname:
        text_parts.append(f"Trade: {trade.reqname}")
    
    if hasattr(trade, 'exchange') and trade.exchange:
        text_parts.append(f"Exchange: {trade.exchange}")
    
    # Category
    if hasattr(trade, 'classified_category') and trade.classified_category:
        text_parts.append(f"Category: {trade.classified_category}")
    
    # Requester info
    if hasattr(trade, 'requester'):
        requester = trade.requester
        if hasattr(requester, 'first_name') and requester.first_name:
            text_parts.append(f"Requester: {requester.first_name}")
        if hasattr(requester, 'location') and requester.location:
            text_parts.append(f"Location: {requester.location}")
    
    result = ". ".join(text_parts)
    print(f"📝 Trade {trade.pk} text: '{result}'")
    return result


def get_first_attr(obj, field_names, default=None):
    """Get first available attribute from a list of possible field names."""
    for field in field_names:
        if hasattr(obj, field):
            val = getattr(obj, field)
            if val is not None:
                return val
    return default

# --- New: simple keyword extractor used by onboarding ---
_STOPWORDS = {
    "the","and","for","with","that","this","from","have","you","your",
    "are","was","were","will","shall","can","could","would","should",
    "a","an","in","on","at","to","of","is","it","as","by","be","or","if",
    "i","me","my","we","our","they","them","their","he","she","his","her",
    "but","so","not","no","yes","do","does","did","about","into","out","up","get"
}

_TOKEN_RE = re.compile(r"[a-zA-Z0-9]+", re.UNICODE)

def _tokenize(text: str) -> Iterable[str]:
    if not text:
        return []
    text = text.lower()
    return _TOKEN_RE.findall(text)

def extract_keywords(text: str, top_n: int = 5) -> List[str]:
    """
    Extract up to top_n keyword tokens from text.
    - Lowercases
    - Removes very short tokens and common stopwords
    - Ranks by frequency
    """
    if not text:
        return []
    tokens = [t for t in _tokenize(text) if len(t) > 2 and t not in _STOPWORDS and not t.isdigit()]
    if not tokens:
        return []
    counts = Counter(tokens)
    keywords = [k for k, _ in counts.most_common(top_n)]
    return keywords

__all__ = ["_user_text", "_trade_text", "get_first_attr", "extract_keywords"]