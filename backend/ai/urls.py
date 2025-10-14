from django.urls import path
from ai.api.views import (
    api_best_picks,
    api_categorize,
    api_evaluate,
    api_get_evaluation,
    api_onboarding_picks,
    api_mark_interested,
    api_explore_feed,
    api_best_match,
    api_submit_rating,
)
from .api import views

app_name = 'ai'

urlpatterns = [
    path('best-picks/', api_best_picks, name='ai-best-picks'),
    path('onboarding-picks/', api_onboarding_picks, name='ai-onboarding'),
    path('explore/', api_explore_feed, name='ai-explore'),
    path('best-match/', api_best_match, name='ai-best-match'),
    path('mark-interested/', api_mark_interested, name='ai-mark-interested'),
    path('categorize/', api_categorize, name='ai-categorize'),
    path('evaluate/', api_evaluate, name='ai-evaluate'),
    path('evaluation/<int:tradereq_id>/', api_get_evaluation, name='ai-get-evaluation'),
    path('submit-rating/', api_submit_rating, name='ai-submit-rating'),
    path('onboarding-picks/', views.onboarding_picks, name='onboarding_picks'),
    path('onboarding-picks-for-request/', views.onboarding_picks_for_request, name='onboarding_picks_for_request'),
]