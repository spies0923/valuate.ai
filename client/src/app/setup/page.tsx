"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, CheckCircle } from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SetupPage() {
    const { setupAdmin, checkSetupRequired, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [checkingSetup, setCheckingSetup] = useState(true);
    const [setupRequired, setSetupRequired] = useState(false);

    // Check if setup is required
    useEffect(() => {
        const checkSetup = async () => {
            try {
                const required = await checkSetupRequired();
                setSetupRequired(required);

                if (!required) {
                    // Setup already done, redirect to login
                    router.push("/login");
                }
            } catch (error) {
                console.error("Failed to check setup status:", error);
            } finally {
                setCheckingSetup(false);
            }
        };

        checkSetup();
    }, []);

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push("/home");
        }
    }, [isAuthenticated, isLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !password || !confirmPassword) {
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            alert("Password must be at least 8 characters");
            return;
        }

        setSubmitting(true);
        try {
            await setupAdmin(name, email, password);
        } catch (error) {
            // Error handled by auth context
        } finally {
            setSubmitting(false);
        }
    };

    if (checkingSetup || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!setupRequired) {
        return null; // Will redirect
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <Shield className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-center">Initial Setup</CardTitle>
                    <CardDescription className="text-center">
                        Create your administrator account to get started with valuate.ai
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={submitting}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={submitting}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Minimum 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={submitting}
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={submitting}
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="rounded-lg bg-muted p-4 text-sm">
                            <div className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <p className="text-muted-foreground">
                                    This account will have administrator privileges to manage teachers and oversee the system.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!name || !email || !password || !confirmPassword || submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Create Admin Account
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <ToastContainer />
        </div>
    );
}
