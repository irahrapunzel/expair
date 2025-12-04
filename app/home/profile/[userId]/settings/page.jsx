"use client";

import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  Loader2,
  X,
  Pencil,
  Search,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { useSession } from "next-auth/react";
import { authFetch } from "@/lib/authFetch";
import Map, { Marker } from "react-map-gl";
import ProfileAvatar from "@/components/avatar";

const inter = Inter({ subsets: ["latin"] });

// --- helpers ---
const joinUrl = (...parts) =>
  parts
    .map((p) => String(p ?? "").replace(/(^\/+|\/+$)/g, ""))
    .filter(Boolean)
    .join("/");
const resolveAccountsBase = (raw) => {
  const root = String(raw || "http://127.0.0.1:8000").replace(/\/+$/, "");
  return root.includes("/api/accounts") ? root : `${root}/api/accounts`;
};

const backendUrl = "http://localhost:8000";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export default function SettingsPage() {
  const { data: session, update, status } = useSession();
  const params = useParams();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState("profile");
  const [userId, setUserId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [emailAdd, setEmailAdd] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [links, setLinks] = useState([]);
  const [location, setLocation] = useState("");

  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const debouncedUsername = useDebounce(username, 500);

  const [originalFirstName, setOriginalFirstName] = useState("");
  const [originalLastName, setOriginalLastName] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalEmailAdd, setOriginalEmailAdd] = useState("");
  const [originalBio, setOriginalBio] = useState("");
  const [originalLocation, setOriginalLocation] = useState("");
  const [originalLinks, setOriginalLinks] = useState("");

  // ui state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // edit toggles
  const [editFirstName, setEditFirstName] = useState(false);
  const [editLastName, setEditLastName] = useState(false);
  const [editBio, setEditBio] = useState(false);
  const [editUsername, setEditUsername] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [editLocation, setEditLocation] = useState(false);
  const [editLinks, setEditLinks] = useState(false);

  // location states
  const [viewport, setViewport] = useState({
    longitude: 121.0437,
    latitude: 14.5995,
    zoom: 12,
  });

  const [marker, setMarker] = useState({
    longitude: 121.0437,
    latitude: 14.5995,
  });

  const [searchQuery, setSearchQuery] = useState(location || "");
  const [suggestions, setSuggestions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isUserInteracted, setIsUserInteracted] = useState(false); 

  const DEFAULT_AVATAR = "/assets/defaultavatar.png";
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_AVATAR);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [details, setDetails] = useState("");
  const [charCount, setCharCount] = useState(0);

  const handleDetailsChange = (e) => {
    const text = e.target.value;
    setDetails(text);
    setCharCount(text.length);
  };

  const passwordRules = [
    { label: "At least one lowercase letter", test: /[a-z]/ },
    { label: "At least one uppercase letter", test: /[A-Z]/ },
    { label: "At least one number", test: /\d/ },
    { label: "Minimum 8 characters", test: /.{8,}/ },
  ];

  const menuItems = [
    { key: "profile", label: "Profile" },
  ];

  const checkAvailability = async (field, value) => {
    if (
      field === "username" &&
      value.toLowerCase() === originalUsername.toLowerCase()
    ) {
      return false; 
    }

    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || backendUrl; 
    if (!baseUrl) {
      console.error("[settings] NEXT_PUBLIC_BACKEND_URL is not set!");
      setError("Configuration Error: Backend URL not found.");
      return true; 
    }

    try {
      // NOTE: Using native fetch here, which is fine
      const response = await fetch(`${baseUrl}/api/validate-field/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ field, value }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API call failed with status: ${
            response.status
          }. Response: ${errorText.substring(0, 100)}...`
        );
      }

      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error(`Error checking ${field} for value "${value}":`, error);
      setError(
        `Network Error: Could not verify ${field} availability. Please try again.`
      );
      return true; 
    }
  };

  // for Username Validation
  useEffect(() => {
    if (
      !debouncedUsername ||
      debouncedUsername.length < 3 ||
      debouncedUsername.toLowerCase() === originalUsername.toLowerCase()
    ) {
      setUsernameError("");
      return;
    }

    const checkUsername = async () => {
      setIsCheckingUsername(true);
      const exists = await checkAvailability("username", debouncedUsername);
      setUsernameError(exists ? "Username already taken." : "");
      setIsCheckingUsername(false);
    };
    checkUsername();
  }, [debouncedUsername, originalUsername]);

  useEffect(() => {
    if (!session) return; 

    const run = async () => {
      try {
        const res = await authFetch(
          `${backendUrl}/api/accounts/me/`,
          {},
          session
        );
        // FIX 1: Handle if res is already data or a Response
        const data = (res && typeof res.json === 'function') ? await res.json() : res;
        console.log("Me endpoint:", data);
      } catch (err) {
        console.error("[settings] load error", err);
      }
    };

    run();
  }, [session]);

  useEffect(() => {
    console.log("🔍 Session object in Settings page:", session); 

    let uid = null;

    if (params?.userId) {
      uid = params.userId; 
    } else if (pathname) {
      const m = pathname.match(/\/profile\/([^\/]+)/i);
      if (m) {
        uid = m[1]; 
      }
    }

    if (!uid && typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      uid = sp.get("uid");
    }

    setUserId(uid);
  }, [params, pathname]);

  // load current profile
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");
      setSaved(false);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        console.warn("[settings] No backend URL configured");
        setFirstName("");
        setLastName("");
        setUsername("");
        setEmailAdd("");
        setBio("");
        setLocation("");
        setLinks([]);
        setProfilePicUrl("/assets/defaultavatar.png");
        setOriginalFirstName("");
        setOriginalLastName("");
        setOriginalUsername("");
        setOriginalEmailAdd("");
        setOriginalBio("");
        setOriginalLocation("");
        setOriginalLinks([]);
        setLoading(false);
        return;
      }

      try {
        const API_BASE = resolveAccountsBase(backendUrl);

        let url;
        if (userId != null) {
          if (/^\d+$/.test(String(userId))) {
            url = `${joinUrl(API_BASE, "users", String(userId))}/`;
          } else {
            url = `${joinUrl(API_BASE, "users", "username", String(userId))}/`;
          }
        } else {
          url = `${joinUrl(API_BASE, "me")}/`;
        }

        const res = await authFetch(url, { credentials: "include" });
        
        // FIX 2: Check if 'res' is a Response object or plain data
        let data;
        if (res && typeof res.json === "function") {
            // It is a standard Fetch Response
            if (!res.ok) {
              const t = await res.text();
              throw new Error(`Load failed (${res.status}): ${t.slice(0, 160)}`);
            }
            data = await res.json();
        } else {
            // It is already parsed data (custom authFetch behavior)
            if (!res) throw new Error("No data returned from server");
            if (res.error) throw new Error(res.error); // Handle custom error objects
            data = res;
        }

        let linksValue = [];

        if (Array.isArray(data.links)) {
          linksValue = data.links.map((l) =>
            String(l)
              .replace(/^https?:\/\//, "")
              .replace(/^"|"$/g, "")
              .trim()
          );
        } else if (typeof data.links === "string" && data.links.trim() !== "") {
          try {
            const parsed = JSON.parse(data.links);
            if (Array.isArray(parsed)) {
              linksValue = parsed.map((l) =>
                String(l)
                  .replace(/^https?:\/\//, "")
                  .replace(/^"|"$/g, "")
                  .trim()
              );
            } else {
              linksValue = [data.links.trim()];
            }
          } catch {
            linksValue = data.links
              .split(",")
              .map((l) =>
                String(l)
                  .replace(/^https?:\/\//, "")
                  .replace(/^"|"$/g, "")
                  .trim()
              )
              .filter(Boolean);
          }
        } else {
          linksValue = [];
        }
        setUserId(Number(data.user_id || userId || 0) || null);
        const firstNameValue = data.first_name || "";
        const lastNameValue = data.last_name || "";
        const usernameValue = String(data.username || "");
        const emailValue = String(data.emailAdd || data.email || "");
        const bioValue = String(data.bio || "");
        const locationValue = String(data.location || "");

        setFirstName(firstNameValue);
        setLastName(lastNameValue);
        setUsername(usernameValue);
        setEmailAdd(emailValue);
        setBio(bioValue);
        setLocation(locationValue);
        setSearchQuery(locationValue);
        setLinks(linksValue);
        setProfilePicUrl(
          String(data.profilePic || "/assets/defaultavatar.png")
        );

        setOriginalFirstName(firstNameValue);
        setOriginalLastName(lastNameValue);
        setOriginalUsername(usernameValue);
        setOriginalEmailAdd(emailValue);
        setOriginalBio(bioValue);
        setOriginalLocation(locationValue);
        setOriginalLinks(linksValue);
      } catch (e) {
        console.error("[settings] load error", e);
        if (
          e.message.includes("Failed to fetch") ||
          e.message.includes("ERR_CONNECTION_REFUSED")
        ) {
          setError("Backend server is not available.");
          setOriginalUsername("");
          setOriginalEmailAdd("");
          setOriginalBio("");
          setOriginalLocation("");
          setOriginalLinks([]);
        } else {
          setError(e.message || "Failed to load settings.");
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [userId]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(profilePicUrl || DEFAULT_AVATAR);
    }
  }, [profilePicUrl, file]);

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!location) return;

    const fetchCoords = async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          location
        )}.json?limit=1&access_token=${token}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;

          setViewport((prev) => ({
            ...prev,
            longitude: lng,
            latitude: lat,
            zoom: 12,
          }));

          setMarker({ longitude: lng, latitude: lat });
        }
      } catch (err) {
        console.error("Geocoding error:", err);
      }
    };

    fetchCoords(); 
  }, [location]);

  const norm = (v) => String(v ?? "").trim();

  const isDirty = useMemo(() => {
    if (
      norm(firstName) !== norm(originalFirstName) ||
      norm(lastName) !== norm(originalLastName) ||
      norm(username) !== norm(originalUsername) ||
      norm(bio) !== norm(originalBio) ||
      norm(location) !== norm(originalLocation) ||
      JSON.stringify(links) !== JSON.stringify(originalLinks) ||
      !!file ||
      !!password
    ) {
      return true;
    }
    return false;
  }, [
    firstName,
    lastName,
    username,
    emailAdd,
    bio,
    location,
    links,
    file,
    password,
    originalFirstName,
    originalLastName,
    originalUsername,
    originalEmailAdd,
    originalBio,
    originalLocation,
    originalLinks,
  ]);

  const handlePickImage = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setSaved(false);
  };

  const handleSave = async () => {
    console.log("links before save", links);

    if (saving) return;
    setSaving(true);
    setSaved(false);
    setError("");

    if (usernameError) {
      setError(usernameError);
      setSaving(false);
      return;
    }
    if (isCheckingUsername) {
      setError("Please wait for username availability check to complete.");
      setSaving(false);
      return;
    }

    const configuredBackendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || backendUrl;
    if (!configuredBackendUrl) {
      console.warn("[settings] No backend URL configured, simulating save");
      setTimeout(() => {
        setOriginalFirstName(firstName);
        setOriginalLastName(lastName);
        setOriginalUsername(username);
        setOriginalEmailAdd(emailAdd);
        setOriginalBio(bio);
        setOriginalLocation(location);
        setOriginalLinks(links);

        setFile(null);
        setPassword("");
        setConfirmPassword("");
        setSaved(true);
        setShowSavedPopup(true);
        setSaving(false);
      }, 1000);
      return;
    }

    try {
      console.log(">>> handleSave starting with links:", links);

      const API_BASE = resolveAccountsBase(configuredBackendUrl);
      const fd = new FormData();
      if (file) fd.append("profilePic", file);
      if (norm(firstName)) fd.append("first_name", norm(firstName));
      if (norm(lastName)) fd.append("last_name", norm(lastName));
      if (norm(username)) fd.append("username", norm(username));
      if (norm(emailAdd)) fd.append("emailAdd", norm(emailAdd));
      if (norm(bio)) fd.append("bio", norm(bio));
      if (norm(location)) fd.append("location", norm(location));
      if (userId) fd.append("user_id", String(userId));
      if (password || confirmPassword) {
        const isValid = passwordRules.every((rule) => rule.test.test(password));
        if (!isValid) {
          setError("Password does not meet requirements.");
          setSaving(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setSaving(false);
          return;
        }
        fd.append("password", password);
      }

      const cleanLinks = (Array.isArray(links) ? links : [])
        .map((l) => (typeof l === "string" ? l.trim() : ""))
        .filter((l) => l.length > 0);

      const invalidLinks = cleanLinks.filter(
        (l) => l.trim() !== "" && !isValidLink(l)
      );
      if (invalidLinks.length > 0) {
        setLinkError(
          "One or more links are invalid. Please enter valid URLs (e.g. instagram.com/username)."
        );
        setSaving(false);
        return; 
      }

      setLinkError(""); 
      fd.append("links", JSON.stringify(cleanLinks));

      const targetUrl =
        userId != null
          ? `${joinUrl(API_BASE, "users", String(userId))}/`
          : `${joinUrl(API_BASE, "me")}/`;

      console.log(">>> FormData about to send:");
      for (let [key, value] of fd.entries()) {
        console.log("   ", key, value);
      }

      const res = await authFetch(targetUrl, {
        method: "PATCH",
        credentials: "include",
        body: fd,
      });

      // FIX 3: Robust check for Response vs Data
      let updated;
      if (res && typeof res.json === "function") {
         // It is a Response
         if (!res.ok) {
            const txt = await res.text();
            throw new Error(`Save failed (${res.status}): ${txt.slice(0, 200)}`);
         }
         updated = await res.json();
      } else {
         // It is Data
         if (!res) throw new Error("Save returned no data");
         updated = res;
      }

      console.log("✅ Backend response:", updated);

      const newFirstName = String(updated.first_name ?? firstName);
      const newLastName = String(updated.last_name ?? lastName);
      const newUsername = String(updated.username ?? username);
      const newEmailAdd = String(updated.emailAdd ?? updated.email ?? emailAdd);
      const newBio = String(updated.bio ?? bio);
      const newLocation = String(updated.location ?? location);
      const newProfilePic = String(updated.profilePic ?? profilePicUrl);

      console.log("🖼️ New profile pic URL from backend:", newProfilePic);
      console.log("🔍 Current session before update:", session);

      setFirstName(newFirstName);
      setLastName(newLastName);
      setUsername(newUsername);
      setEmailAdd(newEmailAdd);
      setBio(newBio);
      setLocation(newLocation);
      setProfilePicUrl(newProfilePic);

      setPreviewUrl(newProfilePic);

      await update({
        ...session,
        user: {
          ...session?.user,
          profilePic: newProfilePic,
          username: newUsername,
          firstName: newFirstName,
          lastName: newLastName,
        },
      });

      let newLinks = [];
      try {
        if (Array.isArray(updated.links)) {
          newLinks = updated.links;
        } else if (
          typeof updated.links === "string" &&
          updated.links.trim() !== ""
        ) {
          newLinks = [updated.links];
        } else {
          newLinks = links; 
        }
      } catch {
        newLinks = links;
      }

      setLinks(newLinks);

      setOriginalFirstName(newFirstName);
      setOriginalLastName(newLastName);
      setOriginalUsername(newUsername);
      setOriginalEmailAdd(newEmailAdd);
      setOriginalBio(newBio);
      setOriginalLocation(newLocation);
      setOriginalLinks(newLinks.filter((l) => l.trim() !== ""));

      setEditFirstName(false);
      setEditLastName(false);
      setEditBio(false);
      setEditUsername(false);
      setEditPassword(false);
      setEditLocation(false);
      setEditLinks(false);

      setFile(null);
      setPassword("");
      setConfirmPassword("");
      setSaved(true);

      setShowSavedPopup(true);
    } catch (e) {
      console.error("[settings] save error", e);
      if (
        e.message.includes("Failed to fetch") ||
        e.message.includes("ERR_CONNECTION_REFUSED")
      ) {
        setError(
          "Backend server is not available. Changes saved locally only."
        );
        setOriginalUsername(username);
        setOriginalEmailAdd(emailAdd);
        setOriginalBio(bio);
        setOriginalLocation(location);
        setOriginalLinks(links);
        setSaved(true);
      } else {
        setError(e.message || "Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(originalFirstName);
    setLastName(originalLastName);
    setUsername(originalUsername);
    setEmailAdd(originalEmailAdd);
    setBio(originalBio);
    setLocation(originalLocation);
    setLinks(originalLinks.filter((l) => l.trim() !== ""));
    setFile(null);
    setPassword("");
    setConfirmPassword("");

    setEditFirstName(false);
    setEditLastName(false);
    setEditBio(false);
    setEditUsername(false);
    setEditPassword(false);
    setEditLocation(false);
    setEditLinks(false);

    setSaved(false);
    setError("");
  };

  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?autocomplete=true&limit=5&access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.features) {
        setSuggestions(data.features);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSuggestion = (place) => {
    console.log("Selected place:", place); 
    setSearchQuery(place.place_name); 
    const [longitude, latitude] = place.center;
    setViewport({
      latitude,
      longitude,
      zoom: 14,
    });
    setMarker({
      latitude,
      longitude,
    });
    setSuggestions([]); 
    setIsUserInteracted(true); 
    setErrorMessage(""); 
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      setErrorMessage("Please enter a location to search.");
      return;
    }

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchQuery
      )}.json?access_token=${token}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        setViewport((prev) => ({
          ...prev,
          latitude,
          longitude,
          zoom: 14,
        }));
        setMarker({ latitude, longitude });
        setIsUserInteracted(true); 
        setErrorMessage("");
      } else {
        setErrorMessage("Location not found. Please try again.");
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleMarkerChange = async (newMarker) => {
    console.log("New marker selected:", newMarker); 
    setMarker(newMarker); 
    setViewport((prev) => ({
      ...prev,
      latitude: newMarker.latitude,
      longitude: newMarker.longitude,
    }));

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${newMarker.longitude},${newMarker.latitude}.json?access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        setSearchQuery(data.features[0].place_name); 
        setIsUserInteracted(true); 
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
    }
  };

  const handleLinkChange = (index, value) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
    setLinkError("");
    if (value.trim() && !isValidLink(value.trim())) {
      console.warn("Invalid URL:", value);
    }
  };

  const handleAddLink = () => {
    setLinks([...links, ""]);
    setSaved(false);
  };

  const handleRemoveLink = (index) => {
    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);
    setSaved(false);
  };

  const reverseGeocode = async (lng, lat) => {
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?limit=1&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        const placeName = data.features[0].place_name;
        setLocation(placeName); 
        setSearchQuery(placeName); 
      } else {
        const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setLocation(fallback);
        setSearchQuery(fallback);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setLocation(fallback);
      setSearchQuery(fallback);
    }
  };

  const isValidLink = (url) => {
    const s = String(url || "").trim();
    if (!s) return false;
    return /^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+([\/?#].*)?$/i.test(s);
  };

  if (status === "loading") {
    return (
      <div
        className={`${inter.className} min-h-screen bg-[#050015] text-white py-10 px-4 flex items-center justify-center`}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className={`${inter.className} min-h-screen bg-[#050015] text-white py-10 px-4 flex items-center justify-center`}
      >
        <p>You must log in first.</p>
      </div>
    );
  }

  return (
    <div
      className={`${inter.className} min-h-screen bg-[#050015] text-white py-10 px-4`}
    >
      <div className="max-w-[940px] mx-auto flex gap-10">
        {/* Left Sidebar */}
        <aside className="w-[220px] flex-shrink-0">
          <Link
            href={`/home/profile/${userId ?? ""}`}
            className="flex items-center gap-2 mb-6 text-white/70 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" /> Back to Profile
          </Link>
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`text-left px-4 py-2 rounded-[8px] transition ${
                  activeTab === item.key
                    ? "bg-[#120A2A] text-white"
                    : "text-white/70 hover:bg-[#1A0F3E]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right Content */}
        <main className="flex-1">
          <h1 className="text-3xl font-semibold mb-6">
            {menuItems.find((m) => m.key === activeTab)?.label} Settings
          </h1>

          {activeTab === "profile" && (
            <>
              {loading && (
                <div className="flex items-center gap-2 text-white/70 mb-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading your
                  settings…
                </div>
              )}
              {!loading && error && (
                <p className="text-red-400 mb-4">{error}</p>
              )}

              {/* Profile Picture */}
              <section className="mb-8">
                <p className="mb-2 text-sm text-white/70">Profile Picture</p>
                <div className="flex items-center gap-4">
                  <div className="relative w-[200px] h-[200px] rounded-full overflow-hidden border border-white/20 bg-[#0B0420]">
                    {file ? (
                      <img
                        src={previewUrl}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ProfileAvatar src={previewUrl} size={200} />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handlePickImage}
                    className="bg-[#0038FF] px-5 py-2 rounded-[10px] shadow hover:bg-[#1a4dff] text-sm"
                  >
                    Change
                  </button>

                  <input
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <p className="mt-2 text-s text-white/40">
                  JPG or PNG up to 5MB. Square images work best.
                </p>
              </section>

              {/* First Name */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">First Name</p>
                  <Pencil
                    className="w-4 h-4 text-white/60 cursor-pointer"
                    onClick={() => setEditFirstName(!editFirstName)}
                  />
                </div>
                {editFirstName ? (
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm"
                  />
                ) : (
                  <p className="text-white/100">{firstName || "Not set"}</p>
                )}
              </section>

              {/* Last Name */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">Last Name</p>
                  <Pencil
                    className="w-4 h-4 text-white/60 cursor-pointer"
                    onClick={() => setEditLastName(!editLastName)}
                  />
                </div>
                {editLastName ? (
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm"
                  />
                ) : (
                  <p className="text-white/100">{lastName || "Not set"}</p>
                )}
              </section>

              {/* Bio */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">Bio</p>
                  <Pencil
                    className="w-4 h-4 text-white/60 cursor-pointer"
                    onClick={() => setEditBio(!editBio)}
                  />
                </div>

                {editBio ? (
                  <div className="flex flex-col gap-[10px]">
                    <textarea
                      value={bio}
                      onChange={(e) => {
                        setBio(e.target.value);
                        setCharCount(e.target.value.length); 
                      }}
                      rows={3}
                      maxLength={300}
                      className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm resize-none"
                      placeholder="Write something about yourself..."
                    />
                    <div className="flex justify-end">
                      <span
                        className={`text-[13px] ${
                          charCount >= 300 ? "text-red-400" : "text-[#413663]"
                        }`}
                      >
                        {charCount}/300 characters
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/100 whitespace-pre-line">
                    {bio || "Not set"}
                  </p>
                )}
              </section>

              {/* Username */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">Username</p>
                  <Pencil
                    className="w-4 h-4 text-white/60 cursor-pointer"
                    onClick={() => {
                      setEditUsername(!editUsername);
                      if (editUsername) {
                        setUsernameError("");
                        setIsCheckingUsername(false);
                        setError(""); 
                      }
                    }}
                  />
                </div>
                {editUsername ? (
                  <>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setSaved(false);
                        setUsernameError(""); 
                      }}
                      className={`w-full px-4 py-3 bg-[#120A2A] border rounded-[10px] text-white text-sm ${
                        usernameError ? "border-red-500" : "border-white/40"
                      }`}
                    />
                    {isCheckingUsername && (
                      <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Checking availability...
                      </p>
                    )}
                    {usernameError && (
                      <p className="text-red-400 text-xs mt-1">
                        {usernameError}
                      </p>
                    )}
                    {!isCheckingUsername &&
                      !usernameError &&
                      username.trim() !== "" &&
                      username.toLowerCase() !==
                        originalUsername.toLowerCase() && (
                        <p className="text-emerald-400 text-xs mt-1">
                          Username is available.
                        </p>
                      )}
                  </>
                ) : (
                  <p className="text-white/100">{username || "Not set"}</p>
                )}
              </section>

              {/* Password */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">Password</p>
                  <Pencil
                    className="w-4 h-4 text-white/60 cursor-pointer"
                    onClick={() => setEditPassword(!editPassword)}
                  />
                </div>
                {editPassword ? (
                  <>
                    <div className="relative mb-3">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setSaved(false);
                        }}
                        className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 flex items-center text-white/60"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <div className="relative mb-2">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setSaved(false);
                        }}
                        className="w-full px-4 py-3 bg-[#120A2A] border border-white/40 rounded-[10px] text-white text-sm"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-3 flex items-center text-white/60"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    <ul className="text-xs text-white/60 space-y-1 mt-2">
                      {passwordRules.map((rule, idx) => (
                        <li
                          key={idx}
                          className={
                            rule.test.test(password)
                              ? "text-emerald-400"
                              : "text-white/40"
                          }
                        >
                          • {rule.label}
                        </li>
                      ))}
                      {confirmPassword && confirmPassword !== password && (
                        <li className="text-red-400">
                          • Passwords do not match
                        </li>
                      )}
                    </ul>
                  </>
                ) : (
                  <p className="text-white/100">••••••••</p>
                )}
              </section>

              {/* Location */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">Location</p>
                  <Pencil
                    className="w-4 h-4 text-white/60 cursor-pointer"
                    onClick={() => setEditLocation(!editLocation)}
                  />
                </div>

                {editLocation ? (
                  <div className="relative w-full">
                    <div className="relative w-full">
                      <Search
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          fetchSuggestions(e.target.value);
                          setSaved(false);
                        }}
                        placeholder="Search for your location here..."
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="w-full h-[50px] sm:h-[57px] pl-12 pr-12 rounded-[12px] sm:rounded-[15px] border border-[rgba(255,255,255,0.4)] bg-[#120A2A] text-white text-[14px] sm:text-[16px] shadow focus:outline-none"
                      />
                      <MapPin
                        onClick={handleSearch}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                        size={20}
                      />
                    </div>

                    {suggestions.length > 0 && (
                      <ul className="absolute top-full left-0 right-0 mt-1 bg-[#120A2A] border border-[rgba(255,255,255,0.4)] rounded-[15px] shadow-lg overflow-hidden z-20">
                        {suggestions.map((place) => (
                          <li
                            key={place.id}
                            className="px-4 py-2 text-left text-white hover:bg-[#1a1a3d] cursor-pointer transition-colors"
                            onClick={() => handleSelectSuggestion(place)}
                          >
                            {place.place_name}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4 h-64 w-full rounded-lg overflow-hidden">
                      <Map
                        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                        initialViewState={viewport}
                        viewState={viewport} 
                        style={{ width: "100%", height: "100%" }}
                        mapStyle="mapbox://styles/mapbox/streets-v11"
                        onMove={(evt) => setViewport(evt.viewState)}
                        onClick={(e) => {
                          const lng = e.lngLat.lng;
                          const lat = e.lngLat.lat;

                          setMarker({ longitude: lng, latitude: lat });
                          setViewport((prev) => ({
                            ...prev,
                            longitude: lng,
                            latitude: lat,
                            zoom: prev.zoom < 12 ? 12 : prev.zoom, 
                          }));

                          reverseGeocode(lng, lat);
                        }}
                      >
                        <Marker
                          longitude={marker.longitude}
                          latitude={marker.latitude}
                          draggable
                          onDragEnd={(e) => {
                            const lng = e.lngLat.lng;
                            const lat = e.lngLat.lat;

                            setMarker({ longitude: lng, latitude: lat });
                            setViewport((prev) => ({
                              ...prev,
                              longitude: lng,
                              latitude: lat,
                            }));

                            reverseGeocode(lng, lat);
                          }}
                        />
                      </Map>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/100">{location || "Not set"}</p>
                )}
              </section>

              {/* Links */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">Links</p>
                  <Pencil
                    className="w-4 h-4 text-white/60 cursor-pointer"
                    onClick={() => setEditLinks(!editLinks)}
                  />
                </div>

                {editLinks ? (
                  <div className="flex-1 min-w-[200px] sm:min-w-[400px] text-left">
                    <div className="max-h-[200px] sm:max-h-[310px] overflow-y-auto custom-scrollbar">
                      {links.map((link, index) => (
                        <div
                          key={index}
                          className="relative mb-[10px] sm:mb-[12px]"
                        >
                          <input
                            type="url"
                            value={link}
                            onChange={(e) =>
                              handleLinkChange(index, e.target.value)
                            }
                            placeholder="Link here"
                            className="bg-[#120A2A] text-white border border-white/40 rounded-[10px] sm:rounded-[12px] w-full pr-8 sm:pr-10 h-[45px] sm:h-[50px] placeholder-[#413663] placeholder:text-[14px] sm:placeholder:text-[15px] px-4 py-3"
                          />
                          <X
                            className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-white/70 cursor-pointer"
                            onClick={() => handleRemoveLink(index)}
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="font-[400] text-[14px] sm:text-[15px] text-[#0038FF] hover:underline text-left mt-1"
                    >
                      + Add another link
                    </button>
                  </div>
                ) : (
                  <div>
                    {links.filter((l) => l.trim() !== "").length > 0 ? (
                      <ul className="list-disc list-inside text-white/80">
                        {links
                          .filter((raw) => raw.trim() !== "") 
                          .map((raw, index) => {
                            const displayText = raw.trim();
                            const href = displayText.startsWith("http")
                              ? displayText
                              : `https://${displayText}`; 

                            return (
                              <li key={index}>
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#4A9EFF] underline hover:opacity-80"
                                >
                                  {displayText}
                                </a>
                              </li>
                            );
                          })}
                      </ul>
                    ) : (
                      <p className="text-white/100">Not set</p>
                    )}
                  </div>
                )}

                {linkError && (
                  <p className="text-red-400 text-sm mt-2">{linkError}</p>
                )}
              </section>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-[#1a1a3d] px-6 py-3 rounded-[10px] shadow text-sm text-white hover:bg-[#2a2a4d] transition"
                >
                  Cancel
                </button>
                <button
                  disabled={saving || loading || !isDirty}
                  onClick={() => setConfirmOpen(true)}
                  className="bg-[#0038FF] disabled:bg-[#0038FF]/60 px-6 py-3 rounded-[10px] shadow hover:bg-[#1a4dff] text-sm"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </main>
        {/* Confirm before saving */}
        <ConfirmSaveModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={async () => {
            setConfirmOpen(false);
            await handleSave(); 
          }}
          saving={saving}
        />

        {/* Saved popup */}
        <SavedPopup
          isOpen={showSavedPopup}
          onClose={() => setShowSavedPopup(false)}
        />
      </div>
    </div>
  );

  function SavedPopup({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
        <div
          className="w-[420px] min-h-[200px] flex flex-col items-center justify-center p-8 relative text-center"
          style={{
            background: "rgba(0, 0, 0, 0.4)",
            border: "2px solid #0038FF",
            boxShadow: "0px 4px 15px #D78DE5",
            backdropFilter: "blur(40px)",
            borderRadius: "15px",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-[20px] right-[20px] text-white hover:text-gray-300"
            type="button"
          >
            ✕
          </button>

          <h2 className="text-[22px] font-semibold text-white mb-4">
            ✅ Settings saved successfully!
          </h2>
          <button
            onClick={onClose}
            className="mt-2 w-[150px] h-[38px] bg-[#0038FF] rounded-[10px] text-white text-[15px] shadow-[0px_0px_10px_#284CCC] hover:bg-[#1a4dff] transition-colors"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
}

function ConfirmSaveModal({ isOpen, onClose, onConfirm, saving }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-[420px] p-6 bg-black/70 border-2 border-[#0038FF] rounded-[12px] shadow-[0px_4px_15px_#D78DE5] z-50"
        role="dialog"
        aria-modal="true"
      >
        <button
          className="absolute top-3 right-3 text-white/80"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>
        <h3 className="text-lg font-semibold text-white mb-3">
          Are you sure you want to save changes?
        </h3>
        <p className="text-sm text-white/70 mb-6">
          This will update your profile. You can review changes before saving.
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded bg-[#1a1a3d] text-white"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-[#0038FF] text-white"
            onClick={onConfirm}
            disabled={saving}
            type="button"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}