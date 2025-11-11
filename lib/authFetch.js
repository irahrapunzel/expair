"use client";

import { getSession } from "next-auth/react";

/**
 * authFetch - Authenticated fetch wrapper
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @param {object} session - NextAuth session object (optional, will call getSession if not provided)
 * @returns {Promise<object>} Parsed JSON response
 */
export async function authFetch(url, options = {}, session) {
  console.log("[authFetch] 🚀 Request:", url);
  
  // If session not provided, try to get it
  if (!session) {
    session = await getSession();
    console.log("[authFetch] getSession() returned:", session ? "✅ Session found" : "❌ No session");
  }
  
  // Check if session exists and has token
  if (!session || !session.access) {
    console.error("[authFetch] ⚠️ No token found in session. session value:", session);
    throw new Error("Not authenticated (no token)");
  }

  const token = session.access;
  console.log("[authFetch] 🔑 Token found:", token ? `${token.substring(0, 20)}...` : 'none');

  // Merge Authorization header with any existing headers
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  console.log("[authFetch] 📬 Response status:", response.status);

  // Parse JSON and handle errors
  let data;
  const contentType = response.headers.get("content-type");
  
  if (contentType && contentType.includes("application/json")) {
    const text = await response.text();
    console.log("[authFetch] 📄 Response text:", text.substring(0, 200));
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("[authFetch] ❌ Failed to parse JSON:", e);
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  } else {
    const text = await response.text();
    console.error("[authFetch] ❌ Non-JSON response:", text.substring(0, 200));
    throw new Error(`Expected JSON, got: ${contentType}`);
  }

  console.log("[authFetch] ✅ Parsed data:", data);

  // Check for HTTP errors
  if (!response.ok) {
    const errorMsg = data.error || data.detail || data.message || `HTTP ${response.status}`;
    console.error("[authFetch] ❌ HTTP Error:", errorMsg);
    throw new Error(errorMsg);
  }

  return data;
}