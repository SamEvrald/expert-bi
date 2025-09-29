import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, FileText, Plus, Upload, TrendingUp, Users, Database, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ApiService } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "./Navbar";

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Dataset {
  id: string;
  originalName: string;
  status: string;
  rowCount?: number;
  columnCount?: number;
  createdAt: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects and datasets in parallel
        const [projectsResponse, datasetsResponse] = await Promise.all([
          ApiService.getProjects(),
          ApiService.getDatasets()
        ]);

        console.log('Projects response:', projectsResponse);
        console.log('Datasets response:', datasetsResponse);

        // Ensure we always set arrays, even if API returns something unexpected
        setProjects(Array.isArray(projectsResponse.data) ? projectsResponse.data : []);
        setDatasets(Array.isArray(datasetsResponse.data) ? datasetsResponse.data : []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set empty arrays on error to prevent filter errors
        setProjects([]);
        setDatasets([]);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const completedProjects = Array.isArray(projects) ? projects.filter(p => p.status === 'active').length : 0;
  const totalDatasets = Array.isArray(datasets) ? datasets.length : 0;
  const completedDatasets = Array.isArray(datasets) ? datasets.filter(d => d.status === 'completed').length : 0;
  const totalRows = Array.isArray(datasets) ? datasets.reduce((sum, d) => sum + (d.rowCount || 0), 0) : 0;

  const stats = [
    {
      title: "Total Projects",
      value: Array.isArray(projects) ? projects.length.toString() : "0",
      change: `${completedProjects} active`,
      icon: <FileText className="h-6 w-6 text-chart-primary" />
    },
    {
      title: "Data Points Processed",
      value: totalRows > 1000 ? `${(totalRows / 1000).toFixed(1)}K` : totalRows.toString(),
      change: `${completedDatasets} datasets completed`,
      icon: <Database className="h-6 w-6 text-chart-secondary" />
    },
    {
      title: "Datasets Uploaded",
      value: totalDatasets.toString(),
      change: `${Array.isArray(datasets) ? datasets.filter(d => d.createdAt > new Date(Date.now() - 7*24*60*60*1000).toISOString()).length : 0} this week`,
      icon: <TrendingUp className="h-6 w-6 text-chart-tertiary" />
    },
    {
      title: "Account Type",
      value: user?.name || "User",
      change: "Free Plan",
      icon: <Users className="h-6 w-6 text-chart-quaternary" />
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Header */}
      <div className="border-b border-border bg-gradient-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-foreground animate-slide-in-left">Dashboard</h1>
              <p className="text-muted-foreground mt-1 animate-slide-in-left" style={{animationDelay: '0.1s'}}>
                Welcome back, {user?.name}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to="/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Link>
              </Button>
              <Button variant="gradient" asChild>
                <Link to="/upload">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="shadow-card hover:shadow-elegant transition-all duration-300 transform hover:scale-105 animate-scale-in"
              style={{animationDelay: `${0.2 + index * 0.1}s`}}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects List */}
          <div className="lg:col-span-2 animate-slide-in-left" style={{animationDelay: '0.6s'}}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-accent" />
                  Recent Projects
                </CardTitle>
                <CardDescription>
                  {!Array.isArray(projects) || projects.length === 0 ? "No projects yet" : `${projects.length} project${projects.length !== 1 ? 's' : ''} total`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!Array.isArray(projects) || projects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No projects yet</p>
                    <p className="text-sm">Create your first project by uploading data</p>
                    <Button variant="gradient" className="mt-4" asChild>
                      <Link to="/upload">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </Link>
                    </Button>
                  </div>
                ) : (
                  projects.slice(0, 5).map((project, index) => (
                    <div 
                      key={project.id} 
                      className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-all duration-200 transform hover:scale-[1.02] animate-fade-in"
                      style={{animationDelay: `${0.8 + index * 0.1}s`}}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-foreground">{project.name}</h3>
                            <Badge variant={project.status === 'active' ? 'default' : 'outline'}>
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{project.description || "No description"}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Created {formatDate(project.createdAt)}</span>
                            <span>•</span>
                            <span>Updated {formatDate(project.updatedAt)}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6 animate-slide-in-right" style={{animationDelay: '0.7s'}}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>
                  Get started with your data analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="gradient" className="w-full justify-start" asChild>
                  <Link to="/upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV File
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Browse Templates
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Samples
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!Array.isArray(datasets) || datasets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No activity yet
                    </p>
                  ) : (
                    datasets.slice(0, 3).map((dataset, index) => (
                      <div key={dataset.id} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium truncate">{dataset.originalName}</p>
                          <p className="text-muted-foreground">{formatDate(dataset.createdAt)}</p>
                        </div>
                        <Badge variant={
                          dataset.status === 'completed' ? 'default' : 
                          dataset.status === 'processing' ? 'secondary' : 
                          'outline'
                        }>
                          {dataset.status}
                        </Badge>
                      </div>
                    ))
                  )}
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link to="/upload">
                      <Plus className="h-4 w-4 mr-2" />
                      Upload New Dataset
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;