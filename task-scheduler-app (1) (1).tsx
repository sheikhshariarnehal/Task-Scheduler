import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Bell, Plus, Check, X, List, ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Color options for task icons
const COLOR_OPTIONS = [
  { name: 'Red', value: '#FF6B6B' },
  { name: 'Green', value: '#4ECB71' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Orange', value: '#FB923C' }
];

// Notification time presets
const NOTIFICATION_PRESETS = [
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: 'Day before', value: 1440 }
];

// Task interface
interface Task {
  id: string;
  title: string;
  dateTime: string;
  details: string;
  icon: {
    color: string;
  };
  notifications: number[];
  isCompleted?: boolean;
  completedAt?: string;
}

const TaskSchedulerApp: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Load tasks from local storage on initial render
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<Task>>({
    title: '',
    dateTime: '',
    details: '',
    icon: { color: COLOR_OPTIONS[0].value },
    notifications: []
  });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  // Save tasks to local storage whenever tasks change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Check for due tasks and send notifications
  useEffect(() => {
    const checkDueTasks = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.isCompleted) return;
        
        const taskDate = new Date(task.dateTime);
        
        // Check each notification time
        task.notifications.forEach(notificationMinutes => {
          const notificationTime = new Date(taskDate.getTime() - notificationMinutes * 60000);
          
          // If notification time is now or in the past, and task is in the future
          if (notificationTime <= now && taskDate > now) {
            // Create a browser notification
            if (Notification.permission === 'granted') {
              new Notification(task.title, {
                body: `Reminder: ${task.details}`,
                icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${task.icon.color}"><circle cx="12" cy="12" r="10" /></svg>`
              });
            }
          }
        });
      });
    };

    // Request notification permission
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    // Check tasks every minute
    const intervalId = setInterval(checkDueTasks, 60000);

    // Initial check
    checkDueTasks();

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [tasks]);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Add or update task
  const handleSaveTask = () => {
    if (!currentTask.title || !currentTask.dateTime) {
      alert('Please enter a title and date/time');
      return;
    }

    const taskToSave: Task = {
      id: editingTaskId || generateId(),
      title: currentTask.title!,
      dateTime: currentTask.dateTime!,
      details: currentTask.details || '',
      icon: { color: currentTask.icon?.color || COLOR_OPTIONS[0].value },
      notifications: currentTask.notifications || [],
      isCompleted: currentTask.isCompleted || false
    };

    if (editingTaskId) {
      // Update existing task
      setTasks(tasks.map(t => t.id === editingTaskId ? taskToSave : t));
    } else {
      // Add new task
      setTasks([...tasks, taskToSave]);
    }

    // Reset form and close dialog
    setCurrentTask({
      title: '',
      dateTime: '',
      details: '',
      icon: { color: COLOR_OPTIONS[0].value },
      notifications: []
    });
    setEditingTaskId(null);
    setIsAddTaskOpen(false);
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  // Edit task
  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setEditingTaskId(task.id);
    setIsAddTaskOpen(true);
  };

  // Mark task as complete
  const handleCompleteTask = (task: Task) => {
    const updatedTasks = tasks.map(t => 
      t.id === task.id 
        ? { 
            ...t, 
            isCompleted: true, 
            completedAt: new Date().toISOString() 
          } 
        : t
    );
    setTasks(updatedTasks);
  };

  // Toggle notification time
  const handleToggleNotification = (minutes: number) => {
    setCurrentTask(prev => {
      const notifications = prev.notifications || [];
      const newNotifications = notifications.includes(minutes)
        ? notifications.filter(n => n !== minutes)
        : [...notifications, minutes];
      return { ...prev, notifications: newNotifications };
    });
  };

  // Render task list
  const renderTaskList = (taskList: Task[], isPending: boolean) => (
    taskList.length === 0 ? (
      <p className="text-center text-gray-500">
        {isPending ? 'No pending tasks' : 'No completed tasks'}
      </p>
    ) : (
      <div className="space-y-4">
        {taskList.map(task => (
          <div 
            key={task.id} 
            className="flex items-center p-4 border rounded-lg"
          >
            <div 
              className="w-4 h-4 mr-4 rounded-full" 
              style={{ backgroundColor: task.icon.color }}
            />
            <div className="flex-grow">
              <h3 className="font-semibold">{task.title}</h3>
              <p className="text-sm text-gray-600">
                {new Date(task.dateTime).toLocaleString()}
              </p>
              {task.details && (
                <p className="text-sm text-gray-500 mt-1">
                  {task.details}
                </p>
              )}
              {!isPending && task.completedAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Completed on: {new Date(task.completedAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              {isPending && (
                <>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleCompleteTask(task)}
                    title="Mark as Complete"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleEditTask(task)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button 
                variant="destructive" 
                size="icon"
                onClick={() => handleDeleteTask(task.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  );

  // Separate pending and completed tasks
  const pendingTasks = tasks.filter(task => !task.isCompleted);
  const completedTasks = tasks.filter(task => task.isCompleted);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Task Scheduler</span>
            <Button 
              onClick={() => {
                setIsAddTaskOpen(true);
                setEditingTaskId(null);
              }}
              className="flex items-center"
            >
              <Plus className="mr-2" /> Add Task
            </Button>
          </CardTitle>
        </CardHeader>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value: 'pending' | 'completed') => setActiveTab(value)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">
              <List className="mr-2 w-4 h-4" /> Pending Tasks
            </TabsTrigger>
            <TabsTrigger value="completed">
              <ClipboardCheck className="mr-2 w-4 h-4" /> Completed Tasks
            </TabsTrigger>
          </TabsList>
          
          <CardContent>
            <TabsContent value="pending">
              {renderTaskList(pendingTasks, true)}
            </TabsContent>
            <TabsContent value="completed">
              {renderTaskList(completedTasks, false)}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Add/Edit Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTaskId ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Task Title</label>
              <Input 
                value={currentTask.title || ''}
                onChange={(e) => setCurrentTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="block mb-2">Date and Time</label>
              <Input 
                type="datetime-local"
                value={currentTask.dateTime || ''}
                onChange={(e) => setCurrentTask(prev => ({ ...prev, dateTime: e.target.value }))}
              />
            </div>

            <div>
              <label className="block mb-2">Details</label>
              <Textarea 
                value={currentTask.details || ''}
                onChange={(e) => setCurrentTask(prev => ({ ...prev, details: e.target.value }))}
                placeholder="Enter task details (optional)"
              />
            </div>

            <div>
              <label className="block mb-2">Task Icon Color</label>
              <div className="flex space-x-2">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setCurrentTask(prev => ({ 
                      ...prev, 
                      icon: { color: color.value } 
                    }))}
                    className={`w-8 h-8 rounded-full ${
                      currentTask.icon?.color === color.value 
                        ? 'ring-2 ring-offset-2 ring-blue-500' 
                        : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-2">Notifications</label>
              <div className="flex flex-wrap gap-2">
                {NOTIFICATION_PRESETS.map(preset => (
                  <Button
                    key={preset.value}
                    variant={currentTask.notifications?.includes(preset.value) ? 'default' : 'outline'}
                    onClick={() => handleToggleNotification(preset.value)}
                    className="flex items-center"
                  >
                    {currentTask.notifications?.includes(preset.value) ? (
                      <Check className="mr-2 w-4 h-4" />
                    ) : (
                      <Bell className="mr-2 w-4 h-4" />
                    )}
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setIsAddTaskOpen(false);
                  setCurrentTask({});
                  setEditingTaskId(null);
                }}
              >
                <X className="mr-2 w-4 h-4" /> Cancel
              </Button>
              <Button onClick={handleSaveTask}>
                <Check className="mr-2 w-4 h-4" /> Save Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskSchedulerApp;
