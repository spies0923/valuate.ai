"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import axios from "axios";
import { serverUrl } from "@/utils/utils";
import { ToastContainer, toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, UserPlus, Trash2, Edit, Shield, Users } from "lucide-react";

interface Teacher {
    _id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

export default function AdminPage() {
    const { user, token, isLoading } = useAuth();
    const router = useRouter();

    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

    // Form states for create
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Form states for edit
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editPassword, setEditPassword] = useState("");

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        } else if (!isLoading && user && user.role !== "admin") {
            toast.error("Admin access required");
            router.push("/home");
        } else if (!isLoading && user && user.role === "admin") {
            fetchTeachers();
        }
    }, [user, isLoading, router]);

    const fetchTeachers = async () => {
        if (!token) return;

        setLoadingTeachers(true);
        try {
            const response = await axios.get(`${serverUrl}/auth/teachers`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setTeachers(response.data.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch teachers");
        } finally {
            setLoadingTeachers(false);
        }
    };

    const createTeacher = async () => {
        if (!token || !name || !email || !password) return;

        setSubmitting(true);
        try {
            await axios.post(
                `${serverUrl}/auth/teachers`,
                { name, email, password },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            toast.success("Teacher created successfully!");
            setCreateDialogOpen(false);
            setName("");
            setEmail("");
            setPassword("");
            fetchTeachers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create teacher");
        } finally {
            setSubmitting(false);
        }
    };

    const updateTeacher = async () => {
        if (!token || !selectedTeacher) return;

        setSubmitting(true);
        try {
            const updateData: any = {};
            if (editName) updateData.name = editName;
            if (editEmail) updateData.email = editEmail;
            if (editPassword) updateData.password = editPassword;

            await axios.put(
                `${serverUrl}/auth/teachers/${selectedTeacher._id}`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            toast.success("Teacher updated successfully!");
            setEditDialogOpen(false);
            setSelectedTeacher(null);
            setEditName("");
            setEditEmail("");
            setEditPassword("");
            fetchTeachers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update teacher");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleTeacherStatus = async (teacher: Teacher) => {
        if (!token) return;

        try {
            await axios.put(
                `${serverUrl}/auth/teachers/${teacher._id}`,
                { isActive: !teacher.isActive },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            toast.success(`Teacher ${teacher.isActive ? "deactivated" : "activated"} successfully!`);
            fetchTeachers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update teacher status");
        }
    };

    const deleteTeacher = async (teacher: Teacher) => {
        if (!token || !confirm(`Are you sure you want to delete ${teacher.name}?`)) return;

        try {
            await axios.delete(`${serverUrl}/auth/teachers/${teacher._id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            toast.success("Teacher deleted successfully!");
            fetchTeachers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete teacher");
        }
    };

    const openEditDialog = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setEditName(teacher.name);
        setEditEmail(teacher.email);
        setEditPassword("");
        setEditDialogOpen(true);
    };

    if (isLoading || !user || user.role !== "admin") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <Navbar />
            <main className="flex flex-col items-center w-full h-full">
                <div className="w-full h-full p-5 px-10">
                    <div className="flex justify-between items-center mb-7">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Shield className="h-8 w-8" />
                                Admin Dashboard
                            </h1>
                            <p className="text-muted-foreground mt-1">Manage teacher accounts</p>
                        </div>
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Teacher
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <UserPlus className="h-5 w-5" />
                                        Create Teacher Account
                                    </DialogTitle>
                                    <DialogDescription>
                                        Add a new teacher who can use the system
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="create-name">Full Name</Label>
                                        <Input
                                            id="create-name"
                                            placeholder="Enter teacher's name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="create-email">Email</Label>
                                        <Input
                                            id="create-email"
                                            type="email"
                                            placeholder="Enter email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="create-password">Password</Label>
                                        <Input
                                            id="create-password"
                                            type="password"
                                            placeholder="Minimum 8 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={createTeacher}
                                        disabled={!name || !email || !password || submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            "Create Teacher"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {loadingTeachers ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    <CardTitle>Teachers ({teachers.length})</CardTitle>
                                </div>
                                <CardDescription>Manage teacher accounts and permissions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {teachers.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">No teachers yet. Create one to get started!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {teachers.map((teacher) => (
                                            <div
                                                key={teacher._id}
                                                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{teacher.name}</p>
                                                        <Badge variant={teacher.isActive ? "default" : "destructive"}>
                                                            {teacher.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{teacher.email}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Created: {new Date(teacher.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => toggleTeacherStatus(teacher)}
                                                    >
                                                        {teacher.isActive ? "Deactivate" : "Activate"}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => openEditDialog(teacher)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteTeacher(teacher)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>

            {/* Edit Teacher Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5" />
                            Edit Teacher
                        </DialogTitle>
                        <DialogDescription>
                            Update teacher information (leave password blank to keep current)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input
                                id="edit-name"
                                placeholder="Enter teacher's name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                placeholder="Enter email address"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-password">New Password (Optional)</Label>
                            <Input
                                id="edit-password"
                                type="password"
                                placeholder="Leave blank to keep current password"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={updateTeacher}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Teacher"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ToastContainer />
        </div>
    );
}
