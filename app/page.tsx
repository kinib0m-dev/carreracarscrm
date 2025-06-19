import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Car,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Welcome to your CRM
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Manage your leads, track your sales, and grow your business
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" />
              Go to Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* Quick Overview Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Lead Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Track and manage your leads from first contact to conversion
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <Car className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Inventory Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Monitor your stock levels and vehicle availability
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                View detailed insights and conversion metrics
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            Ready to get started? Your dashboard has everything you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/leads" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                View Leads
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard Overview
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
