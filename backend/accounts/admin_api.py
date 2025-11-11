from django.utils import timezone
from django.db.models import Count, Avg, Q, F, Sum, Case, When, IntegerField, Value
from django.db.models.functions import TruncMonth, Coalesce
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import traceback

try:
    import pytz
except ImportError:
    pytz = None

from accounts.models import (
    User, TradeRequest, TradeDetail, ReputationSystem, 
    Report, Conversation, Message, UserVerification, VerificationStatus
)

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_dashboard_stats(request):
    """
    GET /api/admin/dashboard-stats/
    Returns key statistics for admin dashboard.
    """
    try:
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        total_users = User.objects.count()
        
        verified_users = UserVerification.objects.filter(
            email_verified=True, 
            id_verification_status=VerificationStatus.VERIFIED
        ).count()
        
        pending_verifications = UserVerification.objects.filter(
            id_verification_status=VerificationStatus.PENDING
        ).count()
        
        total_reports = Report.objects.count()
        pending_reports = Report.objects.filter(status='PENDING').count()
        
        completed_trades = TradeRequest.objects.filter(status="COMPLETED").count()
        active_users_month = User.objects.filter(created_at__gte=start_of_month).count()

        flagged_user_ids = Report.objects.filter(
            status='PENDING'
        ).values_list('reported_user_id', flat=True).distinct()
        
        flagged_users = User.objects.filter(id__in=list(flagged_user_ids)).count()
        
        stats = {
            "totalUsersRegistered": total_users,
            "verifiedUsers": verified_users,
            "pendingVerifications": pending_verifications,
            "flaggedUsers": flagged_users,
            "totalReportsSubmitted": total_reports,
            "pendingReports": pending_reports,
            "totalCompletedTrades": completed_trades,
            "activeUsersThisMonth": active_users_month,
        }
        
        return Response(stats)
        
    except Exception as e:
        print(f"❌ Error in admin_dashboard_stats: {str(e)}")
        print(traceback.format_exc())
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_trade_stats(request):
    """
    GET /api/admin/trade-stats/
    Returns comprehensive trade statistics with trends.
    """
    try:
        # Current period stats
        total_trades = TradeRequest.objects.count()
        completed_trades = TradeRequest.objects.filter(status='COMPLETED').count()
        active_trades = TradeRequest.objects.filter(status='ACTIVE').count()
        pending_trades = TradeRequest.objects.filter(status='PENDING').count()
        
        # ✅ FIX: Use timezone-aware datetime
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # ✅ FIX: Properly calculate last month start (timezone-aware)
        if current_month_start.month == 1:
            last_month_start = current_month_start.replace(year=current_month_start.year - 1, month=12)
        else:
            last_month_start = current_month_start.replace(month=current_month_start.month - 1)
        
        # Current month counts
        current_completed = TradeRequest.objects.filter(
            status='COMPLETED',
            created_at__gte=current_month_start
        ).count()
        
        current_active = TradeRequest.objects.filter(
            status='ACTIVE',
            created_at__gte=current_month_start
        ).count()
        
        current_pending = TradeRequest.objects.filter(
            status='PENDING',
            created_at__gte=current_month_start
        ).count()
        
        current_total = TradeRequest.objects.filter(
            created_at__gte=current_month_start
        ).count()
        
        # Last month counts
        last_completed = TradeRequest.objects.filter(
            status='COMPLETED',
            created_at__gte=last_month_start,
            created_at__lt=current_month_start
        ).count()
        
        last_active = TradeRequest.objects.filter(
            status='ACTIVE',
            created_at__gte=last_month_start,
            created_at__lt=current_month_start
        ).count()
        
        last_pending = TradeRequest.objects.filter(
            status='PENDING',
            created_at__gte=last_month_start,
            created_at__lt=current_month_start
        ).count()
        
        last_total = TradeRequest.objects.filter(
            created_at__gte=last_month_start,
            created_at__lt=current_month_start
        ).count()
        
        # Calculate percentage changes
        def calc_trend(current, previous):
            if previous == 0:
                if current == 0:
                    return {"value": "0%", "is_up": False, "is_neutral": True}
                return {"value": "+100%", "is_up": True, "is_neutral": False}
            change = ((current - previous) / previous) * 100
            return {
                "value": f"{'+' if change >= 0 else ''}{change:.1f}%",
                "is_up": change > 0,
                "is_neutral": abs(change) < 1
            }
        
        trends = {
            'total_trades': calc_trend(current_total, last_total),
            'completed_trades': calc_trend(current_completed, last_completed),
            'active_trades': calc_trend(current_active, last_active),
            'pending_trades': calc_trend(current_pending, last_pending)
        }
        
        # Monthly breakdown (last 6 months)
        six_months_ago = current_month_start - timedelta(days=180)
        
        monthly_trades = TradeRequest.objects.filter(
            created_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            trade_count=Count('tradereq_id'),
            completed_count=Count('tradereq_id', filter=Q(status='COMPLETED'))
        ).order_by('-month')
        
        # Format monthly data with ratings and user counts
        monthly_data = []
        for entry in monthly_trades:
            month_start = entry['month']
            month_end = (month_start + timedelta(days=32)).replace(day=1)
            
            # Get unique users (both requesters and responders)
            requesters = TradeRequest.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end
            ).values_list('requester_id', flat=True).distinct()
            
            responders = TradeRequest.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end,
                responder__isnull=False
            ).values_list('responder_id', flat=True).distinct()
            
            unique_users = len(set(list(requesters) + list(responders)))
            
            # ✅ FIX: Calculate average rating from BOTH requester and responder ratings
            completed_trade_ids = TradeRequest.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end,
                status='COMPLETED'
            ).values_list('tradereq_id', flat=True)
            
            # Get both requester and responder star counts
            reputations = ReputationSystem.objects.filter(
                trade_request_id__in=completed_trade_ids
            )
            
            all_ratings = []
            for rep in reputations:
                if rep.requester_starcount:
                    all_ratings.append(rep.requester_starcount)
                if rep.responder_starcount:
                    all_ratings.append(rep.responder_starcount)
            
            avg_rating = sum(all_ratings) / len(all_ratings) if all_ratings else 0.0
            
            monthly_data.append({
                'month': month_start.strftime('%B %Y'),
                'trades': entry['trade_count'],
                'completed': entry['completed_count'],
                'active_users': unique_users,
                'avg_rating': float(avg_rating)
            })
        
        print(f"✅ Trade stats calculated successfully - {len(monthly_data)} months")
        
        return Response({
            'success': True,
            'total_trades': total_trades,
            'completed_trades': completed_trades,
            'active_trades': active_trades,
            'pending_trades': pending_trades,
            'trends': trends,
            'monthly_breakdown': monthly_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error in admin_trade_stats: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_top_traders(request):
    """
    GET /api/admin/top-traders/
    Returns top traders ranked by completed trade count.
    """
    try:
        limit = int(request.GET.get('limit', 10))
        
        # ✅ FIX: Use correct related_name from models
        users_with_trades = User.objects.annotate(
            completed_as_requester=Count(
                'trade_requests_made',  # ✅ Correct related_name
                filter=Q(trade_requests_made__status='COMPLETED'),
                distinct=True
            ),
            completed_as_responder=Count(
                'trade_requests_received',  # ✅ Correct related_name
                filter=Q(trade_requests_received__status='COMPLETED'),
                distinct=True
            )
        ).annotate(
            total_completed=F('completed_as_requester') + F('completed_as_responder')
        ).filter(
            total_completed__gt=0
        )
        
        # Sort by completed trades, then by average rating
        top_traders = users_with_trades.order_by(
            '-total_completed',
            F('avgStars').desc(nulls_last=True)  # ✅ Correct field name
        )[:limit]
        
        traders_data = []
        for user in top_traders:
            # ✅ Count ratings from ReputationSystem
            rating_count = ReputationSystem.objects.filter(
                Q(trade_request__requester_id=user.id) | 
                Q(trade_request__responder_id=user.id)
            ).count()
            
            traders_data.append({
                'user_id': user.id,
                'username': user.username,
                'completed_trades': int(user.total_completed),
                'rating': float(user.avgStars) if user.avgStars else 0.0,
                'rating_count': rating_count,
                'level': int(user.level) if user.level else 1,
                'total_xp': int(user.tot_XpPts) if user.tot_XpPts else 0,  # ✅ Correct field name
                'profile_pic': user.profilePic if user.profilePic else '/assets/defaultavatar.png'  # ✅ Correct field name
            })
        
        print(f"✅ Top traders calculated: {len(traders_data)} traders")
        
        return Response({
            'success': True,
            'top_traders': traders_data,
            'count': len(traders_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error in admin_top_traders: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET']) 
@permission_classes([AllowAny])
def admin_recent_activity(request):
    """
    GET /api/admin/recent-activity/
    Returns recent system activity for admin dashboard.
    """
    try:
        limit = int(request.GET.get('limit', 10))
        
        # ✅ GMT+8 timezone for Philippines
        manila_tz = pytz.timezone('Asia/Manila') if pytz else None
        
        activities = []
        
        # ensure we request at least one item from each source when limit is small
        user_slice = max(1, limit // 2)
        trade_slice = max(1, limit // 2)
        report_slice = max(1, limit // 3)
        
        # Recent user registrations
        recent_users = User.objects.order_by('-created_at')[:user_slice]
        for user in recent_users:
            # ✅ Ensure created_at is timezone-aware
            created_at_aware = user.created_at
            if timezone.is_naive(created_at_aware):
                created_at_aware = timezone.make_aware(created_at_aware, timezone.utc)
            
            # Convert to Manila time if pytz available
            if manila_tz:
                created_at_manila = created_at_aware.astimezone(manila_tz)
                timestamp = created_at_manila.strftime('%B %d, %Y • %I:%M:%S %p (GMT+8)')
            else:
                timestamp = created_at_aware.strftime('%B %d, %Y • %I:%M:%S %p')
            
            activities.append({
                'type': 'user_registered',
                'timestamp': timestamp,
                'description': f"{user.username} joined EXPAIR",
                'user_id': user.id,
                'sort_date': created_at_aware  # ✅ Always timezone-aware
            })
        
        # Recent completed trades
        recent_trades = TradeRequest.objects.filter(
            status='COMPLETED'
        ).select_related('requester', 'responder').order_by('-created_at')[:trade_slice]
        
        for trade in recent_trades:
            # ✅ Ensure created_at is timezone-aware
            created_at_aware = trade.created_at
            if timezone.is_naive(created_at_aware):
                created_at_aware = timezone.make_aware(created_at_aware, timezone.utc)
            
            if manila_tz:
                created_at_manila = created_at_aware.astimezone(manila_tz)
                timestamp = created_at_manila.strftime('%B %d, %Y • %I:%M:%S %p (GMT+8)')
            else:
                timestamp = created_at_aware.strftime('%B %d, %Y • %I:%M:%S %p')
            
            requester_name = trade.requester.username if trade.requester else "Unknown"
            responder_name = trade.responder.username if trade.responder else "Unknown"
            
            activities.append({
                'type': 'trade_completed',
                'timestamp': timestamp,
                'description': f"{requester_name} completed a trade with {responder_name}",
                'trade_id': trade.tradereq_id,
                'sort_date': created_at_aware  # ✅ Always timezone-aware
            })
        
        # Recent reports
        recent_reports = Report.objects.select_related(
            'reporter', 'reported_user'
        ).order_by('-created_at')[:report_slice]
        
        for report in recent_reports:
            # ✅ Ensure created_at is timezone-aware
            created_at_aware = report.created_at
            if timezone.is_naive(created_at_aware):
                created_at_aware = timezone.make_aware(created_at_aware, timezone.utc)
            
            if manila_tz:
                created_at_manila = created_at_aware.astimezone(manila_tz)
                timestamp = created_at_manila.strftime('%B %d, %Y • %I:%M:%S %p (GMT+8)')
            else:
                timestamp = created_at_aware.strftime('%B %d, %Y • %I:%M:%S %p')
            
            activities.append({
                'type': 'report_submitted',
                'timestamp': timestamp,
                'description': f"New report against {report.reported_user.username if report.reported_user else 'Unknown'}",
                'report_id': report.report_id,
                'sort_date': created_at_aware  # ✅ Always timezone-aware
            })
        
        # ✅ Sort by datetime (all are now timezone-aware)
        activities.sort(key=lambda x: x['sort_date'], reverse=True)
        
        # Remove sort_date before returning
        for activity in activities:
            del activity['sort_date']
        
        print(f"✅ Recent activity calculated: {len(activities[:limit])} activities")
        
        return Response({
            'success': True,
            'activities': activities[:limit],
            'count': len(activities[:limit])
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error in admin_recent_activity: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_user_stats(request):
    """
    GET /api/admin/user-stats/
    Returns user statistics with month-over-month trends.
    """
    try:
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        
        # Current counts
        total_users = User.objects.count()
        
        verified_users = UserVerification.objects.filter(
            email_verified=True, 
            id_verification_status=VerificationStatus.VERIFIED
        ).count()
        
        current_pending = UserVerification.objects.filter(
            id_verification_status=VerificationStatus.PENDING
        ).count()
        
        # ✅ FIX: Use 'status' field instead of 'is_resolved'
        current_flagged_ids = Report.objects.filter(
            status='PENDING'
        ).values_list('reported_user_id', flat=True).distinct()
        current_flagged = User.objects.filter(id__in=list(current_flagged_ids)).count()
        
        # Last month counts
        last_month_total = User.objects.filter(
            created_at__lt=current_month_start
        ).count()
        
        last_month_verified = UserVerification.objects.filter(
            email_verified=True,
            id_verification_status=VerificationStatus.VERIFIED,
            user__created_at__lt=current_month_start
        ).count()
        
        last_pending = UserVerification.objects.filter(
            id_verification_status=VerificationStatus.PENDING,
            user__created_at__gte=last_month_start,
            user__created_at__lt=current_month_start
        ).count()
        
        # ✅ FIX: Last month flagged users
        last_flagged_ids = Report.objects.filter(
            status='PENDING',
            created_at__gte=last_month_start,
            created_at__lt=current_month_start
        ).values_list('reported_user_id', flat=True).distinct()
        last_flagged = User.objects.filter(id__in=list(last_flagged_ids)).count()
        
        # Calculate trends
        def calc_trend(current, previous):
            if previous == 0:
                if current == 0:
                    return {"value": "0%", "is_up": False, "is_neutral": True}
                return {"value": "+100%", "is_up": True, "is_neutral": False}
            change = ((current - previous) / previous) * 100
            return {
                "value": f"{'+' if change >= 0 else ''}{change:.1f}%",
                "is_up": change > 0,
                "is_neutral": abs(change) < 1
            }
        
        stats = {
            "totalUsersRegistered": total_users,
            "verifiedUsers": verified_users,
            "pendingVerifications": current_pending,
            "flaggedUsers": current_flagged,
            "trends": {
                "total_users": calc_trend(total_users, last_month_total),
                "verified_users": calc_trend(verified_users, last_month_verified),
                "pending_verifications": calc_trend(current_pending, last_pending),
                "flagged_users": calc_trend(current_flagged, last_flagged)
            }
        }
        
        print(f"✅ User stats calculated successfully")
        
        return Response(stats)
        
    except Exception as e:
        print(f"❌ Error in admin_user_stats: {str(e)}")
        print(traceback.format_exc())
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_users_list(request):
    """
    GET /api/admin/users-list/
    Returns paginated list of users with filters and search.
    """
    try:
        search_query = request.GET.get('search', '').strip()
        verification_filter = request.GET.get('verification', 'all').lower()
        flagged_filter = request.GET.get('flagged', 'false').lower() == 'true'
        sort_by = request.GET.get('sort', 'joined')
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        print(f"📊 admin_users_list called - page={page}, search='{search_query}', verification={verification_filter}, flagged={flagged_filter}")
        
        # ✅ FIX: Simpler base query without complex annotations
        users = User.objects.all()
        
        # Apply search filter first (most restrictive)
        if search_query:
            users = users.filter(
                Q(username__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query)
            )
            print(f"🔍 After search filter: {users.count()} users")
        
        # Verification filtering
        if verification_filter == 'verified':
            verified_user_ids = UserVerification.objects.filter(
                email_verified=True,
                id_verification_status=VerificationStatus.VERIFIED
            ).values_list('user_id', flat=True)
            users = users.filter(id__in=list(verified_user_ids))
            print(f"✅ After verified filter: {users.count()} users")
        elif verification_filter == 'pending':
            pending_user_ids = UserVerification.objects.filter(
                id_verification_status=VerificationStatus.PENDING
            ).values_list('user_id', flat=True)
            users = users.filter(id__in=list(pending_user_ids))
            print(f"⏳ After pending filter: {users.count()} users")
        elif verification_filter == 'unverified':
            verified_or_pending_ids = UserVerification.objects.filter(
                id_verification_status__in=[VerificationStatus.VERIFIED, VerificationStatus.PENDING]
            ).values_list('user_id', flat=True)
            users = users.exclude(id__in=list(verified_or_pending_ids))
            print(f"❌ After unverified filter: {users.count()} users")
        
        # ✅ FIX: Flagged filter - use 'status' field
        if flagged_filter:
            flagged_user_ids = Report.objects.filter(
                status='PENDING'
            ).values_list('reported_user_id', flat=True).distinct()
            users = users.filter(id__in=list(flagged_user_ids))
            print(f"🚩 After flagged filter: {users.count()} users")
        
        # Sorting
        if sort_by == 'joined':
            users = users.order_by('-created_at')
        elif sort_by == 'name':
            users = users.order_by('username')
        elif sort_by == 'email':
            users = users.order_by('email')
        elif sort_by == 'rating':
            users = users.order_by(F('avgStars').desc(nulls_last=True))
        elif sort_by == 'level':
            users = users.order_by(F('level').desc(nulls_last=True))
        
        # Get total before pagination
        total_count = users.count()
        print(f"📊 Total users after all filters: {total_count}")
        
        # Pagination
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        users_page = users[start_idx:end_idx]
        
        print(f"📄 Fetching users {start_idx} to {end_idx}")
        
        # ✅ FIX: Calculate stats per user (slower but more reliable)
        users_data = []
        for user in users_page:
            try:
                # Calculate completed trades
                completed_as_requester = TradeRequest.objects.filter(
                    requester=user,
                    status='COMPLETED'
                ).count()
                
                completed_as_responder = TradeRequest.objects.filter(
                    responder=user,
                    status='COMPLETED'
                ).count()
                
                completed_trades = completed_as_requester + completed_as_responder
                
                # Get verification status
                try:
                    verification = UserVerification.objects.get(user_id=user.id)
                    if verification.email_verified and verification.id_verification_status == VerificationStatus.VERIFIED:
                        verification_status = 'verified'
                    elif verification.id_verification_status == VerificationStatus.PENDING:
                        verification_status = 'pending'
                    else:
                        verification_status = 'unverified'
                except UserVerification.DoesNotExist:
                    verification_status = 'unverified'
                
                # ✅ FIX: Count active reports using 'status' field
                active_reports_count = Report.objects.filter(
                    reported_user=user,
                    status='PENDING'
                ).count()
                
                # Count ratings from ReputationSystem
                rating_count = ReputationSystem.objects.filter(
                    Q(trade_request__requester_id=user.id) | 
                    Q(trade_request__responder_id=user.id)
                ).count()
                
                users_data.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name or '',
                    'last_name': user.last_name or '',
                    'profile_pic': user.profilePic or '/assets/defaultavatar.png',
                    'created_at': user.created_at.isoformat() if user.created_at else None,
                    'level': user.level or 1,
                    'total_xp': user.tot_XpPts or 0,
                    'rating': float(user.avgStars) if user.avgStars else None,
                    'rating_count': rating_count,
                    'completed_trades': completed_trades,
                    'verification_status': verification_status,
                    'active_reports_count': active_reports_count,
                    'location': user.location or '',
                    'nationality': user.nationality or ''
                })
                
            except Exception as user_error:
                print(f"⚠️ Error processing user {user.id}: {str(user_error)}")
                print(traceback.format_exc())
                # Continue with other users
                continue
        
        print(f"✅ Successfully serialized {len(users_data)} users")
        
        return Response({
            'success': True,
            'users': users_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_count,
                'total_pages': (total_count + per_page - 1) // per_page
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error in admin_users_list: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_trade_details(request):
    """
    GET /api/admin/trade-details/
    Returns paginated list of trades with filtering.
    """
    try:
        status_filter = request.GET.get('status')
        user_id = request.GET.get('user_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        trades = TradeRequest.objects.select_related(
            'requester', 'responder'
        ).order_by('-created_at')
        
        if status_filter:
            trades = trades.filter(status=status_filter.upper())
        
        if user_id:
            trades = trades.filter(
                Q(requester__id=user_id) | Q(responder__id=user_id)
            )
        
        if start_date:
            trades = trades.filter(created_at__gte=start_date)
        
        if end_date:
            trades = trades.filter(created_at__lte=end_date)
        
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        total_count = trades.count()
        trades_page = trades[start_idx:end_idx]
        
        trades_data = []
        for trade in trades_page:
            # Calculate total XP
            trade_details = TradeDetail.objects.filter(trade_request=trade)
            total_xp = sum(detail.total_xp for detail in trade_details if detail.total_xp)
            
            # Get ratings if completed
            requester_rating = None
            responder_rating = None
            
            if trade.status == 'COMPLETED':
                try:
                    reputation = ReputationSystem.objects.get(trade_request=trade)
                    # Average both ratings
                    ratings = []
                    if reputation.requester_starcount:
                        ratings.append(reputation.requester_starcount)
                    if reputation.responder_starcount:
                        ratings.append(reputation.responder_starcount)
                    requester_rating = sum(ratings) / len(ratings) if ratings else None
                except ReputationSystem.DoesNotExist:
                    pass
            
            trades_data.append({
                'tradereq_id': trade.tradereq_id,
                'reqname': trade.reqname,
                'status': trade.status,
                'requester': {
                    'user_id': trade.requester.id,
                    'username': trade.requester.username,
                    'profile_pic': trade.requester.profilePic or '/assets/defaultavatar.png'
                },
                'responder': {
                    'user_id': trade.responder.id,
                    'username': trade.responder.username,
                    'profile_pic': trade.responder.profilePic or '/assets/defaultavatar.png'
                } if trade.responder else None,
                'deadline': trade.reqdeadline.isoformat() if trade.reqdeadline else None,
                'created_at': trade.created_at.isoformat(),
                'total_xp': total_xp,
                'rating': requester_rating
            })
        
        return Response({
            'success': True,
            'trades': trades_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_count,
                'total_pages': (total_count + per_page - 1) // per_page
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error in admin_trade_details: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_reports_list(request):
    """
    GET /api/admin/reports-list/
    Returns paginated list of reports with filters.
    """
    try:
        search_query = request.GET.get('search', '').strip()
        status_filter = request.GET.get('status', 'all').lower()
        category_filter = request.GET.get('category', 'all').lower()
        sort_by = request.GET.get('sort', 'newest')
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        reports = Report.objects.select_related(
            'reporter', 'reported_user'
        ).order_by('-created_at')
        
        # Apply filters
        if search_query:
            reports = reports.filter(
                Q(reporter__username__icontains=search_query) |
                Q(reported_user__username__icontains=search_query) |
                Q(report_cat__icontains=search_query) |
                Q(report_desc__icontains=search_query)
            )
        
        # ✅ FIX: Use 'status' field values
        if status_filter != 'all':
            if status_filter == 'pending':
                reports = reports.filter(status='PENDING')
            elif status_filter == 'resolved':
                reports = reports.filter(status='RESOLVED')
        
        if category_filter != 'all':
            reports = reports.filter(report_cat__iexact=category_filter)
        
        # Sorting
        if sort_by == 'newest':
            reports = reports.order_by('-created_at')
        elif sort_by == 'oldest':
            reports = reports.order_by('created_at')
        
        # Pagination
        total_count = reports.count()
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        reports_page = reports[start_idx:end_idx]
        
        # Serialize
        reports_data = []
        for report in reports_page:
            reports_data.append({
                'report_id': report.report_id,
                'reporter': {
                    'user_id': report.reporter.id,
                    'username': report.reporter.username,
                    'profile_pic': report.reporter.profilePic or '/assets/defaultavatar.png'
                },
                'reported_user': {
                    'user_id': report.reported_user.id,
                    'username': report.reported_user.username,
                    'profile_pic': report.reported_user.profilePic or '/assets/defaultavatar.png'
                } if report.reported_user else None,
                'category': report.report_cat,
                'description': report.report_desc,
                'status': report.status,  # ✅ Return actual status field
                'created_at': report.created_at.isoformat()
            })
        
        return Response({
            'success': True,
            'reports': reports_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total_count,
                'total_pages': (total_count + per_page - 1) // per_page
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error in admin_reports_list: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_update_report_status(request):
    """
    POST /api/admin/update-report-status/
    Update report resolution status.
    """
    try:
        report_id = request.data.get('report_id')
        # ✅ FIX: Accept 'status' parameter instead of 'is_resolved'
        new_status = request.data.get('status', 'RESOLVED')
        
        if not report_id:
            return Response({
                'success': False,
                'error': 'Missing required field: report_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            report = Report.objects.get(report_id=report_id)
        except Report.DoesNotExist:
            return Response({
                'success': False,
                'error': f'Report {report_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # ✅ FIX: Update 'status' field
        report.status = new_status
        report.save()
        
        return Response({
            'success': True,
            'message': f'Report {report_id} status updated to {new_status}',
            'report': {
                'report_id': report.report_id,
                'status': report.status
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error in admin_update_report_status: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_verify_user(request):
    """
    POST /api/admin/verify-user/
    Manually verify a user's account.
    """
    try:
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({
                'success': False,
                'error': 'Missing required field: user_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': f'User {user_id} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get or create verification record
        verification, created = UserVerification.objects.get_or_create(
            user=user,
            defaults={
                'email_verified': True,
                'id_verification_status': VerificationStatus.VERIFIED
            }
        )
        
        if not created:
            verification.email_verified = True
            verification.id_verification_status = VerificationStatus.VERIFIED
            verification.save()
        
        return Response({
            'success': True,
            'message': f'User {user.username} has been verified',
            'user': {
                'user_id': user.id,
                'username': user.username,
                'verification_status': 'verified'
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error in admin_verify_user: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)