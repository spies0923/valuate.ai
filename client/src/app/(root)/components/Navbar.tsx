"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function Navbar() {
	const router = useRouter();
	const [premiumOpen, setPremiumOpen] = useState(false);

	const handleLogout = () => {
		localStorage.clear();
		router.push("/");
	};

	return (
		<div className="pb-[70px]">
			<div className="z-50 fixed w-full backdrop-filter backdrop-blur-lg bg-background/80 border-b flex justify-between items-center px-6 py-4">
				<Link href={"/home"} className="font-black text-3xl hover:opacity-80 transition-opacity">
					valuate.ai
				</Link>
				<div className="flex items-center gap-4">
					<Dialog open={premiumOpen} onOpenChange={setPremiumOpen}>
						<DialogTrigger asChild>
							<Button variant="default">
								🚀 Premium
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle className="text-2xl">🚀 Go Premium!</DialogTitle>
								<DialogDescription className="text-lg pt-2">
									Enjoy premium features for just $49/month!
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="flex items-center text-lg">
									<Check className="mr-3 h-5 w-5 text-green-500" /> Premium feature 1
								</div>
								<div className="flex items-center text-lg">
									<Check className="mr-3 h-5 w-5 text-green-500" /> Premium feature 2
								</div>
								<div className="flex items-center text-lg">
									<Check className="mr-3 h-5 w-5 text-green-500" /> Premium feature 3
								</div>
								<div className="flex items-center text-lg">
									<Check className="mr-3 h-5 w-5 text-green-500" /> Premium feature 4
								</div>
							</div>
							<DialogFooter>
								<Button size="lg" className="w-full" onClick={() => setPremiumOpen(false)}>
									Upgrade now 🚀
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
					<UserButton afterSignOutUrl="/" />
				</div>
			</div>
		</div>
	);
}

export default Navbar;
