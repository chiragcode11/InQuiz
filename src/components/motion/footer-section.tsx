"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Facebook, Instagram, Linkedin, Send, Twitter } from "lucide-react"
import { Link } from "react-router-dom"

const APP_NAME = "InQuiz";
const FOOTER_LINKS = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" }
];

function Footerdemo() {
    return (
        <footer className="relative border-t border-border/50 bg-background/95 backdrop-blur-sm text-foreground transition-colors duration-300">
            <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative">
                        <h2 className="mb-2 text-2xl font-bold tracking-tight">
                            {APP_NAME}
                        </h2>
                        <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
                            Master your next technical interview. Practice in a realistic environment with AI.
                        </p>
                        <form className="relative" onSubmit={(e) => e.preventDefault()}>
                            <Input
                                type="email"
                                placeholder="Get updates"
                                className="pr-12 h-10 bg-background/50 border-border/50"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-white text-black hover:bg-zinc-200 transition-transform hover:scale-105"
                            >
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Subscribe</span>
                            </Button>
                        </form>
                        <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
                    </div>
                    <div>
                        <h3 className="mb-4 text-base font-semibold">Quick Links</h3>
                        <nav className="space-y-2.5 text-sm">
                            <Link to="/" className="block transition-colors hover:text-white text-muted-foreground">
                                Home
                            </Link>
                            <Link to="/#features" className="block transition-colors hover:text-white text-muted-foreground">
                                Features
                            </Link>
                            <Link to="/#pricing" className="block transition-colors hover:text-white text-muted-foreground">
                                Pricing
                            </Link>
                            <Link to="/about" className="block transition-colors hover:text-white text-muted-foreground">
                                About Us
                            </Link>
                            <Link to="/#faq" className="block transition-colors hover:text-white text-muted-foreground">
                                FAQ
                            </Link>
                        </nav>
                    </div>
                    <div>
                        <h3 className="mb-4 text-base font-semibold">Resources</h3>
                        <nav className="space-y-2.5 text-sm">
                            <Link to="/dashboard" className="block transition-colors hover:text-white text-muted-foreground">
                                Dashboard
                            </Link>
                            <Link to="/guide" className="block transition-colors hover:text-white text-muted-foreground">
                                Interview Prep Guide
                            </Link>
                            <Link to="/support" className="block transition-colors hover:text-white text-muted-foreground">
                                Support
                            </Link>
                            <a href="mailto:hello@inquiz.ai" className="block transition-colors hover:text-white text-muted-foreground">
                                Contact Us
                            </a>
                        </nav>
                    </div>
                    <div className="relative">
                        <h3 className="mb-4 text-base font-semibold">Connect</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Follow us for updates and tips on building your online store.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="rounded-full h-9 w-9 border-border/50 hover:border-white/20 hover:bg-white/5 hover:text-white"
                                            asChild
                                        >
                                            <a href="https://facebook.com/inquiz" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                                <Facebook className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Follow us on Facebook</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="rounded-full h-9 w-9 border-border/50 hover:border-white/20 hover:bg-white/5 hover:text-white"
                                            asChild
                                        >
                                            <a href="https://twitter.com/inquiz" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                                <Twitter className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Follow us on Twitter</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="rounded-full h-9 w-9 border-border/50 hover:border-white/20 hover:bg-white/5 hover:text-white"
                                            asChild
                                        >
                                            <a href="https://instagram.com/inquiz" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                                <Instagram className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Follow us on Instagram</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="rounded-full h-9 w-9 border-border/50 hover:border-white/20 hover:bg-white/5 hover:text-white"
                                            asChild
                                        >
                                            <a href="https://linkedin.com/company/inquiz" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                                <Linkedin className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Connect with us on LinkedIn</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 text-center md:flex-row">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
                    </p>
                    <nav className="flex flex-wrap items-center justify-center gap-4 text-sm">
                        {FOOTER_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className="transition-colors hover:text-white text-muted-foreground"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </footer>
    )
}

export { Footerdemo }
