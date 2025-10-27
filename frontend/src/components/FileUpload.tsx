import React, { useCallback, useState } from 'react';
import { ApiService, ApiResponse } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from './Navbar';

type Dataset = {
  id: number;
  name?: string;
  projectId?: number;
  userId?: number;
  status?: 'uploaded' | 'processing' | 'completed' | 'failed' | 'error';
  errorMessage?: string;
  [key: string]: unknown;
};

type UploadedFile = {
  name: string;
  size: number;
  status: 'queued' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  datasetId?: number;
  error?: string;
};

const FileUpload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Dataset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pollDatasetUntilComplete = useCallback(async (datasetId: number, fileName: string) => {
    const maxAttempts = 30;
    let attempts = 0;
    while (attempts < maxAttempts) {
      const dsResp = await ApiService.getDataset<Dataset>(datasetId);
      const ds = dsResp?.data;
      if (ds?.status === 'completed') return ds;
      if (ds?.status === 'failed' || ds?.status === 'error') {
        throw new Error(ds?.errorMessage || 'Analysis failed');
      }
      attempts++;
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error('Analysis timed out');
  }, []);

  const uploadSingleFile = useCallback(async (file: File) => {
    setIsUploading(true);
    const fileName = file.name;

    const uiFile: UploadedFile = {
      name: fileName,
      size: file.size,
      status: 'uploading',
      progress: 0
    };
    setFiles((prev) => [...prev, uiFile]);

    try {
      // Remove project creation since datasets don't need project_id
      setFiles((prev) => prev.map(f => f.name === fileName ? { ...f, status: 'uploading', progress: 20 } : f));

      const formData = new FormData();
      formData.append('file', file);
      // Remove projectId since it's not in your database schema

      const uploadResp = await ApiService.uploadDataset<{ id: number }>(formData);
      const dataset = uploadResp?.data;
      if (!dataset?.id) {
        throw new Error('Upload failed: missing dataset id in response');
      }

      setFiles((prev) => prev.map(f => f.name === fileName ? { ...f, status: 'processing', progress: 50, datasetId: dataset.id } : f));

      const completed = await pollDatasetUntilComplete(dataset.id, fileName);

      setFiles((prev) => prev.map(f => f.name === fileName ? { ...f, status: 'completed', progress: 100 } : f));
      setUploadedFiles((prev) => [completed, ...prev.filter(d => d.id !== completed.id)]);

      toast({
        title: 'Analysis Complete',
        description: `${fileName} processed successfully.`,
      });

      // Navigate to analytics page with datasetId
      setTimeout(() => {
        navigate('/analytics', { state: { datasetId: completed.id, fileName } });
      }, 500);

      return completed;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload/analysis error';
      setFiles((prev) => prev.map(f => f.name === fileName ? { ...f, status: 'error', progress: 100, error: msg } : f));
      toast({
        title: 'Upload Failed',
        description: msg,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [navigate, pollDatasetUntilComplete, toast]);

  const handleFileList = useCallback((fileList: FileList) => {
    Array.from(fileList).forEach((file) => {
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        uploadSingleFile(file).catch(() => { /* handled inside uploadSingleFile */ });
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload CSV files only.',
          variant: 'destructive',
        });
      }
    });
  }, [uploadSingleFile, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) handleFileList(e.dataTransfer.files);
  }, [handleFileList]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
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
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                  ${isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50 hover:bg-accent/5'}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-accent rounded-full w-fit mx-auto">
                    <Upload className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Drop your CSV files here, or click to browse</h3>
                    <p className="text-muted-foreground">Supports CSV files up to 10MB. Multiple files allowed.</p>
                  </div>
                  <Button variant="gradient" onClick={() => document.getElementById('file-input')?.click()}>
                    Browse Files
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFileList(e.target.files)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {files.length > 0 && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Uploaded Files</CardTitle>
                <CardDescription>Track the progress of your file uploads and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {files.map((f, i) => (
                    <div key={`${f.name}-${i}`} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {f.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-500" />
                            : f.status === 'error' ? <AlertCircle className="h-4 w-4 text-red-500" />
                            : <FileText className="h-4 w-4 text-muted-foreground" />}
                          <div>
                            <h4 className="font-medium">{f.name}</h4>
                            <p className="text-sm text-muted-foreground">{formatFileSize(f.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {f.status === 'uploading' && <Badge variant="secondary">Uploading</Badge>}
                          {f.status === 'processing' && <Badge variant="secondary">Processing</Badge>}
                          {f.status === 'completed' && <Badge variant="default">Completed</Badge>}
                          {f.status === 'error' && <Badge variant="destructive">Error</Badge>}
                          <Button variant="ghost" size="icon" onClick={() => removeFile(f.name)} className="h-8 w-8">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {(f.status === 'uploading' || f.status === 'processing') && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{f.status === 'uploading' ? 'Uploading...' : 'Analyzing...'}</span>
                            <span className="font-medium">{Math.round(f.progress)}%</span>
                          </div>
                          <Progress value={f.progress} className="h-2" />
                        </div>
                      )}
                      {f.status === 'error' && f.error && <div className="text-sm text-red-600 mt-2">{f.error}</div>}
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