"""
Report generation utilities for EXPAIR platform.
Generates PDF and CSV reports for trade history using ReportLab.
"""

import csv
import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from django.http import HttpResponse
from django.db import models
from accounts.models import User, TradeRequest, ReputationSystem


class TradeReportGenerator:
    """Generate trade history reports in PDF and CSV formats."""
    
    def __init__(self, user, trades_queryset, is_individual=False):
        """
        Initialize report generator.
        
        Args:
            user: User model instance
            trades_queryset: QuerySet of TradeRequest objects
            is_individual: Boolean, True if single trade report
        """
        self.user = user
        self.trades = trades_queryset
        self.is_individual = is_individual
        self.styles = getSampleStyleSheet()
        
        # ✅ Cache user stats with CORRECT field names
        self.user_rating = float(getattr(user, 'avgStars', 0) or 0)
        self.user_rating_count = int(getattr(user, 'ratingCount', 0) or 0)
        self.user_level = int(getattr(user, 'level', 1) or 1)
        self.user_xp = int(getattr(user, 'tot_XpPts', 0) or 0)
        self.user_verification = self._get_verification_status()
        
        # Custom styles
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#284CCC'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#284CCC'),
            spaceAfter=12,
            spaceBefore=12
        )
        
        # ✅ NEW: Wrap style for table cells
        self.cell_style = ParagraphStyle(
            'CellText',
            parent=self.styles['Normal'],
            fontSize=8,
            leading=10,
            alignment=TA_CENTER,
            wordWrap='CJK'
        )
    
    def _get_verification_status(self):
        """Get verification status from user using CORRECT field names."""
        # ✅ Check actual verification status field
        status = getattr(self.user, 'id_verification_status', None)
        
        # Map status to readable format
        if status == 'VERIFIED':
            return 'Verified'
        elif status == 'PENDING':
            return 'Pending Verification'
        elif status == 'REJECTED':
            return 'Verification Rejected'
        else:
            # Fallback to is_verified boolean
            is_verified = getattr(self.user, 'is_verified', False)
            return 'Verified' if is_verified else 'Not Verified'
    
    def generate_csv(self):
        """Generate CSV report for trade history."""
        response = HttpResponse(content_type='text/csv')
        filename = self._get_filename('csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        writer = csv.writer(response)
        
        # Header rows
        writer.writerow(['EXPAIR Trade History Report'])
        writer.writerow([f'User: {self.user.get_full_name()} (@{self.user.username})'])
        writer.writerow([f'Generated: {datetime.now().strftime("%B %d, %Y %I:%M %p")}'])
        writer.writerow([])
        
        if not self.is_individual:
            writer.writerow([f'Total Trades: {self.trades.count()}'])
            writer.writerow([f'Rating: {self.user_rating:.1f}/5.0 ({self.user_rating_count} reviews)'])
            writer.writerow([f'Level: {self.user_level} | XP: {self.user_xp}'])
            writer.writerow([f'Verification: {self.user_verification}'])
            writer.writerow([])
        
        # Column headers
        writer.writerow([
            'Trade ID',
            'Partner Name',
            'Partner Username',
            'You Requested',
            'Partner Offered',
            'Status',
            'Your Rating (Given)',
            'Partner Rating (Received)',
            'Completed Date'
        ])
        
        # Trade data rows
        for trade in self.trades:
            partner = self._get_trade_partner(trade)
            your_rating_given, partner_rating_received = self._get_ratings(trade)
            
            writer.writerow([
                trade.tradereq_id,
                partner.get_full_name() if partner else 'N/A',
                partner.username if partner else 'N/A',
                self._get_what_user_requested(trade),
                self._get_what_partner_offered(trade),
                trade.status or 'COMPLETED',
                your_rating_given,
                partner_rating_received,
                trade.created_at.strftime('%B %d, %Y') if trade.created_at else 'N/A'
            ])
        
        return response
    
    def generate_pdf(self):
        """Generate PDF report for trade history."""
        response = HttpResponse(content_type='application/pdf')
        filename = self._get_filename('pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=50,
            leftMargin=50,
            topMargin=72,
            bottomMargin=50,
        )
        
        elements = []
        
        # Title
        title_text = 'Individual Trade Report' if self.is_individual else 'Trade History Report'
        elements.append(Paragraph(title_text, self.title_style))
        elements.append(Spacer(1, 12))
        
        # User information
        user_info = [
            f"<b>User:</b> {self.user.get_full_name()} (@{self.user.username})",
            f"<b>Email:</b> {self.user.email}",
            f"<b>Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
        ]
        
        if not self.is_individual:
            user_info.extend([
                f"<b>Total Trades:</b> {self.trades.count()}",
                f"<b>Rating:</b> {self.user_rating:.1f}/5.0 ({self.user_rating_count} reviews)",
                f"<b>Level:</b> {self.user_level} | <b>XP:</b> {self.user_xp:,}",
                f"<b>Verification:</b> {self.user_verification}"
            ])
        
        for info in user_info:
            elements.append(Paragraph(info, self.styles['Normal']))
            elements.append(Spacer(1, 6))
        
        elements.append(Spacer(1, 20))
        
        # Trades table
        elements.append(Paragraph('Trade Details', self.heading_style))
        elements.append(Spacer(1, 12))
        
        # ✅ FIXED: Use Paragraph for text wrapping in cells
        table_data = [[
            Paragraph('<b>ID</b>', self.cell_style),
            Paragraph('<b>Partner</b>', self.cell_style),
            Paragraph('<b>You Requested</b>', self.cell_style),
            Paragraph('<b>Partner Offered</b>', self.cell_style),
            Paragraph('<b>Your Rating<br/>(Given)</b>', self.cell_style),
            Paragraph('<b>Partner Rating<br/>(Received)</b>', self.cell_style),
            Paragraph('<b>Completed</b>', self.cell_style)
        ]]
        
        for trade in self.trades:
            partner = self._get_trade_partner(trade)
            your_rating_given, partner_rating_received = self._get_ratings(trade)
            
            row = [
                Paragraph(str(trade.tradereq_id), self.cell_style),
                Paragraph(partner.username if partner else 'N/A', self.cell_style),
                Paragraph(self._get_what_user_requested(trade), self.cell_style),
                Paragraph(self._get_what_partner_offered(trade), self.cell_style),
                Paragraph(your_rating_given, self.cell_style),
                Paragraph(partner_rating_received, self.cell_style),
                Paragraph(trade.created_at.strftime('%m/%d/%Y') if trade.created_at else 'N/A', self.cell_style)
            ]
            table_data.append(row)
        
        # ✅ FIXED: Adjusted column widths to prevent overlap
        table = Table(table_data, colWidths=[
            0.5*inch,  # ID
            1*inch,    # Partner
            1.8*inch,  # You Requested
            1.8*inch,  # Partner Offered
            0.8*inch,  # Your Rating
            0.8*inch,  # Partner Rating
            0.8*inch   # Completed
        ])
        
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#284CCC')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F5F5F5')),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9F9F9')]),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 30))
        
        # Footer
        elements.append(Spacer(1, 0.5*inch))
        footer_text = f"<i>Generated by EXPAIR - Skill Exchange Platform | {datetime.now().strftime('%B %d, %Y')}</i>"
        elements.append(Paragraph(footer_text, self.styles['Normal']))
        
        doc.build(elements, onFirstPage=self._add_page_number, onLaterPages=self._add_page_number)
        
        pdf = buffer.getvalue()
        buffer.close()
        response.write(pdf)
        
        return response
    
    def _get_filename(self, extension):
        """Generate filename for report."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if self.is_individual and self.trades.exists():
            return f"trade_{self.trades.first().tradereq_id}_report_{timestamp}.{extension}"
        else:
            return f"{self.user.username}_trade_history_{timestamp}.{extension}"
    
    def _get_trade_partner(self, trade):
        """Get the partner user for a trade."""
        try:
            if trade.requester_id == self.user.id:
                return trade.responder
            elif trade.responder_id == self.user.id:
                return trade.requester
            return None
        except Exception as e:
            print(f"[_get_trade_partner] Error: {e}")
            return None
    
    def _get_what_user_requested(self, trade):
        """
        ✅ FIXED: Get what the CURRENT USER requested.
        
        From UI pattern: "{username} requested {service}"
        - If user is REQUESTER → return trade.reqname (what they requested)
        - If user is RESPONDER → return what the REQUESTER asked for (trade.reqname)
        
        In both cases, we return trade.reqname because that's what was originally requested.
        """
        try:
            # The reqname is ALWAYS what the REQUESTER asked for
            return trade.reqname or 'Service requested'
        except Exception as e:
            print(f"[_get_what_user_requested] Error for trade {trade.tradereq_id}: {e}")
            return 'N/A'
    
    def _get_what_partner_offered(self, trade):
        """
        ✅ FIXED: Get what the partner offered in exchange.
        
        From UI pattern: "in exchange for {service}"
        - This is what the RESPONDER offered
        - Need to find the responder's TradeDetail to get their service
        """
        try:
            # Get the responder (who is offering their service)
            responder = trade.responder
            
            if not responder:
                return 'N/A'
            
            # Try to get the responder's trade detail
            try:
                responder_detail = trade.tradedetail_set.filter(user=responder).first()
                
                if responder_detail:
                    # Check these fields in order of priority
                    service = (
                        responder_detail.reqtype or  # Type of service they're offering
                        responder_detail.needs or    # What they specified
                        'Service provided'
                    )
                    return service
            except Exception as detail_err:
                print(f"[_get_what_partner_offered] TradeDetail error: {detail_err}")
            
            # Fallback: return a generic message
            return 'Service exchange'
            
        except Exception as e:
            print(f"[_get_what_partner_offered] Error for trade {trade.tradereq_id}: {e}")
            return 'N/A'
    
    def _get_ratings(self, trade):
        """
        ✅ FIXED: Get ratings correctly.
        
        Returns:
            (your_rating_given, partner_rating_received)
            - your_rating_given: Star rating YOU gave to your partner
            - partner_rating_received: Star rating YOU received from your partner
        """
        try:
            # Determine if current user is requester or responder
            is_requester = (trade.requester_id == self.user.id)
            
            # Get the reputation record for this trade
            reputation = ReputationSystem.objects.filter(tradereq=trade).first()
            
            if not reputation:
                return 'N/A', 'N/A'
            
            # ✅ Extract ratings based on database schema
            if is_requester:
                # User is requester
                # Rating GIVEN by requester (to responder)
                your_rating = reputation.requester_starcount
                # Rating RECEIVED by requester (from responder)
                partner_rating = reputation.responder_starcount
            else:
                # User is responder
                # Rating GIVEN by responder (to requester)
                your_rating = reputation.responder_starcount
                # Rating RECEIVED by responder (from requester)
                partner_rating = reputation.requester_starcount
            
            # Format ratings
            your_rating_str = f"{float(your_rating):.1f}" if your_rating is not None else 'N/A'
            partner_rating_str = f"{float(partner_rating):.1f}" if partner_rating is not None else 'N/A'
            
            print(f"[_get_ratings] Trade {trade.tradereq_id}: Given={your_rating_str}, Received={partner_rating_str}")
            
            return your_rating_str, partner_rating_str
            
        except Exception as e:
            print(f"[_get_ratings] Error for trade {trade.tradereq_id}: {e}")
            return 'N/A', 'N/A'
    
    def _add_page_number(self, canvas, doc):
        """Add page numbers to PDF."""
        canvas.saveState()
        canvas.setFont('Helvetica', 9)
        page_num = canvas.getPageNumber()
        text = f"Page {page_num}"
        canvas.drawRightString(7.5*inch, 0.5*inch, text)
        canvas.restoreState()


def generate_user_trade_report(user, trade_ids=None, format='pdf'):
    """
    Generate trade history report for a user.
    
    Args:
        user: User model instance
        trade_ids: List of specific trade IDs (None for all trades)
        format: 'pdf' or 'csv'
    
    Returns:
        HttpResponse with report file
    """
    # ✅ Get trades with proper joins
    trades = TradeRequest.objects.filter(
        models.Q(requester=user) | models.Q(responder=user),
        status='COMPLETED'
    ).select_related(
        'requester',
        'responder'
    ).prefetch_related(
        'tradedetail_set',
        'reputationsystem_set'  # ✅ Also prefetch reputation data
    ).order_by('-created_at')
    
    if trade_ids:
        trades = trades.filter(tradereq_id__in=trade_ids)
    
    print(f"[generate_user_trade_report] Generating {format} for user {user.username}")
    print(f"[generate_user_trade_report] Found {trades.count()} completed trades")
    
    is_individual = trade_ids and len(trade_ids) == 1
    
    generator = TradeReportGenerator(user, trades, is_individual)
    
    if format.lower() == 'csv':
        return generator.generate_csv()
    else:
        return generator.generate_pdf()