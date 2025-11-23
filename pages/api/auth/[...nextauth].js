import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

function decodeJwtExp(token) {
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    if (json && typeof json.exp === "number") return json.exp * 1000;
  } catch (e) {
    console.error("Error decoding JWT:", e);
  }
  return null;
}

export default NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 2,
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 7,
  },
  debug: process.env.NODE_ENV === "development",

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username/Email", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" }
      },
      async authorize(credentials) {
        console.log("=== NEXTAUTH AUTHORIZE DEBUG ===");

        if (!credentials?.identifier || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          const requestBody = {
            identifier: credentials.identifier,
            password: credentials.password,
          };

          const res = await fetch(`${BACKEND_URL}/api/accounts/login/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(requestBody),
          });

          const data = await res.json();

          // --- STEP 1: INTERCEPT SANCTION LOCKOUT (403 Status) ---
          if (res.status === 403 && data.code === 'SANCTIONED_LOCKOUT') {
            console.log("Sanction Lockout detected. Returning MINIMAL user object for restricted session.");
            
            // FIX: Instead of throwing an error, return a minimal user object. 
            // This creates a valid session without tokens, enabling the frontend to read the status.
            return {
              id: String(data.user_id || data.id),
              // Exclude tokens (access and refresh)
              username: data.username || credentials.identifier, 
              email: data.email || 'restricted@expair.com',
              first_name: data.first_name,
              last_name: data.last_name,
              is_admin: !!data.is_admin,
              sanction_details: data.sanction_details || {},
              sanction_status: data.sanction_status || 'SUSPENSION',
              isSuspendedOnly: true, // Crucial flag for JWT callback
            };
          }
          // --------------------------------------------------------

          // --- STEP 2: CHECK FOR GENERIC FAILURES (401, 400, 500) ---
          // Block all non-200 responses if they are not the 403 sanction response
          if (!res.ok) {
            console.log(`Login failed with status: ${res.status}. Returning null.`);
            return null;
          }
          // ---------------------------------------------------------

          // --- STEP 3: SUCCESSFUL LOGIN (Status 200) ---
          if (data && data.access && data.refresh) {
            const isAdmin = !!data.is_admin;

            return {
              id: String(data.user_id || data.id),
              access: data.access,
              refresh: data.refresh,
              username: data.username,
              email: data.email,
              first_name: data.first_name,
              last_name: data.last_name,
              image: data.image,
              is_admin: isAdmin,
              sanction_details: data.sanction_details || {},
              sanction_status: data.sanction_status || 'NONE',
            };
          }
          return null;
        } catch (error) {
          console.error("Authorize (Uncaught) error:", error);
          return null;
        }
      }
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("=== SIGNIN CALLBACK ===");
      console.log("Account provider:", account?.provider);

      if (account?.provider === "google") {
        try {
          console.log("Processing Google sign in...");

          const res = await fetch(`${BACKEND_URL}/api/accounts/google-login/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              email: profile?.email,
              name: profile?.name,
              image: profile?.picture,
            }),
          });

          if (!res.ok) {
            console.error("Google login failed:", res.status);
            return false;
          }

          const data = await res.json();
          console.log("Backend response:", data);

          if (data?.is_new) {
            // NEW USER - Store data for registration
            user.isNewUser = true;
            user.googleData = {
              email: data.email,
              name: data.name,
              first_name: data.first_name,
              last_name: data.last_name,
              image: data.image,
            };
            // No JWT tokens for new users
            user.access = null;
            user.refresh = null;

            console.log("New Google user - storing registration data");
            return true;

          } else {
            // EXISTING USER - Store tokens
            user.access = data.access;
            user.refresh = data.refresh;
            user.id = String(data.user_id || data.id);
            user.username = data.username;
            user.first_name = data.first_name;
            user.last_name = data.last_name;
            user.email = data.email;
            user.isNewUser = false;
            if (data.image) user.image = data.image;

            // NEW: Propagate sanction status if received from Google login endpoint
            user.sanction_details = data.sanction_details || null;
            user.sanction_status = data.sanction_status || 'NONE';
            user.isSuspendedOnly = (user.sanction_status?.toUpperCase() === "SUSPENSION" || user.sanction_status?.toUpperCase() === "BAN");


            console.log("Existing Google user - storing tokens");
            return true;
          }
        } catch (e) {
          console.error("Google login request failed:", e);
          return false;
        }
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      console.log("=== REDIRECT CALLBACK ===");
      console.log("URL:", url);
      console.log("Base URL:", baseUrl);

      // For OAuth redirects, go to our handler page
      return `${baseUrl}/auth/callback`;
    },

    async jwt({ token, user, account, trigger, session }) {
      console.log("=== JWT CALLBACK START ===");
      console.log("Trigger:", trigger);

      // Handle session update trigger (after registration completion)
      if (trigger === "update" && session) {
        console.log("=== SESSION UPDATE TRIGGER ===");
        console.log("Session data:", session);

        if (session.user) {
          if (session.user.profilePic !== undefined) {
            token.profilePic = session.user.profilePic;
            console.log("🖼️ Updated profilePic in token:", session.user.profilePic);
          }
          if (session.user.username !== undefined) {
            token.username = session.user.username;
          }
          if (session.user.firstName !== undefined) {
            token.first_name = session.user.firstName;
          }
          if (session.user.lastName !== undefined) {
            token.last_name = session.user.lastName;
          }
        }

        if (session.access && session.refresh) {
          token.access = session.access;
          token.refresh = session.refresh;
          token.isNewUser = false;
          token.tokenTimestamp = Date.now();
          delete token.googleData;
          // IMPORTANT: Clear the suspension only flag on successful token update
          delete token.isSuspendedOnly; 
          console.log("Updated session with new tokens after registration");
        }

        return token;
      }

      // Initial sign in
      if (user && account) {
        console.log("=== INITIAL SIGN IN ===");

        token.id = user.id;
        token.username = user.username;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.email = user.email;

        // Store Admin and Sanction Statuses
        token.is_admin = user.is_admin;
        token.sanction_status = user.sanction_status;
        token.sanction_details = user.sanction_details;
        
        // NEW LINE: Store the suspension flag
        token.isSuspendedOnly = user.isSuspendedOnly;


        if (user.profilePic) token.profilePic = user.profilePic;
        if (user.image) token.image = user.image;

        // Handle new user flag and Google data
        if (user.isNewUser !== undefined) {
          token.isNewUser = user.isNewUser;
          if (user.isNewUser && user.googleData) {
            token.googleData = user.googleData;
            console.log("Stored Google data for new user");
          }
        }

        // Store JWT tokens (only for non-suspended existing users)
        if (user.access && user.refresh && !user.isSuspendedOnly) {
          token.access = user.access;
          token.refresh = user.refresh;
          token.tokenTimestamp = Date.now();
          console.log("Stored JWT tokens");
        } else if (user.isSuspendedOnly) {
          console.log("User is suspended. Tokens not stored/refreshed.");
          // Ensure tokens are cleared if they existed previously 
          delete token.access;
          delete token.refresh;
        }

        return token;
      }

      // Skip token refresh for new users
      if (token.isNewUser) {
        console.log("Skipping token validation for new user");
        return token;
      }

      // Token refresh logic continues as before...
      if (!token.access || !token.refresh) {
        // FIX: If token is for a suspended user, allow token to pass if it only contains sanction info
        if (token.isSuspendedOnly) {
          console.log("Token is for suspended user. Bypassing refresh check.");
          return token; 
        }

        console.error("Missing stored tokens");
        return null;
      }

      // Existing Token refresh logic:
      const accessExpiry = decodeJwtExp(token.access);
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;

      if (accessExpiry) {
        const timeToExpiry = accessExpiry - now;
        console.log(`Token expires in: ${Math.round(timeToExpiry / 1000 / 60)} minutes`);

        if (timeToExpiry < tenMinutes) {
          console.log("=== REFRESHING TOKEN ===");

          try {
            const res = await fetch(`${BACKEND_URL}/api/accounts/token/refresh/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh: token.refresh }),
            });

            if (res.ok) {
              const data = await res.json();
              token.access = data.access;
              token.tokenTimestamp = Date.now();
              if (data.refresh && data.refresh !== token.refresh) {
                token.refresh = data.refresh;
              }
              console.log("Token refresh successful");
              delete token.refreshAttempted;
            } else {
              if (!token.refreshAttempted) {
                token.refreshAttempted = true;
                return token;
              } else {
                console.log("Refresh failed, forcing re-auth");
                return null;
              }
            }
          } catch (error) {
            console.error("Token refresh error:", error);
            if (!token.refreshAttempted) {
              token.refreshAttempted = true;
              return token;
            } else {
              return null;
            }
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      console.log("=== SESSION CALLBACK ===");
      console.log("Token available:", !!token);
      console.log("Token has access:", !!token?.access);
      console.log("Token profilePic:", token?.profilePic);

      const cleanedToken = {};
      for (const key in token) {
        // Ensure no property is null or undefined before mapping to session
        if (token[key] !== null && token[key] !== undefined) {
          cleanedToken[key] = token[key];
        }
      }
      
      // FIX: Check for ID presence for a valid user session (sanctioned or not)
      if (cleanedToken.id) { 
        // Only set access/refresh for non-suspended users
        if (!cleanedToken.isNewUser && !cleanedToken.isSuspendedOnly) {
          session.access = cleanedToken.access;
          session.refresh = cleanedToken.refresh;
        } else { 
          session.access = null;
          session.refresh = null;
        }

        if (session.user) {
          session.user.id = cleanedToken.id;
          session.user.username = cleanedToken.username;
          session.user.first_name = cleanedToken.first_name;
          session.user.last_name = cleanedToken.last_name;
          session.user.email = cleanedToken.email;
          session.user.profilePic = cleanedToken.profilePic || cleanedToken.image;

          // Pass Sanction Status and Admin Flag
          session.user.is_admin = cleanedToken.is_admin;
          session.user.sanction_status = cleanedToken.sanction_status;
          session.user.sanction_details = cleanedToken.sanction_details;
          session.user.isSuspendedOnly = cleanedToken.isSuspendedOnly || false; // NEW LINE

          // Pass new user flag
          session.user.isNewUser = cleanedToken.isNewUser || false;
          if (cleanedToken.googleData) {
            session.user.googleData = cleanedToken.googleData;
          }
        }
      } else {
        session.access = null;
        session.refresh = null;
        session.user = null; // Ensure user object is explicitly null if no ID
      }

      console.log("Session prepared with access token:", !!session.access);
      return session;
    }
  },

  pages: {
    error: '/auth/error',
  },
});