"""AI module configuration - matches actual database field names"""

# Gemini API Configuration
GEMINI_PRO = "gemini-2.5-pro"
GEMINI_FLASH = "gemini-2.5-flash"

# TradeRequest field mappings (from your actual model)
TR_PK_FIELDS = ['tradereq_id', 'id', 'pk']
TR_REQUESTER_FK_FIELDS = ['requester_id', 'requester']
TR_REQDEADLINE_FIELDS = ['reqdeadline', 'deadline']
TR_SERVICE_FIELDS = ['reqname', 'exchange']
TR_BIO_FIELDS = ['exchange', 'reqname', 'description']  # Updated
TR_STATUS_FIELDS = ['status']  # Changed from reqstatus to status

# User field mappings (from your actual model)
USER_LOCATION_FIELDS = ['location']

# User reputation/rating field mappings
USER_AVG_STARS = ['avg_stars', 'average_rating', 'rating']
USER_RATING_COUNT = ['rating_count', 'num_ratings', 'total_ratings']

# Reputation system field mappings
REPUTATION_FIELDS = ['reputation_score', 'score', 'reputation']

# Evaluation field mappings (from your actual Evaluation model)
EVAL_FK_FIELDS = ['trade_request', 'trade_request_id', 'tradereq_id']
EVAL_FIELDS = [
    'taskcomplexity',
    'timecommitment',
    'skilllevel',
    'evaluationdescription',
]

# TradeDetail field mappings
DETAIL_FIELDS = {
    'skillprof': 'skillprof',
    'modedel': 'modedel',
    'reqtype': 'reqtype',
    'reqbio': 'reqbio',
    'contextpic': 'contextpic',
    'total_xp': 'total_xp'
}

# Classifier categories
CATEGORIES = [
    "Creative & Design",
    "Technical & IT",
    "Business & Management",
    "Communication & Interpersonal",
    "Health & Wellness",
    "Education & Training",
    "Home & Lifestyle",
    "Handiwork & Maintenance",
    "Digital & Social Media",
    "Language & Translation",
    "Financial & Accounting",
    "Sports & Fitness",
    "Arts & Performance",
    "Culture & Diversity",
    "Research & Critical Thinking",
    "Other"
]

# Cache settings
CACHE_TIMEOUT = 3600  # 1 hour