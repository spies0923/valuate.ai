"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, School, LogOut, User, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

function Navbar() {
	const router = useRouter();
	const { user, logout } = useAuth();
	const [premiumOpen, setPremiumOpen] = useState(false);

	return (
		<div className="pb-[70px]">
			<div className="z-50 fixed w-full backdrop-filter backdrop-blur-lg bg-background/80 border-b flex justify-between items-center px-6 py-4">
				<div className="flex items-center gap-8">
					<Link href={"/home"} className="font-black text-3xl hover:opacity-80 transition-opacity">
						valuate.ai
					</Link>
					<nav className="hidden md:flex items-center gap-6">
						<Link href={"/home"} className="text-sm font-medium hover:text-primary transition-colors">
							Home
						</Link>
						<Link href={"/organizations"} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
							<School className="h-4 w-4" />
							Organizations
						</Link>
						{user?.role === "admin" && (
							<Link href={"/admin"} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
								<Shield className="h-4 w-4" />
								Admin
							</Link>
						)}
					</nav>
				</div>
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
					{user && (
						<div className="flex items-center gap-3">
							<div className="hidden md:flex flex-col items-end">
								<div className="flex items-center gap-2">
									<p className="text-sm font-medium">{user.name}</p>
									{user.role === "admin" && (
										<Badge variant="default" className="text-xs">Admin</Badge>
									)}
								</div>
								<p className="text-xs text-muted-foreground">{user.email}</p>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={logout}
								title="Logout"
							>
								<LogOut className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default Navbar;
