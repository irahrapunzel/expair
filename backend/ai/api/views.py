from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ai.services.matching import rank_best_picks, rank_explore_trades, get_best_match
from ai.services.classifier import categorize_tradereq
from ai.services.evaluation import evaluate_trade
from ai.services.onboarding import get_onboarding_best_picks, create_interests_from_onboarding
from ai.services.clients import gemini_client
from ai.api.serializers import BestPicksIn, CategorizeIn, EvaluateIn
from accounts.models import Evaluation
from ai.services.sentiment import analyze_sentiment
from ai.api.serializers import SubmitRatingIn
from accounts.models import ReputationSystem, TradeRequest
from django.utils import timezone
from django.db.models import Avg
from django.core.cache import cache
from ..services.onboarding import OnboardingService


def check_ai_available():
    """Check if AI features are available"""
    if gemini_client is None:
        return False, Response(
            {"error": "AI features are currently unavailable. GEMINI_API_KEY not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    return True, None


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_best_picks(request):
    """Get best matching trades for a user"""
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    serializer = BestPicksIn(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user_id = serializer.validated_data.get("user_id", request.user.pk)
    top_k = serializer.validated_data.get("top_k", 20)

    try:
        matches = rank_best_picks(for_user_id=user_id, top_k=top_k)
        return Response({
            "matches": [
                {
                    "tradereq_id": m['trade'].pk,
                    "reqname": m['trade'].reqname,
                    "requester": m['trade'].requester.username,
                    "score": m['score'],
                    "category": getattr(m['trade'], 'classified_category', None),
                }
                for m in matches
            ]
        })
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_onboarding_picks(request):
    """
    Get 6 best picks for user onboarding (SM1).
    Called after user completes signup and enters first trade request.
    Also shows what each requester can offer based on skill matching.
    """
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    user_id = request.user.pk
    
    # Caching
    cache_key = f"onboarding_picks_{user_id}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)

    try:
        picks = get_onboarding_best_picks(user_id)
        response_data = {
            "best_picks": [
                {
                    "tradereq_id": p['trade'].pk,
                    "reqname": p['trade'].reqname,
                    "requester": p['trade'].requester.username,
                    "requester_id": p['trade'].requester.pk,
                    "score": p['score'],
                    "category": getattr(p['trade'], 'classified_category', None),
                    "exchange": getattr(p['trade'], 'exchange', None),
                    "reqdeadline": getattr(p['trade'], 'reqdeadline', None),
                    # Frontend display fields
                    "name": p['trade'].requester.get_full_name() or p['trade'].requester.username,
                    "username": p['trade'].requester.username,
                    "profilePicUrl": getattr(p['trade'].requester, 'profilepic', None) or '/assets/defaultavatar.png',
                    "rating": float(getattr(p['trade'].requester, 'avgStars', 0) or 0),
                    "ratingCount": getattr(p['trade'].requester, 'ratingCount', 0) or 0,
                    "level": getattr(p['trade'].requester, 'currentLevel', 1) or 1,
                    "need": p['trade'].reqname,
                    "offer": p['trade'].exchange or "—",
                    "deadline": str(p['trade'].reqdeadline) if p['trade'].reqdeadline else None,
                    "userId": p['trade'].requester.pk,
                }
                for p in picks
            ],
            "count": len(picks)
        }

        cache.set(cache_key, response_data, 300)
        return Response(response_data)
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    viewer = request.user if getattr(request, 'id', None) else None

    items_with_matches = []
    items_without_matches = []

    for tr in qs:
        requester = tr.requester
        display_name = (f"{(requester.first_name or '').strip()} {(requester.last_name or '').strip()}").strip() or requester.username

        needs = tr.reqname
        profile_pic_url = requester.profilePic if requester.profilePic else None

        # 🔧 IMPROVED SKILL MATCHING LOGIC
        # Get all skills that the REQUESTER has (what they can offer)
        requester_skills = UserSkill.objects.filter(
            user_id=tr.requester.id
        ).select_related("specSkills__genSkills_id")

        # Build requester's skill categories
        requester_gen_skills = {}  # {gen_skill_id: category_name}
        requester_spec_skills = []  # List of specific skill names
        
        for skill in requester_skills:
            if skill.specSkills:
                requester_spec_skills.append(skill.specSkills.specName)
                if skill.specSkills.genSkills_id:
                    requester_gen_skills[skill.specSkills.genSkills_id.genskills_id] = skill.specSkills.genSkills_id.genCateg
        
        # Determine what the requester "can offer"
        can_offer = ""
        has_match = False
        
        if viewer:
            # Get viewer's interests
            viewer_interests = UserInterest.objects.filter(
                user=viewer
            ).values_list('genSkills_id_id', flat=True)
            
            # Priority 1: Match requester's skills with viewer's interests (BEST MATCH)
            if viewer_interests and requester_gen_skills:
                matching_skill_ids = set(viewer_interests) & set(requester_gen_skills.keys())
                
                if matching_skill_ids:
                    # Use the first matching skill category
                    matching_skill_id = list(matching_skill_ids)[0]
                    can_offer = requester_gen_skills[matching_skill_id]
                    has_match = True
            
            # Priority 2: Check if any requester's SPECIFIC skills are mentioned in viewer's request
            if not can_offer and requester_spec_skills:
                needs_lower = needs.lower()
                for spec_skill in requester_spec_skills:
                    if spec_skill.lower() in needs_lower:
                        # Find the general category for this specific skill
                        for skill in requester_skills:
                            if skill.specSkills and skill.specSkills.specName == spec_skill:
                                if skill.specSkills.genSkills_id:
                                    can_offer = skill.specSkills.genSkills_id.genCateg
                                    has_match = True
                                    break
                        if can_offer:
                            break
        
        # Priority 3: Show requester's most prominent skill category
        if not can_offer and requester_gen_skills:
            # Get the most common skill category the requester has
            can_offer = list(requester_gen_skills.values())[0]
        
        # Priority 4: Show first specific skill as general category
        if not can_offer and requester_spec_skills:
            # Find the category of the first specific skill
            first_skill = requester_skills.first()
            if first_skill and first_skill.specSkills and first_skill.specSkills.genSkills_id:
                can_offer = first_skill.specSkills.genSkills_id.genCateg
        
        # Priority 5: Fallback to database skill (last resort)
        if not can_offer:
            any_spec = SpecSkill.objects.first()
            can_offer = any_spec.specName if any_spec else ""
        
        # Build the response item
        item_data = {
            "tradereq_id": tr.tradereq_id,
            "requester_id": requester.id,
            "name": display_name,
            "rating": float(requester.avgStars or 0),
            "ratingCount": int(requester.ratingCount or 0),
            "level": int(requester.level or 0),
            "need": needs,
            "offer": can_offer,  # ✅ Will never be "—" now
            "deadline": tr.reqdeadline.isoformat() if tr.reqdeadline else "",
            "profilePicUrl": profile_pic_url,
            "userId": requester.id,
            "username": requester.username,
        }
        
        # Separate items with matches from those without
        if has_match:
            items_with_matches.append(item_data)
        else:
            items_without_matches.append(item_data)

    # Prioritize matches, then add others
    all_items = items_with_matches + items_without_matches

    return Response({"items": all_items}, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_mark_interested(request):
    """
    Mark trades as interested during onboarding or explore.
    Adds to user's "Trades you're interested in" section.
    """
    tradereq_ids = request.data.get('tradereq_ids', [])
    
    if not tradereq_ids:
        return Response(
            {"error": "tradereq_ids is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        created_count = create_interests_from_onboarding(
            user_id=request.user.pk,
            tradereq_ids=tradereq_ids
        )
        return Response({
            "success": True,
            "created_count": created_count,
            "message": f"Added {created_count} trades to your interests"
        })
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_explore_feed(request):
    """
    Get ranked trades for explore page.
    Uses multi-factor ranking: AI similarity, category, location, availability.
    """
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    user_id = request.user.pk
    top_k = int(request.GET.get('top_k', 20))
    cache_key = f"explore_feed_{user_id}_{top_k}"
    
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    try:
        trades = rank_explore_trades(for_user_id=user_id, top_k=top_k)
        response_data = {
            "ranked_trades": [
                {
                    "tradereq_id": t['trade'].pk,
                    "reqname": t['trade'].reqname,
                    "requester": t['trade'].requester.username,
                    "requester_id": t['trade'].requester.pk,
                    # ✅ ADD THESE FIELDS:
                    "name": (f"{t['trade'].requester.first_name} {t['trade'].requester.last_name}").strip() or t['trade'].requester.username,
                    "username": t['trade'].requester.username,
                    "profilePicUrl": t['trade'].requester.profilePic if t['trade'].requester.profilePic else None,
                    "rating": float(t['trade'].requester.avgStars or 0),
                    "ratingCount": int(t['trade'].requester.ratingCount or 0),
                    "level": int(t['trade'].requester.level or 0),
                    "offer": t['trade'].exchange or "Skills & Services",
                    "deadline": t['trade'].reqdeadline.isoformat() if t['trade'].reqdeadline else "",
                    # Keep existing fields:
                    "score": t['score'],
                    "category": getattr(t['trade'], 'classified_category', None),
                    "exchange": getattr(t['trade'], 'exchange', None),
                    "reqdeadline": getattr(t['trade'], 'reqdeadline', None),
                    "score_breakdown": t['breakdown'],
                }
                for t in trades
            ],
            "count": len(trades)
        }

        cache.set(cache_key, response_data, 900)
        return Response(response_data)
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_categorize(request):
    """Categorize a trade request"""
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    serializer = CategorizeIn(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    tradereq_id = serializer.validated_data["tradereq_id"]

    try:
        category = categorize_tradereq(tradereq_id)
        return Response({"category": category})
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_evaluate(request):
    """
    Evaluate trade and save to database.
    Called when user clicks "Evaluate" button in Pending Trades.
    Both parties must submit details first.
    """
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    serializer = EvaluateIn(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    tradereq_id = serializer.validated_data["tradereq_id"]

    try:
        # Get AI evaluation
        result = evaluate_trade(tradereq_id)
        
        # Get trade request
        from accounts.models import TradeRequest
        tradereq = TradeRequest.objects.get(pk=tradereq_id)
        
        # Get or create Evaluation record
        evaluation, created = Evaluation.objects.update_or_create(
            trade_request=tradereq,
            defaults={
                'taskcomplexity': result['taskcomplexity'],
                'timecommitment': result['timecommitment'],
                'skilllevel': result['skilllevel'],
                'evaluationdescription': result['evaluationdescription'],
            }
        )
        
        # Return evaluation with display-friendly scores
        return Response({
            'evaluation_id': evaluation.evaluation_id,
            'tradereq_id': tradereq_id,
            # Raw scores (0-100)
            'taskcomplexity': evaluation.taskcomplexity,
            'timecommitment': evaluation.timecommitment,
            'skilllevel': evaluation.skilllevel,
            'overall_score': evaluation.overall_score,
            # Out of 10 for UI display
            'overall_score_out_of_10': evaluation.overall_score_out_of_10,
            'taskcomplexity_out_of_10': evaluation.taskcomplexity_out_of_10,
            'timecommitment_out_of_10': evaluation.timecommitment_out_of_10,
            'skilllevel_out_of_10': evaluation.skilllevel_out_of_10,
            # Quality and description
            'quality_label': evaluation.quality_label,
            'evaluationdescription': evaluation.evaluationdescription,
            # Confirmation status
            'requester_evaluation_status': evaluation.requester_evaluation_status,
            'responder_evaluation_status': evaluation.responder_evaluation_status,
            'requester_responded_at': evaluation.requester_responded_at,
            'responder_responded_at': evaluation.responder_responded_at,
            # Metadata
            'created': created,  # True if new, False if updated
        })
        
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_get_evaluation(request, tradereq_id):
    """
    Retrieve saved evaluation for a trade.
    Used in Pending Trades, Active Trades, and Messages tabs.
    """
    try:
        evaluation = Evaluation.objects.select_related('trade_request').get(
            trade_request_id=tradereq_id
        )
        
        return Response({
            'evaluation_id': evaluation.evaluation_id,
            'tradereq_id': tradereq_id,
            # Raw scores (0-100)
            'taskcomplexity': evaluation.taskcomplexity,
            'timecommitment': evaluation.timecommitment,
            'skilllevel': evaluation.skilllevel,
            'overall_score': evaluation.overall_score,
            # Out of 10 for UI display
            'overall_score_out_of_10': evaluation.overall_score_out_of_10,
            'taskcomplexity_out_of_10': evaluation.taskcomplexity_out_of_10,
            'timecommitment_out_of_10': evaluation.timecommitment_out_of_10,
            'skilllevel_out_of_10': evaluation.skilllevel_out_of_10,
            # Quality and description
            'quality_label': evaluation.quality_label,
            'evaluationdescription': evaluation.evaluationdescription,
            # Confirmation status
            'requester_evaluation_status': evaluation.requester_evaluation_status,
            'responder_evaluation_status': evaluation.responder_evaluation_status,
            'requester_responded_at': evaluation.requester_responded_at,
            'responder_responded_at': evaluation.responder_responded_at,
        })
        
    except Evaluation.DoesNotExist:
        return Response(
            {"error": "No evaluation found for this trade. Both parties must submit details and evaluate first."},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_best_match(request):
    """
    Get THE single best match for the authenticated user.
    Returns the most compatible trade based on multi-factor scoring.
    """
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    user_id = request.user.pk
    
    try:
        best_match = get_best_match(for_user_id=user_id)
        
        if best_match:
            trade = best_match['trade']
            return Response({
                "best_match": {
                    "tradereq_id": trade.pk,
                    "reqname": trade.reqname,
                    "requester": trade.requester.username,
                    "requester_id": trade.requester.pk,
                    "score": best_match['score'],
                    "category": getattr(trade, 'classified_category', None),
                    "exchange": getattr(trade, 'exchange', None),
                    "reqdeadline": getattr(trade, 'reqdeadline', None),
                    "score_breakdown": best_match['breakdown'],
                }
            })
        else:
            return Response({
                "best_match": None,
                "message": "No compatible trades found"
            })
            
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_submit_rating(request):
    """
    TR1: Submit trade rating with AI sentiment analysis.
    Called after user submits proof of completing a trade in Active Trades tab.
    Generates 1-5 star rating from review text using AI.
    """
    available, error_response = check_ai_available()
    if not available:
        return error_response
    
    serializer = SubmitRatingIn(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    tradereq_id = serializer.validated_data["tradereq_id"]
    review_text = serializer.validated_data["review_text"]
    
    try:
        # Get trade request
        trade = TradeRequest.objects.select_related('requester', 'responder').get(pk=tradereq_id)
        
        # Determine if current user is requester or responder
        is_requester = (request.user.pk == trade.requester.pk)
        is_responder = (request.user.pk == trade.responder.pk)
        
        if not (is_requester or is_responder):
            return Response(
                {"error": "You are not part of this trade"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if user already rated
        if is_requester and trade.requester_rated:
            return Response(
                {"error": "You have already rated this trade"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if is_responder and trade.responder_rated:
            return Response(
                {"error": "You have already rated this trade"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Analyze sentiment and get star rating
        sentiment_result = analyze_sentiment(review_text)
        stars = sentiment_result['stars']
        
        # Get or create ReputationSystem record
        reputation, created = ReputationSystem.objects.get_or_create(
            trade_request=trade
        )
        
        # Update appropriate fields based on who is rating
        if is_requester:
            reputation.requester_starcount = stars
            reputation.requester_rating_desc = review_text
            reputation.requester_rated_at = timezone.now()
            trade.requester_rated = True
            partner = trade.responder
        else:  # is_responder
            reputation.responder_starcount = stars
            reputation.responder_rating_desc = review_text
            reputation.responder_rated_at = timezone.now()
            trade.responder_rated = True
            partner = trade.requester
        
        reputation.save()
        trade.save()
        
        # Update partner's average rating
        partner_ratings = ReputationSystem.objects.filter(
            trade_request__requester=partner,
            responder_starcount__isnull=False
        ).values_list('responder_starcount', flat=True).union(
            ReputationSystem.objects.filter(
                trade_request__responder=partner,
                requester_starcount__isnull=False
            ).values_list('requester_starcount', flat=True)
        )
        
        if partner_ratings:
            avg_rating = sum(partner_ratings) / len(partner_ratings)
            partner.avgStars = round(avg_rating, 2)
            partner.ratingCount = len(partner_ratings)
            partner.save()
        
        return Response({
            'success': True,
            'stars': stars,
            'sentiment': sentiment_result['sentiment'],
            'confidence': sentiment_result['confidence'],
            'review_text': review_text,
            'rated_at': reputation.requester_rated_at if is_requester else reputation.responder_rated_at,
            'partner_updated': {
                'username': partner.username,
                'new_avg_stars': float(partner.avgStars),
                'total_ratings': partner.ratingCount,
            }
        })
        
    except TradeRequest.DoesNotExist:
        return Response(
            {"error": f"Trade request {tradereq_id} not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ...existing imports...
from ..services.onboarding import OnboardingService

# ...existing code...

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def onboarding_picks_for_request(request):
    """
    Get personalized best picks based on user's first trade request.
    
    This endpoint is used in the onboarding flow (Onboarding2) to show
    highly relevant matches based on the actual request they just made.
    
    Query params:
    - tradereq_id: The trade request ID (required)
    
    Returns:
        {
            "best_picks": [
                {
                    "tradereq_id": 123,
                    "requester_id": 456,
                    "name": "John Doe",
                    "username": "johndoe",
                    "need": "I need plumbing help",
                    "offer": "Home Services",
                    "deadline": "2025-12-31",
                    "profilePicUrl": "...",
                    "rating": 4.5,
                    "ratingCount": 10,
                    "level": 5,
                    "match_score": 85.3
                },
                ...
            ],
            "count": 6,
            "request_text": "I need plumbing help"
        }
    """
    tradereq_id = request.GET.get('tradereq_id')
    
    if not tradereq_id:
        return Response(
            {'error': 'tradereq_id is required'},
            status=400
        )
    
    try:
        tradereq_id = int(tradereq_id)
    except ValueError:
        return Response(
            {'error': 'tradereq_id must be an integer'},
            status=400
        )
    
    # Generate personalized picks
    service = OnboardingService()
    best_picks = service.get_best_picks_for_request(
        tradereq_id=tradereq_id,
        requester_id=request.user.id,
        limit=6
    )
    
    # Get request text for context
    try:
        trade_request = TradeRequest.objects.get(
            tradereq_id=tradereq_id,
            requester_id=request.user.id
        )
        request_text = trade_request.reqname
    except TradeRequest.DoesNotExist:
        request_text = ""
    
    return Response({
        'best_picks': best_picks,
        'count': len(best_picks),
        'request_text': request_text
    })