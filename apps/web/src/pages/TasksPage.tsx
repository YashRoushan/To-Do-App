import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { useState } from 'react';
import TaskDialog from '../components/TaskDialog';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filterStatus],
    queryFn: () => api.getTasks({ status: filterStatus, limit: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] }); // Refresh calendar
    },
  });

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleNewTask = () => {
    console.log('Opening new task dialog');
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-8">Loading tasks...</div>;
  }

  const tasks = data?.tasks || [];
  const statuses = ['todo', 'in_progress', 'done'];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Button 
          onClick={(e) => {
            e.preventDefault();
            console.log('Button clicked!');
            handleNewTask();
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
      />

      {/* Status Filters */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filterStatus === undefined ? 'default' : 'outline'}
          onClick={() => setFilterStatus(undefined)}
        >
          All
        </Button>
        {statuses.map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => setFilterStatus(status)}
          >
            {status.replace('_', ' ').toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Kanban View */}
      <div className="grid grid-cols-3 gap-4">
        {statuses.map((status) => {
          const statusTasks = tasks.filter((t) => t.status === status);
          return (
            <div key={status} className="space-y-2">
              <h2 className="font-semibold text-sm uppercase text-muted-foreground">
                {status.replace('_', ' ')} ({statusTasks.length})
              </h2>
              <div className="space-y-2">
                {statusTasks.map((task) => (
                  <Card key={task._id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{task.title}</CardTitle>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            Priority: {task.priority}
                          </span>
                          {task.dueAt && (
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(task.dueAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(task._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

