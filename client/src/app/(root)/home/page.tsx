"use client";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { Plus, FileText, Loader2 } from "lucide-react";

export default function Home() {

	const [valuators, setValuators] = useState([]);
	const [valuation, setValuation] = useState([]);
	const [title, setTitle] = useState("");
	const [questionPaperUrl, setQuestionPaperUrl] = useState("");
	const [answerKeyUrl, setAnswerKeyUrl] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);

	const router = useRouter();

	const [creatingValuator, setCreatingValuator] = useState(false);

	const getValuators = async () => {
		const config = {
			method: "GET",
			url: `${serverUrl}/valuators?page=1&limit=100`,
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

	const createValuator = async () => {
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
			})
			.catch((error) => {
				setCreatingValuator(false);
				const message = error.response?.data?.message || "Error creating valuator!";
				toast.error(message);
				setDialogOpen(false);
			});
	}

	useEffect(() => {
		getValuators();
	}, [])

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
