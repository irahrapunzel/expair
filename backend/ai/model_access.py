"""Helper functions to access Django models from AI services"""

from django.apps import apps
from typing import Any, Iterable, Optional


def get_model(model_name: str, app_label: str = 'accounts'):
    """
    Get Django model by name.
    
    Args:
        model_name: Name of the model (e.g., 'TradeRequest', 'User')
        app_label: Django app label (default: 'accounts')
    
    Returns:
        Django model class
    
    Examples:
        >>> TradeRequest = get_model('TradeRequest')
        >>> User = get_model('User')
        >>> CustomModel = get_model('CustomModel', app_label='other_app')
    """
    return apps.get_model(app_label, model_name)


def get_first_attr(obj: Any, candidates: Iterable[str], default: Any = None) -> Any:
    """
    Get first available attribute from a list of possible field names.
    
    Args:
        obj: Object to inspect
        candidates: List of possible attribute names to check
        default: Default value if none found
    
    Returns:
        Value of first found attribute, or default
    
    Examples:
        >>> # Try multiple field names for trade ID
        >>> trade_id = get_first_attr(trade, ['tradereq_id', 'id', 'pk'])
        >>> # Try multiple field names for user location
        >>> location = get_first_attr(user, ['location', 'city', 'address'], 'Unknown')
    """
    for candidate in candidates:
        if hasattr(obj, candidate):
            val = getattr(obj, candidate)
            if val is not None:
                return val
    return default


def set_first_attr(obj: Any, candidates: Iterable[str], value: Any) -> Optional[str]:
    """
    Set first available attribute from a list of possible field names.
    
    Args:
        obj: Object to modify
        candidates: List of possible attribute names to try
        value: Value to set
    
    Returns:
        Name of the attribute that was set, or None if none found
    
    Examples:
        >>> # Set trade deadline using first available field
        >>> field_set = set_first_attr(trade, ['reqdeadline', 'deadline'], new_date)
        >>> print(f"Set field: {field_set}")
    """
    for candidate in candidates:
        if hasattr(obj, candidate):
            setattr(obj, candidate, value)
            return candidate
    return None


def model_exists(model_name: str, app_label: str = 'accounts') -> bool:
    """
    Check if a model exists in the given app.
    
    Args:
        model_name: Name of the model
        app_label: Django app label (default: 'accounts')
    
    Returns:
        True if model exists, False otherwise
    
    Examples:
        >>> if model_exists('TradeRequest'):
        ...     TradeRequest = get_model('TradeRequest')
    """
    try:
        apps.get_model(app_label, model_name)
        return True
    except LookupError:
        return False


def get_all_models(app_label: str = 'accounts') -> dict:
    """
    Get all models from a Django app.
    
    Args:
        app_label: Django app label (default: 'accounts')
    
    Returns:
        Dictionary mapping model names to model classes
    
    Examples:
        >>> models = get_all_models('accounts')
        >>> print(models.keys())
        dict_keys(['User', 'TradeRequest', 'TradeDetail', ...])
    """
    try:
        app_config = apps.get_app_config(app_label)
        return {model.__name__: model for model in app_config.get_models()}
    except LookupError:
        return {}