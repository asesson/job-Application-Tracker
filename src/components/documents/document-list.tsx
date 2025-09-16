'use client';

import { useState } from 'react';
import { useDocuments, useDeleteDocument, useDownloadDocument } from '@/lib/hooks/useDocuments';
import { DocumentUploadForm } from '@/components/forms/document-upload-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Download,
  Trash2,
  MoreHorizontal,
  Plus,
  Upload,
} from 'lucide-react';
import { format } from 'date-fns';

interface DocumentListProps {
  applicationId: string;
}

const documentTypeLabels = {
  resume: 'Resume/CV',
  cover_letter: 'Cover Letter',
  portfolio: 'Portfolio',
  certificate: 'Certificate',
  other: 'Other',
};

const documentTypeColors = {
  resume: 'bg-blue-100 text-blue-800',
  cover_letter: 'bg-green-100 text-green-800',
  portfolio: 'bg-purple-100 text-purple-800',
  certificate: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

export function DocumentList({ applicationId }: DocumentListProps) {
  const { data: documents = [], isLoading } = useDocuments(applicationId);
  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDownloadDocument();

  const [showUploadForm, setShowUploadForm] = useState(false);

  const handleDelete = async (doc: any) => {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument.mutateAsync(doc);
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document');
      }
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      await downloadDocument.mutateAsync(doc);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    return <FileText className="h-8 w-8 text-blue-600" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Documents</h3>
        <Button onClick={() => setShowUploadForm(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Document List */}
      {documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      {getFileIcon(document.file_type)}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {document.file_name}
                        </h4>
                        <Badge
                          className={documentTypeColors[document.document_type]}
                          variant="secondary"
                        >
                          {documentTypeLabels[document.document_type]}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatFileSize(document.file_size)}</span>
                        <span>
                          Uploaded {format(new Date(document.uploaded_at), 'MMM d, yyyy')}
                        </span>
                      </div>

                      {document.notes && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {document.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(document)}
                      disabled={downloadDocument.isPending}
                    >
                      <Download className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(document)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(document)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No documents uploaded
          </h3>
          <p className="text-gray-500 mb-4">
            Upload resumes, cover letters, and other documents related to this application.
          </p>
          <Button onClick={() => setShowUploadForm(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Upload First Document
          </Button>
        </div>
      )}

      {/* Upload Form Dialog */}
      <DocumentUploadForm
        applicationId={applicationId}
        open={showUploadForm}
        onOpenChange={setShowUploadForm}
        onSuccess={() => setShowUploadForm(false)}
      />
    </div>
  );
}