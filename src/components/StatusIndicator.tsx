import { useApp } from '../hooks/useApp';
import { CheckCircle, } from 'lucide-react';
import { Badge } from './ui/badge';

export function StatusIndicator() {
  const { state } = useApp();
  const { isLoading, isSaving, lastSaved, error } = state;

  // Only show the indicator when it's in the "Saved" state
  if (lastSaved && !isLoading && !isSaving && !error) {
    const savedDate = new Date(lastSaved);
    const timeAgo = getTimeAgo(savedDate);
    
    return (
      <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-200">
        <CheckCircle size={12} />
        Saved {timeAgo}
      </Badge>
    );
  }

  // Return null for all other states to hide the component
  return null;
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
