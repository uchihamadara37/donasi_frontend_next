// frontend/context/authContext.tsx
"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { BaseUser } from "@/interfaces" // Asumsi BaseUser structure is defined


type AuthContextType = {
    user: BaseUser | null;
    loading: boolean; // Indicates if auth state is being loaded/checked
    accessToken: string | null;
    login: (accessToken: string, user: BaseUser) => void;
    logout: () => void;
    // This function now explicitly aims to refresh the access token AND user data
    // by relying on the HTTP-only refresh token cookie managed by the backend.
    refreshAccessTokenAndUser: (onSuccess?: () => void) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true, // Set to true initially to indicate session check is in progress
    accessToken: null,
    login: () => { },
    logout: () => { },
    refreshAccessTokenAndUser: async () => { }
})

// Ensure this environment variable is set in .env.local
import { URL_SERVER } from "@/interfaces"; // Adjust the import path as necessary

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<BaseUser | null>(null);
    const [loading, setLoading] = useState(true); // Manages loading state for auth operations
    const [accessToken, setAccessToken] = useState<string | null>(null);

    const refreshAccessTokenAndUser = useCallback(async (): Promise<void> => {
        setLoading(true); // Indicate that a session check/refresh is in progress
        console.log("Attempting to refresh access token and user data from backend via cookie...");

        try {
            const res = await fetch(`${URL_SERVER}/api/refreshToken`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include', // Ensure cookies are sent (important for httpOnly refreshToken)
            });

            const data = await res.json();
            console.log("Response from /api/refreshToken (cookie-based):", data);

            if (res.ok) {
                setAccessToken(data.accessToken);
                setUser(data.user); // Update user state with fresh data from backend
                // onSuccess && onSuccess();
                console.log("Session refreshed successfully. User and AccessToken updated.");
            } else if (res.status === 401 || res.status === 403) {
                console.log("Session expired or invalid (401/403). Clearing frontend state.");
                setUser(null);
                setAccessToken(null);
            } else {
                console.error("Failed to refresh token with unexpected status:", res.status, data.message || "Unknown error");
                // For other errors, we should also clear the session for security/consistency
                setUser(null);
                setAccessToken(null);
            }
        } catch (error) {
            console.error("Network or other error during token refresh:", error);
            // If there's a network error, assume the session might be broken or the server is unreachable
            setUser(null);
            setAccessToken(null);
        } finally {
            setLoading(false); // Always set loading to false when the session check/refresh attempt is over
        }
    }, []); // Dependency array: only re-create if URL_SERVER changes

    // useEffect to perform initial session check on component mount
    useEffect(() => {
        refreshAccessTokenAndUser(); // On initial load, try to establish session via cookie
    }, [refreshAccessTokenAndUser]); // Dependency on useCallback ensures it's stable

    
    const login = useCallback((newAccessToken: string, loggedInUser: BaseUser) => {
        setLoading(true);
        setAccessToken(newAccessToken);
        setUser(loggedInUser);

        setLoading(false);
        console.log("Frontend login success: user state and AccessToken updated.");
    }, []);

    // 'logout' function. Now calls the backend to clear the httpOnly cookie.
    const logout = useCallback(async () => {
        console.log("Frontend logout initiated.");
        setLoading(true);
        try {
            // Call the backend's logout endpoint. This endpoint is responsible
            // for removing the refresh token from the database and clearing the httpOnly cookie.
            await fetch(`${URL_SERVER}/api/logout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: 'include', // Ensure cookies are sent so backend can clear the correct one
            });
            console.log("Backend logout API called.");
        } catch (error) {
            console.error("Error during backend logout call:", error);
        } finally {
            // Clear frontend state regardless of backend API call success/failure
            setUser(null);
            setAccessToken(null);
            setLoading(false);
            console.log("Frontend state cleared for logout.");
        }
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const authContextValue = React.useMemo(() => ({
        user,
        loading,
        accessToken,
        login,
        logout,
        refreshAccessTokenAndUser,
    }), [user, loading, accessToken, login, logout, refreshAccessTokenAndUser]);

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
}