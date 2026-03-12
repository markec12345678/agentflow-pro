'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { Badge } from '@/web/components/ui/badge';
import { Input } from '@/web/components/ui/input';
import { Label } from '@/web/components/ui/label';
import { Switch } from '@/web/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/web/components/ui/select';
import {
  Clock,
  Calendar,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  Play,
  Pause,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ScheduledExecution {
  id: string;
  workflowId: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  successCount: number;
  failureCount: number;
  lastStatus?: 'success' | 'failed';
}

interface CronSchedulerProps {
  workflowId: string;
}

export default function CronScheduler({ workflowId }: CronSchedulerProps) {
  const [schedules, setSchedules] = useState<ScheduledExecution[]>([]);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    cronExpression: '0 0 * * *',
    timezone: 'Europe/Ljubljana',
    enabled: true,
  });

  const cronPresets = [
    { label: 'Every Minute', value: '* * * * *' },
    { label: 'Every Hour', value: '0 * * * *' },
    { label: 'Every Day at Midnight', value: '0 0 * * *' },
    { label: 'Every Day at 9 AM', value: '0 9 * * *' },
    { label: 'Every Monday at 9 AM', value: '0 9 * * 1' },
    { label: 'Every 15 Minutes', value: '*/15 * * * *' },
    { label: 'Every 6 Hours', value: '0 */6 * * *' },
    { label: 'Every Sunday', value: '0 0 * * 0' },
  ];

  const handleAddSchedule = () => {
    const schedule: ScheduledExecution = {
      id: `schedule-${Date.now()}`,
      workflowId,
      cronExpression: newSchedule.cronExpression,
      timezone: newSchedule.timezone,
      enabled: newSchedule.enabled,
      runCount: 0,
      successCount: 0,
      failureCount: 0,
      nextRun: calculateNextRun(newSchedule.cronExpression),
    };
    setSchedules([...schedules, schedule]);
    setShowAddSchedule(false);
    toast.success('Schedule created');
  };

  const handleRemoveSchedule = (scheduleId: string) => {
    setSchedules(schedules.filter(s => s.id !== scheduleId));
    toast.success('Schedule removed');
  };

  const handleToggleSchedule = (scheduleId: string, enabled: boolean) => {
    setSchedules(
      schedules.map(s =>
        s.id === scheduleId ? { ...s, enabled } : s
      )
    );
    toast.success(enabled ? 'Schedule enabled' : 'Schedule disabled');
  };

  const handleRunNow = (scheduleId: string) => {
    toast.success('Schedule executed manually');
    // In real implementation, trigger workflow execution
  };

  const calculateNextRun = (cronExpression: string): Date => {
    // Simplified calculation - in production use cron-parser library
    const next = new Date();
    next.setHours(next.getHours() + 1);
    return next;
  };

  const parseCronExpression = (cron: string): string => {
    // Simple parser for display purposes
    const parts = cron.split(' ');
    if (parts.length !== 5) return 'Invalid cron expression';
    
    const [minute, hour, day, month, weekday] = parts;
    
    const descriptions = [];
    if (minute === '*') descriptions.push('every minute');
    else if (minute.startsWith('*/')) descriptions.push(`every ${minute.slice(2)} minutes`);
    else descriptions.push(`at minute ${minute}`);
    
    if (hour === '*') descriptions.push('every hour');
    else if (hour.startsWith('*/')) descriptions.push(`every ${hour.slice(2)} hours`);
    else descriptions.push(`at hour ${hour}`);
    
    if (day === '*') descriptions.push('every day');
    else descriptions.push(`on day ${day}`);
    
    if (month === '*') descriptions.push('every month');
    else descriptions.push(`in month ${month}`);
    
    if (weekday === '*') descriptions.push('every weekday');
    else if (weekday === '0') descriptions.push('on Sunday');
    else if (weekday === '1') descriptions.push('on Monday');
    else descriptions.push(`on weekday ${weekday}`);
    
    return descriptions.join(' ');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Schedule Manager
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Schedule workflows to run automatically using cron expressions
          </p>
        </div>
        <Button onClick={() => setShowAddSchedule(!showAddSchedule)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      {/* Add Schedule Form */}
      {showAddSchedule && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Schedule</CardTitle>
            <CardDescription>
              Configure when this workflow should run automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Cron Expression</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newSchedule.cronExpression}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, cronExpression: e.target.value })
                  }
                  placeholder="* * * * *"
                  className="font-mono"
                />
                <Select
                  value={newSchedule.cronExpression}
                  onValueChange={(value) =>
                    setNewSchedule({ ...newSchedule, cronExpression: value })
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Quick select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cronPresets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-gray-500 mt-2 font-mono">
                {parseCronExpression(newSchedule.cronExpression)}
              </p>
            </div>

            <div>
              <Label>Timezone</Label>
              <Select
                value={newSchedule.timezone}
                onValueChange={(timezone) =>
                  setNewSchedule({ ...newSchedule, timezone })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Ljubljana">
                    Europe/Ljubljana (CET/CEST)
                  </SelectItem>
                  <SelectItem value="Europe/London">
                    Europe/London (GMT/BST)
                  </SelectItem>
                  <SelectItem value="Europe/Berlin">
                    Europe/Berlin (CET/CEST)
                  </SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">
                    America/New_York (EST/EDT)
                  </SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    America/Los_Angeles (PST/PDT)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={newSchedule.enabled}
                onCheckedChange={(enabled) =>
                  setNewSchedule({ ...newSchedule, enabled })
                }
              />
              <Label>Enable schedule immediately</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddSchedule(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSchedule}>
                <Save className="w-4 h-4 mr-2" />
                Create Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      <div className="grid gap-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    schedule.enabled ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Calendar className={`w-5 h-5 ${
                      schedule.enabled ? 'text-green-600' : 'text-gray-500'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-mono">
                        {schedule.cronExpression}
                      </CardTitle>
                      <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                        {schedule.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm mt-1">
                      {parseCronExpression(schedule.cronExpression)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRunNow(schedule.id)}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveSchedule(schedule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <div className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" />
                    Next Run
                  </div>
                  <div className="font-mono text-sm">
                    {schedule.nextRun?.toLocaleString('sl-SI') || 'Not scheduled'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                    <RotateCcw className="w-4 h-4" />
                    Total Runs
                  </div>
                  <div className="font-mono text-sm">{schedule.runCount}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Success Rate
                  </div>
                  <div className="font-mono text-sm">
                    {schedule.runCount > 0
                      ? Math.round((schedule.successCount / schedule.runCount) * 100)
                      : 0}
                    % ({schedule.successCount}/{schedule.runCount})
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                    Timezone
                  </div>
                  <div className="text-sm">{schedule.timezone}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <Switch
                  checked={schedule.enabled}
                  onCheckedChange={(enabled) => handleToggleSchedule(schedule.id, enabled)}
                />
                <Label className="text-sm">
                  {schedule.enabled ? 'Disable schedule' : 'Enable schedule'}
                </Label>
              </div>
            </CardContent>
          </Card>
        ))}

        {schedules.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No Schedules Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create a schedule to run this workflow automatically
              </p>
              <Button onClick={() => setShowAddSchedule(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Schedule
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
