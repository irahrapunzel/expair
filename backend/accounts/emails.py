from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.core.mail import send_mail
from django.conf import settings
import random

def generate_otp():
    """Generate 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_otp_email(email, otp_code):
    """Send OTP verification email"""
    subject = "Expair - Verify Your Email"
    message = f"""
    Hello,
    
    Your verification code is: {otp_code}
    
    This code will expire in 90 seconds.
    
    If you didn't request this, please ignore this email.
    
    Best regards,
    Expair Team
    """
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )
    
def send_support_emails(ticket):
    """
    Sends:
     - confirmation to ticket_email (user)
     - notification to SUPPORT_INBOX (support team)
    Ticket is the model instance (support ticket).
    """
    ticket_ref = f"TICKET-{ticket.ticket_id}"  # or however you prefer
    # Build reply-to alias (requires your mail system supports plus-addressing)
    reply_alias = f"{settings.SUPPORT_INBOUND_ALIAS_PREFIX}ticket{ticket.ticket_id}@{settings.EMAIL_HOST_USER.split('@')[-1]}"
    # Example: support+ticket123@your-domain.com

    # Common context
    ctx = {
        "ticket_id": ticket.ticket_id,
        "ticket_ref": ticket_ref,
        "name": ticket.ticket_name,
        "email": ticket.ticket_email,
        "title": ticket.ticket_title,
        "desc": ticket.ticket_desc,
        "reply_alias": reply_alias,
    }

    # ---- send confirmation to user ----
    subject_user = f"[{ticket_ref}] We received your support request"
    text_user = render_to_string("emails/support_confirmation.txt", ctx)
    html_user = render_to_string("emails/support_confirmation.html", ctx)

    msg_user = EmailMultiAlternatives(
        subject_user,
        text_user,
        settings.DEFAULT_FROM_EMAIL,
        [ticket.ticket_email],
        headers={"Reply-To": reply_alias},
    )
    msg_user.attach_alternative(html_user, "text/html")
    msg_user.send(fail_silently=False)

    # ---- send notification to support inbox ----
    subject_support = f"[{ticket_ref}] New support request from {ticket.ticket_name or ticket.ticket_email}"
    text_support = render_to_string("emails/support_notification.txt", ctx)
    html_support = render_to_string("emails/support_notification.html", ctx)

    msg_support = EmailMultiAlternatives(
        subject_support,
        text_support,
        settings.DEFAULT_FROM_EMAIL,
        [settings.SUPPORT_INBOX],
        headers={"Reply-To": ticket.ticket_email},  # make it easy for agent to reply to user
    )
    msg_support.attach_alternative(html_support, "text/html")
    msg_support.send(fail_silently=False)
