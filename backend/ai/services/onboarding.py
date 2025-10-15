"""
Onboarding-specific AI recommendation service.
Provides robust 'offer' label fallback so frontend never receives a hyphen.
"""
import logging
from typing import List, Dict, Any, Optional, Set
from django.contrib.auth import get_user_model
from django.db.models import Q

from accounts.models import TradeRequest, UserSkill, UserInterest, GenSkill, SpecSkill
from .embedding import EmbeddingService
from .text_utils import extract_keywords
from .matching import MatchingService

logger = logging.getLogger(__name__)
User = get_user_model()


class OnboardingService:
    """Service for generating onboarding recommendations."""

    def __init__(self):
        self.embedding_service = EmbeddingService()
        try:
            self.matching_service = MatchingService()
        except Exception:
            self.matching_service = None

    def get_best_picks_for_request(
        self,
        tradereq_id: int,
        requester_id: int,
        limit: int = 6
    ) -> List[Dict[str, Any]]:
        """
        Return list of users who can OFFER what the requester NEEDS.
        Logic: User says "I need X" → Find people who have skills in X
        """
        try:
            # Get the user's first trade request (what they NEED)
            user_trade_request = TradeRequest.objects.select_related('requester').get(
                tradereq_id=tradereq_id,
                requester_id=requester_id
            )
        except TradeRequest.DoesNotExist:
            logger.warning("TradeRequest not found: %s", tradereq_id)
            return []

        # ✅ What the user NEEDS
        user_need_text = user_trade_request.reqname or ""
        user_need_keywords = extract_keywords(user_need_text)
        user_need_category = user_trade_request.classified_category or ""
        
        logger.info(f"🎯 User needs: '{user_need_text}' | Category: '{user_need_category}' | Keywords: {user_need_keywords}")
        
        user_need_embedding = None
        try:
            user_need_embedding = self.embedding_service.get_embedding(user_need_text)
        except Exception as e:
            logger.warning(f"Failed to get embedding: {e}")

        # Get user's interests (what they're interested in receiving)
        user_interest_cats: Set[str] = set()
        user_interest_ids: Set[int] = set()
        try:
            user_interests = UserInterest.objects.filter(
                user_id=requester_id
            ).select_related('genSkills_id')
            
            for ui in user_interests:
                if ui.genSkills_id:
                    user_interest_cats.add(ui.genSkills_id.genCateg.lower())
                    user_interest_ids.add(ui.genSkills_id.genSkills_id)
        except Exception as e:
            logger.warning(f"Failed to get user interests: {e}")

        # Get ALL other users (not trade requests!)
        # We want to match users who have the SKILLS we need
        all_users = User.objects.exclude(
            id=requester_id
        ).prefetch_related(
            'userskill_set__specSkills__genSkills_id',
            'userinterest_set__genSkills_id'
        )[:200]

        logger.info(f"🔍 Evaluating {len(all_users)} potential helpers")

        scored_users = []
        
        for user in all_users:
            score, breakdown = self._calculate_user_match_score(
                user=user,
                user_need_text=user_need_text,
                user_need_embedding=user_need_embedding,
                user_need_keywords=user_need_keywords,
                user_need_category=user_need_category,
                user_interest_ids=user_interest_ids
            )
            
            # ✅ ALWAYS include users, even with score 0
            scored_users.append({
                'user': user,
                'score': score,
                'breakdown': breakdown
            })

        # Sort by score (highest first)
        scored_users.sort(key=lambda x: x['score'], reverse=True)
        
        # ✅ Take top N
        top_users = scored_users[:limit]

        logger.info(f"✅ Returning {len(top_users)} onboarding picks")

        # Format results
        results = []
        for entry in top_users:
            user = entry['user']
            
            # ✅ Determine what this user can OFFER (based on their skills)
            offer = self._determine_user_offer(
                user=user,
                viewer_need_keywords=user_need_keywords,
                viewer_need_category=user_need_category
            )
            
            if not offer:
                offer = "Skills & Services"

            # Get user's latest trade request (optional - shows what they need)
            user_latest_request = TradeRequest.objects.filter(
                requester_id=user.id
            ).order_by('-created_at').first()

            results.append({
                'tradereq_id': user_latest_request.tradereq_id if user_latest_request else None,
                'requester_id': user.id,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'username': user.username,
                'need': user_latest_request.reqname if user_latest_request else "Open to trades",
                'offer': offer,  # ✅ What they can OFFER (their skills)
                'deadline': user_latest_request.reqdeadline.isoformat() if (user_latest_request and user_latest_request.reqdeadline) else None,
                'profilePicUrl': user.profilePic if getattr(user, 'profilePic', None) else None,
                'rating': float(getattr(user, 'avgStars', 0) or 0),
                'ratingCount': int(getattr(user, 'ratingCount', 0) or 0),
                'level': int(getattr(user, 'level', 1) or 1),
                'match_score': round(entry['score'], 2),
                'score_breakdown': entry['breakdown'],
            })

        return results

    def _calculate_user_match_score(
        self,
        user: User,
        user_need_text: str,
        user_need_embedding: Optional[List[float]],
        user_need_keywords: List[str],
        user_need_category: str,
        user_interest_ids: Set[int]
    ) -> tuple[float, Dict[str, float]]:
        """
        Score how well this user can fulfill the requester's need.
        Higher score = better match for what user is looking for.
        """
        score = 0.0
        breakdown = {
            'skill_match': 0.0,
            'category_match': 0.0,
            'keyword_match': 0.0,
            'semantic_similarity': 0.0,
            'interest_alignment': 0.0,
        }

        # Get user's skills (what they can OFFER)
        try:
            user_skills = UserSkill.objects.filter(
                user=user
            ).select_related('specSkills__genSkills_id')
            
            user_skill_names = set()
            user_skill_gen_ids = set()
            user_skill_categories = set()
            
            for skill in user_skills:
                if skill.specSkills:
                    if skill.specSkills.specName:
                        user_skill_names.add(skill.specSkills.specName.lower())
                    if skill.specSkills.genSkills_id:
                        user_skill_gen_ids.add(skill.specSkills.genSkills_id.genSkills_id)
                        user_skill_categories.add(skill.specSkills.genSkills_id.genCateg.lower())
            
            # ✅ 1. DIRECT SKILL MATCH (0-40 points) - Most important!
            # Does user have skills that match what requester needs?
            skill_matches = 0
            for kw in user_need_keywords:
                kw_lower = kw.lower()
                # Check if keyword appears in user's skills
                if any(kw_lower in skill for skill in user_skill_names):
                    skill_matches += 1
                # Check if keyword matches skill category
                if any(kw_lower in cat for cat in user_skill_categories):
                    skill_matches += 1
            
            if skill_matches > 0:
                skill_score = min(40, skill_matches * 15)  # Up to 40 points
                breakdown['skill_match'] = skill_score
                score += skill_score
                
        except Exception as e:
            logger.warning(f"Skill match calculation failed: {e}")

        # ✅ 2. CATEGORY MATCH (0-30 points)
        # Does classified category match user's skill categories?
        if user_need_category:
            need_cat_lower = user_need_category.lower()
            if any(need_cat_lower in cat or cat in need_cat_lower for cat in user_skill_categories):
                breakdown['category_match'] = 30.0
                score += 30.0

        # ✅ 3. KEYWORD IN SKILLS (0-20 points)
        # Additional keyword matching
        if user_need_keywords and user_skill_names:
            keyword_matches = sum(
                1 for kw in user_need_keywords 
                if any(kw.lower() in skill for skill in user_skill_names)
            )
            if keyword_matches > 0:
                kw_score = min(20, (keyword_matches / len(user_need_keywords)) * 20)
                breakdown['keyword_match'] = kw_score
                score += kw_score

        # ✅ 4. SEMANTIC SIMILARITY (0-10 points)
        # Compare need text to user's skill descriptions
        if user_need_embedding is not None and user_skill_names:
            try:
                # Create text from user's skills
                skills_text = " ".join(user_skill_names)
                if skills_text:
                    skills_emb = self.embedding_service.get_embedding(skills_text)
                    similarity = self.embedding_service.cosine_similarity(user_need_embedding, skills_emb)
                    semantic_score = similarity * 10
                    breakdown['semantic_similarity'] = semantic_score
                    score += semantic_score
            except Exception as e:
                logger.warning(f"Semantic similarity failed: {e}")

        return float(score), breakdown

    def _determine_user_offer(
        self,
        user: User,
        viewer_need_keywords: List[str],
        viewer_need_category: str
    ) -> str:
        """
        Determine what the user can OFFER based on their skills.
        Priority:
        1) Skill that matches viewer's need keywords
        2) Skill that matches viewer's need category
        3) User's first/primary skill
        4) Fallback to generic
        """
        try:
            user_skills = UserSkill.objects.filter(
                user=user
            ).select_related('specSkills__genSkills_id')
            
            if not user_skills.exists():
                return ""
            
            # Try to match with viewer's need keywords
            for skill in user_skills:
                if skill.specSkills and skill.specSkills.specName:
                    skill_name = skill.specSkills.specName.lower()
                    for kw in viewer_need_keywords:
                        if kw.lower() in skill_name:
                            if skill.specSkills.genSkills_id:
                                return skill.specSkills.genSkills_id.genCateg
            
            # Try to match with viewer's need category
            if viewer_need_category:
                for skill in user_skills:
                    if skill.specSkills and skill.specSkills.genSkills_id:
                        skill_cat = skill.specSkills.genSkills_id.genCateg.lower()
                        if viewer_need_category.lower() in skill_cat or skill_cat in viewer_need_category.lower():
                            return skill.specSkills.genSkills_id.genCateg
            
            # Return first skill category
            first_skill = user_skills.first()
            if first_skill and first_skill.specSkills and first_skill.specSkills.genSkills_id:
                return first_skill.specSkills.genSkills_id.genCateg
                
        except Exception as e:
            logger.warning(f"Failed to determine offer skill: {e}")
        
        return ""


def get_onboarding_best_picks(user_id: int, limit: int = 6) -> List[Dict[str, Any]]:
    """Find latest request for user_id and return best picks."""
    try:
        latest = TradeRequest.objects.filter(requester_id=user_id).order_by('-created_at').first()
        if not latest:
            logger.info(f"No trade requests found for user {user_id}")
            return []
        
        svc = OnboardingService()
        return svc.get_best_picks_for_request(
            tradereq_id=latest.tradereq_id, 
            requester_id=user_id, 
            limit=limit
        )
    except Exception as e:
        logger.error("get_onboarding_best_picks error: %s", e, exc_info=True)
        return []


def create_interests_from_onboarding(user_id: int, tradereq_ids: List[int]) -> int:
    """
    Create UserInterest rows based on selected tradereq_ids.
    Returns number created.
    """
    created = 0
    try:
        user = User.objects.get(id=user_id)
        gen_to_add = set()
        
        for tid in tradereq_ids:
            try:
                tr = TradeRequest.objects.get(tradereq_id=tid)
                kws = extract_keywords(tr.reqname or "")
                
                for kw in kws:
                    try:
                        gs = GenSkill.objects.filter(genCateg__icontains=kw).first()
                        if gs:
                            gen_to_add.add(gs)
                    except Exception as e:
                        logger.warning(f"Failed to find GenSkill for keyword '{kw}': {e}")
                
                if tr.classified_category:
                    try:
                        gs = GenSkill.objects.filter(genCateg__icontains=tr.classified_category).first()
                        if gs:
                            gen_to_add.add(gs)
                    except Exception as e:
                        logger.warning(f"Failed to find GenSkill for category '{tr.classified_category}': {e}")
                        
            except TradeRequest.DoesNotExist:
                continue

        for gs in gen_to_add:
            ui, created_flag = UserInterest.objects.get_or_create(user=user, genSkills_id=gs)
            if created_flag:
                created += 1
                
    except Exception as e:
        logger.error("create_interests_from_onboarding error: %s", e, exc_info=True)

    return created


__all__ = ["OnboardingService", "get_onboarding_best_picks", "create_interests_from_onboarding"]