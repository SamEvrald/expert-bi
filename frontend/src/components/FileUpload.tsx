import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiService } from "@/lib/api";
import Navbar from "./Navbar";

interface UploadedFile {
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  datasetId?: string;
}

const FileUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [defaultProject, setDefaultProject] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Ensure we have a default project
  const ensureDefaultProject = async () => {
    if (defaultProject) return defaultProject;
    
    try {
      // Try to get existing projects first
      const projectsResponse = await ApiService.getProjects();
      const projects = projectsResponse.data as any[];
      let projectId;
      
      if (projects && projects.length > 0) {
        projectId = projects[0].id;
      } else {
        // Create a default project
        const createResponse = await ApiService.createProject('My First Project', 'Default project for CSV uploads');
        const project = createResponse.data as any;
        projectId = project.id;
      }
      
      setDefaultProject(projectId);
      return projectId;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create or get project. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const uploadFile = async (file: File) => {
    const fileName = file.name;
    
    const newFile: UploadedFile = {
      name: fileName,
      size: file.size,
      status: 'uploading',
      progress: 0
    };

    setFiles(prev => [...prev, newFile]);

    try {
      // Ensure we have a project to upload to
      const projectId = await ensureDefaultProject();
      
      // Start upload
      setFiles(prev => prev.map(f => 
        f.name === fileName ? { ...f, status: 'uploading', progress: 30 } : f
      ));

      // Upload file to backend
      const uploadResponse = await ApiService.uploadDataset(file, projectId);
      const dataset = uploadResponse.data as any;
      
      setFiles(prev => prev.map(f => 
        f.name === fileName ? { 
          ...f, 
          status: 'processing', 
          progress: 60,
          datasetId: dataset.id 
        } : f
      ));

      // Poll for analysis completion
      const pollForCompletion = async () => {
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max wait
        
        while (attempts < maxAttempts) {
          try {
            const datasetResponse = await ApiService.getDataset(dataset.id);
            const currentDataset = datasetResponse.data as any;
            
            if (currentDataset.status === 'completed') {
              // Analysis complete, get the results
              setFiles(prev => prev.map(f => 
                f.name === fileName ? { ...f, status: 'completed', progress: 100 } : f
              ));
              
              toast({
                title: "Analysis Complete!",
                description: `${fileName} has been successfully analyzed.`,
              });
              
              // Navigate to analytics with the dataset ID
              setTimeout(() => {
                navigate('/analytics', { 
                  state: { 
                    datasetId: dataset.id,
                    fileName: fileName 
                  } 
                });
              }, 1000);
              
              return;
            } else if (currentDataset.status === 'error') {
              throw new Error(currentDataset.errorMessage || 'Analysis failed');
            }
            
            // Update progress
            const progress = Math.min(60 + (attempts * 1.3), 90);
            setFiles(prev => prev.map(f => 
              f.name === fileName ? { ...f, progress } : f
            ));
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          } catch (error) {
            throw error;
          }
        }
        
        throw new Error('Analysis timed out');
      };

      await pollForCompletion();
      
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.name === fileName ? { 
          ...f, 
          status: 'error', 
          progress: 100,
          error: error instanceof Error ? error.message : 'Upload failed'
        } : f
      ));
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "There was an error uploading your file.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = useCallback((uploadedFiles: FileList) => {
    Array.from(uploadedFiles).forEach(file => {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        uploadFile(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload CSV files only.",
          variant: "destructive",
        });
      }
    });
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary">Uploading</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Upload Area */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-accent" />
              Upload Your Data
            </CardTitle>
            <CardDescription>
              Upload CSV files to start your analysis. Maximum file size: 10MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                ${isDragging 
                  ? 'border-accent bg-accent/5' 
                  : 'border-border hover:border-accent/50 hover:bg-accent/5'
                }
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="space-y-4">
                <div className="p-4 bg-gradient-accent rounded-full w-fit mx-auto">
                  <Upload className="h-8 w-8 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Drop your CSV files here, or click to browse
                  </h3>
                  <p className="text-muted-foreground">
                    Supports CSV files up to 10MB. Multiple files allowed.
                  </p>
                </div>
                <Button 
                  variant="gradient"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  Browse Files
                </Button>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {files.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Uploaded Files</CardTitle>
              <CardDescription>
                Track the progress of your file uploads and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.map((file, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(file.status)}
                        <div>
                          <h4 className="font-medium">{file.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(file.status)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(file.name)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {(file.status === 'uploading' || file.status === 'processing') && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {file.status === 'uploading' ? 'Uploading...' : 'Analyzing...'}
                          </span>
                          <span className="font-medium">{Math.round(file.progress)}%</span>
                        </div>
                        <Progress value={file.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </div>
  );
};

export default FileUpload;