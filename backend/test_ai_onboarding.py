import os
import django
import numpy as np
from typing import List

# Set your Django settings module (project name appears to be `backend`)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from ai.services.onboarding import OnboardingService

# ----- Dummy model-like helpers -----
class DummyGenSkill:
    def __init__(self, genCateg: str):
        self.genCateg = genCateg

class DummySpecSkill:
    def __init__(self, specName: str, genSkill: DummyGenSkill = None):
        self.specName = specName
        self.genSkills_id = genSkill

class DummyUserSkill:
    def __init__(self, specSkills: DummySpecSkill = None):
        self.specSkills = specSkills

class DummyQS:
    """Minimal queryset-like wrapper used by onboarding service code."""
    def __init__(self, items: List[DummyUserSkill]):
        self._items = items

    def select_related(self, *args, **kwargs):
        return self

    def all(self):
        return self._items

    def first(self):
        return self._items[0] if self._items else None

class DummyUser:
    def __init__(self, pk, username, first_name="", last_name="", skills=None,
                 profilePic=None, avgStars=None, ratingCount=None, level=None, is_active=True):
        self.id = pk
        self.pk = pk
        self.username = username
        self.first_name = first_name
        self.last_name = last_name
        self.profilePic = profilePic
        self.avgStars = avgStars
        self.ratingCount = ratingCount
        self.level = level
        self.is_active = is_active
        # userskill_set used in onboarding; create DummyQS of DummyUserSkill
        self.userskill_set = DummyQS(skills or [])

# ----- Stub embedding service to avoid network calls -----
class StubEmbeddingService:
    def get_embedding(self, text: str):
        # deterministic simple vector based on text length / token content
        v = np.array([sum(ord(c) for c in text) % 100 + (i*3) for i in range(8)], dtype=float)
        # normalize
        norm = np.linalg.norm(v)
        return (v / norm).tolist() if norm != 0 else v.tolist()

    def cosine_similarity(self, a, b):
        a_arr = np.array(a, dtype=float)
        b_arr = np.array(b, dtype=float)
        na = np.linalg.norm(a_arr)
        nb = np.linalg.norm(b_arr)
        if na == 0 or nb == 0:
            return 0.0
        return float(np.dot(a_arr, b_arr) / (na * nb))

# ----- Test scenario -----
def main():
    svc = OnboardingService()
    # replace real embedding service with stub
    svc.embedding_service = StubEmbeddingService()

    # create dummy gen/ spec skills
    gen_home = DummyGenSkill("Home Services")
    gen_tech = DummyGenSkill("Technology")
    spec_plumbing = DummySpecSkill("Plumbing", gen_home)
    spec_electrical = DummySpecSkill("Electrical Repair", gen_home)
    spec_web = DummySpecSkill("Web Development", gen_tech)

    # Users: one plumbing pro, one web dev, one with no skills
    user_plumber = DummyUser(
        pk=1, username="plumb_guy", first_name="Joe", last_name="Fix",
        skills=[DummyUserSkill(spec_plumbing), DummyUserSkill(spec_electrical)],
        profilePic=None, avgStars=4.7, ratingCount=12, level=6
    )
    user_dev = DummyUser(
        pk=2, username="dev_gal", first_name="Ada", last_name="Code",
        skills=[DummyUserSkill(spec_web)],
        profilePic=None, avgStars=4.2, ratingCount=5, level=4
    )
    user_no_skills = DummyUser(
        pk=3, username="no_skill", first_name="Sam", last_name="None",
        skills=[],
        profilePic=None, avgStars=None, ratingCount=0, level=1
    )

    # Dummy trade/request context
    request_text = "I need urgent plumbing repair for a leaking sink"
    request_embedding = svc.embedding_service.get_embedding(request_text)
    keywords = ["plumbing", "leak", "sink"]

    users = [user_plumber, user_dev, user_no_skills]

    print("Testing onboarding scoring with dummy users\n")
    for u in users:
        score = svc._calculate_match_score(
            user=u,
            request_text=request_text,
            request_embedding=request_embedding,
            keywords=keywords,
            deadline=None
        )
        offer = svc._determine_offer_skill(user=u, request_text=request_text, keywords=keywords)
        print(f"user={u.username:12s} | score={score:6.2f} | offer='{offer}'")

if __name__ == "__main__":
    main()