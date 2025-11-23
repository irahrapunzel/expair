"""
Migration script to add source_report_id to existing sanction_details.
Run this once to fix existing suspended/banned users.
"""

import os
import django
import sys

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from accounts.models import User, Report
from django.db.models import Q

def fix_sanction_details():
    """
    For each user with active sanction, find their most recent report
    and add source_report_id to sanction_details.
    """
    
    # Get all users with active sanctions
    sanctioned_users = User.objects.filter(
        Q(sanction_status='SUSPENSION') | Q(sanction_status='BAN')
    ).exclude(sanction_details={})
    
    print(f"Found {sanctioned_users.count()} sanctioned users to process")
    
    fixed_count = 0
    for user in sanctioned_users:
        try:
            sanction_details = user.sanction_details or {}
            
            # Check if source_report_id is missing
            if 'source_report_id' not in sanction_details and 'report_id' not in sanction_details:
                print(f"\n🔍 Processing user: {user.username} (ID: {user.id})")
                print(f"   Current sanction: {user.sanction_status}")
                print(f"   Current details: {sanction_details}")
                
                # Find the most recent resolved report that led to this sanction
                recent_report = Report.objects.filter(
                    reported_user=user,
                    status='RESOLVED',
                    sanction_applied=user.sanction_status
                ).order_by('-created_at').first()
                
                # If no resolved report with matching sanction, try any RESOLVED report
                if not recent_report:
                    recent_report = Report.objects.filter(
                        reported_user=user,
                        status='RESOLVED'
                    ).order_by('-created_at').first()
                
                # If still no report, try PENDING reports
                if not recent_report:
                    recent_report = Report.objects.filter(
                        reported_user=user
                    ).order_by('-created_at').first()
                
                if recent_report:
                    # Update sanction_details with report ID
                    sanction_details['source_report_id'] = recent_report.report_id
                    sanction_details['report_id'] = recent_report.report_id  # Alias
                    
                    # Preserve existing fields and add missing ones
                    if 'level' not in sanction_details:
                        sanction_details['level'] = user.sanction_status
                    
                    user.sanction_details = sanction_details
                    user.save()
                    
                    print(f"   ✅ Fixed! Added source_report_id: {recent_report.report_id}")
                    fixed_count += 1
                else:
                    print(f"   ⚠️ No related report found for {user.username}")
                    print(f"   Creating a placeholder report...")
                    
                    # Create a system-generated report for audit purposes
                    system_admin = User.objects.filter(is_superuser=True).first()
                    if system_admin:
                        new_report = Report.objects.create(
                            reporter=system_admin,
                            reported_user=user,
                            category='Behavioral Violation',
                            issue_detail=sanction_details.get('reason', 'Legacy sanction - no original report'),
                            description='System-generated report for existing sanction (migration)',
                            status='RESOLVED',
                            sanction_applied=user.sanction_status
                        )
                        
                        sanction_details['source_report_id'] = new_report.report_id
                        sanction_details['report_id'] = new_report.report_id
                        if 'level' not in sanction_details:
                            sanction_details['level'] = user.sanction_status
                        
                        user.sanction_details = sanction_details
                        user.save()
                        
                        print(f"   ✅ Created report #{new_report.report_id} and updated user")
                        fixed_count += 1
            else:
                existing_id = sanction_details.get('source_report_id') or sanction_details.get('report_id')
                print(f"✓ User {user.username} already has report ID: {existing_id}")
                
        except Exception as e:
            print(f"❌ Error processing user {user.username}: {str(e)}")
            import traceback
            traceback.print_exc()
            continue
    
    print(f"\n{'='*60}")
    print(f"✅ Migration complete!")
    print(f"   Fixed: {fixed_count} users")
    print(f"   Total processed: {sanctioned_users.count()}")
    print(f"{'='*60}")

if __name__ == '__main__':
    print("="*60)
    print("FIXING EXISTING SANCTION DATA")
    print("="*60)
    fix_sanction_details()