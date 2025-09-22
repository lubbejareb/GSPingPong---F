import React from 'react';
import { useApp } from '../context/AppContext';
import { Loader2, CheckCircle, AlertCircle, CloudDownload, CloudUpload } from 'lucide-react';
import { Badge } from './ui/badge';

export function StatusIndicator() {
  const { state } = useApp();
  const { isLoading, isSaving, lastSaved, error } = state;

  if (error) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle size={12} />
        Error: {error}
      </Badge>
    );
  }

  if (isLoading) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1 animate-pulse">
        <CloudDownload size={12} />
        Loading data...
      </Badge>
    );
  }

  if (isSaving) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 size={12} className="animate-spin" />
        Saving...
      </Badge>
    );
  }

  if (lastSaved) {
    const savedDate = new Date(lastSaved);
    const timeAgo = getTimeAgo(savedDate);
    
    return (
      <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-200">
        <CheckCircle size={12} />
        Saved {timeAgo}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <CloudUpload size={12} />
      No save data
    </Badge>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
}
