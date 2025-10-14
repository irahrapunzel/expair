"""
Onboarding-specific AI recommendation service.
Generates personalized best picks based on the user's first trade request.
"""

import logging
from typing import List, Dict, Any, Optional
from django.contrib.auth import get_user_model
from django.db.models import Q
from accounts.models import TradeRequest, UserSkill, UserInterest, GenSkill
from .embedding import EmbeddingService
from .text_utils import extract_keywords
from .matching import MatchingService

logger = logging.getLogger(__name__)
User = get_user_model()

class OnboardingService:
    """Service for generating onboarding recommendations."""
    
    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.matching_service = MatchingService()
    
    def get_best_picks_for_request(
        self,
        tradereq_id: int,
        requester_id: int,
        limit: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Generate best picks based on a specific trade request.
        
        Scoring Algorithm:
        - Semantic similarity to request: 40%
        - Keyword match in user skills: 30%
        - Skill category relevance: 20%
        - User profile quality: 10%
        
        Args:
            tradereq_id: The trade request ID to base recommendations on
            requester_id: The user ID of the requester
            limit: Maximum number of recommendations
           
        Returns:
            List of user recommendations with matching scores
        """
        try:
            # Get the trade request
            trade_request = TradeRequest.objects.select_related('requester').get(
                tradereq_id=tradereq_id,
                requester_id=requester_id
            )
            
            request_text = trade_request.reqname
            request_deadline = trade_request.reqdeadline

            # Requester's interest categories (used to prefer shared interests)
            requester_cats = set()
            try:
                for ui in trade_request.requester.userinterest_set.select_related('genSkills_id').all():
                    if ui.genSkills_id and ui.genSkills_id.genCateg:
                        requester_cats.add(ui.genSkills_id.genCateg)
            except Exception:
                requester_cats = set()
            
            logger.info(f"🎯 Generating personalized picks for request: '{request_text}'")
            
            # Extract keywords from request (e.g., "plumbing" from "I need plumbing help")
            keywords = extract_keywords(request_text)
            logger.debug(f"📝 Extracted keywords: {keywords}")
            
            # Get semantic embedding of the request
            request_embedding = self.embedding_service.get_embedding(request_text)
            
            # Get all potential responders (exclude requester, only active users)
            potential_users = User.objects.exclude(
                id=requester_id
            ).filter(
                is_active=True
            ).prefetch_related(
                'userskill_set__specSkills__genSkills_id',
                'userinterest_set__genSkills_id'
            )
            
            scored_users = []
            
            for user in potential_users:
                score = self._calculate_match_score(
                    user=user,
                    request_text=request_text,
                    request_embedding=request_embedding,
                    keywords=keywords,
                    deadline=request_deadline
                )
                
                if score > 0:
                    scored_users.append({
                        'user': user,
                        'score': score
                    })
            
            # Sort by score descending
            scored_users.sort(key=lambda x: x['score'], reverse=True)
            
            # Take top N
            top_picks = scored_users[:limit]
            
            logger.info(f"✅ Found {len(top_picks)} matching users (from {len(scored_users)} candidates)")
            
            # Format results
            results = []
            for pick in top_picks:
                user = pick['user']
                
                # Determine what they can offer (best matching skill)
                can_offer = self._determine_offer_skill(
                    user=user,
                    request_text=request_text,
                    keywords=keywords
                )

                can_offer = self._determine_offer_skill(
                    user=user,
                    request_text=request_text,
                    keywords=keywords,
                    requester_interest_cats=requester_cats
                )

                # Defensive fallback to match explore_feed behavior
                if not can_offer:
                # try first gen skill or final fallback
                    first_skill = user.userskill_set.select_related('specSkills__genSkills_id').first()
                    if first_skill and first_skill.specSkills and first_skill.specSkills.genSkills_id:
                        can_offer = first_skill.specSkills.genSkills_id.genCateg
                    else:
                        can_offer = "Skills & Services"
                
                results.append({
                    'tradereq_id': tradereq_id,
                    'requester_id': user.id,
                    'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                    'username': user.username,
                    'need': request_text,
                    'offer': can_offer,
                    'deadline': request_deadline.isoformat() if request_deadline else None,
                    'profilePicUrl': user.profilePic if user.profilePic else None,
                    'rating': float(user.avgStars or 0),
                    'ratingCount': int(user.ratingCount or 0),
                    'level': int(user.level or 1),
                    'match_score': round(pick['score'], 2),
                })
            
            return results
            
        except TradeRequest.DoesNotExist:
            logger.error(f"❌ Trade request {tradereq_id} not found")
            return []
        except Exception as e:
            logger.error(f"❌ Error generating best picks: {e}", exc_info=True)
            return []
    
    def _calculate_match_score(
        self,
        user: User,
        request_text: str,
        request_embedding: List[float],
        keywords: List[str],
        deadline: Optional[Any]
    ) -> float:
        """
        Calculate how well a user matches a trade request.
        
        Scoring breakdown:
        - Semantic similarity (40 points): How similar user's skills are to request
        - Keyword match (30 points): How many request keywords appear in user skills
        - Skill category match (20 points): If user has the right category
        - Profile quality (10 points): Rating, level, profile completeness
        
        Returns:
            Float score between 0-100
        """
        score = 0.0
        
        # Get user's skills with full details
        user_skills = list(user.userskill_set.select_related(
            'specSkills__genSkills_id'
        ).all())
        
        if not user_skills:
            logger.debug(f"⚠️ User {user.username} has no skills, score=0")
            return 0.0
        
        # 1. SEMANTIC SIMILARITY (40 points) ⭐ MOST IMPORTANT
        # Compare request embedding with user's skill embeddings
        skill_texts = []
        for skill in user_skills:
            if skill.specSkills:
                skill_texts.append(skill.specSkills.specName)
        
        if skill_texts:
            # Combine all skills into one text for embedding
            combined_skills = ", ".join(skill_texts)
            user_embedding = self.embedding_service.get_embedding(combined_skills)
            
            # Calculate cosine similarity
            similarity = self.embedding_service.cosine_similarity(
                request_embedding,
                user_embedding
            )
            
            semantic_score = similarity * 40
            score += semantic_score
            
            logger.debug(f"🔍 {user.username} semantic: {semantic_score:.1f}/40 (similarity={similarity:.3f})")
        
        # 2. KEYWORD MATCH (30 points)
        # Check if request keywords appear in user's skills
        if keywords:
            user_skill_names_lower = [
                skill.specSkills.specName.lower()
                for skill in user_skills
                if skill.specSkills
            ]
            
            keyword_matches = 0
            for keyword in keywords:
                keyword_lower = keyword.lower()
                if any(keyword_lower in skill_name for skill_name in user_skill_names_lower):
                    keyword_matches += 1
            
            keyword_score = (keyword_matches / len(keywords)) * 30 if keywords else 0
            score += keyword_score
            
            logger.debug(f"🔑 {user.username} keywords: {keyword_score:.1f}/30 ({keyword_matches}/{len(keywords)} matches)")
        
        # 3. SKILL CATEGORY MATCH (20 points)
        # Check if user has the right general category
        request_lower = request_text.lower()
        user_categories = set()
        
        for skill in user_skills:
            if skill.specSkills and skill.specSkills.genSkills_id:
                category = skill.specSkills.genSkills_id.genCateg.lower()
                user_categories.add(category)
        
        # Check if any category keyword appears in request
        # e.g., "plumbing" → "Home Services"
        category_keywords = {
            'home services': ['plumbing', 'electrical', 'carpentry', 'cleaning', 'repair'],
            'technology': ['website', 'app', 'software', 'programming', 'coding', 'tech'],
            'creative': ['design', 'graphic', 'video', 'photo', 'art', 'music'],
            'education': ['tutor', 'teach', 'lesson', 'course', 'training'],
            'health & fitness': ['fitness', 'workout', 'yoga', 'nutrition', 'health'],
        }
        
        category_match = False
        for category, category_kws in category_keywords.items():
            if category in user_categories:
                if any(kw in request_lower for kw in category_kws):
                    category_match = True
                    break
        
        if category_match:
            score += 20
            logger.debug(f"✅ {user.username} category: 20/20 (match)")
        else:
            logger.debug(f"❌ {user.username} category: 0/20 (no match)")
        
        # 4. PROFILE QUALITY (10 points)
        profile_score = 0
        
        # Rating (0-5 points)
        if user.avgStars:
            if user.avgStars >= 4.5:
                profile_score += 5
            elif user.avgStars >= 4.0:
                profile_score += 4
            elif user.avgStars >= 3.5:
                profile_score += 3
            elif user.avgStars >= 3.0:
                profile_score += 2
        
        # Level (0-3 points)
        if user.level:
            if user.level >= 10:
                profile_score += 3
            elif user.level >= 5:
                profile_score += 2
            elif user.level >= 3:
                profile_score += 1
        
        # Profile picture (2 points)
        if user.profilePic:
            profile_score += 2
        
        score += min(profile_score, 10)
        
        logger.debug(f"👤 {user.username} profile: {profile_score}/10")
        logger.debug(f"🎯 {user.username} TOTAL: {score:.1f}/100\n")
        
        return score
    
def _determine_offer_skill(
    self,
    user: User,
    request_text: str,
    keywords: List[str],
    requester_interest_cats: Optional[set] = None
) -> str:
    """
    Determine what skill category the user can offer based on request context.
    """
    user_skills = list(user.userskill_set.select_related(
        'specSkills__genSkills_id'
    ).all())

    if not user_skills:
        return "Skills & Services"

    request_lower = request_text.lower()

    # Priority 1: Specific skill name mentioned in request
    for skill in user_skills:
        if skill.specSkills:
            skill_name_lower = skill.specSkills.specName.lower()
            if skill_name_lower in request_lower:
                if skill.specSkills.genSkills_id:
                    return skill.specSkills.genSkills_id.genCateg

    # Priority 2: Keyword match
    if keywords:
        for skill in user_skills:
            if skill.specSkills:
                skill_name_lower = skill.specSkills.specName.lower()
                for kw in keywords:
                    if kw.lower() in skill_name_lower:
                        if skill.specSkills.genSkills_id:
                            return skill.specSkills.genSkills_id.genCateg

    # Priority 2.5: Shared / user interests
    try:
        user_interest_cats = []
        for ui in user.userinterest_set.select_related('genSkills_id').all():
            if ui.genSkills_id and ui.genSkills_id.genCateg:
                user_interest_cats.append(ui.genSkills_id.genCateg)

        # If both requester and user share an interest, prefer that category
        if requester_interest_cats:
            for cat in user_interest_cats:
                if cat in requester_interest_cats:
                    return cat

        # Otherwise, if the user has any interest, use the first one
        if user_interest_cats:
            return user_interest_cats[0]
    except Exception:
        pass

    # Priority 3: First available category
    first_skill = user_skills[0]
    if first_skill.specSkills and first_skill.specSkills.genSkills_id:
        return first_skill.specSkills.genSkills_id.genCateg

    # Priority 4: Fallback
    return "Skills & Services"


# Module-level convenience functions for views.py
def get_onboarding_best_picks(user_id: int, limit: int = 6) -> List[Dict[str, Any]]:
    """
    Convenience wrapper for views to get onboarding recommendations.
    Gets the user's MOST RECENT trade request and generates picks based on it.
    """
    try:
        # Get user's most recent trade request
        latest_request = TradeRequest.objects.filter(
            requester_id=user_id
        ).order_by('-reqsubdate').first()
        
        if not latest_request:
            logger.warning(f"No trade requests found for user {user_id}")
            return []
        
        service = OnboardingService()
        return service.get_best_picks_for_request(
            tradereq_id=latest_request.tradereq_id,
            requester_id=user_id,
            limit=limit
        )
    except Exception as e:
        logger.error(f"Error in get_onboarding_best_picks: {e}", exc_info=True)
        return []


def create_interests_from_onboarding(user_id: int, tradereq_ids: List[int]) -> int:
    """
    Auto-create user interests based on selected trades during onboarding.
    
    Args:
        user_id: The user's ID
        tradereq_ids: List of trade request IDs user marked as interested
        
    Returns:
        Number of interests created
    """
    try:
        from accounts.models import TradeRequest, UserInterest, GenSkill
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        user = User.objects.get(id=user_id)
        
        created_count = 0
        gen_skills_to_add = set()
        
        # Extract categories from selected trades
        for tradereq_id in tradereq_ids:
            try:
                trade = TradeRequest.objects.get(tradereq_id=tradereq_id)
                
                # Extract keywords from trade name
                keywords = extract_keywords(trade.reqname)
                
                # Find matching general skills
                if keywords:
                    for keyword in keywords:
                        gen_skills = GenSkill.objects.filter(
                            genCateg__icontains=keyword
                        )[:2]  # Limit to 2 per keyword
                        gen_skills_to_add.update(gen_skills)
                
                # Also add category if classified
                if hasattr(trade, 'classified_category') and trade.classified_category:
                    category_skills = GenSkill.objects.filter(
                        genCateg__icontains=trade.classified_category
                    )[:1]
                    gen_skills_to_add.update(category_skills)
                    
            except TradeRequest.DoesNotExist:
                logger.warning(f"Trade request {tradereq_id} not found")
                continue
        
        # Create UserInterest entries
        for gen_skill in gen_skills_to_add:
            _, created = UserInterest.objects.get_or_create(
                user_id=user,
                genSkills_id=gen_skill
            )
            if created:
                created_count += 1
        
        logger.info(f"✅ Created {created_count} interests for user {user_id}")
        return created_count
        
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return 0
    except Exception as e:
        logger.error(f"❌ Error creating interests: {e}", exc_info=True)
        return 0


__all__ = ["OnboardingService", "get_onboarding_best_picks", "create_interests_from_onboarding"]