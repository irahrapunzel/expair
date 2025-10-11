"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  Star,
  Heart,
  Flag,
  Link as LinkIcon,
} from "lucide-react";
import AnimatedLevelBar from "../../../../components/ui/animated-level-bar";
import ProfileAvatar from "@/components/avatar";

// ===== XP / Level  based on CUMULATIVE THRESHOLDS =====
const LVL_CAPS = [
  50, 75, 100, 125, 150, 175, 200, 230, 260, 300, 350, 400, 460, 520, 600, 700,
  800, 900, 1000, 1100, 1250, 1400, 1600, 1800, 2000, 2300, 2600, 2900, 3200,
  3500, 3800, 4200, 4600, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000,
  9600, 10200, 10800, 11500, 12200, 12900, 13600, 14300, 15000, 15800, 16600,
  17500, 18400, 19300, 20300, 21300, 22300, 23300, 24300, 25400, 26500, 27700,
  28900, 30100, 31300, 32600, 33900, 35200, 36500, 37900, 39300, 40700, 42100,
  43600, 45100, 46600, 48100, 49600, 51100, 52700, 54300, 55900, 57500, 59200,
  60900, 62600, 64300, 66000, 67700, 69500, 71300, 73100, 74900, 76700, 78500,
  80300, 82100, 85000, 50, 75, 100, 125, 150, 175, 200, 230, 260, 300, 350, 400,
  460, 520, 600, 700, 800, 900, 1000, 1100, 1250, 1400, 1600, 1800, 2000, 2300,
  2600, 2900, 3200, 3500, 3800, 4200, 4600, 5000, 5500, 6000, 6500, 7000, 7500,
  8000, 8500, 9000, 9600, 10200, 10800, 11500, 12200, 12900, 13600, 14300,
  15000, 15800, 16600, 17500, 18400, 19300, 20300, 21300, 22300, 23300, 24300,
  25400, 26500, 27700, 28900, 30100, 31300, 32600, 33900, 35200, 36500, 37900,
  39300, 40700, 42100, 43600, 45100, 46600, 48100, 49600, 51100, 52700, 54300,
  55900, 57500, 59200, 60900, 62600, 64300, 66000, 67700, 69500, 71300, 73100,
  74900, 76700, 78500, 80300, 82100, 85000,
];

const clampLevel = (lvl) =>
  Math.max(1, Math.min(100, Math.floor(Number(lvl) || 1)));

// Width of the current level band (XP range inside this level)
const getLevelWidth = (lvl) => LVL_CAPS[clampLevel(lvl) - 1] || 1;

// Derive level + in-level progress from lifetime total XP (tot_xppts)
// Inclusive boundary: exact cap stays on the same level
const deriveFromTotalXp = (totalXp) => {
  const t = Math.max(0, Number(totalXp) || 0);

  let cumulative = 0;
  let level = 1;

  for (let i = 0; i < LVL_CAPS.length; i++) {
    if (t < cumulative + LVL_CAPS[i]) {
      // Still inside this level
      const xpInLevel = t - cumulative;
      const levelWidth = LVL_CAPS[i];
      return {
        level: i + 1,
        xpInLevel,
        levelWidth,
        prevCap: cumulative,
        currCap: cumulative + LVL_CAPS[i],
      };
    }
    cumulative += LVL_CAPS[i];
  }

  // If XP exceeds all caps, clamp to max level
  const lastLevel = LVL_CAPS.length;
  return {
    level: lastLevel,
    xpInLevel: LVL_CAPS[lastLevel - 1],
    levelWidth: LVL_CAPS[lastLevel - 1],
    prevCap: cumulative - LVL_CAPS[lastLevel - 1],
    currCap: cumulative,
  };
};

// Helper function to format month input value to readable format
const formatMonthYear = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  }); // e.g., "January 2024"
};

const safeFixed = (val, digits = 1) => {
  const n = Number(val);
  return Number.isFinite(n) ? n.toFixed(digits) : (0).toFixed(digits);
};

const RAW = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
const API_BASE = RAW.includes("/api/accounts")
  ? RAW.replace(/\/+$/, "")
  : `${RAW.replace(/\/+$/, "")}/api/accounts`;

const inter = Inter({ subsets: ["latin"] });

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  console.log("Session data:", session);
  console.log("=== ADDED DEBUG ===");
  console.log("Access token present:", !!session?.access);

  const params = useParams();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // To handle loading state

  const [expanded, setExpanded] = useState(Array(5).fill(false)); // Initialize state for all categories
  const [sortOption, setSortOption] = useState("Latest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const slug = useMemo(() => {
    const raw = params?.userId;
    return Array.isArray(raw) ? raw[0] : raw || null;
  }, [params]);

  // For Basic Information editing
  const [basicInfoEditing, setBasicInfoEditing] = useState(false);
  const [editableFirstName, setEditableFirstName] = useState("");
  const [editableLastName, setEditableLastName] = useState("");
  const [editableBio, setEditableBio] = useState("");

  const [basicInfoSaving, setBasicInfoSaving] = useState(false);
  const [basicInfoError, setBasicInfoError] = useState(null);

  const [user, setUser] = useState({
    firstname: "",
    lastname: "",
    username: "",
    joined: "",
    rating: 0,
    reviews: 0,
    level: 1,
    xpPoints: 0,
    tot_xppts: 0,
    links: "",
  });

  const RAW_ORIGIN = RAW.replace(/\/api\/accounts\/?$/, "");

  const [showDeleteModalForCard, setShowDeleteModalForCard] = useState(null);
  const [tradeToDelete, setTradeToDelete] = useState(null);

  const [showAllCreds, setShowAllCreds] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);

 
  // ----------------------------
  // Skills Editing
  // ----------------------------

  const [skillsEditing, setSkillsEditing] = useState(false);
  const [skillsSaving, setSkillsSaving] = useState(false);
  const [skillsError, setSkillsError] = useState(null);

  // Track original skills for comparison and cancel functionality
  const [originalSkillGroups, setOriginalSkillGroups] = useState([]);
  const [selectedSkillGroups, setSelectedSkillGroups] = useState([]);

  // For adding skills
  const [showAddSkillForm, setShowAddSkillForm] = useState(false);
  const [addSkillCategory, setAddSkillCategory] = useState("");
  const [selectedSpecificSkills, setSelectedSpecificSkills] = useState([]);

  // ----------------------------
  // Interests Editing
  // ----------------------------

  // Interests editing state
  const [interestsEditing, setInterestsEditing] = useState(false);
  const [interestsSaving, setInterestsSaving] = useState(false);
  const [interestsError, setInterestsError] = useState(null);

  // Track original interests for comparison and cancel functionality
  const [originalUserInterests, setOriginalUserInterests] = useState([]);
  const [userInterests, setUserInterests] = useState([]);

  // For adding interests
  const [showAddInterestForm, setShowAddInterestForm] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);

  const [postedTrades, setPostedTrades] = useState([]);
  const [postedTradesLoading, setPostedTradesLoading] = useState(true);
  const [postedTradesError, setPostedTradesError] = useState(null);

  // ----------------------------
  // Credentials Editing
  // ----------------------------

  const [userCredentials, setUserCredentials] = useState([]);

  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsError, setCredentialsError] = useState(null);
  const [editingCredentials, setEditingCredentials] = useState(null); // null | "all" | credential object

  // Handle interest in trade for profile public view
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!basicInfoEditing) {
      setEditableFirstName(user.firstname || "");
      setEditableLastName(user.lastname || "");
      setEditableBio(user.bio || "");
    }
  }, [user, basicInfoEditing]);

  useEffect(() => {
    if (!user) return;
    const s = (
      user.verification_status
        ? user.verification_status
        : user.is_verified
        ? "VERIFIED"
        : user.userVerifyId
        ? "PENDING"
        : "UNVERIFIED"
    ).toLowerCase();
    setVerificationStatus(s);
  }, [user?.verification_status, user?.is_verified, user?.userVerifyId]);

  const handleDeleteTrade = async (trade) => {
    const tradereqId =
      trade?.tradereq_id || trade?.id || tradeToDelete?.tradereq_id;
    if (!tradereqId) {
      console.error("No tradereq_id provided for delete.", {
        trade,
        tradeToDelete,
      });
      alert("Unable to delete: missing trade identifier.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/trade-requests/${tradereqId}/delete/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session?.access}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setPostedTrades((prevTrades) =>
          prevTrades.filter((t) => t.tradereq_id !== tradereqId)
        );
        setShowDeleteModalForCard(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete trade request");
      }
    } catch (error) {
      console.error("Error deleting trade request:", error);
      alert("Failed to delete trade request");
    }
  };

  const isOwnProfile = useMemo(() => {
    console.log("=== IS OWN PROFILE CHECK ===");
    console.log("Current slug:", slug);
    console.log(
      "Session user ID:",
      session?.user?.user_id || session?.user?.id
    );
    console.log(
      "Session user username:",
      session?.user?.username || session?.username
    );
    console.log("Loaded user ID:", user?.id);
    console.log("Loaded user username:", user?.username);

    // If viewing /me, it's always own profile
    if (slug === "me") {
      console.log("Viewing /me - own profile");
      return true;
    }

    // If not authenticated, can't be own profile
    if (!session?.user && !session?.access) {
      console.log("Not authenticated - not own profile");
      return false;
    }

    // Get current user info from session
    const sessionUserId = session?.user?.user_id || session?.user?.id;
    const sessionUsername = session?.user?.username || session?.username;

    // Check if slug matches current user ID or username
    const slugIsUserId =
      sessionUserId && String(sessionUserId) === String(slug);
    const slugIsUsername =
      sessionUsername &&
      sessionUsername.toLowerCase() === String(slug).toLowerCase();

    // Also check if loaded user data matches session user
    const loadedUserMatches =
      user?.id && sessionUserId && user.id === sessionUserId;

    const result = slugIsUserId || slugIsUsername || loadedUserMatches;
    console.log("Final isOwnProfile result:", result);

    return result;
  }, [slug, session, user?.id, user?.username]);

  const fetchPostedTrades = async () => {
    console.log("isOwnProfile:", isOwnProfile);
    console.log("slug:", slug);

    const url = isOwnProfile
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/posted-trades/`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/posted-trades/${slug}/`;

    try {
      setPostedTradesLoading(true);
      setPostedTradesError(null);

      // 🧠 Define headers FIRST
      const headers = new Headers();
      headers.append("Content-Type", "application/json");
      if (session?.access) {
        headers.append("Authorization", `Bearer ${session.access}`);
      }

      console.log("🔑 Sending headers:", Object.fromEntries(headers.entries()));
      console.log("Fetching posted trades from:", url);

      const response = await fetch(url, { method: "GET", headers });

      console.log("📩 Response status:", response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error(
          "❌ Failed to fetch posted trades:",
          response.status,
          errText
        );
        throw new Error(`Failed to fetch posted trades (${response.status})`);
      }

      const data = await response.json();
      console.log("✅ Posted trades data received:", data);

      const transformed = data.posted_trades.map((trade) => ({
        id: trade.tradereq_id,
        tradereq_id: trade.tradereq_id,
        name:
          (isOwnProfile
            ? `${session?.user?.first_name || ""} ${session?.user?.last_name || ""
              }`.trim()
            : `${user?.firstname || ""} ${user?.lastname || ""}`.trim()) ||
          session?.user?.username ||
          user?.username ||
          slug ||
          "User",

        rating: Number(
          isOwnProfile ? session?.user?.rating ?? 0 : user?.rating ?? 0
        ),
        reviews: Number(
          isOwnProfile ? session?.user?.reviews ?? 0 : user?.reviews ?? 0
        ),
        level: Number(
          isOwnProfile ? session?.user?.level ?? 1 : user?.level ?? 1
        ),
        needs: trade.reqname,
        interested:
          trade.interested_users
            ?.filter((u) => u.status === "PENDING")
            ?.map((u) => ({
              id: u.id,
              interest_id: u.interest_id,
              name: u.name,
              username: u.username,
              avatar: u.profilePic
                ? u.profilePic.startsWith("http")
                  ? u.profilePic
                  : `${process.env.NEXT_PUBLIC_BACKEND_URL}${u.profilePic}`
                : "/assets/defaultavatar.png",
              rating: u.rating,
              reviews: u.rating_count,
              level: u.level,
              status: u.status,
            })) || [],
        until: trade.deadline
          ? new Date(trade.deadline).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
          })
          : "No deadline",
      }));
      console.log("🧩 Transformed trades:", transformed);

      setPostedTrades(transformed);
    } catch (err) {
      console.error("❌ Failed to fetch posted trades:", err);
      setPostedTradesError(err.message);
    } finally {
      setPostedTradesLoading(false);
    }
  };

  useEffect(() => {
    console.log("=== USEEFFECT RUNNING ===");
    console.log("Slug:", slug);
    console.log("Session:", session);

    if (!slug) return;
    if (status === "loading") return; // Wait for session to load

    // Only require authentication for "me" endpoint
    if (slug === "me" && !session?.access) {
      console.error("[profile] NO ACCESS TOKEN for /me endpoint");
      setError("Authentication required");
      setLoading(false);
      return;
    }

    console.log("=== PROFILE LOAD START ===");
    console.log("Slug:", slug);
    console.log("Session status:", status);
    console.log("Full session object:", JSON.stringify(session, null, 2));

    const slugStr = String(slug).toLowerCase();
    const sessionUsername = String(
      session?.username || session?.user?.username || ""
    ).toLowerCase();
    const sessionUserId = session?.user?.user_id || session?.user?.id;

    const isNumeric = /^\d+$/.test(String(slug));
    const isUsername = /^[a-zA-Z0-9_.]{3,30}$/.test(String(slug));

    if (!(slugStr === "me" || isNumeric || isUsername)) {
      setError("Invalid profile URL.");
      setLoading(false);
      return;
    }

    // If authenticated user is viewing their own profile by ID or username, redirect to /me
    if (
      status === "authenticated" &&
      sessionUsername &&
      slugStr !== "me" &&
      (slugStr === sessionUsername ||
        (sessionUserId && slugStr === String(sessionUserId)))
    ) {
      console.log("Redirecting own profile view to /me");
      router.replace("/home/profile/me");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setError(null);
        setLoading(true);

        let url;
        if (slug === "me") {
          url = `${API_BASE}/me/`;
        } else if (isNumeric) {
          url = `${API_BASE}/users/${slug}/`;
        } else {
          url = `${API_BASE}/users/by-username/${encodeURIComponent(slug)}/`;
        }

        console.log("[profile] Making request to:", url);

        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };

        // Only add auth header if we have a token
        if (session?.access) {
          headers.Authorization = `Bearer ${session.access}`;
          console.log("[profile] Authorization header set");
        } else {
          console.log("[profile] No access token available");
        }

        // Make the request and log everything
        const res = await fetch(url, {
          method: "GET",
          headers,
          credentials: "include",
        });

        console.log("[profile] Response received:", res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error("[profile] Request failed:", res.status, errorText);
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        console.log("[profile] Data received:", data);

        if (cancelled) return;

        // Map the user data
        console.log("[profile] Mapping user data from:", data);

        setUser((prev) => ({
          ...prev,
          firstname: data.first_name || data.firstname || "",
          lastname: data.last_name || data.lastname || "",
          username: data.username || "",
          id:
            Number(data.user_id ?? data.id ?? (isNumeric ? slug : null)) ||
            null,
          profilePic: data.profilePic || null,
          joined: data.created_at
            ? new Date(data.created_at).toLocaleString(undefined, {
              month: "long",
              year: "numeric",
            })
            : "",
          rating: Number(data.avgStars ?? data.rating) || 0,
          reviews: Number(data.ratingCount ?? data.reviews) || 0,
          bio: data.bio || "",
          is_verified: Boolean(data.is_verified),
          verification_status: data.verification_status ?? null,
          userVerifyId: data.userVerifyId || null,
          links: data.links || "",

          // XP calculation
          ...(() => {
            const totalXp = Number(
              data.tot_XpPts ?? data.tot_xppts ?? data.totalXp ?? 0
            );
            const d = deriveFromTotalXp(totalXp);
            return {
              tot_xppts: totalXp,
              level: d.level,
              xpPoints: d.xpInLevel,
              _lvlWidth: d.levelWidth,
            };
          })(),
        }));

        setUserInterests(data.interests || []);
        setOriginalUserInterests(data.interests || []);

        console.log("[profile] User state updated successfully");

        // Load interests and skills
        const userId = isNumeric
          ? String(slug)
          : String(data.user_id ?? data.id ?? "");
        if (userId) {
          console.log(
            "[profile] Loading interests and skills for user:",
            userId
          );

          const [iRes, sRes] = await Promise.all([
            fetch(`${API_BASE}/users/${userId}/interests/`, { headers }),
            fetch(`${API_BASE}/users/${userId}/skills/`, { headers }),
          ]);

          console.log("[profile] Interests response:", iRes.status);
          console.log("[profile] Skills response:", sRes.status);

          if (iRes.ok && sRes.ok) {
            const [iJson, sJson] = await Promise.all([
              iRes.json(),
              sRes.json(),
            ]);

            if (cancelled) return;

            console.log("[profile] Interests data:", iJson);
            console.log("[profile] Skills data:", sJson);

            const interests = Array.isArray(iJson?.interests)
              ? iJson.interests
              : [];
            setUserInterests(data.interests || []);
            setOriginalUserInterests(data.interests || []);

            if (sJson?.skill_groups && typeof sJson.skill_groups === "object") {
              const skillGroupsArray = Object.entries(sJson.skill_groups).map(
                ([category, skills]) => ({
                  category,
                  skills: Array.isArray(skills) ? skills : [],
                })
              );
              setSelectedSkillGroups(skillGroupsArray);
              setOriginalSkillGroups(skillGroupsArray);
            } else {
              setSelectedSkillGroups([]);
              setOriginalSkillGroups([]);
            }
          }
        }
      } catch (e) {
        console.error("[profile] Load error:", e);
        console.error("[profile] Error stack:", e.stack);
        setError(`Failed to load profile: ${e.message}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, session?.access, status, router]);

  useEffect(() => {
    console.log("📡 [fetchPostedTrades useEffect] running...");
    console.log("slug:", slug);
    console.log("status:", status);
    console.log("session:", session);

    if (!slug) {
      console.log("⛔ No slug, skip fetchPostedTrades");
      return;
    }

    if (status === "loading") {
      console.log("⏳ Auth still loading");
      return;
    }

    // We’ll only run once the profile data (user state) is ready
    if (status === "authenticated" && session?.access) {
      console.log("✅ Running fetchPostedTrades now...");
      fetchPostedTrades();
    } else {
      console.log("⚠️ Not authenticated — skipping fetchPostedTrades");
    }
  }, [slug, status, session?.access]);

  useEffect(() => {
    if (!user) return;
    if (!basicInfoEditing) {
      // keep edit fields in sync when not editing
      setEditableFirstName?.(user.firstname || "");
      setEditableLastName?.(user.lastname || "");
      setEditableBio?.(user.bio || "");
    }
  }, [user, basicInfoEditing]);

  // Fetch credentials from the API
  useEffect(() => {
    // Only fetch if we have a user ID
    if (!user?.id) return;

    const fetchCredentials = async () => {
      setCredentialsLoading(true);
      setCredentialsError(null);

      try {
        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };

        // Add auth header if available
        if (session?.access) {
          headers.Authorization = `Bearer ${session.access}`;
        }

        // Fix: Use user.id instead of user object, and use consistent API_BASE
        const response = await fetch(
          `${API_BASE}/users/${user.id}/credentials/`,
          {
            method: "GET",
            headers,
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch credentials (${response.status}): ${errorText}`
          );
        }

        const data = await response.json();
        console.log("[credentials] Data received:", data);

        // Handle different possible response structures
        const credentials = data.credentials || data.results || data || [];
        setUserCredentials(Array.isArray(credentials) ? credentials : []);
      } catch (error) {
        console.error("[credentials] Fetch error:", error);
        setCredentialsError(error.message || "Failed to load credentials");
        setUserCredentials([]); // Reset to empty array on error
      } finally {
        setCredentialsLoading(false);
      }
    };

    fetchCredentials();
  }, [user?.id, session?.access]);

  const toggleCategory = (index) => {
    setExpanded((prev) => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const reviewRatings = useMemo(() => {
    const ratings = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
    reviews.forEach((review) => {
      const roundedRating = Math.floor(review.rating);
      if (ratings.hasOwnProperty(roundedRating)) {
        ratings[roundedRating]++;
      }
    });
    return ratings;
  }, [reviews]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchReviews = async () => {
      setReviewsLoading(true);
      setReviewsError(null);

      try {
        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };

        if (session?.access) {
          headers.Authorization = `Bearer ${session.access}`;
        }

        const response = await fetch(
          `${API_BASE}/users/${user.id}/reviews/`, // You'll need to create this endpoint
          {
            method: "GET",
            headers,
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch reviews (${response.status})`);
        }

        const data = await response.json();
        console.log("[reviews] Data received:", data);

        // Transform the backend data to match your frontend format
        const transformedReviews = (data.reviews || []).map((review) => ({
          requester:
            `${review.reviewer_first_name} ${review.reviewer_last_name}`.trim() ||
            review.reviewer_username,
          tradePartner:
            `${user.firstname} ${user.lastname}`.trim() || user.username,
          tradeCompletionDate: new Date(review.completed_at).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
            }
          ),
          requestTitle: review.request_title,
          offerTitle: review.offer_title,
          rating: review.rating,
          reviewDescription: review.review_description,
          likes: review.likes_count || 0,
          trade_id: review.trade_id,
        }));

        setReviews(transformedReviews);
      } catch (error) {
        console.error("[reviews] Fetch error:", error);
        setReviewsError(error.message || "Failed to load reviews");
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [user?.id, session?.access]);

  // Function to render stars based on a rating, now using filled and outlined stars
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    const stars = [];

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`full-${i}`}
          className="w-4 h-4 fill-[#906EFF] text-[#906EFF]"
        />
      );
    }
    // Half star
    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative w-4 h-4">
          <Star className="absolute w-4 h-4 text-gray-300 stroke-2" />
          <div className="absolute top-0 left-0 overflow-hidden w-1/2">
            <Star className="w-4 h-4 fill-[#906EFF] text-[#906EFF]" />
          </div>
        </div>
      );
    }
    // Empty stars with a clearer border
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300 stroke-2" />
      );
    }
    return stars;
  };

  // Full list of main categories (used for adding interests/skills)
  const mainCategories = [
    "Creative & Design",
    "Technical & IT",
    "Business & Management",
    "Communication & Interpersonal",
    "Health & Wellness",
    "Education & Training",
    "Home & Lifestyle",
    "Handiwork & Maintenance",
    "Digital & Social Media",
    "Language & Translation",
    "Financial & Accounting",
    "Sports & Fitness",
    "Arts & Performance",
    "Culture & Diversity",
    "Research & Critical Thinking",
  ];

  // Full subcategory mapping (used when adding a specific skill)
  const subcategories = {
    "Creative & Design": [
      "Graphic Design",
      "Photography",
      "Video Editing",
      "Illustration",
      "Animation",
    ],
    "Technical & IT": [
      "Web Development",
      "Software Development",
      "IT Support",
      "Network Administration",
      "Cybersecurity",
    ],
    "Business & Management": [
      "Project Management",
      "Business Consulting",
      "Human Resources",
      "Operations Management",
      "Marketing Strategy",
    ],
    "Communication & Interpersonal": [
      "Customer Service",
      "Public Relations",
      "Copywriting",
      "Translation",
      "Social Media Management",
    ],
    "Health & Wellness": [
      "Nutrition Coaching",
      "Personal Training",
      "Mental Health Counseling",
      "Yoga Instruction",
      "Physical Therapy",
    ],
    "Education & Training": [
      "Tutoring",
      "Language Instruction",
      "Corporate Training",
      "Curriculum Development",
      "Test Preparation",
    ],
    "Home & Lifestyle": [
      "Interior Decorating",
      "Cleaning Services",
      "Gardening",
      "Event Planning",
      "Personal Assistance",
    ],
    "Handiwork & Maintenance": [
      "Furniture Assembly",
      "Sewing & Alterations",
      "Handyman Services",
      "Painting & Decorating",
      "Crafting",
    ],
    "Digital & Social Media": [
      "Social Media Management",
      "Content Creation",
      "SEO",
      "Digital Advertising",
      "Email Marketing",
    ],
    "Language & Translation": [
      "Translation",
      "Interpretation",
      "Language Tutoring",
      "Transcription",
      "Localization",
    ],
    "Financial & Accounting": [
      "Bookkeeping",
      "Tax Preparation",
      "Financial Planning",
      "Payroll Services",
      "Auditing",
    ],
    "Sports & Fitness": [
      "Personal Training",
      "Group Fitness Instruction",
      "Sports Coaching",
      "Nutrition for Athletes",
      "Physical Therapy",
    ],
    "Arts & Performance": [
      "Music Lessons",
      "Dance Instruction",
      "Acting Coaching",
      "Visual Arts",
      "Creative Writing",
    ],
    "Culture & Diversity": [
      "Diversity Training",
      "Cultural Consulting",
      "Language & Cultural Exchange",
      "Community Outreach",
      "Inclusion Workshops",
    ],
    "Research & Critical Thinking": [
      "Market Research",
      "Data Analysis",
      "Academic Research",
      "Competitive Analysis",
      "Strategic Planning",
    ],
  };


  // ----------------------------
  // Verification state
  // ----------------------------

  // verification popup state
  const [showVerificationPopup, setShowVerificationPopup] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("unverified"); // "unverified" | "pending" | "verified"
  const [idFile, setIdFile] = useState(null); // File object
  const [idPreviewUrl, setIdPreviewUrl] = useState(null); // local preview URL for images

  useEffect(() => {
    if (!user) return;
    const s = (
      user.verification_status
        ? user.verification_status
        : user.is_verified
          ? "VERIFIED"
          : user.userVerifyId
            ? "PENDING"
            : "UNVERIFIED"
    ).toLowerCase();
    setVerificationStatus(s);
  }, [user?.verification_status, user?.is_verified, user?.userVerifyId]);

  // call this when input changes
  const handleIdFileChange = (file) => {
    if (!file) {
      setIdFile(null);
      setIdPreviewUrl(null);
      return;
    }

    setIdFile(file);

    // if it's an image, create a preview URL
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setIdPreviewUrl(url);
    } else {
      setIdPreviewUrl(null);
    }
  };

  async function handleSubmitVerification() {
    try {
      if (!idFile) {
        alert("Please choose a file first.");
        return;
      }
      const fd = new FormData();
      fd.append("userVerifyId", idFile);
      if (user?.id) fd.append("user_id", String(user.id)); // works even without auth cookie

      const headers = { Accept: "application/json" };
      if (session?.access) {
        headers.Authorization = `Bearer ${session.access}`;
      }

      const res = await fetch(`${API_BASE}/me/`, {
        method: "PATCH",
        credentials: "include",
        headers, // DO NOT set Content-Type when sending FormData
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Upload failed (${res.status}): ${txt.slice(0, 120)}`);
      }

      const updated = await res.json();
      // reflect backend response in local state
      setUser((prev) => ({
        ...prev,
        userVerifyId: updated.userVerifyId || prev.userVerifyId || null,
        is_verified: Boolean(updated.is_verified),
        verification_status:
          updated.verification_status ?? prev?.verification_status ?? null,
      }));

      // frontend UX: immediately show "pending"
      setVerificationStatus("pending");

      setVerificationStatus(
        (
          updated.verification_status ||
          (updated.is_verified
            ? "VERIFIED"
            : updated.userVerifyId
              ? "PENDING"
              : "UNVERIFIED")
        ).toLowerCase()
      );

      setShowVerificationPopup(false);
      setIdFile(null);
      setIdPreviewUrl(null);
    } catch (e) {
      console.error("[verify upload] error", e);
      alert(e.message || "Upload failed.");
    }
  }

  // Helper function to find differences between original and current skills
  const getSkillsDifferences = () => {
    const currentSkillsFlat = new Set();
    const originalSkillsFlat = new Set();

    // Flatten current skills into a Set of "category|skill" strings
    selectedSkillGroups.forEach((group) => {
      group.skills.forEach((skill) => {
        currentSkillsFlat.add(`${group.category}|${skill}`);
      });
    });

    // Flatten original skills
    originalSkillGroups.forEach((group) => {
      group.skills.forEach((skill) => {
        originalSkillsFlat.add(`${group.category}|${skill}`);
      });
    });

    // Find skills to add (in current but not in original)
    const skillsToAdd = [...currentSkillsFlat].filter(
      (skill) => !originalSkillsFlat.has(skill)
    );

    // Find skills to remove (in original but not in current)
    const skillsToRemove = [...originalSkillsFlat].filter(
      (skill) => !currentSkillsFlat.has(skill)
    );

    return { skillsToAdd, skillsToRemove };
  };

  // Function to get general skill ID from category name
  const getGeneralSkillId = async (categoryName) => {
    try {
      const headers = { Accept: "application/json" };
      if (session?.access) headers.Authorization = `Bearer ${session.access}`;

      const res = await fetch(`${API_BASE}/skills/general/`, { headers });
      if (!res.ok)
        throw new Error(`Failed to fetch general skills: ${res.status}`);

      const generalSkills = await res.json();
      const skill = generalSkills.find((s) => s.genCateg === categoryName);
      return skill ? skill.genSkills_id : null;
    } catch (e) {
      console.error("[getGeneralSkillId] error", e);
      throw e;
    }
  };

  // Function to get specific skill IDs from names within a category
  const getSpecificSkillIds = async (categoryName, skillNames) => {
    try {
      const genSkillId = await getGeneralSkillId(categoryName);
      if (!genSkillId)
        throw new Error(`General skill not found: ${categoryName}`);

      const headers = { Accept: "application/json" };
      if (session?.access) headers.Authorization = `Bearer ${session.access}`;

      const res = await fetch(
        `${API_BASE}/skills/specific/?genskills_id=${genSkillId}`,
        { headers }
      );
      if (!res.ok)
        throw new Error(`Failed to fetch specific skills: ${res.status}`);

      const specificSkills = await res.json();
      const skillIds = [];

      skillNames.forEach((skillName) => {
        const skill = specificSkills.find((s) => s.specName === skillName);
        if (skill) {
          skillIds.push(skill.specSkills_id);
        } else {
          console.warn(
            `Specific skill not found: ${skillName} in ${categoryName}`
          );
        }
      });

      return skillIds;
    } catch (e) {
      console.error("[getSpecificSkillIds] error", e);
      throw e;
    }
  };

  // add/remove category (removes whole group)
  const removeSkillCategory = (category) => {
    setSelectedSkillGroups((prev) =>
      prev.filter((g) => g.category !== category)
    );
  };

  // remove a specific skill within a category
  const removeSpecificSkill = (category, skillToRemove) => {
    setSelectedSkillGroups(
      (prev) =>
        prev
          .map((g) =>
            g.category === category
              ? { ...g, skills: g.skills.filter((s) => s !== skillToRemove) }
              : g
          )
          .filter((g) => g.skills.length > 0) // optional: remove empty groups
    );
  };

  const handleAddSkill = () => {
    if (!addSkillCategory || selectedSpecificSkills.length === 0) return;

    if (
      selectedSkillGroups.length >= 6 &&
      !selectedSkillGroups.some((g) => g.category === addSkillCategory)
    ) {
      alert("You can only have up to 6 general skills.");
      return;
    }

    setSelectedSkillGroups((prev) => {
      const existing = prev.find((g) => g.category === addSkillCategory);
      if (existing) {
        if (existing.skills.length + selectedSpecificSkills.length > 5) {
          alert("Max 5 specific skills per category.");
          return prev;
        }
        return prev.map((g) =>
          g.category === addSkillCategory
            ? {
              ...g,
              skills: [...new Set([...g.skills, ...selectedSpecificSkills])],
            }
            : g
        );
      }
      return [
        ...prev,
        { category: addSkillCategory, skills: selectedSpecificSkills },
      ];
    });

    setAddSkillCategory("");
    setSelectedSpecificSkills([]);
    setShowAddSkillForm(false);
  };

  // Main save function
  const handleSaveSkills = async () => {
    if (!user?.id) {
      setSkillsError("User ID not found");
      return;
    }

    setSkillsSaving(true);
    setSkillsError(null);

    try {
      const { skillsToAdd, skillsToRemove } = getSkillsDifferences();

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (session?.access) {
        headers.Authorization = `Bearer ${session.access}`;
      }

      // Remove skills first
      if (skillsToRemove.length > 0) {
        // Group skills to remove by category
        const removeByCategory = {};

        for (const skillStr of skillsToRemove) {
          const [category, skillName] = skillStr.split("|");
          if (!removeByCategory[category]) {
            removeByCategory[category] = [];
          }
          removeByCategory[category].push(skillName);
        }

        // Get skill IDs and remove them
        for (const [category, skillNames] of Object.entries(removeByCategory)) {
          try {
            const skillIds = await getSpecificSkillIds(category, skillNames);

            if (skillIds.length > 0) {
              const deleteRes = await fetch(
                `${API_BASE}/users/${user.id}/skills/`,
                {
                  method: "DELETE",
                  headers,
                  body: JSON.stringify({
                    specskills_ids: skillIds,
                  }),
                }
              );

              if (!deleteRes.ok) {
                const errorText = await deleteRes.text();
                throw new Error(`Failed to delete skills: ${errorText}`);
              }
            }
          } catch (e) {
            console.error(`Error removing skills from ${category}:`, e);
            throw e;
          }
        }
      }

      // Add new skills
      if (skillsToAdd.length > 0) {
        // Group skills to add by category
        const addByCategory = {};

        for (const skillStr of skillsToAdd) {
          const [category, skillName] = skillStr.split("|");
          if (!addByCategory[category]) {
            addByCategory[category] = [];
          }
          addByCategory[category].push(skillName);
        }

        // Build the payload for adding skills
        const items = [];

        for (const [category, skillNames] of Object.entries(addByCategory)) {
          try {
            const genSkillId = await getGeneralSkillId(category);
            if (genSkillId) {
              items.push({
                genskills_id: genSkillId,
                spec_names: skillNames,
              });
            }
          } catch (e) {
            console.error(`Error preparing skills for ${category}:`, e);
            throw e;
          }
        }

        if (items.length > 0) {
          const addRes = await fetch(`${API_BASE}/skills/user/`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              user_id: user.id,
              items: items,
            }),
          });

          if (!addRes.ok) {
            const errorText = await addRes.text();
            throw new Error(`Failed to add skills: ${errorText}`);
          }
        }
      }

      // Update original skills to current state (successful save)
      setOriginalSkillGroups([...selectedSkillGroups]);
      setSkillsEditing(false);
      setShowAddSkillForm(false);

      console.log("Skills saved successfully");
    } catch (e) {
      console.error("[handleSaveSkills] error", e);
      setSkillsError(e.message || "Failed to save skills");
    } finally {
      setSkillsSaving(false);
    }
  };

  // Cancel function to revert changes
  const handleCancelSkills = () => {
    setSelectedSkillGroups([...originalSkillGroups]);
    setSkillsEditing(false);
    setShowAddSkillForm(false);
    setSkillsError(null);
    setAddSkillCategory("");
    setSelectedSpecificSkills([]);
  };

  // Check if there are unsaved changes
  const hasUnsavedSkillsChanges = () => {
    if (selectedSkillGroups.length !== originalSkillGroups.length) return true;

    const { skillsToAdd, skillsToRemove } = getSkillsDifferences();
    return skillsToAdd.length > 0 || skillsToRemove.length > 0;
  };

  // Helper function to find differences between original and current interests
  const getInterestsDifferences = () => {
    const currentSet = new Set(userInterests);
    const originalSet = new Set(originalUserInterests);

    // Find interests to add (in current but not in original)
    const interestsToAdd = userInterests.filter(
      (interest) => !originalSet.has(interest)
    );

    // Find interests to remove (in original but not in current)
    const interestsToRemove = originalUserInterests.filter(
      (interest) => !currentSet.has(interest)
    );

    return { interestsToAdd, interestsToRemove };
  };

  useEffect(() => {
    if (!slug) return;

    const loadPostedTrades = async () => {
      try {
        setPostedTradesLoading(true);
        setPostedTradesError(null);

        const headers = {
          "Content-Type": "application/json",
        };
        if (session?.access) headers.Authorization = `Bearer ${session.access}`;

        // ✅ Determine which endpoint to call based on profile ownership
        let url;
        if (isOwnProfile) {
          url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/posted-trades/`;
        } else {
          url = `${process.env.NEXT_PUBLIC_BACKEND_URL
            }/posted-trades/${encodeURIComponent(slug)}/`;
        }

        console.log("[Profile] Fetching posted trades from:", url);

        const res = await fetch(url, { headers });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Failed to fetch (${res.status})`);
        }

        const data = await res.json();
        console.log("[Profile] posted trades response:", data);

        // 🧩 Transform data for consistency
        const mapped = (data.posted_trades || []).map((trade) => ({
          id: trade.tradereq_id,
          tradereq_id: trade.tradereq_id,
          reqname: trade.reqname,
          deadline: trade.deadline,
          name: isOwnProfile
            ? `${session?.user?.first_name || ""} ${session?.user?.last_name || ""
              }`.trim() || session?.user?.username
            : `${user?.firstname || ""} ${user?.lastname || ""}`.trim() ||
            user?.username,
          username: isOwnProfile ? session?.user?.username : user?.username,
          rating: isOwnProfile ? session?.user?.rating || 0 : user?.rating || 0,
          reviews: isOwnProfile
            ? session?.user?.reviews || 0
            : user?.reviews || 0,
          level: isOwnProfile ? session?.user?.level || 1 : user?.level || 1,
          offer: trade.offer || "Skills & Services",
          profilePic: isOwnProfile
            ? (session?.user?.image || session?.user?.profilePic || user?.profilePic)
            : (trade.profilePic || user?.profilePic),
        }));

        setPostedTrades(mapped);
      } catch (err) {
        console.error("❌ Failed to fetch posted trades:", err);
        setPostedTradesError(err.message);
      } finally {
        setPostedTradesLoading(false);
      }
    };

    loadPostedTrades();
  }, [slug, isOwnProfile, session, user]);

  const [userInterestStatus, setUserInterestStatus] = useState({});

  useEffect(() => {
    if (!isOwnProfile && postedTrades.length > 0 && session?.access) {
      const fetchInterestStatus = async () => {
        try {
          const tradeIds = postedTrades.map(t => t.tradereq_id);

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/check-interests/`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access}`
              },
              body: JSON.stringify({ trade_ids: tradeIds })
            }
          );

          if (response.ok) {
            const data = await response.json();
            setUserInterestStatus(data.interests); // { tradereq_id: "PENDING" | "ACCEPTED" | null }
          }
        } catch (error) {
          console.error('Failed to fetch interest status:', error);
        }
      };

      fetchInterestStatus();
    }
  }, [isOwnProfile, postedTrades, session?.access]);

  const fmtUntil = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `until ${d.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
    })}`;
  };

  const displayName = isOwnProfile
    ? "You"
    : `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.username ||
    "User";

  // Function to get general skill ID from category name
  const getGeneralSkillIdForInterest = async (categoryName) => {
    try {
      const headers = { Accept: "application/json" };
      if (session?.access) headers.Authorization = `Bearer ${session.access}`;

      const res = await fetch(`${API_BASE}/skills/general/`, { headers });
      if (!res.ok)
        throw new Error(`Failed to fetch general skills: ${res.status}`);

      const generalSkills = await res.json();
      const skill = generalSkills.find((s) => s.genCateg === categoryName);
      return skill ? skill.genSkills_id : null;
    } catch (e) {
      console.error("[getGeneralSkillIdForInterest] error", e);
      throw e;
    }
  };

  const InlineConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
      // Outer container: absolute positioning (for inline use)
      <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-70 z-20 rounded-[20px]">
        <div
          // Window size changed from w-[300px] to w-[420px] to be proportional to SavedPopup
          className="w-[420px] p-8 flex flex-col gap-6 rounded-[15px] shadow-lg"
          style={{
            // Window styles copied exactly from SavedPopup
            background: "rgba(0, 0, 0, 0.4)",
            border: "2px solid #0038FF",
            boxShadow: "0px 4px 15px #D78DE5",
            backdropFilter: "blur(40px)",
            borderRadius: "15px",
          }}
        >
          {/* Message Text: Adjusted size and margin for better fit */}
          <h3 className="text-center text-[18px] font-semibold text-white">
            {message}
          </h3>

          {/* Buttons Container */}
          <div className="flex justify-center gap-4 mt-2">
            {/* Cancel Button - Secondary Style (Transparent, Blue Border) */}
            <button
              onClick={onCancel}
              // Styled to be the secondary action: transparent background, primary blue border
              className="w-[150px] h-[38px] py-2 rounded-[10px] text-white border-2 border-[#0038FF] bg-transparent text-[15px] hover:bg-white/10 transition duration-300"
            >
              <span className="text-[15px]">Cancel</span>
            </button>

            {/* Confirm Button - Primary Style (Blue from SavedPopup) */}
            <button
              onClick={onConfirm}
              // Styled to be the primary action: Blue background, blue shadow
              className="w-[150px] h-[38px] py-2 rounded-[10px] text-white bg-[#0038FF] text-[15px] shadow-[0px_0px_10px_#284CCC] hover:bg-[#1a4dff] transition duration-300"
            >
              <span className="text-[15px]">Confirm</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Interests add/remove
  const removeInterest = (interest) => {
    setUserInterests((prev) => prev.filter((i) => i !== interest));
  };

  const handleAddInterest = () => {
    setUserInterests((prev) => [...new Set([...prev, ...selectedInterests])]);
    setSelectedInterests([]);
    setShowAddInterestForm(false);
  };

  // Main save function for interests (updated to use combined endpoint)
  // Main save function for interests
  const handleSaveInterests = async () => {
    if (!user?.id) {
      setInterestsError("User ID not found");
      return;
    }

    setInterestsSaving(true);
    setInterestsError(null);

    try {
      const { interestsToAdd, interestsToRemove } = getInterestsDifferences();

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (session?.access) {
        headers.Authorization = `Bearer ${session.access}`;
      }

      // Remove interests first
      if (interestsToRemove.length > 0) {
        const removeGenSkillIds = [];

        for (const interest of interestsToRemove) {
          try {
            const genSkillId = await getGeneralSkillIdForInterest(interest);
            if (genSkillId) {
              removeGenSkillIds.push(genSkillId);
            }
          } catch (e) {
            console.error(
              `Error getting ID for interest to remove ${interest}:`,
              e
            );
          }
        }

        if (removeGenSkillIds.length > 0) {
          const removeRes = await fetch(
            `${API_BASE}/users/${user.id}/interests/`,
            {
              method: "DELETE",
              headers,
              body: JSON.stringify({ genSkills_ids: removeGenSkillIds }),
            }
          );

          if (!removeRes.ok) {
            const errorText = await removeRes.text();
            throw new Error(`Failed to remove interests: ${errorText}`);
          }
        }
      }

      // Add new interests
      if (interestsToAdd.length > 0) {
        const addGenSkillIds = [];

        for (const interest of interestsToAdd) {
          try {
            const genSkillId = await getGeneralSkillIdForInterest(interest);
            if (genSkillId) {
              addGenSkillIds.push(genSkillId);
            } else {
              console.warn(
                `General skill ID not found for interest: ${interest}`
              );
            }
          } catch (e) {
            console.error(`Error getting ID for interest ${interest}:`, e);
            throw e;
          }
        }

        if (addGenSkillIds.length > 0) {
          const addRes = await fetch(`${API_BASE}/users/add_interests/`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              user_id: user.id,
              genSkills_ids: addGenSkillIds,
            }),
          });

          if (!addRes.ok) {
            const errorText = await addRes.text();
            throw new Error(`Failed to add interests: ${errorText}`);
          }
        }
      }

      // Update original interests to current state (successful save)
      setOriginalUserInterests([...userInterests]);
      setInterestsEditing(false);
      setShowAddInterestForm(false);

      console.log("Interests saved successfully");
    } catch (e) {
      console.error("[handleSaveInterests] error", e);
      setInterestsError(e.message || "Failed to save interests");
    } finally {
      setInterestsSaving(false);
    }
  };

  const handleCancelInterests = () => {
    setUserInterests([...originalUserInterests]);
    setInterestsEditing(false);
    setShowAddInterestForm(false);
    setInterestsError(null);
  };

  const hasUnsavedInterestChanges = () => {
    const { interestsToAdd, interestsToRemove } = getInterestsDifferences();
    return interestsToAdd.length > 0 || interestsToRemove.length > 0;
  };

  // ----------------------------
  // existing memoized reviews etc
  // ----------------------------
  const sortedReviews = useMemo(() => {
    let sorted = [...reviews];
    if (sortOption === "Latest") {
      sorted.sort(
        (a, b) =>
          new Date(b.tradeCompletionDate) - new Date(a.tradeCompletionDate)
      );
    } else if (sortOption === "Highest Rating") {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === "Lowest Rating") {
      sorted.sort((a, b) => a.rating - b.rating);
    }
    return sorted;
  }, [reviews, sortOption]);

  const handleSortChange = (option) => {
    setSortOption(option);
    setShowSortDropdown(false);
  };

  // Inline Button component
  const Button = ({ children, className, onClick, ...props }) => {
    return (
      <button
        className={clsx(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2",
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </button>
    );
  };

  const EditCredentialsPage = ({ credentialsToEdit, onCancel, onSave }) => {
    // Main Categories and Subcategories data
    const mainCategories = [
      "Creative & Design",
      "Technical & IT",
      "Business & Management",
      "Communication & Interpersonal",
      "Health & Wellness",
      "Education & Training",
      "Home & Lifestyle",
      "Handiwork & Maintenance",
      "Digital & Social Media",
      "Language & Translation",
      "Financial & Accounting",
      "Sports & Fitness",
      "Arts & Performance",
      "Culture & Diversity",
      "Research & Critical Thinking",
    ];

    const subcategories = {
      "Creative & Design": [
        "Graphic Design",
        "Photography",
        "Video Editing",
        "Illustration",
        "Animation",
      ],
      "Technical & IT": [
        "Web Development",
        "Software Development",
        "IT Support",
        "Network Administration",
        "Cybersecurity",
      ],
      "Business & Management": [
        "Project Management",
        "Business Consulting",
        "Human Resources",
        "Operations Management",
        "Marketing Strategy",
      ],
      "Communication & Interpersonal": [
        "Customer Service",
        "Public Relations",
        "Copywriting",
        "Translation",
        "Social Media Management",
      ],
      "Health & Wellness": [
        "Nutrition Coaching",
        "Personal Training",
        "Mental Health Counseling",
        "Yoga Instruction",
        "Physical Therapy",
      ],
      "Education & Training": [
        "Tutoring",
        "Language Instruction",
        "Corporate Training",
        "Curriculum Development",
        "Test Preparation",
      ],
      "Home & Lifestyle": [
        "Interior Decorating",
        "Cleaning Services",
        "Gardening",
        "Event Planning",
        "Personal Assistance",
      ],
      "Handiwork & Maintenance": [
        "Furniture Assembly",
        "Sewing & Alterations",
        "Handyman Services",
        "Painting & Decorating",
        "Crafting",
      ],
      "Digital & Social Media": [
        "Social Media Management",
        "Content Creation",
        "SEO",
        "Digital Advertising",
        "Email Marketing",
      ],
      "Language & Translation": [
        "Translation",
        "Interpretation",
        "Language Tutoring",
        "Transcription",
        "Localization",
      ],
      "Financial & Accounting": [
        "Bookkeeping",
        "Tax Preparation",
        "Financial Planning",
        "Payroll Services",
        "Auditing",
      ],
      "Sports & Fitness": [
        "Personal Training",
        "Group Fitness Instruction",
        "Sports Coaching",
        "Nutrition for Athletes",
        "Physical Therapy",
      ],
      "Arts & Performance": [
        "Music Lessons",
        "Dance Instruction",
        "Acting Coaching",
        "Visual Arts",
        "Creative Writing",
      ],
      "Culture & Diversity": [
        "Diversity Training",
        "Cultural Consulting",
        "Language & Cultural Exchange",
        "Community Outreach",
        "Inclusion Workshops",
      ],
      "Research & Critical Thinking": [
        "Market Research",
        "Data Analysis",
        "Academic Research",
        "Competitive Analysis",
        "Strategic Planning",
      ],
    };

    const defaultCredential = {
      title: "",
      org: "",
      issueDate: "",
      expiryDate: "",
      id: "",
      url: "",
      skills: [],
      skillCategory: "",
    };

    // Initialize state with the credentials data passed as a prop, adding a skillCategory field
    const [formData, setFormData] = useState(() =>
      Array.isArray(credentialsToEdit) && credentialsToEdit
        ? credentialsToEdit.map((cred) => ({
          // Map backend fields to frontend fields
          title: cred.credential_title || "",
          org: cred.issuer || "",
          issueDate: cred.issue_date || "",
          expiryDate: cred.expiry_date || "",
          id: cred.cred_id || "",
          url: cred.cred_url || "",
          skills: cred.skills || [],
          skillCategory: "",
          usercred_id: cred.usercred_id, // Keep the backend ID for updates
        }))
        : [defaultCredential]
    );

    // Helper function to update a specific field of a specific credential
    const handleChange = (index, field, value) => {
      const newFormData = [...formData];
      newFormData[index] = { ...newFormData[index], [field]: value };
      setFormData(newFormData);
    };

    // Handle changes for the main skill category dropdown
    const handleCategoryChange = (index, value) => {
      const newFormData = [...formData];
      newFormData[index] = { ...newFormData[index], skillCategory: value };
      setFormData(newFormData);
    };

    // Handle changes for the associated skills dropdown
    const handleSkillDropdownChange = (index, value) => {
      const newFormData = [...formData];
      // Check if the skill is not already in the array before adding
      if (value && !newFormData[index].skills.includes(value)) {
        newFormData[index].skills.push(value);
        setFormData(newFormData);
      }
    };

    // Function to remove a skill from the tags
    const handleRemoveSkill = (credentialIndex, skillToRemove) => {
      const newFormData = [...formData];
      const newSkills = newFormData[credentialIndex].skills.filter(
        (skill) => skill !== skillToRemove
      );
      newFormData[credentialIndex] = {
        ...newFormData[credentialIndex],
        skills: newSkills,
      };
      setFormData(newFormData);
    };

    // Function to add a new empty credential
    const addCredential = () => {
      setFormData([...formData, defaultCredential]);
    };

    // --- Trade Again modal state ---
    const [showRepeatModal, setShowRepeatModal] = useState(false);
    const [repeatReview, setRepeatReview] = useState(null);

    const openRepeatModal = (review) => {
      setRepeatReview(review);
      setShowRepeatModal(true);
    };
    const closeRepeatModal = () => {
      setShowRepeatModal(false);
      setRepeatReview(null);
    };
    const confirmRepeatTrade = () => {
      // placeholder; backend integration later
      alert(`Trade request sent to ${repeatReview?.requester || "user"}.`);
      closeRepeatModal();
    };

    const handleSave = () => {
      const validationErrors = validateCredentials(formData);

      if (validationErrors.length > 0) {
        // Display errors to user instead of sending to backend
        alert(validationErrors.join("\n")); // Or use a proper error display component
        return;
      }

      onSave(formData);
    };

    return (
      <div className="flex flex-col gap-[25px]">
        <h4 className="text-[22px] font-semibold">
          Edit Credentials
          {formData.length > 1 && ` (${formData.length} items)`}
        </h4>

        <div className="flex flex-col gap-8">
          {formData.map((cred, index) => (
            <div
              key={index}
              className="flex flex-col gap-5 p-6 border border-white/20 rounded-[15px]"
            >
              {formData.length > 1 && (
                <h5 className="text-lg font-semibold text-white/70">
                  Credential {index + 1}
                </h5>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column - Name, Issuing Org, Issue Date, Expiry Date */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/50">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cred.title}
                      onChange={(e) =>
                        handleChange(index, "title", e.target.value)
                      }
                      className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663]"
                      placeholder="e.g., Adobe Certified Expert"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/50">
                      Issuing Organization{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cred.org}
                      onChange={(e) =>
                        handleChange(index, "org", e.target.value)
                      }
                      className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663]"
                      placeholder="e.g., Adobe Systems"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/50">
                      Issue Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={cred.issueDate || ""}
                      onChange={(e) =>
                        handleChange(index, "issueDate", e.target.value)
                      }
                      placeholder="Month Year"
                      className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663] text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/50">Expiry Date</label>
                    <input
                      type="date"
                      value={cred.expiryDate || ""}
                      onChange={(e) =>
                        handleChange(index, "expiryDate", e.target.value)
                      }
                      placeholder="Month Year"
                      className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663] text-sm"
                    />
                  </div>
                </div>

                {/* Right Column - Cred ID, Cred URL, Skill Category, Associated Skills */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/50">
                      Credential ID
                    </label>
                    <input
                      type="text"
                      value={cred.id}
                      onChange={(e) =>
                        handleChange(index, "id", e.target.value)
                      }
                      className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663]"
                      placeholder="e.g., ACE-123456789"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/50">
                      Credential URL
                    </label>
                    <input
                      type="url"
                      value={cred.url}
                      onChange={(e) =>
                        handleChange(index, "url", e.target.value)
                      }
                      className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663]"
                      placeholder="e.g., https://www.adobe.com/cert..."
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/50">
                      Skill Category
                    </label>
                    <select
                      value={cred.skillCategory}
                      onChange={(e) =>
                        handleCategoryChange(index, e.target.value)
                      }
                      className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663] text-sm"
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      {mainCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-white/50">
                      Associated Skills
                    </label>
                    <select
                      onChange={(e) =>
                        handleSkillDropdownChange(index, e.target.value)
                      }
                      className="bg-[#120A2A] text-white border-[1.5px] border-white/40 rounded-md p-2 placeholder-[#413663] text-sm"
                      disabled={!cred.skillCategory}
                      value=""
                    >
                      <option value="" disabled>
                        Select subcategory
                      </option>
                      {cred.skillCategory &&
                        subcategories[cred.skillCategory]?.map((skill) => (
                          <option key={skill} value={skill}>
                            {skill}
                          </option>
                        ))}
                    </select>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(cred.skills || []).map((skill, skillIndex) => (
                        <div
                          key={skillIndex}
                          className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs px-3 py-1 rounded-full cursor-default"
                        >
                          <span>{skill}</span>
                          <button
                            onClick={() => handleRemoveSkill(index, skill)}
                            className="flex items-center justify-center w-4 h-4 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
                            aria-label={`Remove ${skill}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addCredential}
          className="text-[#0038FF] hover:underline text-sm font-semibold mt-4 text-left"
        >
          + Add credential
        </button>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            onClick={onCancel}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#0038FF] hover:bg-[#1a4dff] text-white shadow-[0px_0px_15px_#284CCC]"
          >
            Save Changes
          </Button>
        </div>
      </div>
    );
  };

  // Handler for editing all credentials
  const handleEditAllCredentials = () => {
    setEditingCredentials("all");
  };

  // Handler for editing a single credential
  const handleEditSingleCredential = (credential) => {
    setEditingCredentials(credential);
  };

  // Handler for saving changes
  const handleSaveCredentials = async (updatedCredentials) => {
    // helper: normalize <input type="month"> values like "2024-09" -> "2024-09-01"
    const normalizeDate = (d) => {
      if (!d) return null;
      return /^\d{4}-\d{2}$/.test(d) ? `${d}-01` : d; // leave YYYY-MM-DD as-is
    };

    try {
      setCredentialsLoading(true);
      setCredentialsError(null);

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (session?.access) {
        headers.Authorization = `Bearer ${session.access}`;
      }

      // Process each credential
      const credentialsArray = Array.isArray(updatedCredentials)
        ? updatedCredentials
        : [updatedCredentials];

      for (const cred of credentialsArray) {
        // Build the payload with correct field mapping
        const payload = {
          user: user.id,
          credential_title: cred.title || "",
          issuer: cred.org || "",
          issue_date: normalizeDate(cred.issueDate),
          expiry_date: normalizeDate(cred.expiryDate),
          cred_id: cred.id || "",
          cred_url: cred.url || "",
        };

        const isUpdate = cred.usercred_id; // Your backend uses 'usercred_id' as primary key
        if (isUpdate) {
          payload.usercred_id = isUpdate;
        }

        const method = isUpdate ? "PUT" : "POST";

        console.log(`[credentials] ${method} request:`, payload);

        const res = await fetch(`${API_BASE}/users/${user.id}/credentials/`, {
          method,
          headers,
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error(
            `[credentials] ${method} failed:`,
            res.status,
            errorText
          );
          throw new Error(
            `Save ${method} failed (${res.status}): ${errorText.slice(0, 200)}`
          );
        }

        const result = await res.json();
        console.log(`[credentials] ${method} success:`, result);
      }

      // Re-fetch credentials to update UI with server state
      const refetchHeaders = { Accept: "application/json" };
      if (session?.access) {
        refetchHeaders.Authorization = `Bearer ${session.access}`;
      }

      const refRes = await fetch(`${API_BASE}/users/${user.id}/credentials/`, {
        method: "GET",
        headers: refetchHeaders,
        credentials: "include",
      });

      if (!refRes.ok) {
        const errorText = await refRes.text();
        console.warn(
          `[credentials] Refetch failed (${refRes.status}): ${errorText}`
        );
        // Don't throw here - the save might have worked, just the refetch failed
      } else {
        const refJson = await refRes.json();
        const credentials =
          refJson.credentials || refJson.results || refJson || [];
        setUserCredentials(Array.isArray(credentials) ? credentials : []);
      }

      // Close the editor
      setEditingCredentials(null);
    } catch (e) {
      console.error("[credentials] save error:", e);
      setCredentialsError(e.message || "Failed to save credentials");
    } finally {
      setCredentialsLoading(false);
    }
  };

  const validateCredentials = (credentials) => {
    const errors = [];

    credentials.forEach((cred, index) => {
      if (!cred.title?.trim()) {
        errors.push(`Credential ${index + 1}: Name is required`);
      }
      if (!cred.org?.trim()) {
        errors.push(
          `Credential ${index + 1}: Issuing Organization is required`
        );
      }
      if (!cred.issueDate) {
        errors.push(`Credential ${index + 1}: Issue Date is required`);
      }
    });

    return errors;
  };

  // Conditionally render the edit page or the profile page
  if (editingCredentials) {
    const credsToEdit =
      editingCredentials === "all" ? userCredentials : [editingCredentials];
    return (
      <div
        className={`px-6 pb-20 pt-10 mx-auto max-w-[940px] text-white ${inter.className}`}
      >
        <EditCredentialsPage
          credentialsToEdit={credsToEdit}
          onCancel={() => setEditingCredentials(null)}
          onSave={handleSaveCredentials}
        />
      </div>
    );
  }

  // Inline helper for Trade Details to keep code clean
  const TradePill = ({ content }) => {
    return (
      <div
        className={clsx(
          "inline-flex items-center px-[15px] py-[10px] text-[13px] rounded-full border-2 text-white overflow-hidden"
        )}
      >
        <span className="whitespace-nowrap">{content}</span>
      </div>
    );
  };

  // Inline ReviewCard component with updated design
  const ReviewCard = ({ review }) => {
    const {
      requester,
      tradePartner,
      tradeCompletionDate,
      requestTitle,
      offerTitle,
      rating,
      reviewDescription,
      likes,
    } = review;
    const [isLiked, setIsLiked] = useState(false);

    // Function to render stars based on a rating
    const renderStars = (rating) => {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
      const stars = [];

      // Full stars
      for (let i = 0; i < fullStars; i++) {
        stars.push(
          <Star
            key={`full-${i}`}
            className="w-5 h-5 fill-[#906EFF] text-[#906EFF]"
          />
        );
      }
      // Half star
      if (hasHalfStar) {
        stars.push(
          <div key="half" className="relative w-5 h-5">
            <Star className="absolute w-5 h-5 text-gray-300 stroke-2" />
            <div className="absolute top-0 left-0 overflow-hidden w-1/2">
              <Star className="w-5 h-5 fill-[#906EFF] text-[#906EFF]" />
            </div>
          </div>
        );
      }
      // Empty stars
      for (let i = 0; i < emptyStars; i++) {
        stars.push(
          <Star key={`empty-${i}`} className="w-5 h-5 text-gray-300 stroke-2" />
        );
      }
      return stars;
    };

    // Function to handle the report action
    const handleReport = () => {
      // In a real app, this would be a client-side navigation or a more complex interaction
      console.log(
        `Navigating to help form for reporting review by ${requester}`
      );
      window.location.href = "/help#help-form";
    };

    return (
      <div
        className="flex flex-col gap-[20px] rounded-[20px] border-[3px] border-[#284CCC]/80 p-[25px] relative transition-all duration-300 hover:scale-[1.01]"
        style={{
          background:
            "radial-gradient(circle at top right, #3D2490 0%, #120A2A 69%)",
        }}
      >
        <div className="flex justify-between items-start">
          {/* User and Partner Avatars with 'X' separator, names, and date */}
          <div className="flex items-start gap-[15px]">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {/* Use the defaultavatar.png for the review cards */}
                <Image
                  src="/assets/defaultavatar.png"
                  alt={`${tradePartner}'s avatar`}
                  width={35}
                  height={35}
                  className="rounded-full object-cover"
                />
                <Icon icon="ic:baseline-close" className="w-4 h-4 text-white" />
                {/* Use the defaultavatar.png for the review cards */}
                <Image
                  src="/assets/defaultavatar.png"
                  alt={`${requester}'s avatar`}
                  width={35}
                  height={35}
                  className="rounded-full object-cover"
                />
                <div className="flex flex-col justify-start">
                  <span className="font-semibold text-white text-base">{`${tradePartner} & ${requester}`}</span>
                  <span className="text-white/50 text-base">
                    {tradeCompletionDate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-5 text-white text-sm">
            {/* Rating number on the left */}
            <span className="text-lg">{safeFixed(user.rating, 1)}</span>
            <div className="flex items-center gap-[5px]">
              {renderStars(rating)}
            </div>
            <button
              onClick={handleReport}
              className="p-1 rounded-full hover:bg-white/10 transition"
            >
              <Flag className="w-5 h-5 cursor-pointer text-white/50" />
            </button>
          </div>
        </div>

        {/* Trade Details and Review Text */}
        <div className="flex flex-col md:flex-row gap-[25px] w-full">
          {/* Trade Details Section */}
          <div className="flex-1 flex flex-col gap-[25px]">
            <div className="flex items-center gap-[15px] w-full">
              <h6 className="text-white text-base text-white/50 whitespace-nowrap">
                Name requested
              </h6>
              <div className="inline-flex items-center px-[15px] py-[8px] text-[13px] rounded-full border-2 text-white bg-[#284CCC]/20 border-[#284CCC]/80 text-[#C1C9E1]">
                <span className="whitespace-nowrap">{requestTitle}</span>
              </div>
            </div>
            <div className="flex items-center gap-[15px] w-full">
              <h6 className="text-white text-base text-white/50 whitespace-nowrap">
                In exchange for
              </h6>
              <div className="inline-flex items-center px-[15px] py-[8px] text-[13px] rounded-full border-2 text-white bg-[#3D2490]/20 border-[#3D2490]/80 text-[#C1C9E1]">
                <span className="whitespace-nowrap">{offerTitle}</span>
              </div>
            </div>
          </div>

          {/* Review Text Section */}
          <div className="flex-1 flex flex-col gap-2 md:text-right">
            <p className="text-white text-base">{reviewDescription}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center gap-1.5 text-white text-sm">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="transition-transform transform hover:scale-110"
            >
              <Heart
                className={clsx(
                  "w-5 h-5 transition-colors duration-300",
                  isLiked ? "fill-[#906EFF] stroke-[#906EFF]" : "stroke-white"
                )}
              />
            </button>
            <span>{likes + (isLiked ? 1 : 0)}</span>
          </div>
          <div className="flex gap-4">
            <Button
              className="bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm rounded-[15px] px-5 py-2 shadow-[0px_0px_15px_#284CCC]"
              onClick={() => onTradeAgain?.(review)}
            >
              Trade again
            </Button>

            <Button className="bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm rounded-[15px] px-5 py-2 shadow-[0px_0px_15px_#284CCC]">
              View details
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const isDirty =
    basicInfoEditing &&
    ((editableFirstName ?? "") !== (user.firstname ?? "") ||
      (editableLastName ?? "") !== (user.lastname ?? "") ||
      (editableBio ?? "") !== (user.bio ?? ""));

  async function handleSaveBasicInfo() {
    console.log("=== ENHANCED SAVE DEBUG ===");
    console.log("Full session object:", JSON.stringify(session, null, 2));
    console.log("Session.access exists:", !!session?.access);
    console.log("Session.accessToken exists:", !!session?.accessToken);
    console.log("Session.user.access exists:", !!session?.user?.access);

    setBasicInfoSaving(true);
    setBasicInfoError(null);

    try {
      const RAW =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
      const API_BASE = RAW.includes("/api/accounts")
        ? RAW.replace(/\/+$/, "")
        : `${RAW.replace(/\/+$/, "")}/api/accounts`;

      const body = {
        first_name: editableFirstName ?? "",
        last_name: editableLastName ?? "",
        bio: editableBio ?? "",
        user_id: user?.id ?? null,
      };

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      // Try multiple possible token locations
      let token = null;
      if (session?.access) {
        token = session.access;
        console.log("Using session.access token");
      } else if (session?.accessToken) {
        token = session.accessToken;
        console.log("Using session.accessToken token");
      } else if (session?.user?.access) {
        token = session.user.access;
        console.log("Using session.user.access token");
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log("Authorization header set with token");
      } else {
        console.log("No access token found, relying on cookies");
      }

      console.log("Making request to:", `${API_BASE}/me/`);
      console.log("Request headers:", headers);
      console.log("Request body:", body);

      const res = await fetch(`${API_BASE}/me/`, {
        method: "PATCH",
        headers,
        credentials: "include", // Always include cookies
        body: JSON.stringify(body),
      });

      console.log("Response status:", res.status);
      console.log("Response headers:", [...res.headers.entries()]);

      if (!res.ok) {
        const txt = await res.text();
        console.log("Error response body:", txt);
        throw new Error(`Save failed (${res.status}): ${txt.slice(0, 200)}`);
      }

      const updated = await res.json();
      console.log("Success response:", updated);

      setUser((prev) => ({
        ...prev,
        firstname: updated.first_name ?? editableFirstName ?? prev.firstname,
        lastname: updated.last_name ?? editableLastName ?? prev.lastname,
        bio: updated.bio ?? editableBio ?? prev.bio,
      }));

      setBasicInfoEditing(false);
      console.log("Save completed successfully");
    } catch (e) {
      console.error("[basic info save] error", e);
      setBasicInfoError(e.message || "Failed to save.");
    } finally {
      setBasicInfoSaving(false);
    }
  }

  const handleInterestedClick = (trade) => {
    setSelectedTrade(trade);
    setShowConfirmDialog(true);
  };

  const handleConfirmInterest = async () => {
    if (!selectedTrade || !session?.access) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/express-interest/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access}`,
          },
          body: JSON.stringify({
            tradereq_id: selectedTrade.tradereq_id, // ✅ correct key
          }),
        }
      );

      // 🧠 Parse the response early
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 🧩 Backend often returns { error: "..." } or { message: "..." }
        const errorMessage =
          data?.error ||
          data?.message ||
          `Failed to send trade request (Error ${res.status})`;

        console.error("❌ Express interest failed:", errorMessage);
        alert(errorMessage);
        return;
      }

      console.log("✅ Interest created successfully!", data);
      setShowConfirmDialog(false);
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("❌ Network or unexpected error:", err);
      alert("Network error — please check your connection and try again.");
    }
  };

  const handleCancelInterest = () => {
    setShowConfirmDialog(false);
    setSelectedTrade(null);
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setSelectedTrade(null);
  };

  console.log("Rendered isOwnProfile:", isOwnProfile, postedTrades);

  // Original Profile Page content
  return (
    <div
      className={`w-[950px] mx-auto pt-10 pb-20 text-white ${inter.className}`}
    >
      {/* SECTION 0 - PAGE TITLE */}
      <h4 className="text-[22px] font-semibold mb-10">My Profile</h4>

      {/* SECTION 1 - BASIC INFORMATION */}
      <div className="flex gap-[50px] relative">
        {/* Profile Picture */}
        <div className="w-[200px] h-[200px] relative flex-shrink-0">
          <ProfileAvatar
            src={user?.profilePic}
            alt={`${user?.firstname || ""} ${user?.lastname || ""}`}
            size={200}
            className="rounded-full shadow-[0_0_50px_#906EFF99] object-cover"
          />
        </div>

        {/* Right Section */}
        <div className="flex-1 flex flex-col">
          {/* Top Row: Name + Verified Badge */}
          <div className="flex items-center gap-6 mb-[5px]">
            {basicInfoEditing ? (
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="First name"
                  value={editableFirstName}
                  onChange={(e) => setEditableFirstName(e.target.value)}
                  className="bg-[#120A2A] border border-white/30 rounded-[15px] p-2 text-white text-[20px] font-semibold w-full max-w-[150px]"
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={editableLastName}
                  onChange={(e) => setEditableLastName(e.target.value)}
                  className="bg-[#120A2A] border border-white/30 rounded-[15px] p-2 text-white text-[20px] font-semibold w-full max-w-[150px]"
                />
              </div>
            ) : (
              <h3 className="text-[26px] font-semibold">
                {`${user.firstname} ${user.lastname}`.trim() || "—"}
              </h3>
            )}
            {(user.is_verified || verificationStatus === "verified") && (
              <Icon
                icon="mdi:check-decagram"
                className="text-[#0038FF] w-[1.8em] h-[1.8em]" // scale with font size
              />
            )}
          </div>
          {/* Username + Joined Date */}
          <div className="flex text-white/50 text-[16px] mb-[20px] gap-[25px]">
            <span>@{user.username || "—"}</span>
            <span>Joined {user.joined || "—"}</span>
          </div>
          {/* Buttons: Edit (only if own profile) */}
          {isOwnProfile ? (
            <div className="absolute top-0 right-0 flex gap-4">
              <button
                className="text-white hover:bg-[#1A0F3E] px-3 py-2 flex items-center gap-2 rounded-[10px] transition"
                onClick={() =>
                  router.push(`/home/profile/${user.username}/settings`)
                }
              >
                <Icon icon="mdi:cog" className="w-5 h-5" />
                Settings
              </button>
            </div>
          ) : (
            <div className="absolute top-0 right-0">
              <Link href="/home/messages">
                <Button className="bg-[#0038FF] hover:bg-[#1a4dff] text-white text-[16px] rounded-[15px] px-5 py-2 shadow-[0px_0px_15px_#284CCC] flex items-center gap-2">
                  <Icon icon="mdi:email-outline" className="w-4 h-4" />
                  Message
                </Button>
              </Link>
            </div>
          )}
          {/* Rating + Level */}
          <div className="flex items-center gap-6 mb-[20px]">
            <div className="flex items-center gap-2">
              <Icon
                icon="lucide:star"
                className="text-[#906EFF] w-5 h-5 fill-current"
              />
              <span className="font-semibold text-[16px]">
                {user.rating.toFixed(1)}{" "}
                <span className="text-white/50">({user.reviews})</span>
              </span>
            </div>

            {/* Level Bar Section */}
            <div className="flex items-center gap-3">
              {/* LVL label (moved to the left, purple) */}
              <span className="text-[16px] font-semibold text-[#906EFF]">
                LVL {user.level}
              </span>

              {/* Track */}
              <div className="relative w-[220px] h-[20px] rounded-[32px] border-2 border-white overflow-hidden">
                {/* Fill */}
                <div
                  className="h-full rounded-[32px] transition-all duration-500"
                  style={{
                    // percent = in-level XP / width of this level band
                    width: `${(() => {
                      const width = getLevelWidth(user.level || 1);
                      const gained = Number(user.xpPoints) || 0;
                      return Math.min((gained / (width || 1)) * 100, 100);
                    })()}%`,
                    minWidth: (Number(user.xpPoints) || 0) > 0 ? "6px" : "0",
                    backgroundImage:
                      "linear-gradient(90deg, #FB9696 0%, #D78DE5 25%, #7E59F8 50%, #284CCC 75%, #6DDFFF 100%)",
                  }}
                />
              </div>

              {/* XP progress (current / needed) */}
              <span className="text-[16px] text-white/80">
                {user.xpPoints}/{getLevelWidth(user.level || 1)}
              </span>
            </div>
          </div>
          {/* Bio */}
          <div className="w-full mb-4">
            {basicInfoEditing ? (
              <textarea
                value={editableBio}
                onChange={(e) => setEditableBio(e.target.value)}
                rows={4}
                className="bg-[#120A2A] border border-white/30 rounded-[15px] p-2 text-white w-full"
              />
            ) : (
              <p className="w-full leading-[1.6]">{user.bio}</p>
            )}
          </div>
          {/* Links */}
          {user.links &&
            (() => {
              let parsedLinks = [];

              if (Array.isArray(user.links)) {
                parsedLinks = user.links;
              } else if (typeof user.links === "string") {
                try {
                  const maybeJson = JSON.parse(user.links);
                  parsedLinks = Array.isArray(maybeJson)
                    ? maybeJson
                    : [user.links];
                } catch {
                  parsedLinks = [user.links];
                }
              }

              return parsedLinks.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {parsedLinks
                    .filter((url) => url && url.trim() !== "")
                    .map((url, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <LinkIcon className="w-4 h-4 text-gray-500" />
                        <a
                          href={url.startsWith("http") ? url : `https://${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4A9EFF] underline hover:opacity-80 break-all"
                        >
                          {url}
                        </a>
                      </div>
                    ))}
                </div>
              ) : null;
            })()}

          {basicInfoEditing && (
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleSaveBasicInfo}
                  disabled={!isDirty || basicInfoSaving}
                  className={clsx(
                    "text-white rounded-[15px]",
                    basicInfoSaving ? "bg-[#0038FF]/70" : "bg-[#0038FF]"
                  )}
                >
                  {basicInfoSaving ? "Saving..." : "Save"}
                </Button>

                <Button
                  type="button"
                  onClick={() => setBasicInfoEditing(false)}
                  disabled={basicInfoSaving}
                  className="bg-white/10 text-white rounded-[15px]"
                >
                  Cancel
                </Button>
              </div>

              {/* inline feedback */}
              {basicInfoError && (
                <p className="text-red-400 text-sm">{basicInfoError}</p>
              )}
            </div>
          )}
          {/* Get Verified Button area */}
          {isOwnProfile && (
            <div className="w-full flex justify-end items-center gap-3">
              {/* UNVERIFIED → Get Verified */}
              {verificationStatus === "unverified" && (
                <button
                  onClick={() => setShowVerificationPopup(true)}
                  className="bg-[#0038FF] hover:bg-[#1a4dff] text-white text-sm rounded-[15px] px-5 py-2 shadow flex items-center gap-2 shadow-[0px_0px_15px_#284CCC]"
                >
                  <Icon icon="material-symbols:verified" className="w-4 h-4" />
                  <span>Get Verified</span>
                </button>
              )}

              {/* PENDING → Waiting only */}
              {verificationStatus === "pending" && (
                <span
                  className="inline-flex items-center gap-2 bg-gray-600 text-white text-sm rounded-[15px] px-5 py-2"
                  title="Your ID was submitted and is awaiting manual review."
                >
                  <Icon icon="mdi:clock-outline" className="w-4 h-4" />
                  <span>Waiting for Verification</span>
                </span>
              )}

              {/* REJECTED → Resubmit only */}
              {verificationStatus === "rejected" && (
                <button
                  onClick={() => {
                    // clear any previous selection & reopen the popup
                    setIdFile(null);
                    if (idPreviewUrl) {
                      URL.revokeObjectURL(idPreviewUrl);
                      setIdPreviewUrl(null);
                    }
                    setShowVerificationPopup(true);
                  }}
                  className="bg-red-600 hover:bg-[#9c050c] text-white text-sm rounded-[15px] px-5 py-2 flex items-center gap-2 shadow-[0px_0px_15px_red]"
                >
                  <Icon icon="material-symbols:verified" className="w-4 h-4" />
                  <span>Resubmit ID</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ==== YOUR SKILLS ==== */}
      <div className="mt-[50px] flex flex-col gap-[25px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[15px]">
            <h5 className="text-lg font-semibold">Skills</h5>

            {isOwnProfile && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (skillsEditing) {
                      handleCancelSkills();
                    } else {
                      setSkillsEditing(true);
                    }
                  }}
                  disabled={skillsSaving}
                  aria-label="Edit skills"
                >
                  <PencilIcon
                    className={
                      skillsEditing
                        ? "w-5 h-5 text-[#906EFF]"
                        : "w-5 h-5 text-white"
                    }
                  />
                </button>

                {skillsEditing && (
                  <>
                    <Button
                      onClick={handleSaveSkills}
                      disabled={skillsSaving || !hasUnsavedSkillsChanges()}
                      className={clsx(
                        "text-white text-sm rounded-[15px] px-4 py-2",
                        skillsSaving
                          ? "bg-[#0038FF]/70"
                          : hasUnsavedSkillsChanges()
                            ? "bg-[#0038FF] hover:bg-[#1a4dff]"
                            : "bg-white/20 cursor-not-allowed"
                      )}
                    >
                      {skillsSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      onClick={handleCancelSkills}
                      disabled={skillsSaving}
                      className="bg-white/10 hover:bg-white/20 text-white text-sm rounded-[15px] px-4 py-2"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error message */}
        {skillsError && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-[10px] p-3">
            {skillsError}
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-[10px]">
          {selectedSkillGroups &&
            selectedSkillGroups.map((group, index) => (
              <div key={group.category} className="relative">
                <div
                  onClick={() => toggleCategory(index)}
                  className={clsx(
                    "inline-flex items-center h-[30px] px-[15px] gap-2",
                    "rounded-full border-2 transition-colors duration-300",
                    expanded[index]
                      ? "bg-white text-black"
                      : "text-white border-white"
                  )}
                >
                  <span className="text-[16px] leading-none">
                    {group.category}
                  </span>

                  {skillsEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSkillCategory(group.category);
                      }}
                      className="ml-2 w-5 h-5 rounded-full inline-flex items-center justify-center text-white/80 hover:text-white bg-white/5 hover:bg-white/10"
                      aria-label={`Remove ${group.category}`}
                    >
                      &times;
                    </button>
                  )}

                  <Icon
                    icon={
                      expanded[index] ? "mdi:chevron-up" : "mdi:chevron-down"
                    }
                    className={clsx(
                      "transition-transform",
                      expanded[index] ? "text-black" : "text-white"
                    )}
                    width={16}
                  />
                </div>

                {expanded[index] && (
                  <div className="absolute left-0 mt-2 p-3 rounded-[15px] border border-white/20 bg-[#050015] z-10 flex flex-col gap-2 transition-all duration-300 w-[260px]">
                    {group.skills.map((skill, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-[12px] py-[8px] text-[13px] rounded-full border-[1.5px] border-white/50 text-white/50"
                      >
                        <span>{skill}</span>
                        {skillsEditing && (
                          <button
                            onClick={() =>
                              removeSpecificSkill(group.category, skill)
                            }
                            className="ml-2 w-6 h-6 rounded-full inline-flex items-center justify-center text-white/80 hover:text-white bg-white/5 hover:bg-white/10"
                            aria-label={`Remove ${skill}`}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

          {/* + Add only visible in edit mode */}
          {skillsEditing && (
            <div className="flex items-center">
              <button
                onClick={() => setShowAddSkillForm((v) => !v)}
                disabled={skillsSaving}
                className="inline-flex items-center h-[30px] px-[12px] text-[16px] gap-2 rounded-[15px] border-2 border-dashed border-white text-white disabled:opacity-50"
                aria-label="Add skill"
              >
                + Add
              </button>
            </div>
          )}
        </div>

        {showAddSkillForm && skillsEditing && (
          <div className="mt-3 flex flex-col gap-3 bg-[#120A2A] p-4 rounded-[15px]">
            <select
              value={addSkillCategory}
              onChange={(e) => {
                setAddSkillCategory(e.target.value);
                setSelectedSpecificSkills([]);
              }}
              className="bg-[#1E133F] text-white border-[1.5px] border-white/30 rounded-[15px] p-2 text-sm"
            >
              <option value="">Select category</option>
              {mainCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* checkbox list for specific skills (multi-select) */}
            {addSkillCategory && (
              <div className="flex flex-col gap-2 p-3 rounded-[15px] border border-white/10 bg-transparent">
                {(subcategories[addSkillCategory] || []).map((skill) => (
                  <label
                    key={skill}
                    className="flex items-center gap-3 px-3 py-2 rounded-[10px] hover:bg-white/5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSpecificSkills.includes(skill)}
                      onChange={(e) => {
                        const existingGroup = selectedSkillGroups.find(
                          (g) => g.category === addSkillCategory
                        );
                        const existingCount = existingGroup
                          ? existingGroup.skills.length
                          : 0;
                        if (e.target.checked) {
                          // prevent exceeding 5 total specific skills for this category
                          if (
                            existingCount + selectedSpecificSkills.length + 1 >
                            5
                          ) {
                            alert("Max 5 specific skills per category.");
                            return;
                          }
                          setSelectedSpecificSkills((prev) => [...prev, skill]);
                        } else {
                          setSelectedSpecificSkills((prev) =>
                            prev.filter((s) => s !== skill)
                          );
                        }
                      }}
                    />
                    <span className="text-white">{skill}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-3">
              <Button
                onClick={handleAddSkill}
                className="bg-[#0038FF] hover:bg-[#1a4dff] text-white rounded-[15px]"
              >
                Add
              </Button>
              <Button
                onClick={() => {
                  setShowAddSkillForm(false);
                  setAddSkillCategory("");
                  setSelectedSpecificSkills([]);
                }}
                className="bg-white/10 hover:bg-white/20 text-white rounded-[15px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ==== YOUR INTERESTS ==== */}
      <div className="mt-[50px] flex flex-col gap-[25px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[15px]">
            <h5 className="text-lg font-semibold">Interests</h5>

            {isOwnProfile && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (interestsEditing) {
                      handleCancelInterests();
                    } else {
                      setInterestsEditing(true);
                    }
                  }}
                  disabled={skillsSaving}
                  aria-label="Edit interests"
                >
                  <PencilIcon
                    className={
                      interestsEditing
                        ? "w-5 h-5 text-[#906EFF]"
                        : "w-5 h-5 text-white"
                    }
                  />
                </button>

                {interestsEditing && (
                  <>
                    <Button
                      onClick={handleSaveInterests}
                      disabled={interestsSaving || !hasUnsavedInterestChanges()}
                      className={clsx(
                        "text-white text-sm rounded-[15px] px-4 py-2",
                        interestsSaving
                          ? "bg-[#0038FF]/70"
                          : hasUnsavedInterestChanges()
                            ? "bg-[#0038FF] hover:bg-[#1a4dff]"
                            : "bg-white/20 cursor-not-allowed"
                      )}
                    >
                      {interestsSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      onClick={handleCancelInterests}
                      disabled={interestsSaving}
                      className="bg-white/10 hover:bg-white/20 text-white text-sm rounded-[15px] px-4 py-2"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-[15px]">
          {userInterests.map((interest) => (
            <div
              key={interest}
              className="flex items-center gap-2 h-[30px] px-[15px] rounded-full border-2 border-white text-white"
            >
              <span>{interest}</span>
              {interestsEditing && (
                <button
                  onClick={() => removeInterest(interest)}
                  className="ml-1 w-5 h-5 rounded-full inline-flex items-center justify-center text-white/80 hover:text-white bg-white/5 hover:bg-white/10"
                  aria-label={`Remove ${interest}`}
                >
                  &times;
                </button>
              )}
            </div>
          ))}

          {/* + Add only appears in edit mode */}
          {interestsEditing && (
            <div className="flex items-center">
              <button
                onClick={() => setShowAddInterestForm((v) => !v)}
                className="inline-flex items-center h-[30px] px-[12px] text-[16px] gap-2 rounded-[15px] border-2 border-dashed border-white text-white"
                aria-label="Add interest"
              >
                + Add
              </button>
            </div>
          )}
        </div>

        {showAddInterestForm && interestsEditing && (
          <div className="mt-3 flex flex-col gap-2 bg-[#120A2A] p-4 rounded-[15px]">
            {/* fixed interests only — checkbox list */}
            {mainCategories.map((c) => (
              <label
                key={c}
                className="flex items-center gap-3 px-2 py-2 rounded-[10px] hover:bg-white/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedInterests.includes(c)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedInterests((prev) => [...prev, c]);
                      setUserInterests((prev) => [...new Set([...prev, c])]); // ✅ Add directly too
                    } else {
                      setSelectedInterests((prev) =>
                        prev.filter((i) => i !== c)
                      );
                      setUserInterests((prev) => prev.filter((i) => i !== c)); // ✅ Remove directly too
                    }
                  }}
                />
                <span className="text-white">{c}</span>
              </label>
            ))}

            <div className="flex gap-3 mt-3">
              <Button
                onClick={handleAddInterest}
                className="bg-[#0038FF] hover:bg-[#1a4dff] text-white rounded-[15px]"
              >
                Add
              </Button>
              <Button
                onClick={() => {
                  setShowAddInterestForm(false);
                  setSelectedInterests([]);
                }}
                className="bg-white/10 hover:bg-white/20 text-white rounded-[15px]"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-white/20 mt-[50px]" />

        {/* SECTION 3 - Licenses & Certifications */}
        <div className="flex flex-col gap-[25px] mt-[25px]">
          <div className="flex items-center justify-between">
            <h5 className="text-white text-lg font-semibold flex items-center gap-[15px]">
              Licenses & Certifications
              {/* Edit all credentials button */}
              {isOwnProfile && (
                <button onClick={handleEditAllCredentials}>
                  <PencilIcon className="w-5 h-5 text-white cursor-pointer" />
                </button>
              )}
            </h5>
          </div>

          {/* Loading state */}
          {credentialsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-white/60">Loading credentials...</div>
            </div>
          )}

          {/* Error state */}
          {credentialsError && !credentialsLoading && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-[10px] p-3">
              {credentialsError}
            </div>
          )}

          {/* Empty state */}
          {!credentialsLoading &&
            !credentialsError &&
            userCredentials.length === 0 && (
              <div className="text-white/60 text-center py-8">
                No credentials added yet.
                {isOwnProfile && (
                  <button
                    onClick={handleEditAllCredentials}
                    className="block mx-auto mt-2 text-[#0038FF] hover:underline"
                  >
                    + Add your first credential
                  </button>
                )}
              </div>
            )}

          {/* The scrollable container for the credentials */}
          <div
            className={clsx(
              "grid gap-[25px] grid-cols-2",
              !showAllCreds && "max-h-[420px] overflow-y-auto"
            )}
          >
            {(userCredentials || []).length > 0 &&
              (userCredentials || []).map((cred, index) => (
                <div
                  key={index}
                  className="border border-white/20 rounded-[15px] p-[25px] flex flex-col justify-between relative"
                >
                  {/* Pencil icon for editing a single credential */}
                  {isOwnProfile && (
                    <button
                      onClick={() => handleEditSingleCredential(cred)}
                      className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                    >
                      <PencilIcon className="w-4 h-4 cursor-pointer" />
                    </button>
                  )}
                  {/* Group 1 */}
                  <h6 className="text-[20px] font-semibold mb-[5px]">
                    {cred.credential_title}
                  </h6>
                  <p className="text-[16px]">{cred.issuer}</p> {/* Group 2 */}
                  <div className="mt-[15px] text-[16px] text-white/50 leading-[1.6]">
                    Issued <span>{formatMonthYear(cred.issue_date)}</span> •{" "}
                    {/* Changed from cred.issueDate */}
                    {cred.expiry_date
                      ? `Expires ${formatMonthYear(cred.expiry_date)}`
                      : "No expiry"}
                    <br />
                    {cred.cred_id ? `ID: ${cred.cred_id}` : ""}
                  </div>
                  {/* Group 3 */}
                  <div className="mt-[15px]">
                    <a
                      href={cred.cred_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#0038FF] hover:underline transition-colors"
                    >
                      View credential
                      <Icon icon="mdi:arrow-top-right" className="w-4 h-4" />
                    </a>
                  </div>
                  {/* Group 4: Skill */}
                  {(cred.skills || []).length > 0 && (
                    <div className="mt-[20px] flex items-center gap-[10px]">
                      {(cred.skills || []).map((skill, skillIndex) => (
                        <TradePill key={skillIndex} content={skill} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
          {/* Show More / Show Less Button */}
          {(userCredentials || []).length > 4 && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setShowAllCreds(!showAllCreds)}
                className="bg-white/10 text-white hover:bg-white/20"
              >
                {showAllCreds ? (
                  <>
                    Show Less <ChevronUpIcon className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show More <ChevronDownIcon className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 mt-[50px]" />

        {/* SECTION 4: Trades You Posted */}
        {(isOwnProfile || !isOwnProfile) && (
          <div className="mb-10">
            <h5 className="text-white text-lg font-semibold flex items-center gap-[15px] mb-[20px]">
              {isOwnProfile ? "Trades You Posted" : `Trades ${user?.firstname || "they"} Posted`}
            </h5>

            {postedTradesLoading ? (
              <div className="text-center py-8 text-white/60">
                Loading trades...
              </div>
            ) : postedTradesError ? (
              <div className="text-center py-8 text-red-400">
                {postedTradesError}
              </div>
            ) : postedTrades.length === 0 ? (
              <div className="text-white/60 text-center py-8">
                You haven't posted any trades yet.
              </div>
            ) : (
              <div className="flex flex-wrap gap-[25px]">
                {postedTrades.map((trade, index) => {
                  console.log(
                    "🪄 Rendering card:",
                    trade,
                    "isOwnProfile:",
                    isOwnProfile
                  );
                  return (
                    <div key={trade.id} className="relative">
                      {isOwnProfile ? (
                        // ✅ OWNER VIEW CARD (delete + offers)
                        <div
                          className="transition-all duration-300 hover:scale-[1.01] w-[440px] h-[240px] p-[25px] flex flex-col justify-between rounded-[20px] border-[3px] border-[#D78DE5]/80"
                          style={{
                            background:
                              "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                            boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)",
                          }}
                        >
                          {/* 💥 Copy-paste the header, needs, interested section, date & view button */}
                          {/* Exactly the same structure from PendingTradesPage */}

                          {/* Header */}
                          <div className="flex justify-between items-start w-full">
                            <div className="flex items-start gap-[10px]">
                              <Link
                                href={`/home/profile/${session.user.username}`}
                                className="flex-shrink-0"
                              >
                                <div className="w-[25px] h-[25px] rounded-full overflow-hidden bg-gray-400 cursor-pointer hover:ring-2 hover:ring-[#D78DE5] transition-all">
                                  <Image
                                    src={
                                      session?.user?.image ||
                                      "/assets/defaultavatar.png"
                                    }
                                    alt="Your profile picture"
                                    width={25}
                                    height={25}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </Link>
                              <div className="flex flex-col items-start gap-[5px]">
                                <Link
                                  href={`/home/profile/${session.user.username}`}
                                  className="text-[16px] text-white hover:text-[#D78DE5] transition-colors cursor-pointer"
                                >
                                  <span>{trade.name}</span>
                                </Link>
                                <div className="flex items-center gap-[15px]">
                                  <div className="flex items-center gap-[5px]">
                                    <Star className="w-4 h-4 text-[#906EFF] fill-[#906EFF]" />
                                    <span className="text-[13px] font-bold text-white">
                                      {trade.rating}
                                    </span>
                                    <span className="text-[13px] text-white">
                                      ({trade.reviews})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-[5px]">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="12"
                                      height="13"
                                      viewBox="0 0 12 13"
                                      fill="none"
                                    >
                                      <path
                                        d="M6 1.41516C6.09178 1.41516 6.17096 1.42794 6.22461 1.44446C6.23598 1.44797 6.2447 1.4517 6.25098 1.45422L11.0693 6.66516L6.25098 11.8751C6.24467 11.8777 6.23618 11.8823 6.22461 11.8859C6.17096 11.9024 6.09178 11.9152 6 11.9152C5.90822 11.9152 5.82904 11.9024 5.77539 11.8859C5.76329 11.8821 5.75441 11.8777 5.74805 11.8751L0.929688 6.66516L5.74805 1.45422C5.75439 1.45164 5.76351 1.44812 5.77539 1.44446C5.82904 1.42794 5.90822 1.41516 6 1.41516Z"
                                        fill="url(#paint0_radial_1202_2090)"
                                        stroke="url(#paint1_linear_1202_2090)"
                                        strokeWidth="1.5"
                                      />
                                      <defs>
                                        <radialGradient
                                          id="paint0_radial_1202_2090"
                                          cx="0"
                                          cy="0"
                                          r="1"
                                          gradientUnits="userSpaceOnUse"
                                          gradientTransform="translate(6.00002 6.66516) scale(6.09125 6.58732)"
                                        >
                                          <stop
                                            offset="0.4"
                                            stopColor="#933BFF"
                                          />
                                          <stop
                                            offset="1"
                                            stopColor="#34188D"
                                          />
                                        </radialGradient>
                                        <linearGradient
                                          id="paint1_linear_1202_2090"
                                          x1="6.00002"
                                          y1="0.0778344"
                                          x2="6.00002"
                                          y2="13.2525"
                                          gradientUnits="userSpaceOnUse"
                                        >
                                          <stop stopColor="white" />
                                          <stop
                                            offset="0.5"
                                            stopColor="#999999"
                                          />
                                          <stop offset="1" stopColor="white" />
                                        </linearGradient>
                                      </defs>
                                    </svg>
                                    <span className="text-[13px] text-white">
                                      LVL {trade.level}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Right: 🗑 Delete Icon */}
                            <button
                              onClick={() =>
                                setShowDeleteModalForCard(trade.id)
                              }
                              className="p-1 hover:bg-white/10 rounded-full transition"
                              title="Delete trade"
                            >
                              <Icon
                                icon="lucide:trash-2"
                                className="w-5 h-5 text-red-500 hover:text-red-600 transition"
                              />
                            </button>
                          </div>

                          {/* Needs + Interested */}
                          <div className="flex justify-between items-start w-full">
                            <div className="flex flex-col items-start gap-[10px]">
                              <span className="text-[13px] text-white">
                                Needs
                              </span>
                              <div className="px-[10px] py-[5px] bg-[rgba(40,76,204,0.2)] border-[1.5px] border-[#0038FF] rounded-[15px]">
                                <span className="text-[12px] text-white leading-tight">
                                  {trade.needs || trade.reqname || "N/A"}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-[10px]">
                              <span className="text-[13px] text-white">
                                Look who's interested
                              </span>
                              <div className="flex -space-x-2">
                                {trade.interested &&
                                  trade.interested.length > 0 ? (
                                  trade.interested.map((person) => (
                                    <div
                                      key={person.id}
                                      className="w-[25px] h-[25px] rounded-full border border-white overflow-hidden"
                                    >
                                      <Image
                                        src={
                                          person.avatar ||
                                          "/assets/defaultavatar.png"
                                        }
                                        alt={`${person.name}'s profile picture`}
                                        width={25}
                                        height={25}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-[12px] text-white/60">
                                    No requests yet
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Date + View button */}
                          <div className="flex justify-between items-center w-full">
                            <span className="text-[13px] text-white/60">
                              until{" "}
                              {trade.until || trade.deadline || "No deadline"}
                            </span>
                            <button
                              className="w-[120px] h-[30px] flex justify-center items-center bg-[#0038FF] rounded-[10px] shadow-[0px_0px_15px_#284CCC] cursor-pointer hover:bg-[#1a4dff] transition-colors"
                              onClick={() => console.log("View trade", trade)}
                              disabled={
                                !trade.interested ||
                                trade.interested.length === 0
                              }
                            >
                              <span className="text-[13px] text-white">
                                {!trade.interested ||
                                  trade.interested.length === 0
                                  ? "No offers"
                                  : "View"}
                              </span>
                            </button>
                            {showDeleteModalForCard === trade.tradereq_id && (
                              <InlineConfirmationModal
                                message="Are you sure you want to delete this trade request? This action cannot be undone."
                                onConfirm={() => handleDeleteTrade(trade)}
                                onCancel={() => setShowDeleteModalForCard(null)}
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        // 🌐 PUBLIC VIEW CARD (Explore-style)
                        <div
                          className="transition-all duration-300 hover:scale-[1.01] w-[440px] min-h-[220px] p-[25px] flex flex-col justify-between rounded-[20px] border-[3px] border-[#5A5AFF]/80"
                          style={{
                            background:
                              "radial-gradient(100% 275% at 100% 0%, #3D2490 0%, #120A2A 69.23%)",
                            boxShadow: "0px 5px 40px rgba(40, 76, 204, 0.2)",
                          }}
                        >
                          {/* Top Row */}
                          <div className="flex justify-between items-start w-full">
                            <div className="flex gap-[10px]">
                              <Link
                                href={`/home/profile/${trade.username}`}
                                className="flex-shrink-0"
                              >
                                <div className="relative w-[25px] h-[25px] rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#0038FF] transition-all">
                                  <Image
                                    src={
                                      trade.profilePic ||
                                      "/assets/defaultavatar.png"
                                    }
                                    alt={`${trade.name}'s avatar`}
                                    width={25}
                                    height={25}
                                    className="rounded-full object-cover"
                                  />
                                </div>
                              </Link>
                              <div className="flex flex-col gap-[5px]">
                                <Link
                                  href={`/home/profile/${trade.username}`}
                                  className="hover:text-[#0038FF] transition-colors"
                                >
                                  <span className="text-base font-medium cursor-pointer">
                                    {trade.name}
                                  </span>
                                </Link>
                                <div className="flex gap-[15px] items-center text-sm text-white/90">
                                  <div className="flex gap-1 items-center">
                                    <Icon
                                      icon="mdi:star"
                                      className="text-[#B18AFF]"
                                      width={14}
                                      height={14}
                                    />
                                    <span className="font-bold">
                                      {trade.rating.toFixed(1)}
                                    </span>
                                    <span className="text-white/70">
                                      ({trade.reviews})
                                    </span>
                                  </div>
                                  <div className="flex gap-1 items-center">
                                    <Image
                                      src="/assets/lvlrank_icon.png"
                                      alt="Level"
                                      width={12}
                                      height={12}
                                    />
                                    <span className="text-white/80">
                                      LVL {trade.level}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Needs + Offer */}
                          <div className="flex justify-between items-start gap-4 flex-wrap mb-3">
                            <div className="flex flex-col gap-2 flex-1 min-w-[45%] items-start">
                              <span className="text-sm text-white/80 font-medium">
                                Needs
                              </span>
                              <div className="inline-block px-[15px] py-[7px] rounded-[15px] border-[2px] border-[#5A5AFF] bg-[#5A5AFF33] text-sm text-white/90 w-fit">
                                {trade.reqname}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 flex-1 min-w-[45%] items-end">
                              <span className="text-sm text-white/80 font-medium">
                                Can offer
                              </span>
                              <div className="inline-block px-[15px] py-[7px] rounded-[15px] border-[2px] border-[#906EFF] bg-[#906EFF33] text-sm text-white/90 w-fit text-right">
                                {trade.offer || trade.matching_skill}
                              </div>
                            </div>
                          </div>

                          {/* Deadline */}
                          <div className="mt-[0px] flex justify-end mb-3">
                            <p className="text-[13px] text-white/70">
                              {fmtUntil(trade.deadline)}
                            </p>
                          </div>

                          {/* CTA */}
                          <div className="mt-[0px] flex justify-center">
                            {(() => {
                              const hasInterest = userInterestStatus[trade.tradereq_id];
                              const isPending = hasInterest === 'PENDING';
                              const isAccepted = hasInterest === 'ACCEPTED';

                              if (isPending) {
                                return (
                                  <div className="relative group inline-block">
                                    <button
                                      disabled
                                      className="px-[30px] py-[10px] text-white/60 bg-gray-600/50 rounded-[15px] text-sm font-medium cursor-not-allowed border-2 border-gray-500/50"
                                    >
                                      Request Pending
                                    </button>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#120A2A]/95 text-white text-xs rounded-lg border border-[#906EFF]/30 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap">
                                      You already sent an interest request to this trade
                                      {/* Arrow */}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                                        <div className="border-4 border-transparent border-t-[#120A2A]/95"></div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              if (isAccepted) {
                                return (
                                  <button
                                    disabled
                                    className="px-[30px] py-[10px] text-white/60 bg-green-600 rounded-[15px] text-sm font-medium cursor-not-allowed"
                                  >
                                    Already Accepted
                                  </button>
                                );
                              }

                              return (
                                <button
                                  onClick={() => handleInterestedClick(trade)}
                                  className="px-[30px] py-[10px] text-white bg-[#0038FF] hover:bg-[#1a4dff] rounded-[15px] shadow-[0_0_15px_0_#284CCC] text-sm font-medium"
                                >
                                  I'm interested
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && selectedTrade && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="relative flex flex-col items-center justify-center w-[500px] h-[200px] bg-[#120A2A]/95 border-2 border-[#0038FF] shadow-[0px_4px_15px_#284CCC] backdrop-blur-[10px] rounded-[20px] overflow-hidden">
              {/* Background gradients */}
              <div className="absolute top-[-50px] left-[-50px] w-[150px] h-[150px] rounded-full bg-[#0038FF]/15 blur-[40px]"></div>
              <div className="absolute bottom-[-40px] right-[-40px] w-[120px] h-[120px] rounded-full bg-[#906EFF]/15 blur-[40px]"></div>

              {/* Close button */}
              <button
                className="absolute top-4 right-4 text-white hover:text-gray-300"
                onClick={handleCancelInterest}
              >
                <Icon icon="lucide:x" className="w-[20px] h-[20px]" />
              </button>

              <div className="flex flex-col items-center gap-6 w-full px-8 relative z-10">
                <h2 className="font-bold text-[20px] text-center text-white leading-tight">
                  Are you sure you want to add this to your pending trades?
                </h2>
                <div className="flex flex-row gap-4">
                  <button
                    className="flex items-center justify-center w-[120px] h-[40px] border-2 border-[#0038FF] rounded-[15px] text-[#0038FF] text-[16px] font-medium shadow-[0px_0px_15px_#284CCC] hover:bg-[#0038FF]/10 transition-colors"
                    onClick={handleCancelInterest}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex items-center justify-center w-[120px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] font-medium shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors"
                    onClick={handleConfirmInterest}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Success Dialog */}
        {showSuccessDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="relative flex flex-col items-center justify-center w-[500px] h-[200px] bg-[#120A2A]/95 border-2 border-[#0038FF] shadow-[0px_4px_15px_#284CCC] backdrop-blur-[10px] rounded-[20px] overflow-hidden">
              {/* Close button (X) */}
              <button
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                onClick={handleSuccessDialogClose}
              >
                <Icon icon="lucide:x" className="w-[20px] h-[20px]" />
              </button>

              {/* Message */}
              <h2 className="font-bold text-[20px] text-center text-white mb-6">
                Trade invitation successfully sent.
              </h2>

              {/* Go to Pending Trades button */}
              <button
                className="w-[200px] h-[40px] bg-[#0038FF] rounded-[15px] text-white text-[16px] font-medium shadow-[0px_0px_15px_#284CCC] hover:bg-[#1a4dff] transition-colors"
                onClick={() => {
                  handleSuccessDialogClose(); // close the dialog
                  router.push("/home/trades/pending");
                }}
              >
                Go to Pending Trades
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-white/20 mt-[50px]" />

        {/* SECTION 5 - REVIEWS */}
        <div className="flex flex-col gap-[25px] mt-[25px]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h5 className="text-white text-lg font-semibold">Reviews</h5>
              <span className="text-[16px] text-white/50 mt-[5px]">
                {user.reviews} trades & reviews
              </span>
            </div>
            {reviews.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center text-white text-[16px] border border-white/20 rounded-[10px] h-[30px] px-3"
                >
                  {sortOption}{" "}
                  <ChevronDownIcon className="ml-2 h-4 w-4 text-white" />
                </button>
                {showSortDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-40 bg-[#120A2A] rounded-xl border border-white/20 shadow-lg py-1 z-10">
                    {["Latest", "Highest Rating", "Lowest Rating"].map(
                      (option) => (
                        <button
                          key={option}
                          onClick={() => handleSortChange(option)}
                          className={clsx(
                            "block w-full text-left px-4 py-2 text-sm transition-colors",
                            option === sortOption
                              ? "text-[#906EFF] bg-white/10"
                              : "text-white hover:bg-white/10"
                          )}
                        >
                          {option}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Loading state */}
          {reviewsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-white/60">Loading reviews...</div>
            </div>
          )}

          {/* Error state */}
          {reviewsError && !reviewsLoading && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded-[10px] p-3">
              {reviewsError}
            </div>
          )}

          {/* Empty state */}
          {!reviewsLoading && !reviewsError && reviews.length === 0 && (
            <div className="text-white/60 text-center py-8">
              No reviews yet.
            </div>
          )}

          {/* Rating Analytics - only show if there are reviews */}
          {reviews.length > 0 && (
            <div className="flex items-start gap-[50px]">
              {/* Overall Rating Group */}
              <div className="flex flex-col">
                <div className="flex items-end gap-[10px]">
                  <span className="text-[40px] font-bold leading-none">
                    {safeFixed(user.rating, 1)}
                  </span>
                  <span className="text-[16px] text-white/50 pb-2">
                    ({Number(user.reviews) || 0})
                  </span>
                </div>
                <div className="flex items-center mt-[20px]">
                  {renderStars(user.rating)}
                </div>
              </div>

              {/* Rating Bars */}
              <div className="flex flex-col gap-[10px]">
                {Object.keys(reviewRatings)
                  .reverse()
                  .map((rating) => (
                    <div key={rating} className="flex items-center gap-[15px]">
                      <span className="text-[16px] w-[15px]">{rating}</span>
                      <div className="w-[270px] h-[15px] bg-white/20 rounded-full">
                        <div
                          style={{
                            width:
                              user.reviews > 0
                                ? `${(reviewRatings[rating] / user.reviews) * 100
                                }%`
                                : "0%",
                          }}
                          className="h-full bg-[#906EFF] rounded-full"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Reviews section */}
          {reviews.length > 0 && (
            <div className="mt-8 flex flex-col gap-6">
              {sortedReviews.map((review, index) => (
                <ReviewCard key={index} review={review} />
              ))}
            </div>
          )}
        </div>

        {/* === Verification Popup (improved UI) === */}
        {showVerificationPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#120A2A] p-6 rounded-[15px] w-[420px] shadow-lg border border-white/20">
              <div className="flex items-start justify-between">
                <h3 className="text-white text-lg font-semibold">
                  Upload your ID
                </h3>
                <button
                  onClick={() => {
                    // close & clear selection
                    setShowVerificationPopup(false);
                    setIdFile(null);
                    if (idPreviewUrl) {
                      URL.revokeObjectURL(idPreviewUrl);
                      setIdPreviewUrl(null);
                    }
                  }}
                  className="p-1 rounded hover:bg-white/10"
                  aria-label="Close verification popup"
                >
                  <Icon icon="mdi:close" className="w-5 h-5 text-white/70" />
                </button>
              </div>

              <p className="text-white/70 text-sm mt-2 mb-4">
                Please upload a clear image or PDF of your government-issued ID.
                Accepted: PDF, PNG, or JPEG. Max 15&nbsp;MB.
              </p>

              {/* Upload control */}
              <div className="flex items-center gap-3 mb-5">
                <input
                  id="id-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) =>
                    handleIdFileChange(e.target.files?.[0] ?? null)
                  }
                />

                {/* Visible button (label) */}
                <label
                  htmlFor="id-upload"
                  className="cursor-pointer inline-flex items-center gap-2 rounded-[12px] px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm border border-white/20"
                >
                  <Icon icon="mdi:upload" className="w-4 h-4" />
                  Upload file
                </label>

                {/* Filename or preview */}
                <div className="flex-1 min-w-0">
                  {idFile ? (
                    <div className="flex items-center gap-3">
                      {idPreviewUrl ? (
                        <img
                          src={idPreviewUrl}
                          alt="ID preview"
                          className="w-12 h-8 object-cover rounded-sm border border-white/10"
                        />
                      ) : (
                        <span className="inline-block w-12 h-8 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-xs text-white/70">
                          PDF
                        </span>
                      )}
                      <span className="text-white/80 text-sm truncate">
                        {idFile.name}
                      </span>
                      <button
                        onClick={() => {
                          setIdFile(null);
                          if (idPreviewUrl) {
                            URL.revokeObjectURL(idPreviewUrl);
                            setIdPreviewUrl(null);
                          }
                          // clear the native input too
                          const el = document.getElementById("id-upload");
                          if (el) el.value = "";
                        }}
                        className="ml-2 text-white/60 hover:text-white/90"
                        aria-label="Remove selected file"
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="text-white/60 text-sm">
                      No file selected
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    // cancel
                    setShowVerificationPopup(false);
                    setIdFile(null);
                    if (idPreviewUrl) {
                      URL.revokeObjectURL(idPreviewUrl);
                      setIdPreviewUrl(null);
                    }
                    const el = document.getElementById("id-upload");
                    if (el) el.value = "";
                  }}
                  className="bg-white/10 text-white rounded-[15px] px-4 py-2 hover:bg-white/20"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmitVerification}
                  disabled={!idFile}
                  className={`rounded-[15px] px-4 py-2 shadow ${idFile
                    ? "bg-[#0038FF] hover:bg-[#1a4dff] text-white"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                    }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
        {editingCredentials && (
          <EditCredentialsPage
            credentialsToEdit={
              editingCredentials === "all"
                ? userCredentials
                : [editingCredentials]
            }
            onCancel={() => setEditingCredentials(null)}
            onSave={handleSaveCredentials}
          />
        )}
      </div>
    </div>
  );
}
