from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from accounts.models import User, TradeRequest, Report, IdType
from accounts.serializers import IdTypeSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_dashboard_stats(request):
    """
    Get admin dashboard statistics from the database
    """
    try:
        print("=== ADMIN DASHBOARD STATS API CALLED ===")
        
        # Get current date for monthly calculations
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Calculate statistics
        total_users = User.objects.count()
        verified_users = User.objects.filter(is_verified=True).count()
        pending_verifications = User.objects.filter(verification_status="PENDING").count()
        total_reports = Report.objects.count()
        completed_trades = TradeRequest.objects.filter(status="COMPLETED").count()
        active_users_month = User.objects.filter(created_at__gte=start_of_month).count()
        
        print(f"Total Users: {total_users}")
        print(f"Verified Users: {verified_users}")
        print(f"Pending Verifications: {pending_verifications}")
        print(f"Total Reports: {total_reports}")
        print(f"Completed Trades: {completed_trades}")
        print(f"Active Users This Month: {active_users_month}")
        
        stats = {
            "totalUsersRegistered": total_users,
            "verifiedUsers": verified_users,
            "pendingVerifications": pending_verifications,
            "totalReportsSubmitted": total_reports,
            "totalCompletedTrades": completed_trades,
            "activeUsersThisMonth": active_users_month,
        }
        
        print(f"Returning stats: {stats}")
        return Response(stats)
        
    except Exception as e:
        print(f"ERROR in admin_dashboard_stats: {e}")
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_recent_activity(request):
    """
    Get recent activity for admin dashboard
    """
    try:
        # Get recent activities (last 10)
        recent_users = User.objects.order_by('-created_at')[:5]
        recent_trades = TradeRequest.objects.order_by('-created_at')[:3]
        recent_reports = Report.objects.order_by('-created_at')[:2]
        
        activities = []
        
        # Add recent user registrations
        for user in recent_users:
            activities.append({
                "id": f"user_{user.id}",
                "type": "user_registration",
                "message": f"New user '{user.username}' registered",
                "timestamp": user.created_at.strftime("%Y-%m-%d %H:%M"),
                "icon": "Users"
            })
        
        # Add recent trades
        for trade in recent_trades:
            activities.append({
                "id": f"trade_{trade.pk}",
                "type": "trade_created",
                "message": f"New trade '{trade.reqname}' created by {trade.requester.username}",
                "timestamp": trade.created_at.strftime("%Y-%m-%d %H:%M"),
                "icon": "TrendingUp"
            })
        
        # Add recent reports
        for report in recent_reports:
            activities.append({
                "id": f"report_{report.pk}",
                "type": "report_submitted",
                "message": f"Report submitted against user",
                "timestamp": report.created_at.strftime("%Y-%m-%d %H:%M"),
                "icon": "AlertTriangle"
            })
        
        # Sort by timestamp and return last 10
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
    Get list of all users for admin dashboard
    """
    try:
        print("=== ADMIN USERS LIST API CALLED ===")
        
        # Get all users with their verification status
        users = User.objects.all().order_by('-created_at')
        
        users_data = []
        for user in users:
            # Determine verification status
            verification_status = "UNVERIFIED"
            if user.is_verified:
                verification_status = "VERIFIED"
            elif user.userVerifyId:
                verification_status = "PENDING"
            
            users_data.append({
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "created_at": user.created_at.strftime("%b %d, %Y") if user.created_at else "N/A",
                "verification_status": verification_status,
                "is_verified": user.is_verified,
                "userVerifyId": user.userVerifyId,
                "profilePic": user.profilePic,
            })
        
        print(f"Returning {len(users_data)} users")
        return Response({
            "users": users_data,
            "total": len(users_data)
        })
        
    except Exception as e:
        print(f"ERROR in admin_users_list: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def admin_id_types_list(request):
    """
    Get list of all ID types or create a new one
    """
    try:
        if request.method == 'GET':
            print("=== ADMIN ID TYPES LIST API CALLED ===")
            
            # Get all ID types
            id_types = IdType.objects.all().order_by('name')
            serializer = IdTypeSerializer(id_types, many=True)
            
            print(f"Returning {len(id_types)} ID types")
            return Response({
                "id_types": serializer.data,
                "total": len(id_types)
            })
            
        elif request.method == 'POST':
            print("=== CREATE ID TYPE API CALLED ===")
            
            serializer = IdTypeSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                print(f"Created ID type: {serializer.data}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                print(f"Validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        print(f"ERROR in admin_id_types_list: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def admin_id_type_detail(request, id_type_id):
    """
    Get, update, or delete a specific ID type
    """
    try:
        try:
            id_type = IdType.objects.get(id=id_type_id)
        except IdType.DoesNotExist:
            return Response({"error": "ID Type not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'GET':
            print(f"=== GET ID TYPE {id_type_id} API CALLED ===")
            serializer = IdTypeSerializer(id_type)
            return Response(serializer.data)
            
        elif request.method == 'PUT':
            print(f"=== UPDATE ID TYPE {id_type_id} API CALLED ===")
            serializer = IdTypeSerializer(id_type, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                print(f"Updated ID type: {serializer.data}")
                return Response(serializer.data)
            else:
                print(f"Validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        elif request.method == 'DELETE':
            print(f"=== DELETE ID TYPE {id_type_id} API CALLED ===")
            # Check if any users are using this ID type
            users_count = User.objects.filter(id_type=id_type).count()
            if users_count > 0:
                return Response({
                    "error": f"Cannot delete ID type. {users_count} users are currently using this ID type."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            id_type.delete()
            return Response({"message": "ID Type deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        
    except Exception as e:
        print(f"ERROR in admin_id_type_detail: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
