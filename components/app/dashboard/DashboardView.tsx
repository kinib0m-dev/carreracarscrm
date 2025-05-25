"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Car,
  TrendingUp,
  TrendingDown,
  Calendar,
  Mail,
  Target,
  AlertTriangle,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  useDashboardOverview,
  useLeadsDistribution,
  useStockDistribution,
  useMonthlyTrends,
} from "@/lib/dashboard/hooks/use-dashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// Status colors for lead status
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    nuevo: "#0088FE",
    contactado: "#00C49F",
    activo: "#FFBB28",
    calificado: "#FF8042",
    propuesta: "#8884D8",
    evaluando: "#82CA9D",
    manager: "#FFC658",
    iniciado: "#FF7C7C",
    documentacion: "#8DD1E1",
    comprador: "#00C49F",
    descartado: "#FF6B6B",
    sin_interes: "#95A5A6",
    inactivo: "#BDC3C7",
    perdido: "#E74C3C",
    rechazado: "#C0392B",
    sin_opciones: "#7F8C8D",
  };
  return colors[status] || "#95A5A6";
};

export function DashboardView() {
  const {
    overview,
    isLoading: overviewLoading,
    refetch: refetchOverview,
  } = useDashboardOverview();
  const { distribution: leadsDistribution, isLoading: leadsLoading } =
    useLeadsDistribution();
  const { distribution: stockDistribution, isLoading: stockLoading } =
    useStockDistribution();
  const { trends, isLoading: trendsLoading } = useMonthlyTrends();

  const handleRefresh = () => {
    refetchOverview();
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            General overview of the CRM & performance metrics
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={overviewLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${overviewLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{overview.leads.total}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span className="mr-1">
                    {overview.leads.newThisMonth} this month
                  </span>
                  {overview.leads.monthlyGrowth !== 0 && (
                    <Badge
                      variant={
                        overview.leads.monthlyGrowth > 0
                          ? "default"
                          : "secondary"
                      }
                      className="ml-2"
                    >
                      {overview.leads.monthlyGrowth > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(overview.leads.monthlyGrowth)}%
                    </Badge>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {overview.leads.conversionRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {overview.leads.closed} of {overview.leads.total} closed leads
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stock Available */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Stock
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {overview.stock.available}
                </div>
                <p className="text-xs text-muted-foreground">
                  {overview.stock.sold} sold ({overview.stock.soldPercentage}%)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {overview.tasks.pending}
                </div>
                {overview.tasks.overdue > 0 && (
                  <div className="flex items-center text-xs text-red-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {overview.tasks.overdue} overdue
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Leads Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Leads Distribution
            </CardTitle>
            <CardDescription>
              Leads per state in the sales funnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadsDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ label, percent }) =>
                      percent > 5
                        ? `${label} ${(percent * 100).toFixed(0)}%`
                        : ""
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {leadsDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getStatusColor(entry.status)}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [value, "Leads"]}
                    labelFormatter={(label) =>
                      leadsDistribution.find((d) => d.status === label)
                        ?.label || label
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Stock Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="h-5 w-5 mr-2" />
              Stock per vehicle type
            </CardTitle>
            <CardDescription>Available Stock & Sold Stock</CardDescription>
          </CardHeader>
          <CardContent>
            {stockLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stockDistribution}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="available"
                    stackId="a"
                    fill="#00C49F"
                    name="Disponible"
                  />
                  <Bar
                    dataKey="sold"
                    stackId="a"
                    fill="#FF8042"
                    name="Vendido"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Monthly trends
          </CardTitle>
          <CardDescription>
            Evolution of new leads, closed sales, and cars sold
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={trends}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="newLeads"
                  stroke="#0088FE"
                  strokeWidth={2}
                  name="New Leads"
                />
                <Line
                  type="monotone"
                  dataKey="closedDeals"
                  stroke="#00C49F"
                  strokeWidth={2}
                  name="Closed Sales"
                />
                <Line
                  type="monotone"
                  dataKey="soldCars"
                  stroke="#FF8042"
                  strokeWidth={2}
                  name="Sold Vehicles"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {overview.leads.active}
                </div>
                <p className="text-xs text-muted-foreground">Needs managing</p>
              </div>
              <Button asChild size="sm">
                <Link href="/leads">View all</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {overview.stock.available}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available Vehicles
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/stock">Manage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sent Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {overview.emails.sentThisMonth}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
              <Button asChild size="sm">
                <Link href="/emails">
                  <Mail className="h-4 w-4 mr-1" />
                  Emails
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Playground</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Test scenarios</p>
                <p className="text-xs text-muted-foreground">
                  with test clients
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/playground">Test Bot</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekle Performance</CardTitle>
            <CardDescription>Key Metrics this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">New Leads:</span>
              <Badge variant="outline">
                +{Math.floor(overview.leads.newThisMonth / 4)} this week
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sold Cars:</span>
              <Badge variant="outline">
                {Math.floor(overview.stock.soldThisMonth / 4)} this week
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Response rate:</span>
              <Badge variant="outline">
                {overview.leads.active > 0
                  ? Math.round(
                      (overview.leads.active / overview.leads.total) * 100
                    )
                  : 0}
                %
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fast Access</CardTitle>
            <CardDescription>Most used tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/leads/new">
                <Users className="h-4 w-4 mr-2" />
                Create New Lead
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/stock/new">
                <Car className="h-4 w-4 mr-2" />
                Add New Stock
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/emails/new">
                <Mail className="h-4 w-4 mr-2" />
                Generate New Email
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/bot-docs/new">
                <BarChart3 className="h-4 w-4 mr-2" />
                Bot Context & Docs
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
