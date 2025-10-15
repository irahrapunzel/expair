from django.urls import path
from .api import views

app_name = 'ai'

urlpatterns = [
    # Onboarding
    path('onboarding-picks/', views.api_onboarding_picks, name='api_onboarding_picks'),
    path('onboarding-picks-for-request/', views.onboarding_picks_for_request, name='onboarding_picks_for_request'),
    
    # Explore and matching
    path('explore/', views.explore_feed, name='explore_feed'),
    path('best-picks/', views.api_best_picks, name='ai_best_picks'),
    path('best-match/', views.api_best_match, name='ai_best_match'),
    path('mark-interested/', views.api_mark_interested, name='ai_mark_interested'),
    
    # Trade evaluation
    path('categorize/', views.api_categorize, name='ai_categorize'),  # ✅ Fixed: was categorize_trade_request
    path('evaluate/', views.api_evaluate, name='ai_evaluate'),
    path('evaluation/<int:tradereq_id>/', views.api_get_evaluation, name='ai_get_evaluation'),
    
    # Rating
    path('submit-rating/', views.api_submit_rating, name='ai_submit_rating'),
]