import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Calendar as CalendarIcon, CheckCircle, XCircle, Clock, Plus,
  Dumbbell, ChevronLeft, ChevronRight, ArrowRight, AlertCircle, Trash2
} from 'lucide-react';
import Layout from '@/components/Layout';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { useSchedule, useWorkouts, useCreateScheduleEntry, useUpdateScheduleEntry, useDeleteScheduleEntry } from '@/hooks/use-api-queries';
import type { ScheduleEntry } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

const STATUS_CONFIG = {
  completed: { label: 'Completed', color: 'bg-accent/20 text-accent border-accent/40', dot: 'bg-accent', icon: CheckCircle },
  skipped: { label: 'Skipped', color: 'bg-destructive/20 text-destructive border-destructive/40', dot: 'bg-destructive', icon: XCircle },
  scheduled: { label: 'Scheduled', color: 'bg-primary/20 text-primary border-primary/40', dot: 'bg-primary', icon: Clock },
  rescheduled: { label: 'Rescheduled', color: 'bg-warning/20 text-warning border-warning/40', dot: 'bg-warning', icon: AlertCircle },
};

const Schedule = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { data: entries = [], isLoading } = useSchedule();
  const { data: workouts = [] } = useWorkouts();
  const createMutation = useCreateScheduleEntry();
  const updateMutation = useUpdateScheduleEntry();
  const deleteMutation = useDeleteScheduleEntry();

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEntry | null>(null);
  type HistoryFilter = 'scheduled' | 'completed' | 'skipped';
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('scheduled');

  // New entry form state
  const [newWorkoutId, setNewWorkoutId] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const d = parseISO(dateParam);
      setSelectedDay(d);
      setSheetOpen(true);
    }
  }, [searchParams]);

  // Group entries by date string
  const entriesByDate = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    entries.forEach(e => {
      const key = e.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [entries]);

  const getEntriesForDay = (day: Date): ScheduleEntry[] => {
    const key = format(day, 'yyyy-MM-dd');
    return entriesByDate.get(key) || [];
  };

  const selectedDayEntries = selectedDay ? getEntriesForDay(selectedDay) : [];

  // Adherence stats
  const completedCount = entries.filter(e => e.status === 'completed').length;
  const skippedCount = entries.filter(e => e.status === 'skipped').length;
  const scheduledCount = entries.filter(e => e.status === 'scheduled').length;
  const totalCount = entries.length;
  const adherenceRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const completedDays = entries.filter(e => e.status === 'completed').map(e => parseISO(e.date));
  const skippedDays = entries.filter(e => e.status === 'skipped').map(e => parseISO(e.date));
  const scheduledDays = entries.filter(e => e.status === 'scheduled').map(e => parseISO(e.date));

  const filteredHistory = useMemo(() => {
    const filtered = entries.filter(e => e.status === historyFilter);
    return historyFilter === 'scheduled'
      ? filtered.sort((a, b) => a.date.localeCompare(b.date))
      : filtered.sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, historyFilter]);

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setSheetOpen(true);
  };

  const handleScheduleNew = async () => {
    if (!selectedDay || !newWorkoutId) return;
    const workout = workouts.find(w => w.id === newWorkoutId);
    try {
      await createMutation.mutateAsync({
        date: format(selectedDay, 'yyyy-MM-dd'),
        workoutId: newWorkoutId,
        workoutName: workout?.name || 'Workout',
        status: 'scheduled',
        notes: newNotes || undefined,
      });
      toast({ title: 'Workout scheduled', description: `${workout?.name} on ${format(selectedDay, 'MMM d, yyyy')}` });
      setDialogOpen(false);
      setNewWorkoutId('');
      setNewNotes('');
    } catch {
      toast({ title: 'Error', description: 'Failed to schedule workout', variant: 'destructive' });
    }
  };

  const handleUpdateStatus = async (entryId: string, status: 'completed' | 'skipped') => {
    try {
      await updateMutation.mutateAsync({ id: entryId, input: { status } });
      toast({ title: `Marked as ${status}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    toast({ title: 'Entry removed' });
    setDeleteTarget(null);
  };

  const renderDay = (day: Date) => {
    const dayEntries = getEntriesForDay(day);
    if (dayEntries.length === 0) return null;

    return (
      <div className="flex gap-0.5 justify-center mt-0.5">
        {dayEntries.slice(0, 3).map((entry, i) => (
          <div
            key={i}
            className={cn('h-1.5 w-1.5 rounded-full', STATUS_CONFIG[entry.status]?.dot || 'bg-muted-foreground')}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <Layout><div className="flex items-center justify-center h-96"><div className="animate-pulse text-muted-foreground">Loading schedule...</div></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Schedule</h2>
            <p className="text-muted-foreground">Plan, track, and review your training schedule</p>
          </div>
          <Button onClick={() => { setSelectedDay(new Date()); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />Schedule Workout
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-foreground">{adherenceRate}%</div>
              <div className="text-xs text-muted-foreground">Adherence</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-accent">{completedCount}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-destructive">{skippedCount}</div>
              <div className="text-xs text-muted-foreground">Skipped</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <div className="text-2xl font-bold text-primary">{scheduledCount}</div>
              <div className="text-xs text-muted-foreground">Upcoming</div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar + Legend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                Training Calendar
              </CardTitle>
              <CardDescription>Click any day to view details or schedule a workout</CardDescription>
            </CardHeader>
            <CardContent>
              <DayPicker
                mode="single"
                selected={selectedDay}
                onSelect={(day) => day && handleDayClick(day)}
                defaultMonth={entries.length > 0 ? parseISO(entries[0].date) : new Date()}
                className={cn("p-3 pointer-events-auto w-full")}
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                  month: "space-y-4 w-full",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] text-center",
                  row: "flex w-full mt-2",
                  cell: "flex-1 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected])]:bg-accent/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: cn(buttonVariants({ variant: "ghost" }), "h-12 w-full p-0 font-normal aria-selected:opacity-100 flex flex-col items-center justify-center gap-0"),
                  day_range_end: "day-range-end",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent/10 text-accent-foreground font-bold",
                  day_outside: "day-outside text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_hidden: "invisible",
                }}
                components={{
                  IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                  IconRight: () => <ChevronRight className="h-4 w-4" />,
                  DayContent: ({ date }) => (
                    <div className="flex flex-col items-center">
                      <span>{date.getDate()}</span>
                      {renderDay(date)}
                    </div>
                  ),
                }}
                modifiers={{
                  completed: completedDays,
                  skipped: skippedDays,
                  upcoming: scheduledDays,
                }}
                modifiersClassNames={{
                  completed: 'bg-accent/10 text-accent hover:bg-accent/20',
                  skipped: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
                  upcoming: 'bg-primary/10 text-primary hover:bg-primary/20',
                }}
              />
            </CardContent>
          </Card>

          {/* Legend + Quick Stats */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className={cn('h-3 w-3 rounded-full', config.dot)} />
                    <span className="text-sm text-foreground">{config.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">Sessions</CardTitle>
                  <Select value={historyFilter} onValueChange={(v) => setHistoryFilter(v as HistoryFilter)}>
                    <SelectTrigger className="h-7 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Upcoming</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="skipped">Skipped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {historyFilter === 'scheduled' && 'No upcoming workouts scheduled.'}
                    {historyFilter === 'completed' && 'No completed sessions yet.'}
                    {historyFilter === 'skipped' && 'No skipped sessions.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredHistory.slice(0, 8).map(entry => {
                      const config = STATUS_CONFIG[entry.status];
                      const goesToSession = entry.status === 'completed' && entry.sessionId;
                      return (
                        <div
                          key={entry.id}
                          className={cn(
                            'p-2.5 rounded-lg border cursor-pointer transition-colors',
                            historyFilter === 'scheduled' && 'border-primary/20 bg-primary/5 hover:bg-primary/10',
                            historyFilter === 'completed' && 'border-accent/20 bg-accent/5 hover:bg-accent/10',
                            historyFilter === 'skipped' && 'border-destructive/20 bg-destructive/5 hover:bg-destructive/10',
                          )}
                          onClick={() => {
                            if (goesToSession) {
                              window.location.href = `/sessions/${entry.sessionId}`;
                            } else {
                              setSelectedDay(parseISO(entry.date));
                              setSheetOpen(true);
                            }
                          }}
                        >
                          <div className="text-xs text-muted-foreground">{format(parseISO(entry.date), 'EEE, MMM d')}</div>
                          <div className="text-sm font-medium text-foreground truncate">{entry.workoutName}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 capitalize">{config.label}{goesToSession && ' · view details →'}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Day Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedDay ? format(selectedDay, 'EEEE, MMMM d, yyyy') : 'Day Details'}</SheetTitle>
            <SheetDescription>
              {selectedDayEntries.length === 0
                ? 'No workouts on this day'
                : `${selectedDayEntries.length} workout${selectedDayEntries.length > 1 ? 's' : ''}`}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {selectedDayEntries.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Rest day — no workouts scheduled</p>
                <Button size="sm" onClick={() => { setSheetOpen(false); setDialogOpen(true); }}>
                  <Plus className="mr-2 h-3 w-3" />Schedule a Workout
                </Button>
              </div>
            ) : (
              selectedDayEntries.map(entry => {
                const config = STATUS_CONFIG[entry.status];
                const Icon = config.icon;
                return (
                  <Card key={entry.id} className={cn('border', config.color.split(' ').filter(c => c.startsWith('border-')).join(' '))}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-3">
                        <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', config.color.split(' ').filter(c => c.startsWith('text-')).join(' '))} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{entry.workoutName || 'Workout'}</span>
                            <Badge variant="outline" className="text-xs capitalize">{config.label}</Badge>
                          </div>

                          {entry.programId && (
                            <p className="text-xs text-muted-foreground mb-2">Program: Upper/Lower Recomp</p>
                          )}

                          {entry.notes && (
                            <p className="text-sm text-muted-foreground italic mb-2">"{entry.notes}"</p>
                          )}

                          <div className="flex gap-2 mt-3">
                            {entry.status === 'scheduled' && (
                              <>
                                <Link to={`/workouts/${entry.workoutId}/start`}>
                                  <Button size="sm" className="text-xs">
                                    <Dumbbell className="mr-1 h-3 w-3" />Start Workout
                                  </Button>
                                </Link>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => handleUpdateStatus(entry.id, 'skipped')}
                                >
                                  Skip
                                </Button>
                              </>
                            )}
                            {entry.status === 'completed' && entry.sessionId && (
                              <Link to={`/workouts/${entry.workoutId}/start`}>
                                <Button size="sm" variant="outline" className="text-xs">
                                  <ArrowRight className="mr-1 h-3 w-3" />View Session
                                </Button>
                              </Link>
                            )}
                            {entry.status === 'skipped' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => handleUpdateStatus(entry.id, 'completed')}
                              >
                                Mark Completed
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(entry)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            {selectedDayEntries.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => { setSheetOpen(false); setDialogOpen(true); }}
              >
                <Plus className="mr-2 h-3 w-3" />Add Another Workout
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Schedule New Workout Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Workout</DialogTitle>
            <DialogDescription>
              {selectedDay ? `Scheduling for ${format(selectedDay, 'EEEE, MMMM d, yyyy')}` : 'Pick a workout to schedule'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Workout</Label>
              <Select value={newWorkoutId} onValueChange={setNewWorkoutId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a workout" />
                </SelectTrigger>
                <SelectContent>
                  {workouts.map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.estimatedDuration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Any notes for this session..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleScheduleNew} disabled={!newWorkoutId || createMutation.isPending}>
              {createMutation.isPending ? 'Scheduling...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        title="Remove Schedule Entry"
        description={`Remove "${deleteTarget?.workoutName || 'this workout'}" from the schedule?`}
        isLoading={deleteMutation.isPending}
      />
    </Layout>
  );
};

export default Schedule;
