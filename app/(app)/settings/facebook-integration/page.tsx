import { CalendarDays, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnderConstructionPage() {
  return (
    <section className="py-20 min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center">
          {/* Icon */}
          <div className="mb-8 inline-flex items-center justify-center p-4 bg-primary/10 rounded-full">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            We’re Working on This Page
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            This section of the site is currently under development. We’re
            crafting something great — check back soon!
          </p>

          {/* Status card */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 mb-10 flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Currently under construction</span>
            </div>

            <div className="h-10 w-px bg-border hidden md:block"></div>

            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span>Launch date: Coming soon</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
