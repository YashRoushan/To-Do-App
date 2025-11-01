import { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { formatISO, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Expand date range to show more tasks (3 months before and after current view)
  const viewStart = subMonths(startOfMonth(currentDate), 3);
  const viewEnd = addMonths(endOfMonth(currentDate), 3);

  const { data, refetch } = useQuery({
    queryKey: ['calendar', formatISO(viewStart), formatISO(viewEnd)],
    queryFn: () =>
      api.getCalendarEvents(formatISO(viewStart), formatISO(viewEnd)),
    refetchOnWindowFocus: true,
  });

  // Automatically refetch when tasks query is invalidated
  // This is handled by invalidating ['calendar'] queries when tasks change

  const events = useMemo(() => {
    if (!data?.events) return [];
    
    return data.events.map((event: any) => ({
      id: event.taskId,
      title: event.title,
      start: event.startAt || event.dueAt, // Use dueAt as start if no startAt
      end: event.dueAt || event.startAt, // Use startAt as end if no dueAt
      allDay: event.allDay,
      color: event.status === 'done' ? '#10B981' : event.status === 'in_progress' ? '#F59E0B' : '#3B82F6',
      extendedProps: {
        status: event.status,
        priority: event.priority,
      },
    }));
  }, [data]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Calendar</h1>
      <div className="bg-card rounded-lg border p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          editable={true}
          droppable={true}
          datesSet={(arg) => {
            // Update current date when calendar view changes
            setCurrentDate(arg.start);
          }}
          eventContent={(eventInfo) => {
            // Custom event rendering with status indicator
            return (
              <div className="fc-event-main-frame">
                <div className="fc-event-time">{eventInfo.timeText}</div>
                <div className="fc-event-title-container">
                  <div className="fc-event-title">{eventInfo.event.title}</div>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

