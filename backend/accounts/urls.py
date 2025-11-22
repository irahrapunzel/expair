from django.urls import path, include
from accounts.views import validate_field 
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from .views import add_user_interests, user_interests, create_report
from .admin_api import (
    admin_dashboard_stats,
    admin_recent_activity,
    admin_users_list,
    admin_trade_stats,
    admin_top_traders,
    admin_trade_details,
    admin_reports_list,
    admin_update_report_status,
    admin_verify_user,
    admin_user_stats,
    admin_reject_verification,
)
from django.contrib import admin

from accounts import admin_api

urlpatterns = [
    path('register/', views.register_user, name='register_user'),
    path('complete-registration/', views.complete_registration, name='complete_registration'),
    path('api/users/<int:user_id>/verification/', views.user_verification, name='user_verification'),
    
    # OTP Email Verification
    path('send-verification-otp/', views.send_verification_otp, name='send_verification_otp'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),
    path('resend-otp/', views.resend_otp, name='resend_otp'),
    
    path('skills/general/', views.list_general_skills),
    path('skills/interests/', views.user_interests),
    path('skills/specific/', views.list_specific_skills),
    path('skills/user/', views.add_user_skills),

    path('login/', views.login_user, name='login_user'),
    path('google-login/', views.google_login, name='google_login'),
    path('logout/', views.logout_user, name="logout_user"),
    
    path('trade-requests/', views.create_trade_request, name='create_trade_request'),
    path('explore/feed/', views.explore_feed, name='explore_feed'),
    path('express-interest/', views.express_trade_interest, name='express_trade_interest'),
    path('posted-trades/', views.get_posted_trades, name='get_posted_trades'),
    path('interested-trades/', views.get_user_interested_trades, name='get_user_interested_trades'),  
    path('posted-trades/<str:username>/', views.get_user_posted_trades, name='get_user_posted_trades'),
    path('active-trades/', views.get_active_trades, name='get_active_trades'),
    path('home/active-trades/', views.get_home_active_trades, name='home_active_trades'),
    path('completed-trades/', views.get_completed_trades, name='get_completed_trades'),

    path('trade-again/', views.trade_again, name='trade-again'),

    # Trade interest management endpoints
    path('trade-requests/<int:tradereq_id>/interests/', views.get_trade_interests, name='get_trade_interests'),
    path('trade-interests/<int:interest_id>/accept/', views.accept_trade_interest, name='accept_trade_interest'),
    path('trade-interests/<int:interest_id>/decline/', views.decline_trade_interest, name='decline_trade_interest'),
    path('trade-requests/<int:tradereq_id>/details/', views.add_trade_details, name='add_trade_details'),
    path('trade-details/<int:tradereq_id>/', views.get_trade_details, name='get_trade_details'),
    path('trade-requests/<int:tradereq_id>/details/status/', views.check_trade_details_status, name='check_trade_details_status'),
    path('trade-requests/<int:tradereq_id>/cancel/', views.cancel_active_trade, name='cancel_active_trade'),

    # Trade evaluation management endpoints
    path('trade-requests/<int:tradereq_id>/evaluation/', views.get_evaluation_details, name='get_evaluation_details'),
    path('trade-requests/<int:tradereq_id>/evaluation/confirm/', views.confirm_trade_evaluation, name='confirm_trade_evaluation'),
    path('trade-requests/<int:tradereq_id>/evaluation/reject/', views.reject_trade_evaluation, name='reject_trade_evaluation'),
    
    # Trade proof management endpoints
    path('trade-proof/upload/', views.upload_trade_proof, name='upload_trade_proof'),
    path('trade-proof/<int:tradereq_id>/partner/', views.get_partner_proof, name='get_partner_proof'),
    path('trade-proof/<int:tradereq_id>/approve/', views.approve_partner_proof, name='approve_partner_proof'),
    path('trade-proof/<int:tradereq_id>/reject/', views.reject_partner_proof, name='reject_partner_proof'),
    path('trade-requests/<int:tradereq_id>/delete/', views.delete_trade_request, name='delete_trade_request'),
    path('trade-proof/<int:tradereq_id>/my-proof/', views.get_my_proof, name='get_my_proof'),
    path('home/trade-proof-status/<int:tradereq_id>/', views.get_trade_proof_status, name='trade_proof_status'),

    # Trade rating endpoints
    path('trade-rating/submit/', views.submit_trade_rating, name='submit_trade_rating'),
    path('trade-rating/status/<int:tradereq_id>/', views.get_trade_rating_status, name='get_trade_rating_status'),

    path('users/<int:user_id>/reviews/', views.user_reviews, name='user_reviews'),

    path('me/', views.me, name='me'),
    
    # 👇 expose BOTH variants
    path('users/<int:user_id>/', views.user_detail),
    path('users/by-username/<str:username>/', views.user_detail_by_username),
    path("users/username/<str:username>/", views.user_detail_by_username),

    path('users/<int:user_id>/interests/', views.user_interests),
    path("users/add_interests/", views.add_user_interests, name="add-user-interests"),
    path('users/<int:user_id>/skills/', views.user_skills),
    path('users/<int:user_id>/credentials/', views.user_credentials),
    path('check-interests/', views.check_user_interests, name='check_user_interests'),

    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/accounts/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path("users/add_interests/", add_user_interests, name="add-user-interests"),
    path("users/<int:user_id>/interests/", user_interests, name="user_interests"),
    
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('reset-password/', views.reset_password, name='reset_password'),
    
    path('validate-field/', validate_field, name='validate_field'),

    path('submit-appeal/', views.submit_appeal, name='submit_appeal'),
    
    # Notification Endpoints
    path('notifications/', views.list_notifications, name='list_notifications'),
    path('notifications/mark-all-read/', views.mark_all_as_read, name='mark_all_as_read'),
    path('notifications/<int:notification_id>/mark-read/', views.mark_one_as_read, name='mark_one_as_read'),
    path('notifications/<int:notification_id>/delete/', views.delete_notification, name='delete_notification'),
    path('notifications/delete-all-read/', views.delete_all_read_notifications, name='delete_all_read_notifications'),
    
    # Messaging endpoints
    path('trades/<int:tradereq_id>/conversation/', views.get_or_create_conversation, name='get_or_create_conversation'),
    path('conversations/', views.list_conversations, name='list_conversations'),
    path('conversations/<int:conversation_id>/messages/', views.messages_handler, name='messages_handler'),
    path('conversations/<int:conversation_id>/delete/', views.delete_conversation, name='delete_conversation'),

    # Ticketing endpoints
    path('reports/', create_report, name='create-report'),
    path('create-support-ticket/', views.create_support_ticket, name='create_support_ticket'),
    
    # Admin endpoints
    path('api/admin/dashboard-stats/', admin_dashboard_stats, name='admin_dashboard_stats'),
    path('api/admin/trade-stats/', admin_trade_stats, name='admin_trade_stats'),
    path('api/admin/top-traders/', admin_top_traders, name='admin_top_traders'),
    path('api/admin/recent-activity/', admin_recent_activity, name='admin_recent_activity'),
    path('api/admin/trade-details/', admin_trade_details, name='admin_trade_details'),
    path('api/admin/user-stats/', admin_user_stats, name='admin_user_stats'),
    path('api/admin/users-list/', admin_users_list, name='admin_users_list'),
    path('api/admin/update-report-status/', admin_update_report_status, name='admin_update_report_status'),
    path('api/admin/verify-user/', admin_verify_user, name='admin_verify_user'),
    path('api/admin/reject-verification/', admin_reject_verification, name='admin_reject_verification'), 
    path('api/admin/reports-list/', admin_api.admin_reports_list, name='admin_reports_list'),
    path('api/admin/report-detail/<int:report_id>/', admin_api.admin_report_detail, name='admin_report_detail'),
    path('api/admin/resolve-report/', admin_api.admin_resolve_report, name='admin_resolve_report'),
    path('api/admin/bulk-resolve-reports/', admin_api.admin_bulk_resolve_reports, name='admin_bulk_resolve_reports'),
    path('api/admin/report-stats/', admin_api.admin_report_stats, name='admin_report_stats'),
    
    path('api/admin/apply-sanction/', admin_api.admin_apply_sanction, name='admin_apply_sanction'),
    path('api/admin/appeal-review/', admin_api.admin_appeal_review, name='admin_appeal_review'),   
    path('api/admin/user-sanction-history/<int:user_id>/', admin_api.admin_user_sanction_history, name='admin_user_sanction_history'), 
]