from django.utils import timezone
from django.db.models import Count, Avg, Q, F, Sum, Case, When, IntegerField
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from accounts.models import (
    User, TradeRequest, TradeDetail, ReputationSystem, 
    Report, Conversation, Message, UserVerification, VerificationStatus
)

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_dashboard_stats(request):
    """
    Get statistics for the admin dashboard.
    """
    try:
        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        total_users = User.objects.count()
        
        verified_users = User.objects.filter(
            verification__email_verified=True, 
            verification__id_verification_status=VerificationStatus.VERIFIED
        ).count()
        
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
def admin_trade_stats(request):
    """
    GET /api/admin/trade-stats/
    
    Returns comprehensive trade statistics with trends.
    """
    try:
        end_date = timezone.now()
        start_date_param = request.GET.get('start_date')
        
        if start_date_param:
            start_date = datetime.fromisoformat(start_date_param.replace('Z', '+00:00'))
        else:
            start_date = end_date - timedelta(days=365)
        
        # ✅ Current period stats
        total_trades = TradeRequest.objects.count()
        completed_trades = TradeRequest.objects.filter(status='COMPLETED').count()
        active_trades = TradeRequest.objects.filter(status='ACTIVE').count()
        pending_trades = TradeRequest.objects.filter(status='PENDING').count()
        
        # ✅ Calculate trends (compare to previous month)
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        
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
        
        # ✅ Calculate percentage changes
        def calc_trend(current, previous):
            if previous == 0:
                return "+100%" if current > 0 else "0%"
            change = ((current - previous) / previous) * 100
            return f"{'+' if change >= 0 else ''}{change:.1f}%"
        
        def is_trend_up(current, previous):
            return current >= previous
        
        trends = {
            'total_trades': {
                'value': calc_trend(current_total, last_total),
                'is_up': is_trend_up(current_total, last_total)
            },
            'completed_trades': {
                'value': calc_trend(current_completed, last_completed),
                'is_up': is_trend_up(current_completed, last_completed)
            },
            'active_trades': {
                'value': calc_trend(current_active, last_active),
                'is_up': is_trend_up(current_active, last_active)
            },
            'pending_trades': {
                'value': calc_trend(current_pending, last_pending),
                'is_up': is_trend_up(current_pending, last_pending)
            }
        }
        
        # Monthly aggregations (existing code)
        monthly_trades = TradeRequest.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            trade_count=Count('tradereq_id'),
            completed_count=Count('tradereq_id', filter=Q(status='COMPLETED')),
            unique_requesters=Count('requester', distinct=True),
            unique_responders=Count('responder', distinct=True, filter=~Q(responder__isnull=True))
        ).order_by('month')
        
        # Format monthly data with ratings
        monthly_data = []
        for entry in monthly_trades:
            month_start = entry['month']
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            completed_in_month = TradeRequest.objects.filter(
                created_at__gte=month_start,
                created_at__lte=month_end,
                status='COMPLETED'
            )
            
            avg_rating = 0
            if completed_in_month.exists():
                ratings = ReputationSystem.objects.filter(
                    trade_request__in=completed_in_month
                )
                
                total_stars = 0
                count = 0
                for rating in ratings:
                    if rating.requester_starcount:
                        total_stars += rating.requester_starcount
                        count += 1
                    if rating.responder_starcount:
                        total_stars += rating.responder_starcount
                        count += 1
                
                if count > 0:
                    avg_rating = round(total_stars / count, 1)
            
            active_users = entry['unique_requesters'] + entry['unique_responders']
            
            monthly_data.append({
                'month': month_start.strftime('%b %Y'),
                'trades': entry['trade_count'],
                'completed': entry['completed_count'],
                'active_users': active_users,
                'average_rating': avg_rating
            })
        
        return Response({
            'success': True,
            'total_trades': total_trades,
            'completed_trades': completed_trades,
            'active_trades': active_trades,
            'pending_trades': pending_trades,
            'trends': trends,  # ✅ ADD THIS
            'monthly_breakdown': monthly_data,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        print(f"Error in admin_trade_stats: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # TODO: Change to IsAdminUser in production
def admin_top_traders(request):
    """
    GET /api/admin/top-traders/
    
    Returns top traders ranked by completed trade count.
    """
    try:
        limit = int(request.GET.get('limit', 10))
        
        # ✅ FIXED: Use correct reverse relation names
        # From User model: related_name='trade_requests_made' and 'trade_requests_received'
        top_traders = User.objects.annotate(
            completed_as_requester=Count(
                'trade_requests_made',
                filter=Q(trade_requests_made__status='COMPLETED')
            ),
            completed_as_responder=Count(
                'trade_requests_received',
                filter=Q(trade_requests_received__status='COMPLETED')
            ),
            total_completed=F('completed_as_requester') + F('completed_as_responder')
        ).filter(
            total_completed__gt=0
        ).order_by('-total_completed')[:limit]
        
        traders_data = []
        for user in top_traders:
            profile_pic_url = None
            if user.profilePic:
                profile_pic_url = user.profilePic
            
            traders_data.append({
                'user_id': user.id,
                'username': user.username,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'profile_pic': profile_pic_url,
                'trades': user.total_completed,
                'rating': float(user.avgStars or 0),
                'rating_count': user.ratingCount or 0,
                'level': user.level or 1,
                'total_xp': user.tot_XpPts or 0
            })
        
        return Response({
            'success': True,
            'top_traders': traders_data,
            'count': len(traders_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        print(f"Error in admin_top_traders: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # TODO: Change to IsAdminUser
def admin_recent_activity(request):
    """
    GET /api/admin/recent-activity/
    
    Returns recent system activity for admin dashboard.
    """
    try:
        limit = int(request.GET.get('limit', 10))
        
        # Get recent users
        recent_users = User.objects.order_by('-created_at')[:limit]
        
        # Get recent completed trades
        recent_trades = TradeRequest.objects.filter(
            status='COMPLETED'
        ).select_related('requester', 'responder').order_by('-created_at')[:limit]
        
        # Get recent reports
        recent_reports = Report.objects.select_related(
            'reporter', 'reported_user'
        ).order_by('-created_at')[:limit]
        
        # Format activities
        activities = []
        
        # Add user registrations
        for user in recent_users:
            activities.append({
                'type': 'user_registered',
                'timestamp': user.created_at.isoformat(),
                'description': f"New user registered: {user.username}",
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'profile_pic': user.profilePic
                }
            })
        
        # Add completed trades
        for trade in recent_trades:
            activities.append({
                'type': 'trade_completed',
                'timestamp': trade.created_at.isoformat(),
                'description': f"Trade completed: {trade.reqname}",
                'trade': {
                    'id': trade.tradereq_id,
                    'name': trade.reqname,
                    'requester': trade.requester.username,
                    'responder': trade.responder.username if trade.responder else None
                }
            })
        
        # Add reports - ✅ FIXED: Report model doesn't have 'reason' field
        for report in recent_reports:
            # Get the first 50 chars of report_desc if it exists
            report_text = "Report filed"
            if hasattr(report, 'report_desc') and report.report_desc:
                report_text = report.report_desc[:50]
            
            activities.append({
                'type': 'report_filed',
                'timestamp': report.created_at.isoformat(),
                'description': f"Report filed: {report_text}...",
                'report': {
                    'id': report.report_id,
                    'reporter': report.reporter.username,
                    'reported_user': report.reported_user.username if report.reported_user else None,
                    'description': report_text
                }
            })
        
        # Sort all activities by timestamp (most recent first)
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        activities = activities[:limit]
        
        return Response({
            'success': True,
            'activities': activities,
            'count': len(activities)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback
        print(f"Error in admin_recent_activity: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # TODO: Change to IsAdminUser in production
def admin_trade_details(request):
    """
    GET /api/admin/trade-details/
    
    Returns paginated list of trades with filtering.
    """
    try:
        # Parse filters
        status_filter = request.GET.get('status')
        user_id = request.GET.get('user_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # ✅ Base query - don't use prefetch_related with 'trade_details'
        trades = TradeRequest.objects.select_related(
            'requester', 'responder'
        ).order_by('-created_at')
        
        # Apply filters
        if status_filter:
            trades = trades.filter(status=status_filter.upper())
        
        if user_id:
            trades = trades.filter(
                Q(requester_id=user_id) | Q(responder_id=user_id)
            )
        
        if start_date:
            trades = trades.filter(created_at__gte=start_date)
        
        if end_date:
            trades = trades.filter(created_at__lte=end_date)
        
        # Pagination
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        total_count = trades.count()
        trades_page = trades[start_idx:end_idx]
        
        # Format trade data
        trades_data = []
        for trade in trades_page:
            # ✅ Calculate total XP using correct query
            trade_details = TradeDetail.objects.filter(trade_request=trade)
            total_xp = sum(
                detail.total_xp for detail in trade_details 
                if detail.total_xp
            )
            
            # Get ratings if completed
            requester_rating = None
            responder_rating = None
            
            if trade.status == 'COMPLETED':
                try:
                    reputation = ReputationSystem.objects.get(trade_request=trade)
                    
                    # ✅ ReputationSystem has separate fields for each party
                    if reputation.requester_starcount:
                        requester_rating = {
                            'stars': reputation.requester_starcount,
                            'description': reputation.requester_rating_desc or ''
                        }
                    
                    if reputation.responder_starcount:
                        responder_rating = {
                            'stars': reputation.responder_starcount,
                            'description': reputation.responder_rating_desc or ''
                        }
                except ReputationSystem.DoesNotExist:
                    pass
            
            trades_data.append({
                'tradereq_id': trade.tradereq_id,
                'reqname': trade.reqname,
                'exchange': trade.exchange,
                'status': trade.status,
                'requester': {
                    'id': trade.requester.id,
                    'username': trade.requester.username,
                    'name': f"{trade.requester.first_name} {trade.requester.last_name}".strip() or trade.requester.username,
                    'profile_pic': trade.requester.profilePic
                },
                'responder': {
                    'id': trade.responder.id,
                    'username': trade.responder.username,
                    'name': f"{trade.responder.first_name} {trade.responder.last_name}".strip() or trade.responder.username,
                    'profile_pic': trade.responder.profilePic
                } if trade.responder else None,
                'deadline': trade.reqdeadline.isoformat() if trade.reqdeadline else None,
                'created_at': trade.created_at.isoformat(),
                'total_xp': total_xp,
                'ratings': {
                    'requester': requester_rating,
                    'responder': responder_rating
                }
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
        import traceback
        print(f"Error in admin_trade_details: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def admin_users_list(request):
    """
    Get a list of all users for the admin dashboard.
    """
    try:
        users = User.objects.all().order_by('-created_at')
        
        users_data = []
        for user in users:
            users_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'level': user.level,
                'total_xp': user.tot_XpPts,
                'rating': float(user.avgStars or 0),
                'rating_count': user.ratingCount or 0,
                'profile_pic': user.profilePic
            })
        
        return Response(users_data)
        
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )