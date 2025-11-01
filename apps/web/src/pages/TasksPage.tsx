import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { useState } from 'react';
import TaskDialog from '../components/TaskDialog';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  // Always fetch all tasks for drag-and-drop, then filter in UI
  const { data, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.getTasks({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] }); // Refresh calendar
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateTask(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent, allTasks: any[]) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const statuses = ['todo', 'in_progress', 'done'];
    
    // Check if we're dropping on a column or a task
    let newStatus: string | null = null;
    
    // Check if over.id is a status (column)
    if (statuses.includes(over.id as string)) {
      newStatus = over.id as string;
    } else {
      // If dropping on another task, find that task's status
      const targetTask = allTasks.find((t) => t._id === over.id);
      if (targetTask) {
        newStatus = targetTask.status;
      }
    }

    if (!newStatus) return;

    // Find the task to check its current status
    const task = allTasks.find((t) => t._id === taskId);
    if (!task) return;

    // Only update if status changed
    if (task.status !== newStatus && statuses.includes(newStatus)) {
      updateStatusMutation.mutate({ id: taskId, status: newStatus });
    }
  };

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

  const allTasks = data?.tasks || [];
  // Apply filter if active
  const tasks = filterStatus
    ? allTasks.filter((t) => t.status === filterStatus)
    : allTasks;
  const statuses = ['todo', 'in_progress', 'done'];
  const activeTask = activeId ? allTasks.find((t) => t._id === activeId) : null;

  // Draggable Task Card Component
  const DraggableTaskCard = ({ task }: { task: any }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: task._id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style}>
        <Card
          className="hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{task.title}</CardTitle>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.map((tag: any) => {
                  const tagObj = typeof tag === 'object' ? tag : { name: tag, color: '#3B82F6' };
                  return (
                    <span
                      key={tagObj._id || tagObj.id || tagObj.name}
                      className="px-2 py-0.5 text-xs rounded-full font-medium"
                      style={{
                        backgroundColor: tagObj.color || '#3B82F6',
                        color: 'white',
                      }}
                    >
                      {tagObj.name}
                    </span>
                  );
                })}
              </div>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTask(task);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(task._id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Droppable Column Component
  const DroppableColumn = ({ status, tasks: columnTasks }: { status: string; tasks: any[] }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: status,
    });

    return (
      <div ref={setNodeRef} className="space-y-2">
        <h2 className="font-semibold text-sm uppercase text-muted-foreground">
          {status.replace('_', ' ')} ({columnTasks.length})
        </h2>
        <SortableContext
          items={columnTasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            className={`space-y-2 min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-colors ${
              isOver
                ? 'border-primary bg-primary/5'
                : 'border-transparent hover:border-primary/20'
            }`}
            data-status={status}
          >
            {columnTasks.map((task) => (
              <DraggableTaskCard key={task._id} task={task} />
            ))}
            {columnTasks.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Drop tasks here
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    );
  };

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

      {/* Kanban View with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={(e) => handleDragEnd(e, allTasks)}
      >
        <div className="grid grid-cols-3 gap-4">
          {statuses.map((status) => {
            // Always use allTasks for columns to enable drag-and-drop
            const statusTasks = allTasks.filter((t) => t.status === status);
            return (
              <DroppableColumn key={status} status={status} tasks={statusTasks} />
            );
          })}
        </div>
        <DragOverlay>
          {activeTask ? (
            <Card className="opacity-90 rotate-2 shadow-lg w-64">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{activeTask.title}</CardTitle>
                {activeTask.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {activeTask.description}
                  </p>
                )}
              </CardHeader>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

