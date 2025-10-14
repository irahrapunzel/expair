# accounts/utils.py

from django_otp.plugins.otp_email.models import EmailDevice

def user_has_2fa_enabled(user):
    """Check if user has 2FA enabled."""
    return user.emaildevice_set.filter(confirmed=True).exists()


def get_user_email_device(user, confirmed=None):
    """Get user's email OTP device."""
    filters = {'user': user, 'name': 'default'}
    if confirmed is not None:
        filters['confirmed'] = confirmed
    
    try:
        return EmailDevice.objects.get(**filters)
    except EmailDevice.DoesNotExist:
        return None


def parse_device_info(request):
    """
    Extract device info from request.
    Returns dict with device_name, user_agent, ip_address.
    """
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    ip_address = request.META.get('REMOTE_ADDR', '')
    
    # Simple device name parsing (you can improve this)
    if 'Chrome' in user_agent:
        browser = 'Chrome'
    elif 'Firefox' in user_agent:
        browser = 'Firefox'
    elif 'Safari' in user_agent:
        browser = 'Safari'
    else:
        browser = 'Unknown Browser'
    
    if 'Windows' in user_agent:
        os = 'Windows'
    elif 'Mac' in user_agent:
        os = 'macOS'
    elif 'Linux' in user_agent:
        os = 'Linux'
    elif 'Android' in user_agent:
        os = 'Android'
    elif 'iPhone' in user_agent or 'iPad' in user_agent:
        os = 'iOS'
    else:
        os = 'Unknown OS'
    
    device_name = f"{browser} on {os}"
    
    return {
        'device_name': device_name,
        'user_agent': user_agent,
        'ip_address': ip_address,
    }