"use client";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FiPlusCircle } from "react-icons/fi";
import { UploadButton } from "@/utils/uploadthing";
import axios from "axios";
import { bgColors, serverUrl } from "@/utils/utils";
import { ToastContainer, toast } from "react-toastify";
import { AiFillCheckCircle, AiOutlineFileDone } from "react-icons/ai";
import Section from "../components/Animate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Loader2 } from "lucide-react";

export default function Home() {
	const { user } = useAuth();
	const router = useRouter();

	const [valuators, setValuators] = useState([]);
	const [valuation, setValuation] = useState([]);
	const [title, setTitle] = useState("");
	const [questionPaperUrl, setQuestionPaperUrl] = useState("");
	const [answerKeyUrl, setAnswerKeyUrl] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [creatingValuator, setCreatingValuator] = useState(false);

	// Organization state
	const [schools, setSchools] = useState<any[]>([]);
	const [grades, setGrades] = useState<any[]>([]);
	const [classes, setClasses] = useState<any[]>([]);
	const [subjects, setSubjects] = useState<any[]>([]);

	// Selected organization for new valuator
	const [selectedSchool, setSelectedSchool] = useState("");
	const [selectedGrade, setSelectedGrade] = useState("");
	const [selectedClass, setSelectedClass] = useState("");
	const [selectedSubject, setSelectedSubject] = useState("");

	const getValuators = async () => {
		if (!user?._id) return;

		const config = {
			method: "GET",
			url: `${serverUrl}/valuators?page=1&limit=100&userId=${user._id}`,
			headers: {
				"Authorization": `Bearer ${localStorage.getItem("token")}`
			},
		};

		axios(config)
			.then((response) => {
				// Handle both old and new response formats (with pagination)
				const data = response.data?.data || response.data;
				setValuators(Array.isArray(data) ? data : []);
			})
			.catch((error) => {
				const message = error.response?.data?.message || "Failed to fetch valuators";
				toast.error(message);
			});
	}

	const fetchOrganizations = async () => {
		if (!user?._id) return;

		try {
			const res = await axios.get(`${serverUrl}/schools`, { params: { userId: user._id } });
			setSchools(res.data.data || []);
		} catch (error) {
			console.error("Failed to fetch schools");
		}
	};

	const fetchGradesForSchool = async (schoolId: string) => {
		if (!user?._id || !schoolId) return;

		try {
			const res = await axios.get(`${serverUrl}/schools/${schoolId}/grades`, {
				params: { userId: user._id }
			});
			setGrades(res.data.data || []);
		} catch (error) {
			console.error("Failed to fetch grades");
		}
	};

	const fetchClassesForGrade = async (schoolId: string, gradeId: string) => {
		if (!user?._id || !schoolId || !gradeId) return;

		try {
			const res = await axios.get(`${serverUrl}/schools/${schoolId}/grades/${gradeId}/classes`, {
				params: { userId: user._id }
			});
			setClasses(res.data.data || []);
		} catch (error) {
			console.error("Failed to fetch classes");
		}
	};

	const fetchSubjectsForClass = async (schoolId: string, gradeId: string, classId: string) => {
		if (!user?._id || !schoolId || !gradeId || !classId) return;

		try {
			const res = await axios.get(`${serverUrl}/schools/${schoolId}/grades/${gradeId}/classes/${classId}/subjects`, {
				params: { userId: user._id }
			});
			setSubjects(res.data.data || []);
		} catch (error) {
			console.error("Failed to fetch subjects");
		}
	};

	const createValuator = async () => {
		if (!user?._id) return;

		setCreatingValuator(true);
		const config = {
			method: "POST",
			url: `${serverUrl}/valuators`,
			headers: {
				"Authorization": `Bearer ${localStorage.getItem("token")}`,
				"Content-Type": `application/json`,
			},
			data: {
				title: title,
				questionPaper: questionPaperUrl,
				answerKey: answerKeyUrl,
				userId: user._id,
				schoolId: selectedSchool || null,
				gradeId: selectedGrade || null,
				classId: selectedClass || null,
				subjectId: selectedSubject || null,
			}
		};

		axios(config)
			.then((response) => {
				setCreatingValuator(false);
				const message = response.data?.message || "Valuator created successfully!";
				toast.success(message);
				getValuators();
				setDialogOpen(false);
				// Reset form
				setTitle("");
				setQuestionPaperUrl("");
				setAnswerKeyUrl("");
				setSelectedSchool("");
				setSelectedGrade("");
				setSelectedClass("");
				setSelectedSubject("");
			})
			.catch((error) => {
				setCreatingValuator(false);
				const message = error.response?.data?.message || "Error creating valuator!";
				toast.error(message);
				setDialogOpen(false);
			});
	}

	useEffect(() => {
		if (user?._id) {
			getValuators();
		}
	}, [user?._id]);

	useEffect(() => {
		if (dialogOpen && user?._id) {
			fetchOrganizations();
		}
	}, [dialogOpen, user?._id]);

	useEffect(() => {
		if (selectedSchool) {
			fetchGradesForSchool(selectedSchool);
			// Reset dependent selections
			setSelectedGrade("");
			setSelectedClass("");
			setSelectedSubject("");
			setClasses([]);
			setSubjects([]);
		}
	}, [selectedSchool]);

	useEffect(() => {
		if (selectedSchool && selectedGrade) {
			fetchClassesForGrade(selectedSchool, selectedGrade);
			// Reset dependent selections
			setSelectedClass("");
			setSelectedSubject("");
			setSubjects([]);
		}
	}, [selectedGrade]);

	useEffect(() => {
		if (selectedSchool && selectedGrade && selectedClass) {
			fetchSubjectsForClass(selectedSchool, selectedGrade, selectedClass);
			// Reset dependent selection
			setSelectedSubject("");
		}
	}, [selectedClass]);

	return (
		<div>
			<Navbar />
			<main className="flex flex-col items-center w-full h-full">
				<div className="w-full h-full p-5 px-10">
					<p className="text-2xl my-4 mb-7 font-semibold">My Exam Valuators ({valuators.length})</p>
					<div className="flex flex-wrap w-full gap-6">
						<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
							<DialogTrigger asChild>
								<Card className="hover:shadow-xl duration-200 cursor-pointer border-2 border-dashed flex flex-col min-h-[400px] min-w-[350px] items-center justify-center group">
									<CardContent className="flex flex-col items-center justify-center p-6">
										<Plus className="h-24 w-24 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
										<p className="font-semibold text-xl text-muted-foreground group-hover:text-foreground transition-colors">New Valuator</p>
									</CardContent>
								</Card>
							</DialogTrigger>
							<DialogContent className="max-w-2xl">
								<DialogHeader>
									<DialogTitle className="flex items-center text-2xl">
										<FiPlusCircle className="mr-2" /> Create new valuator
									</DialogTitle>
									<DialogDescription>
										Create a new exam valuator by uploading the question paper and answer key.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-6 py-4">
									<div className="space-y-2">
										<Label htmlFor="title">Exam title</Label>
										<Input
											id="title"
											placeholder="Enter exam title"
											value={title}
											onChange={(e) => setTitle(e.target.value)}
										/>
									</div>

									{/* Organization Selectors */}
									<div className="space-y-4 border-t pt-4">
										<Label className="text-base">Organization (Optional)</Label>
										<p className="text-sm text-muted-foreground">Associate this valuator with a school, grade, class, and subject for better organization.</p>

										<div className="grid grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label>School</Label>
												<Select value={selectedSchool} onValueChange={setSelectedSchool}>
													<SelectTrigger>
														<SelectValue placeholder="Select school (optional)" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="">None</SelectItem>
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
												<Select value={selectedGrade} onValueChange={setSelectedGrade} disabled={!selectedSchool}>
													<SelectTrigger>
														<SelectValue placeholder={selectedSchool ? "Select grade (optional)" : "Select school first"} />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="">None</SelectItem>
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
												<Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedGrade}>
													<SelectTrigger>
														<SelectValue placeholder={selectedGrade ? "Select class (optional)" : "Select grade first"} />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="">None</SelectItem>
														{classes.map((cls) => (
															<SelectItem key={cls._id} value={cls._id}>
																{cls.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											<div className="space-y-2">
												<Label>Subject</Label>
												<Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
													<SelectTrigger>
														<SelectValue placeholder={selectedClass ? "Select subject (optional)" : "Select class first"} />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="">None</SelectItem>
														{subjects.map((subject) => (
															<SelectItem key={subject._id} value={subject._id}>
																{subject.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										</div>
									</div>

									<Separator />

									<div className="space-y-2">
										<Label>Question Paper</Label>
										<div className="flex items-center gap-2">
											{questionPaperUrl ? (
												<div className="flex items-center gap-2">
													<AiFillCheckCircle className="text-2xl text-green-500" />
													<p className="text-sm text-muted-foreground truncate max-w-md">{questionPaperUrl}</p>
												</div>
											) : (
												<UploadButton
													endpoint="media"
													onClientUploadComplete={(res) => {
														setQuestionPaperUrl(res![0].url);
														toast.success("Question paper uploaded!");
													}}
													onUploadError={(error: Error) => {
														toast.error(`Upload error: ${error.message}`);
													}}
												/>
											)}
										</div>
									</div>
									<div className="space-y-2">
										<Label>Answer Key / Criteria</Label>
										<div className="flex items-center gap-2">
											{answerKeyUrl ? (
												<div className="flex items-center gap-2">
													<AiFillCheckCircle className="text-2xl text-green-500" />
													<p className="text-sm text-muted-foreground truncate max-w-md">{answerKeyUrl}</p>
												</div>
											) : (
												<UploadButton
													endpoint="media"
													onClientUploadComplete={(res) => {
														setAnswerKeyUrl(res![0].url);
														toast.success("Answer key uploaded!");
													}}
													onUploadError={(error: Error) => {
														toast.error(`Upload error: ${error.message}`);
													}}
												/>
											)}
										</div>
									</div>
								</div>
								<DialogFooter>
									<Button
										className="w-full"
										disabled={!title || !questionPaperUrl || !answerKeyUrl || creatingValuator}
										onClick={createValuator}
									>
										{creatingValuator ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Creating...
											</>
										) : (
											"Create Valuator"
										)}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
						{
							valuators?.map((item: any, index: number) => {
								return (
									<Section key={index} translate="translateY(10px)" duration={((index * 0.075) + 0.5).toString() + "s"}>
										<Card
											onClick={() => router.push(`/valuate/${item._id}`)}
											className="hover:shadow-xl duration-200 cursor-pointer border-2 flex flex-col min-h-[400px] min-w-[350px] overflow-hidden group"
										>
											<div
												style={{ background: `linear-gradient(45deg, ${bgColors[item?.title.toString().toLowerCase()[0]][0]}, ${bgColors[item?.title.toString().toLowerCase()[0]][1]})` }}
												className="flex items-center justify-center w-full h-64 opacity-50 group-hover:opacity-60 transition-opacity"
											>
												<FileText style={{ color: bgColors[item?.title.toString().toLowerCase()[0]][1] }} className="h-32 w-32" />
											</div>
											<CardHeader>
												<CardTitle className="text-lg">{item?.title}</CardTitle>
												<CardDescription>{item?.valuations} valuations</CardDescription>
											</CardHeader>
										</Card>
									</Section>
								);
							})
						}
					</div>
				</div>
			</main>
			<ToastContainer />
		</div>
	);
}
