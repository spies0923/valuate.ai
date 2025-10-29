import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "valuate.ai",
	description: "Exam Answer Paper Valuation and Marksheet Generation using AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<title>valuate.ai</title>
				<link rel="icon" href="/valuate.png" type="image/png" sizes="any" />
			</head>
			<body className={inter.className}>
				<AuthProvider>
					{children}
				</AuthProvider>
			</body>
		</html>
	);
}
