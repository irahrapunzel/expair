"""
API views for report generation.
Handles user trade history reports in PDF and CSV formats.
"""

from django.db import models
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from accounts.models import User, TradeRequest
from accounts.report_generators import generate_user_trade_report


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_trade_report(request):
    """
    Generate trade history report for authenticated user.
    
    POST /api/reports/trade-history/
    
    Request body:
        {
            "trade_ids": [1, 2, 3] or null,  // Specific trades or all trades
            "format": "pdf" or "csv"
        }
    
    Returns:
        File download (PDF or CSV)
    """
    try:
        user = request.user
        trade_ids = request.data.get('trade_ids', None)
        report_format = request.data.get('format', 'pdf').lower()
        
        # Validate format
        if report_format not in ['pdf', 'csv']:
            return Response(
                {'error': 'Invalid format. Must be "pdf" or "csv".'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate trade_ids if provided
        if trade_ids:
            if not isinstance(trade_ids, list):
                return Response(
                    {'error': 'trade_ids must be a list of integers.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify user has access to these trades
            user_trades = TradeRequest.objects.filter(
                models.Q(requester=user) | models.Q(responder=user),
                tradereq_id__in=trade_ids
            ).values_list('tradereq_id', flat=True)
            
            invalid_ids = set(trade_ids) - set(user_trades)
            if invalid_ids:
                return Response(
                    {'error': f'Invalid trade IDs: {list(invalid_ids)}'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Generate report
        response = generate_user_trade_report(
            user=user,
            trade_ids=trade_ids,
            format=report_format
        )
        
        return response
        
    except Exception as e:
        print(f"Error generating trade report: {str(e)}")
        return Response(
            {'error': f'Failed to generate report: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_trade_summary(request):
    """
    Get summary of user's trades for report generation UI.
    
    GET /api/reports/trade-summary/
    
    Returns:
        {
            "total_trades": 15,
            "completed_trades": 12,
            "average_rating": 4.5,
            "recent_trades": [...]
        }
    """
    try:
        user = request.user
        
        # Get trade counts
        all_trades = TradeRequest.objects.filter(
            models.Q(requester=user) | models.Q(responder=user)
        )
        
        completed_trades = all_trades.filter(status='COMPLETED')
        
        # Get recent completed trades
        recent_trades = completed_trades.select_related(
            'requester', 'responder'
        ).order_by('-updated_at')[:10]
        
        # Format recent trades
        trades_data = []
        for trade in recent_trades:
            partner = trade.responder if trade.requester == user else trade.requester
            trades_data.append({
                'trade_id': trade.tradereq_id,
                'partner_name': partner.get_full_name() if partner else 'N/A',
                'partner_username': partner.username if partner else 'N/A',
                'service': trade.reqname,
                'completed_date': trade.updated_at.strftime('%B %d, %Y') if trade.updated_at else 'N/A',
                'status': trade.status
            })
        
        return Response({
            'success': True,
            'total_trades': all_trades.count(),
            'completed_trades': completed_trades.count(),
            'average_rating': float(user.rating) if user.rating else 0.0,
            'rating_count': user.rating_count,
            'level': user.level,
            'total_xp': user.total_xp,
            'recent_trades': trades_data
        })
        
    except Exception as e:
        print(f"Error getting trade summary: {str(e)}")
        return Response(
            {'error': f'Failed to get trade summary: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )