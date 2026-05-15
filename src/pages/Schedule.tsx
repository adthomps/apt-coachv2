import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import {
  format, parseISO, startOfMonth, endOfMonth, isWithinInterval, isBefore, isSameDay,
  startOfDay,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import FormDialog from '@/components/common/FormDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle, XCircle, Clock, Plus, Dumbbell, ChevronLeft, ChevronRight, ArrowRight,
  AlertCircle, Trash2, Edit3,
} from 'lucide-react';
import Layout from '@/components/Layout';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import {
  useSchedule, useWorkouts, useCreateScheduleEntry, useUpdateScheduleEntry, useDeleteScheduleEntry,
} from '@/hooks/use-api-queries';
import type { ScheduleEntry } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

const STATUS_CONFIG = {
  completed: { label: 'Done', color: 'bg-success/15 text-success border-success/30', dot: 'bg-success', icon: CheckCircle },
  skipped: { label: 'Skipped', color: 'bg-warning/15 text-warning border-warning/30', dot: 'bg-warning', icon: XCircle },
  scheduled: { label: 'Scheduled', color: 'bg-primary/15 text-primary border-primary/30', dot: 'bg-primary', icon: Clock },
  rescheduled: { label: 'Rescheduled', color: 'bg-warning/15 text-warning border-warning/30', dot: 'bg-warning', icon: AlertCircle },
} as const;

const Schedule = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { data: entries = [], isLoading } = useSchedule();
  const { data: workouts = [] } = useWorkouts();
  const createMutation = useCreateScheduleEntry();
  const updateMutation = useUpdateScheduleEntry();
  const deleteMutation = useDeleteScheduleEntry();

  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEntry | null>(null);

  const [newWorkoutId, setNewWorkoutId] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const d = parseISO(dateParam);
      setSelectedDay(d);
      setVisibleMonth(d);
      setSheetOpen(true);
    }
  }, [searchParams]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    entries.forEach(e => {
      const key = e.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [entries]);

  const getEntriesForDay = (day: Date): ScheduleEntry[] =>
    entriesByDate.get(format(day, 'yyyy-MM-dd')) || [];

  const selectedDayEntries = selectedDay ? getEntriesForDay(selectedDay) : [];

  // ---------- Month-scoped stats ----------
  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);
  const today = startOfDay(new Date());

  const monthEntries = useMemo(
    () => entries.filter(e => isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd })),
    [entries, monthStart, monthEnd],
  );

  const completedCount = monthEntries.filter(e => e.status === 'completed').length;
  const skippedCount = monthEntries.filter(e => e.status === 'skipped').length;
  const scheduledCount = monthEntries.filter(e => e.status === 'scheduled').length;
  const totalMonth = monthEntries.length;
  const adherenceRate = totalMonth > 0 ? Math.round((completedCount / totalMonth) * 100) : 0;

  const overdueCount = monthEntries.filter(
    e => e.status === 'scheduled' && isBefore(parseISO(e.date), today),
  ).length;
  const upcomingCount = scheduledCount - overdueCount;

  // ---------- Schedule direction ----------
  const direction = useMemo(() => {
    if (totalMonth === 0) {
      return {
        tone: 'muted' as const,
        label: 'No data',
        action: 'Schedule sessions for this month',
        reasoning: 'Calendar is empty',
      };
    }
    if (overdueCount > 0) {
      return {
        tone: 'warning' as const,
        label: 'Attention',
        action: `Reschedule ${overdueCount} overdue session${overdueCount > 1 ? 's' : ''}`,
        reasoning: `${overdueCount} overdue · ${upcomingCount} upcoming`,
      };
    }
    if (adherenceRate >= 80) {
      return {
        tone: 'success' as const,
        label: 'Favorable',
        action: 'Hold the line — you are on cadence',
        reasoning: `${adherenceRate}% adherence · ${upcomingCount} upcoming`,
      };
    }
    if (scheduledCount === 0 && completedCount > 0) {
      return {
        tone: 'warning' as const,
        label: 'Plan ahead',
        action: 'Schedule remaining sessions this month',
        reasoning: `${completedCount} done · 0 planned`,
      };
    }
    return {
      tone: 'success' as const,
      label: 'Favorable',
      action: 'Schedule remaining sessions this month',
      reasoning: `${overdueCount} overdue · ${upcomingCount} upcoming`,
    };
  }, [totalMonth, overdueCount, upcomingCount, adherenceRate, scheduledCount, completedCount]);

  // ---------- Lists ----------
  const upcomingSessions = useMemo(
    () => entries
      .filter(e => e.status === 'scheduled' && parseISO(e.date) >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6),
    [entries, today],
  );

  const recentSessions = useMemo(
    () => entries
      .filter(e => e.status === 'completed' || e.status === 'skipped')
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5),
    [entries],
  );

  // ---------- Calendar modifiers ----------
  const completedDays = entries.filter(e => e.status === 'completed').map(e => parseISO(e.date));
  const skippedDays = entries.filter(e => e.status === 'skipped').map(e => parseISO(e.date));
  const scheduledDays = entries.filter(e => e.status === 'scheduled').map(e => parseISO(e.date));

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

  const renderDayDot = (day: Date) => {
    const dayEntries = getEntriesForDay(day);
    if (dayEntries.length === 0) return null;
    const top = dayEntries[0];
    const dotClass = STATUS_CONFIG[top.status]?.dot ?? 'bg-muted-foreground';
    return <div className={cn('h-1.5 w-1.5 rounded-full mt-0.5', dotClass)} />;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-muted-foreground">Loading schedule...</div>
        </div>
      </Layout>
    );
  }

  const directionToneClass =
    direction.tone === 'success' ? 'text-success'
    : direction.tone === 'warning' ? 'text-warning'
    : 'text-muted-foreground';

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Schedule — {format(visibleMonth, 'MMMM yyyy')}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Training calendar for the current month · click any day to view or edit sessions
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => { setSelectedDay(new Date()); setDialogOpen(true); }}
          >
            <Plus className="mr-2 h-4 w-4" />Schedule workout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT: Overview + Calendar */}
          <div className="space-y-4">
            {/* Month overview */}
            <Card>
              <CardContent className="pt-5 space-y-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {format(visibleMonth, 'MMMM yyyy')} Overview
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatTile
                    label="Adherence"
                    value={`${adherenceRate}%`}
                    sub={`${completedCount} / ${totalMonth} so far`}
                    tone={adherenceRate >= 80 ? 'success' : adherenceRate >= 50 ? 'warning' : 'destructive'}
                  />
                  <StatTile
                    label="Completed"
                    value={completedCount}
                    tone="success"
                  />
                  <StatTile
                    label="Skipped"
                    value={skippedCount}
                    tone={skippedCount > 0 ? 'destructive' : 'default'}
                  />
                  <StatTile
                    label="Remaining"
                    value={scheduledCount}
                    sub="in month"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card>
              <CardContent className="pt-5">
                <DayPicker
                  mode="single"
                  selected={selectedDay}
                  onSelect={day => day && handleDayClick(day)}
                  month={visibleMonth}
                  onMonthChange={setVisibleMonth}
                  className={cn('p-0 pointer-events-auto w-full')}
                  classNames={{
                    months: 'flex flex-col w-full',
                    month: 'space-y-3 w-full',
                    caption: 'flex justify-between items-center pb-1',
                    caption_label: 'text-base font-semibold text-foreground',
                    nav: 'flex items-center gap-1',
                    nav_button: cn(buttonVariants({ variant: 'outline' }), 'h-7 w-7 p-0'),
                    nav_button_previous: '',
                    nav_button_next: '',
                    table: 'w-full border-collapse',
                    head_row: 'flex w-full',
                    head_cell: 'text-muted-foreground rounded-md flex-1 font-normal text-xs uppercase tracking-wide text-left pl-1 py-2',
                    row: 'flex w-full mt-1',
                    cell: 'flex-1 text-sm p-0.5 relative',
                    day: cn(
                      buttonVariants({ variant: 'ghost' }),
                      'h-12 w-full p-0 font-normal flex flex-col items-center justify-center gap-0 rounded-md',
                    ),
                    day_selected:
                      'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                    day_today: 'ring-1 ring-primary/40 font-semibold',
                    day_outside: 'text-muted-foreground/40',
                    day_disabled: 'text-muted-foreground/30',
                    day_hidden: 'invisible',
                  }}
                  components={{
                    IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                    IconRight: () => <ChevronRight className="h-4 w-4" />,
                    DayContent: ({ date }) => (
                      <div className="flex flex-col items-center">
                        <span>{date.getDate()}</span>
                        {renderDayDot(date)}
                      </div>
                    ),
                  }}
                  modifiers={{
                    completed: completedDays,
                    skipped: skippedDays,
                    upcoming: scheduledDays,
                  }}
                  modifiersClassNames={{
                    upcoming: 'bg-primary/15 text-primary hover:bg-primary/25',
                  }}
                />

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                  <LegendDot className="bg-success" label="Completed" />
                  <LegendDot className="bg-warning" label="Skipped" />
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-primary/30" /> Scheduled
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Direction + Upcoming + Recent */}
          <div className="space-y-4">
            {/* Schedule direction */}
            <Card>
              <CardContent className="pt-5 space-y-3">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Schedule Direction · <span className={cn('font-semibold', directionToneClass)}>{direction.label}</span>
                </div>
                <div className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Action</span>
                  <span className="text-foreground font-medium text-right">{direction.action}</span>
                  <span className="text-muted-foreground">Reasoning</span>
                  <span className="text-foreground text-right tabular-nums">{direction.reasoning}</span>
                  <span className="text-muted-foreground">Source</span>
                  <span className="text-foreground text-right">Calendar entries</span>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming sessions */}
            <Card>
              <CardContent className="pt-5 space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                  Upcoming Sessions
                </div>
                {upcomingSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-2">No upcoming sessions scheduled.</p>
                ) : (
                  <div className="divide-y divide-border/60">
                    {upcomingSessions.map(e => {
                      const d = parseISO(e.date);
                      const isToday = isSameDay(d, today);
                      return (
                        <div key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                          <span className="text-sm text-foreground/90 w-28 shrink-0">
                            {isToday ? 'Today' : format(d, 'MMM d EEE')}
                          </span>
                          <span className="flex-1 text-sm font-medium text-foreground text-right truncate">
                            {e.workoutName ?? 'Workout'}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px]', STATUS_CONFIG[e.status].color)}
                          >
                            {STATUS_CONFIG[e.status].label}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => { setSelectedDay(d); setSheetOpen(true); }}
                          >
                            <Edit3 className="h-3 w-3 mr-1" /> Edit
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent sessions */}
            <Card>
              <CardContent className="pt-5 space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                  Recent Sessions
                </div>
                {recentSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-2">No completed or skipped sessions yet.</p>
                ) : (
                  <div className="divide-y divide-border/60">
                    {recentSessions.map(e => {
                      const d = parseISO(e.date);
                      const goesToSession = e.status === 'completed' && e.sessionId;
                      return (
                        <div key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                          <span className="text-sm text-foreground/90 w-20 shrink-0">{format(d, 'MMM d')}</span>
                          <span className="flex-1 text-sm font-medium text-foreground text-right truncate">
                            {e.workoutName ?? 'Workout'}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px]', STATUS_CONFIG[e.status].color)}
                          >
                            {STATUS_CONFIG[e.status].label}
                          </Badge>
                          {goesToSession && (
                            <Link to={`/sessions/${e.sessionId}`}>
                              <Button size="sm" variant="ghost" className="h-7 text-xs">
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
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
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground italic mb-2">"{entry.notes}"</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-3">
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
                              <Link to={`/sessions/${entry.sessionId}`}>
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

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        size="md"
        title="Schedule Workout"
        description={selectedDay ? `Scheduling for ${format(selectedDay, 'EEEE, MMMM d, yyyy')}` : 'Pick a workout to schedule'}
        submitLabel={createMutation.isPending ? 'Scheduling…' : 'Schedule'}
        onSubmit={handleScheduleNew}
        isSubmitting={createMutation.isPending}
        canSubmit={!!newWorkoutId}
      >
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
      </FormDialog>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        title="Remove Schedule Entry"
        description={`Remove "${deleteTarget?.workoutName || 'this workout'}" from the schedule?`}
        isLoading={deleteMutation.isPending}
      />
    </Layout>
  );
};

const TONE_VALUE: Record<'default' | 'success' | 'warning' | 'destructive', string> = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
};

const StatTile: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: keyof typeof TONE_VALUE;
}> = ({ label, value, sub, tone = 'default' }) => (
  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={cn('text-2xl font-bold tabular-nums leading-tight mt-1', TONE_VALUE[tone])}>{value}</div>
    {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
  </div>
);

const LegendDot: React.FC<{ className: string; label: string }> = ({ className, label }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className={cn('h-2 w-2 rounded-full', className)} /> {label}
  </span>
);

export default Schedule;
