from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from accounts.models import User, TradeRequest, Report, UserVerification, VerificationStatus

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_dashboard_stats(request):
    """
    Get statistics for the admin dashboard.
    """
    try:
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # **REVISED QUERIES**
        total_users = User.objects.count()
        
        # Verified users have a verified email AND a verified ID status
        verified_users = User.objects.filter(
            verification__email_verified=True, 
            verification__id_verification_status=VerificationStatus.VERIFIED
        ).count()
        
        # Getting pending verifications from the UserVerification model
        pending_verifications = User.objects.filter(
            verification__id_verification_status=VerificationStatus.PENDING
        ).count()
        
        total_reports = Report.objects.count()
        completed_trades = TradeRequest.objects.filter(status="COMPLETED").count()
        active_users_month = User.objects.filter(created_at__gte=start_of_month).count()
        
        stats = {
            "totalUsersRegistered": total_users,
            "verifiedUsers": verified_users,
            "pendingVerifications": pending_verifications,
            "totalReportsSubmitted": total_reports,
            "totalCompletedTrades": completed_trades,
            "activeUsersThisMonth": active_users_month,
        }
        
        return Response(stats)
        
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_recent_activity(request):
    """
    Get recent activity for the admin dashboard.
    """
    try:
        recent_users = User.objects.order_by('-created_at')[:5]
        recent_trades = TradeRequest.objects.order_by('-created_at')[:3]
        recent_reports = Report.objects.order_by('-created_at')[:2]
        
        activities = []
        
        for user in recent_users:
            activities.append({
                "id": f"user_{user.id}",
                "type": "user_registration",
                "message": f"New user '{user.username}' registered",
                "timestamp": user.created_at.strftime("%Y-%m-%d %H:%M"),
                "icon": "Users"
            })
        
        for trade in recent_trades:
            activities.append({
                "id": f"trade_{trade.pk}",
                "type": "trade_created",
                "message": f"New trade '{trade.reqname}' created by {trade.requester.username}",
                "timestamp": trade.created_at.strftime("%Y-%m-%d %H:%M"),
                "icon": "TrendingUp"
            })
        
        for report in recent_reports:
            activities.append({
                "id": f"report_{report.pk}",
                "type": "report_submitted",
                "message": f"Report submitted against user",
                "timestamp": report.created_at.strftime("%Y-%m-%d %H:%M"),
                "icon": "AlertTriangle"
            })
        
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response(activities[:10])
        
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_users_list(request):
    """
    Get a list of all users for the admin dashboard.
    """
    try:
        # Using select_related for a faster query on the verification object
        users = User.objects.select_related('verification').all().order_by('-created_at')
        
        users_data = []
        for user in users:
            # **REVISED LOGIC**
            # Now using the model properties that fetch data from UserVerification
            users_data.append({
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "created_at": user.created_at.strftime("%b %d, %Y") if user.created_at else "N/A",
                "verification_status": user.verification_status, # This now works correctly
                "is_verified": user.is_verified, # This also works correctly
                "profilePic": user.profilePic,
            })
        
        return Response({
            "users": users_data,
            "total": len(users_data)
        })
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_id_types_list(request):
    """
    List all unique ID types used by users.
    This no longer creates or edits, it just lists.
    """
    try:
        # Getting all distinct (unique) id_type values that are not null or empty
        distinct_id_types = UserVerification.objects.values_list('id_type', flat=True).distinct().exclude(id_type__isnull=True).exclude(id_type__exact='')
        
        # Formatting as a list of dictionaries for the frontend
        id_types_data = [{'name': name} for name in distinct_id_types]
        
        return Response({
            "id_types": id_types_data,
            "total": len(id_types_data)
        })
            
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
