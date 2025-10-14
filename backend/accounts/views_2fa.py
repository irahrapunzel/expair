from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django_otp.plugins.otp_email.models import EmailDevice
from django_otp.plugins.otp_static.models import StaticDevice, StaticToken
from django.utils import timezone
from .models import TrustedDevice
from .email_2fa import send_2fa_email


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enable_2fa(request):
    """
    PHASE 1: Start 2FA setup
    - Create EmailDevice for user (unconfirmed)
    - Generate and send OTP code
    """
    user = request.user
    
    # Check if user already has 2FA enabled
    if EmailDevice.objects.filter(user=user, confirmed=True).exists():
        return Response({
            'success': False,
            'message': '2FA is already enabled for your account'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Delete any unconfirmed devices from previous attempts
    EmailDevice.objects.filter(user=user, confirmed=False).delete()
    
    # Create new email device (unconfirmed)
    device = EmailDevice.objects.create(
        user=user,
        name='default',
        confirmed=False
    )
    
    # Generate OTP token (django-otp generates the code)
    token = device.generate_challenge()
    
    # Send email with OTP
    try:
        send_2fa_email(
            user_email=user.email,
            token=token,
            action='enable',
            user_name=user.first_name or user.username
        )
        
        return Response({
            'success': True,
            'message': 'Verification code sent to your email'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        # If email fails, clean up the device
        device.delete()
        return Response({
            'success': False,
            'message': f'Failed to send email: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_enable_2fa(request):
    """
    PHASE 1: Verify OTP and enable 2FA
    - Validate the OTP code
    - Mark device as confirmed
    - Generate backup codes
    """
    user = request.user
    code = request.data.get('code')
    
    if not code:
        return Response({
            'success': False,
            'message': 'Verification code is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get unconfirmed email device
    try:
        device = EmailDevice.objects.get(user=user, confirmed=False)
    except EmailDevice.DoesNotExist:
        return Response({
            'success': False,
            'message': 'No pending 2FA setup found. Please start the setup process again.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify the token using django-otp
    if device.verify_token(code):
        # Mark device as confirmed (2FA is now enabled!)
        device.confirmed = True
        device.save()
        
        # Generate 10 backup codes for emergency access
        static_device, created = StaticDevice.objects.get_or_create(
            user=user,
            name='backup',
            defaults={'confirmed': True}
        )
        
        # If device already exists, clear old tokens
        if not created:
            static_device.token_set.all().delete()
        
        backup_codes = []
        for _ in range(10):
            token = StaticToken.random_token()
            static_device.token_set.create(token=token)
            backup_codes.append(token)
        
        return Response({
            'success': True,
            'message': '2FA enabled successfully! Save your backup codes in a safe place.',
            'backup_codes': backup_codes
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'success': False,
            'message': 'Invalid or expired verification code. Please try again.'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    """
    PHASE 5: Start 2FA disable process
    - Send OTP to confirm user identity (security measure)
    """
    user = request.user
    
    # Check if 2FA is enabled
    try:
        device = EmailDevice.objects.get(user=user, confirmed=True)
    except EmailDevice.DoesNotExist:
        return Response({
            'success': False,
            'message': '2FA is not enabled for your account'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate OTP for verification
    token = device.generate_challenge()
    
    # Send email
    try:
        send_2fa_email(
            user_email=user.email,
            token=token,
            action='disable',
            user_name=user.first_name or user.username
        )
        
        return Response({
            'success': True,
            'message': 'Verification code sent to your email'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Failed to send email: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_disable_2fa(request):
    """
    PHASE 5: Verify OTP and disable 2FA
    - Delete EmailDevice (disables 2FA)
    - Delete all TrustedDevices (revoke all trusted devices)
    - Delete backup codes
    """
    user = request.user
    code = request.data.get('code')
    
    if not code:
        return Response({
            'success': False,
            'message': 'Verification code is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        device = EmailDevice.objects.get(user=user, confirmed=True)
    except EmailDevice.DoesNotExist:
        return Response({
            'success': False,
            'message': '2FA is not enabled'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify the token
    if device.verify_token(code):
        # Delete all 2FA related data
        device.delete()  # Removes EmailDevice (disables 2FA)
        TrustedDevice.objects.filter(user=user).delete()  # Revoke all trusted devices
        StaticDevice.objects.filter(user=user).delete()  # Remove backup codes
        
        return Response({
            'success': True,
            'message': '2FA disabled successfully. All trusted devices have been removed.'
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'success': False,
            'message': 'Invalid or expired verification code'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_2fa_status(request):
    """
    Check if user has 2FA enabled
    Returns: { "success": true, "has2FA": true/false }
    """
    user = request.user
    has_2fa = EmailDevice.objects.filter(user=user, confirmed=True).exists()
    
    # Optional: Also return backup codes count
    backup_codes_count = 0
    try:
        static_device = StaticDevice.objects.get(user=user, confirmed=True)
        backup_codes_count = static_device.token_set.count()
    except StaticDevice.DoesNotExist:
        pass
    
    return Response({
        'success': True,
        'has2FA': has_2fa,
        'backup_codes_remaining': backup_codes_count
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_trusted_devices(request):
    """
    PHASE 6: Get list of trusted devices
    """
    user = request.user
    devices = TrustedDevice.objects.filter(user=user).order_by('-last_used_at')
    
    device_list = [{
        'device_id': device.device_id,
        'device_name': device.device_name,
        'ip_address': device.ip_address,
        'last_used_at': device.last_used_at,
        'created_at': device.created_at,
        'expires_at': device.expires_at,
        'is_valid': device.is_valid()
    } for device in devices]
    
    return Response({
        'success': True,
        'devices': device_list,
        'count': len(device_list)
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_trusted_device(request, device_id):
    """
    PHASE 6: Remove a trusted device
    Next time that device logs in, OTP will be required again
    """
    user = request.user
    
    try:
        device = TrustedDevice.objects.get(device_id=device_id, user=user)
        device_name = device.device_name
        device.delete()
        
        return Response({
            'success': True,
            'message': f'Device "{device_name}" removed successfully'
        }, status=status.HTTP_200_OK)
        
    except TrustedDevice.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Device not found or you do not have permission to remove it'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_2fa_code(request):
    """
    Resend OTP code during setup or disable process
    Works for both confirmed and unconfirmed devices
    """
    user = request.user
    action = request.data.get('action', 'verify')  # 'enable', 'disable', or 'verify'
    
    try:
        # Try to get unconfirmed device (during setup)
        device = EmailDevice.objects.get(user=user, confirmed=False)
        email_action = 'enable'
    except EmailDevice.DoesNotExist:
        # Try confirmed device (during disable)
        try:
            device = EmailDevice.objects.get(user=user, confirmed=True)
            email_action = action if action in ['enable', 'disable'] else 'verify'
        except EmailDevice.DoesNotExist:
            return Response({
                'success': False,
                'message': 'No 2FA device found. Please start the setup process.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate new token
    token = device.generate_challenge()
    
    # Send email
    try:
        send_2fa_email(
            user_email=user.email,
            token=token,
            action=email_action,
            user_name=user.first_name or user.username
        )
        
        return Response({
            'success': True,
            'message': 'New verification code sent to your email'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Failed to send email: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_new_backup_codes(request):
    """
    Generate new backup codes (regenerate if user runs out)
    This will invalidate all old backup codes
    """
    user = request.user
    
    # Check if 2FA is enabled
    if not EmailDevice.objects.filter(user=user, confirmed=True).exists():
        return Response({
            'success': False,
            'message': '2FA must be enabled to generate backup codes'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get or create static device
    static_device, created = StaticDevice.objects.get_or_create(
        user=user,
        name='backup',
        defaults={'confirmed': True}
    )
    
    # Delete all old tokens
    static_device.token_set.all().delete()
    
    # Generate 10 new backup codes
    backup_codes = []
    for _ in range(10):
        token = StaticToken.random_token()
        static_device.token_set.create(token=token)
        backup_codes.append(token)
    
    return Response({
        'success': True,
        'message': 'New backup codes generated. Old codes are now invalid.',
        'backup_codes': backup_codes
    }, status=status.HTTP_200_OK)