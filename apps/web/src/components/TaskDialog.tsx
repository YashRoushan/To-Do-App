import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any;
}

export default function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!task;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [priority, setPriority] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState('');
  const [allDay, setAllDay] = useState(false);

  // Fetch tags
  const { data: tagsData, isLoading: tagsLoading, error: tagsError } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.getTags(),
    retry: 2,
  });

  const tags = tagsData?.tags || [];

  // Debug tags
  useEffect(() => {
    if (tagsError) {
      console.error('Error fetching tags:', tagsError);
    }
    if (tags.length > 0) {
      console.log('Loaded tags:', tags);
    } else if (!tagsLoading) {
      console.warn('No tags found. Make sure you run the seed script or create tags.');
    }
  }, [tags, tagsError, tagsLoading]);

  // Load task data when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'todo');
      setPriority(task.priority || 3);
      setSelectedTags(task.tags?.map((t: any) => (typeof t === 'string' ? t : t._id)) || []);
      if (task.dueAt) {
        const date = new Date(task.dueAt);
        // Format as YYYY-MM-DDTHH:mm (datetime-local format, no seconds)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setDueAt(`${year}-${month}-${day}T${hours}:${minutes}`);
      } else {
        // Default to current time if editing and no dueAt
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setDueAt(`${year}-${month}-${day}T${hours}:${minutes}`);
      }
      setAllDay(task.allDay || false);
    } else {
      // Reset form for new task - set default time to current time
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority(3);
      setSelectedTags([]);
      // Set default to current datetime (without seconds)
      const now = new Date();
      // Format as YYYY-MM-DDTHH:mm (datetime-local format)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setDueAt(`${year}-${month}-${day}T${hours}:${minutes}`);
      setAllDay(false);
    }
  }, [task, open]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] }); // Refresh calendar
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error creating task:', error);
      const errorMessage = error?.error?.message || 'Failed to create task';
      const details = error?.error?.details;
      if (details && Array.isArray(details)) {
        const detailMessages = details.map((d: any) => `${d.path}: ${d.message}`).join('\n');
        alert(`${errorMessage}\n\nDetails:\n${detailMessages}`);
      } else {
        alert(errorMessage);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateTask(task._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', task._id] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] }); // Refresh calendar
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error updating task:', error);
      const errorMessage = error?.error?.message || 'Failed to update task';
      const details = error?.error?.details;
      if (details && Array.isArray(details)) {
        const detailMessages = details.map((d: any) => `${d.path}: ${d.message}`).join('\n');
        alert(`${errorMessage}\n\nDetails:\n${detailMessages}`);
      } else {
        alert(errorMessage);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Please enter a task title');
      return;
    }

    const taskData: any = {
      title: title.trim(),
      status,
      priority: Number(priority),
      tags: selectedTags || [],
      allDay: Boolean(allDay),
    };

    // Only include description if it's not empty
    if (description.trim()) {
      taskData.description = description.trim();
    }

    // Handle dates - convert to ISO string format
    // Use dueAt if set, otherwise default to current time
    const dueDate = dueAt ? new Date(dueAt) : new Date();
    
    // Remove seconds and milliseconds
    dueDate.setSeconds(0);
    dueDate.setMilliseconds(0);
    
    taskData.dueAt = dueDate.toISOString();
    // If not all-day, set startAt to the same time
    if (!allDay) {
      taskData.startAt = dueDate.toISOString();
    }

    console.log('Submitting task:', taskData);

    if (isEditing) {
      updateMutation.mutate(taskData);
    } else {
      createMutation.mutate(taskData);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update task details' : 'Add a new task to your list'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority (1-5)</Label>
              <Select
                value={String(priority)}
                onValueChange={(value) => setPriority(Number(value))}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Low</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3 - Medium</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5 - High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueAt">Due Date & Time</Label>
            <Input
              id="dueAt"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="allDay" className="cursor-pointer">
              All-day event
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            {tagsLoading ? (
              <p className="text-sm text-muted-foreground">Loading tags...</p>
            ) : tagsError ? (
              <p className="text-sm text-red-600">Error loading tags. Check console.</p>
            ) : tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: any) => {
                  const tagId = tag._id || tag.id || String(tag);
                  const isSelected = selectedTags.includes(tagId);
                  return (
                    <button
                      key={tagId}
                      type="button"
                      onClick={() => toggleTag(tagId)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors border-2 ${
                        isSelected
                          ? 'text-white border-transparent'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-gray-300'
                      }`}
                      style={isSelected ? { backgroundColor: tag.color || '#3B82F6' } : {}}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 border rounded-md bg-muted">
                <p className="text-sm text-muted-foreground">
                  No tags found. Run <code className="text-xs bg-background px-1 py-0.5 rounded">npm run seed</code> to create default tags, or create tags manually.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

