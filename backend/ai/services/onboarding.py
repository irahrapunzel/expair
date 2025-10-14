"""
Onboarding-specific AI recommendation service.
Provides robust 'offer' label fallback so frontend never receives a hyphen.
"""
import logging
from typing import List, Dict, Any, Optional, Set
from django.contrib.auth import get_user_model

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
        # MatchingService is optional; keep if you have extra ranking logic
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
        """Return list of top responder dicts with guaranteed 'offer' label."""
        try:
            trade_request = TradeRequest.objects.select_related('requester').get(
                tradereq_id=tradereq_id,
                requester_id=requester_id
            )
        except TradeRequest.DoesNotExist:
            logger.warning("TradeRequest not found: %s", tradereq_id)
            return []

        request_text = trade_request.reqname or ""
        keywords = extract_keywords(request_text)
        request_embedding = None
        try:
            request_embedding = self.embedding_service.get_embedding(request_text)
        except Exception:
            request_embedding = None

        # collect requester interest categories for shared-interest matching
        requester_cats: Set[str] = set()
        try:
            for ui in trade_request.requester.userinterest_set.select_related('genSkills_id').all():
                if ui.genSkills_id and ui.genSkills_id.genCateg:
                    requester_cats.add(ui.genSkills_id.genCateg)
        except Exception:
            requester_cats = set()

        # candidate users (exclude requester)
        potential_users = User.objects.exclude(id=requester_id).filter(is_active=True).prefetch_related(
            'userskill_set__specSkills__genSkills_id',
            'userinterest_set__genSkills_id'
        )

        scored = []
        for user in potential_users:
            score = self._calculate_match_score(
                user=user,
                request_text=request_text,
                request_embedding=request_embedding,
                keywords=keywords,
                deadline=trade_request.reqdeadline
            )
            if score > 0:
                scored.append({'user': user, 'score': score})

        # fallback: if none have score > 0, include some users with any skill
        if not scored:
            for user in potential_users[:limit * 4]:
                scored.append({'user': user, 'score': 0.0})

        scored.sort(key=lambda x: x['score'], reverse=True)
        top = scored[:limit]

        results = []
        for entry in top:
            user = entry['user']
            offer = self._determine_offer_skill(
                user=user,
                request_text=request_text,
                keywords=keywords,
                requester_interest_cats=requester_cats
            )
            # defensive fallback: if still falsy, try responder/requester first skill names
            if not offer:
                try:
                    first_skill = user.userskill_set.select_related('specSkills__genSkills_id').first()
                    if first_skill and first_skill.specSkills:
                        # Prefer specific skill name
                        spec_name = getattr(first_skill.specSkills, "specName", None)
                        if spec_name:
                            offer = spec_name
                        else:
                            # fallback to general category name if specific not present
                            gen = getattr(first_skill.specSkills, "genSkills_id", None)
                            if gen and getattr(gen, "genCateg", None):
                                offer = gen.genCateg
                except Exception:
                    offer = None

            if not offer:
                # try requester skills/interests as last resort
                try:
                    r_first_specific = trade_request.requester.userskill_set.select_related('specSkills__genSkills_id').first()
                    if r_first_specific and r_first_specific.specSkills:
                        spec_name = getattr(r_first_specific.specSkills, "specName", None)
                        if spec_name:
                            offer = spec_name
                        else:
                            gen = getattr(r_first_specific.specSkills, "genSkills_id", None)
                            if gen and getattr(gen, "genCateg", None):
                                offer = gen.genCateg
                    else:
                        r_first_interest = trade_request.requester.userinterest_set.select_related('genSkills_id').first()
                        if r_first_interest and r_first_interest.genSkills_id and getattr(r_first_interest.genSkills_id, "genCateg", None):
                            offer = r_first_interest.genSkills_id.genCateg
                except Exception:
                    offer = None

            if not offer:
                offer = "Skills & Services"

            results.append({
                'tradereq_id': tradereq_id,
                'requester_id': user.id,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'username': user.username,
                'need': request_text,
                'offer': offer,
                'deadline': trade_request.reqdeadline.isoformat() if trade_request.reqdeadline else None,
                'profilePicUrl': user.profilePic if getattr(user, 'profilePic', None) else None,
                'rating': float(getattr(user, 'avgStars', 0) or 0),
                'ratingCount': int(getattr(user, 'ratingCount', 0) or 0),
                'level': int(getattr(user, 'level', 1) or 1),
                'match_score': round(entry.get('score', 0.0), 2),
            })

        return results

    def _calculate_match_score(
        self,
        user: User,
        request_text: str,
        request_embedding: Optional[List[float]],
        keywords: List[str],
        deadline: Optional[Any]
    ) -> float:
        """
        Lightweight scoring: semantic similarity (if available) + keyword matches.
        Keep it conservative so we return >0 only for somewhat relevant users.
        """
        score = 0.0

        # semantic similarity
        try:
            skill_texts = []
            for us in user.userskill_set.select_related('specSkills__genSkills_id').all():
                if us.specSkills and us.specSkills.specName:
                    skill_texts.append(us.specSkills.specName)
            if skill_texts and request_embedding is not None:
                combined = ", ".join(skill_texts)
                u_emb = self.embedding_service.get_embedding(combined)
                sim = self.embedding_service.cosine_similarity(request_embedding, u_emb)
                score += sim * 40  # scale to 0..40
        except Exception:
            pass

        # keyword overlap
        try:
            user_skill_names = [us.specSkills.specName.lower() for us in user.userskill_set.select_related('specSkills').all() if us.specSkills and us.specSkills.specName]
            if keywords and user_skill_names:
                matches = 0
                for kw in keywords:
                    if any(kw.lower() in s for s in user_skill_names):
                        matches += 1
                score += (matches / max(1, len(keywords))) * 30
        except Exception:
            pass

        # small reward if user has interests that match a keyword
        try:
            user_interest_names = [ui.genSkills_id.genCateg.lower() for ui in user.userinterest_set.select_related('genSkills_id').all() if ui.genSkills_id and ui.genSkills_id.genCateg]
            if keywords and user_interest_names:
                if any(kw.lower() in c for kw in keywords for c in user_interest_names):
                    score += 10
        except Exception:
            pass

        return float(score)


    def _determine_offer_skill(
        self,
        user: User,
        request_text: str,
        keywords: List[str],
        requester_interest_cats: Optional[set] = None
    ) -> str:
        """
        Priority:
        1) Shared interest category with requester
        2) User's first interest category
        3) User's first skill category (genCateg)
        4) Requester's first interest or skill
        5) "Skills & Services"
        """
        # 1) shared interests
        try:
            user_interest_cats = [ui.genSkills_id.genCateg for ui in user.userinterest_set.select_related('genSkills_id').all() if ui.genSkills_id and ui.genSkills_id.genCateg]
            if requester_interest_cats:
                for cat in user_interest_cats:
                    if cat in requester_interest_cats:
                        return cat
        except Exception:
            user_interest_cats = []

        # 2) user's first interest
        if user_interest_cats:
            return user_interest_cats[0]

        # 3) user's first skill category
        try:
            first_skill = user.userskill_set.select_related('specSkills__genSkills_id').first()
            if first_skill and first_skill.specSkills and first_skill.specSkills.genSkills_id:
                return first_skill.specSkills.genSkills_id.genCateg
        except Exception:
            pass

        # 4) requester's first interest or skill (caller may pass requester interests)
        # caller-side will try requester; make no-op here (will be tried by caller)
        return ""  # empty indicates caller should try other fallbacks


# Module-level convenience functions for views.py (views expect these names)
def get_onboarding_best_picks(user_id: int, limit: int = 6) -> List[Dict[str, Any]]:
    """Find latest request for user_id and return best picks."""
    try:
        latest = TradeRequest.objects.filter(requester_id=user_id).order_by('-created_at').first()
        if not latest:
            return []
        svc = OnboardingService()
        return svc.get_best_picks_for_request(tradereq_id=latest.tradereq_id, requester_id=user_id, limit=limit)
    except Exception as e:
        logger.error("get_onboarding_best_picks error: %s", e, exc_info=True)
        return []


def create_interests_from_onboarding(user_id: int, tradereq_ids: List[int]) -> int:
    """
    Create UserInterest rows based on selected tradereq_ids (called after onboarding picks selection).
    Returns number created.
    """
    created = 0
    try:
        user = User.objects.get(id=user_id)
        gen_to_add = set()
        for tid in tradereq_ids:
            try:
                tr = TradeRequest.objects.get(tradereq_id=tid)
            except TradeRequest.DoesNotExist:
                continue
            # keywords from reqname
            kws = extract_keywords(tr.reqname or "")
            if kws:
                # attempt to map keywords to GenSkill
                for kw in kws:
                    gs = GenSkill.objects.filter(genCateg__icontains=kw).first()
                    if gs:
                        gen_to_add.add(gs)
            # include classified_category if present
            if tr.classified_category:
                gs = GenSkill.objects.filter(genCateg__icontains=tr.classified_category).first()
                if gs:
                    gen_to_add.add(gs)

        for gs in gen_to_add:
            ui, created_flag = UserInterest.objects.get_or_create(user=user, genSkills_id=gs)
            if created_flag:
                created += 1
    except Exception as e:
        logger.error("create_interests_from_onboarding error: %s", e, exc_info=True)

    return created


__all__ = ["OnboardingService", "get_onboarding_best_picks", "create_interests_from_onboarding"]