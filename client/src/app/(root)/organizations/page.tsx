"use client";
import Navbar from "../components/Navbar";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import axios from "axios";
import { serverUrl } from "@/utils/utils";
import { ToastContainer, toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, School as SchoolIcon, GraduationCap, Users, BookOpen, Trash2, Edit, Loader2 } from "lucide-react";

interface School {
    _id: string;
    name: string;
    description: string;
}

interface Grade {
    _id: string;
    name: string;
    schoolId: string;
    description: string;
}

interface Class {
    _id: string;
    name: string;
    gradeId: string;
    schoolId: string;
    description: string;
}

interface Subject {
    _id: string;
    name: string;
    classId: string;
    gradeId: string;
    schoolId: string;
    description: string;
}

export default function Organizations() {
    const { user } = useUser();
    const [schools, setSchools] = useState<School[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog states
    const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
    const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
    const [classDialogOpen, setClassDialogOpen] = useState(false);
    const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);

    // Form states
    const [schoolName, setSchoolName] = useState("");
    const [schoolDesc, setSchoolDesc] = useState("");
    const [gradeName, setGradeName] = useState("");
    const [gradeDesc, setGradeDesc] = useState("");
    const [gradeSchool, setGradeSchool] = useState("");
    const [className, setClassName] = useState("");
    const [classDesc, setClassDesc] = useState("");
    const [classSchool, setClassSchool] = useState("");
    const [classGrade, setClassGrade] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [subjectDesc, setSubjectDesc] = useState("");
    const [subjectSchool, setSubjectSchool] = useState("");
    const [subjectGrade, setSubjectGrade] = useState("");
    const [subjectClass, setSubjectClass] = useState("");

    const [submitting, setSubmitting] = useState(false);

    const fetchOrganizations = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const [schoolsRes, gradesRes, classesRes, subjectsRes] = await Promise.all([
                axios.get(`${serverUrl}/schools`, { params: { userId: user.id } }),
                axios.get(`${serverUrl}/schools/hierarchy`, { params: { userId: user.id } })
                    .then(() => axios.get(`${serverUrl}/schools`, { params: { userId: user.id } }))
                    .catch(() => ({ data: { data: [] } })),
                Promise.resolve({ data: { data: [] } }),
                Promise.resolve({ data: { data: [] } })
            ]);

            setSchools(schoolsRes.data.data || []);
            // We'll fetch grades/classes/subjects on demand when needed
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch organizations");
        } finally {
            setLoading(false);
        }
    };

    const fetchGradesForSchool = async (schoolId: string) => {
        if (!user?.id) return;
        try {
            const res = await axios.get(`${serverUrl}/schools/${schoolId}/grades`, {
                params: { userId: user.id }
            });
            setGrades(res.data.data || []);
        } catch (error: any) {
            toast.error("Failed to fetch grades");
        }
    };

    const fetchClassesForGrade = async (schoolId: string, gradeId: string) => {
        if (!user?.id) return;
        try {
            const res = await axios.get(`${serverUrl}/schools/${schoolId}/grades/${gradeId}/classes`, {
                params: { userId: user.id }
            });
            setClasses(res.data.data || []);
        } catch (error: any) {
            toast.error("Failed to fetch classes");
        }
    };

    const fetchSubjectsForClass = async (schoolId: string, gradeId: string, classId: string) => {
        if (!user?.id) return;
        try {
            const res = await axios.get(`${serverUrl}/schools/${schoolId}/grades/${gradeId}/classes/${classId}/subjects`, {
                params: { userId: user.id }
            });
            setSubjects(res.data.data || []);
        } catch (error: any) {
            toast.error("Failed to fetch subjects");
        }
    };

    const createSchool = async () => {
        if (!user?.id || !schoolName.trim()) return;

        setSubmitting(true);
        try {
            await axios.post(`${serverUrl}/schools`, {
                name: schoolName,
                description: schoolDesc,
                userId: user.id
            });
            toast.success("School created successfully!");
            setSchoolDialogOpen(false);
            setSchoolName("");
            setSchoolDesc("");
            fetchOrganizations();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create school");
        } finally {
            setSubmitting(false);
        }
    };

    const createGrade = async () => {
        if (!user?.id || !gradeName.trim() || !gradeSchool) return;

        setSubmitting(true);
        try {
            await axios.post(`${serverUrl}/schools/${gradeSchool}/grades`, {
                name: gradeName,
                description: gradeDesc,
                userId: user.id
            });
            toast.success("Grade created successfully!");
            setGradeDialogOpen(false);
            setGradeName("");
            setGradeDesc("");
            setGradeSchool("");
            fetchGradesForSchool(gradeSchool);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create grade");
        } finally {
            setSubmitting(false);
        }
    };

    const createClass = async () => {
        if (!user?.id || !className.trim() || !classSchool || !classGrade) return;

        setSubmitting(true);
        try {
            await axios.post(`${serverUrl}/schools/${classSchool}/grades/${classGrade}/classes`, {
                name: className,
                description: classDesc,
                userId: user.id
            });
            toast.success("Class created successfully!");
            setClassDialogOpen(false);
            setClassName("");
            setClassDesc("");
            setClassSchool("");
            setClassGrade("");
            fetchClassesForGrade(classSchool, classGrade);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create class");
        } finally {
            setSubmitting(false);
        }
    };

    const createSubject = async () => {
        if (!user?.id || !subjectName.trim() || !subjectSchool || !subjectGrade || !subjectClass) return;

        setSubmitting(true);
        try {
            await axios.post(`${serverUrl}/schools/${subjectSchool}/grades/${subjectGrade}/classes/${subjectClass}/subjects`, {
                name: subjectName,
                description: subjectDesc,
                userId: user.id
            });
            toast.success("Subject created successfully!");
            setSubjectDialogOpen(false);
            setSubjectName("");
            setSubjectDesc("");
            setSubjectSchool("");
            setSubjectGrade("");
            setSubjectClass("");
            fetchSubjectsForClass(subjectSchool, subjectGrade, subjectClass);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create subject");
        } finally {
            setSubmitting(false);
        }
    };

    const deleteSchool = async (schoolId: string) => {
        if (!user?.id || !confirm("Are you sure? This will delete all associated grades, classes, and subjects.")) return;

        try {
            await axios.delete(`${serverUrl}/schools/${schoolId}`, {
                params: { userId: user.id }
            });
            toast.success("School deleted successfully!");
            fetchOrganizations();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete school");
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchOrganizations();
        }
    }, [user?.id]);

    // Update grade list when school selection changes
    useEffect(() => {
        if (gradeSchool) {
            fetchGradesForSchool(gradeSchool);
        }
    }, [gradeSchool]);

    // Update class list when school/grade selection changes
    useEffect(() => {
        if (classSchool && classGrade) {
            fetchClassesForGrade(classSchool, classGrade);
        }
    }, [classSchool, classGrade]);

    // Update subject list when school/grade/class selection changes
    useEffect(() => {
        if (subjectSchool && subjectGrade && subjectClass) {
            fetchSubjectsForClass(subjectSchool, subjectGrade, subjectClass);
        }
    }, [subjectSchool, subjectGrade, subjectClass]);

    return (
        <div>
            <Navbar />
            <main className="flex flex-col items-center w-full h-full">
                <div className="w-full h-full p-5 px-10">
                    <div className="flex justify-between items-center mb-7">
                        <div>
                            <h1 className="text-3xl font-bold">Organization Management</h1>
                            <p className="text-muted-foreground mt-1">Manage your schools, grades, classes, and subjects</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Schools Card */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <SchoolIcon className="h-5 w-5" />
                                            <CardTitle>Schools</CardTitle>
                                        </div>
                                        <Dialog open={schoolDialogOpen} onOpenChange={setSchoolDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button size="sm">
                                                    <Plus className="h-4 w-4 mr-1" /> Add School
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Create New School</DialogTitle>
                                                    <DialogDescription>
                                                        Add a new school to your organization
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="school-name">School Name</Label>
                                                        <Input
                                                            id="school-name"
                                                            placeholder="Enter school name"
                                                            value={schoolName}
                                                            onChange={(e) => setSchoolName(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="school-desc">Description (Optional)</Label>
                                                        <Input
                                                            id="school-desc"
                                                            placeholder="Enter description"
                                                            value={schoolDesc}
                                                            onChange={(e) => setSchoolDesc(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        onClick={createSchool}
                                                        disabled={!schoolName.trim() || submitting}
                                                    >
                                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                        Create School
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <CardDescription>{schools.length} schools</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {schools.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No schools yet. Create one to get started!
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {schools.map((school) => (
                                                <div
                                                    key={school._id}
                                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                                                >
                                                    <div>
                                                        <p className="font-medium">{school.name}</p>
                                                        {school.description && (
                                                            <p className="text-sm text-muted-foreground">{school.description}</p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteSchool(school._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Grades Card */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="h-5 w-5" />
                                            <CardTitle>Grades</CardTitle>
                                        </div>
                                        <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" disabled={schools.length === 0}>
                                                    <Plus className="h-4 w-4 mr-1" /> Add Grade
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Create New Grade</DialogTitle>
                                                    <DialogDescription>
                                                        Add a grade level to a school
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>School</Label>
                                                        <Select value={gradeSchool} onValueChange={setGradeSchool}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select school" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {schools.map((school) => (
                                                                    <SelectItem key={school._id} value={school._id}>
                                                                        {school.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="grade-name">Grade Name</Label>
                                                        <Input
                                                            id="grade-name"
                                                            placeholder="e.g., Grade 1, Year 7"
                                                            value={gradeName}
                                                            onChange={(e) => setGradeName(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="grade-desc">Description (Optional)</Label>
                                                        <Input
                                                            id="grade-desc"
                                                            placeholder="Enter description"
                                                            value={gradeDesc}
                                                            onChange={(e) => setGradeDesc(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        onClick={createGrade}
                                                        disabled={!gradeName.trim() || !gradeSchool || submitting}
                                                    >
                                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                        Create Grade
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <CardDescription>Organize by grade level</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Select a school to view grades
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Classes Card - Similar structure */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            <CardTitle>Classes</CardTitle>
                                        </div>
                                        <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" disabled={schools.length === 0}>
                                                    <Plus className="h-4 w-4 mr-1" /> Add Class
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Create New Class</DialogTitle>
                                                    <DialogDescription>
                                                        Add a class section to a grade
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>School</Label>
                                                        <Select value={classSchool} onValueChange={setClassSchool}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select school" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {schools.map((school) => (
                                                                    <SelectItem key={school._id} value={school._id}>
                                                                        {school.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Grade</Label>
                                                        <Select value={classGrade} onValueChange={setClassGrade} disabled={!classSchool}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select grade" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {grades.map((grade) => (
                                                                    <SelectItem key={grade._id} value={grade._id}>
                                                                        {grade.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="class-name">Class Name</Label>
                                                        <Input
                                                            id="class-name"
                                                            placeholder="e.g., Class A, Section 1"
                                                            value={className}
                                                            onChange={(e) => setClassName(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="class-desc">Description (Optional)</Label>
                                                        <Input
                                                            id="class-desc"
                                                            placeholder="Enter description"
                                                            value={classDesc}
                                                            onChange={(e) => setClassDesc(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        onClick={createClass}
                                                        disabled={!className.trim() || !classSchool || !classGrade || submitting}
                                                    >
                                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                        Create Class
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <CardDescription>Organize by class section</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Select a grade to view classes
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Subjects Card - Similar structure */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-5 w-5" />
                                            <CardTitle>Subjects</CardTitle>
                                        </div>
                                        <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button size="sm" disabled={schools.length === 0}>
                                                    <Plus className="h-4 w-4 mr-1" /> Add Subject
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Create New Subject</DialogTitle>
                                                    <DialogDescription>
                                                        Add a subject to a class
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>School</Label>
                                                        <Select value={subjectSchool} onValueChange={setSubjectSchool}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select school" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {schools.map((school) => (
                                                                    <SelectItem key={school._id} value={school._id}>
                                                                        {school.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Grade</Label>
                                                        <Select value={subjectGrade} onValueChange={setSubjectGrade} disabled={!subjectSchool}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select grade" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {grades.map((grade) => (
                                                                    <SelectItem key={grade._id} value={grade._id}>
                                                                        {grade.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Class</Label>
                                                        <Select value={subjectClass} onValueChange={setSubjectClass} disabled={!subjectGrade}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select class" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {classes.map((cls) => (
                                                                    <SelectItem key={cls._id} value={cls._id}>
                                                                        {cls.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="subject-name">Subject Name</Label>
                                                        <Input
                                                            id="subject-name"
                                                            placeholder="e.g., Mathematics, English"
                                                            value={subjectName}
                                                            onChange={(e) => setSubjectName(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="subject-desc">Description (Optional)</Label>
                                                        <Input
                                                            id="subject-desc"
                                                            placeholder="Enter description"
                                                            value={subjectDesc}
                                                            onChange={(e) => setSubjectDesc(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        onClick={createSubject}
                                                        disabled={!subjectName.trim() || !subjectSchool || !subjectGrade || !subjectClass || submitting}
                                                    >
                                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                        Create Subject
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                    <CardDescription>Organize by subject</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        Select a class to view subjects
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
            <ToastContainer />
        </div>
    );
}
