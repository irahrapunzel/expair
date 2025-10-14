# accounts/email_2fa.py

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings


def send_2fa_email(user_email, token, action='login', user_name=None):
    """
    Universal function to send 2FA OTP emails.
    
    Args:
        user_email: User's email address
        token: OTP code (6 digits)
        action: 'enable', 'login', 'disable', or 'verify'
        user_name: Optional user's first name for personalization
    """
    
    # Subject based on action
    subjects = {
        'enable': 'Enable Two-Factor Authentication',
        'login': 'Your Login Verification Code',
        'disable': 'Disable Two-Factor Authentication',
        'verify': 'Your Expair Verification Code',
    }
    
    subject = subjects.get(action, 'Your Expair Verification Code')
    
    # Context for templates
    context = {
        'user_name': user_name or 'there',
        'token': token,
        'action': action,
        'validity_minutes': 10,  # OTP valid for 10 minutes
    }
    
    try:
        # Render templates
        text_content = render_to_string('accounts/emails/2fa_otp.txt', context)
        html_content = render_to_string('accounts/emails/2fa_otp.html', context)
        
        # Create email
        msg = EmailMultiAlternatives(
            subject,
            text_content,
            settings.DEFAULT_FROM_EMAIL,
            [user_email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        
        return True
    except Exception as e:
        print(f"❌ Error sending 2FA email: {e}")
        raise


# Optional: Keep backward compatibility with your existing code
def send_2fa_enable_email(user, token):
    """Backward compatibility - Enable 2FA"""
    return send_2fa_email(user.email, token, 'enable', user.first_name)


def send_2fa_login_email(user, token):
    """Backward compatibility - Login verification"""
    return send_2fa_email(user.email, token, 'login', user.first_name)


def send_2fa_disable_email(user, token):
    """Backward compatibility - Disable 2FA"""
    return send_2fa_email(user.email, token, 'disable', user.first_name)