"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { serverUrl } from "@/utils/utils";
import { toast } from "react-toastify";

interface User {
    _id: string;
    email: string;
    name: string;
    role: "admin" | "teacher";
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    setupAdmin: (name: string, email: string, password: string) => Promise<void>;
    checkSetupRequired: () => Promise<boolean>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Initialize auth state from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            setToken(storedToken);
            fetchUserProfile(storedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    // Fetch user profile
    const fetchUserProfile = async (authToken: string) => {
        try {
            const response = await axios.get(`${serverUrl}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });

            if (response.data.success) {
                setUser(response.data.data);
            }
        } catch (error: any) {
            console.error("Failed to fetch user profile:", error);
            // Token is invalid, clear it
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh user profile
    const refreshUser = async () => {
        if (token) {
            await fetchUserProfile(token);
        }
    };

    // Check if setup is required
    const checkSetupRequired = async (): Promise<boolean> => {
        try {
            const response = await axios.get(`${serverUrl}/auth/check-setup`);
            return response.data.data.setupRequired;
        } catch (error) {
            console.error("Failed to check setup status:", error);
            return false;
        }
    };

    // Setup initial admin user
    const setupAdmin = async (name: string, email: string, password: string) => {
        try {
            const response = await axios.post(`${serverUrl}/auth/setup`, {
                name,
                email,
                password
            });

            if (response.data.success) {
                const { user: newUser, token: newToken } = response.data.data;
                setUser(newUser);
                setToken(newToken);
                localStorage.setItem("token", newToken);
                toast.success("Admin account created successfully!");
                router.push("/home");
            }
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to create admin account";
            toast.error(message);
            throw error;
        }
    };

    // Login
    const login = async (email: string, password: string) => {
        try {
            const response = await axios.post(`${serverUrl}/auth/login`, {
                email,
                password
            });

            if (response.data.success) {
                const { user: loggedInUser, token: newToken } = response.data.data;
                setUser(loggedInUser);
                setToken(newToken);
                localStorage.setItem("token", newToken);
                toast.success(`Welcome back, ${loggedInUser.name}!`);
                router.push("/home");
            }
        } catch (error: any) {
            const message = error.response?.data?.message || "Login failed";
            toast.error(message);
            throw error;
        }
    };

    // Logout
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        toast.info("Logged out successfully");
        router.push("/login");
    };

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        setupAdmin,
        checkSetupRequired,
        refreshUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
