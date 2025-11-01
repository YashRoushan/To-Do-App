import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { formatISO } from 'date-fns';

export default function CalendarPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data } = useQuery({
    queryKey: ['calendar', formatISO(startOfMonth), formatISO(endOfMonth)],
    queryFn: () =>
      api.getCalendarEvents(formatISO(startOfMonth), formatISO(endOfMonth)),
  });

  const events = useMemo(() => {
    return (
      data?.events.map((event: any) => ({
        id: event.taskId,
        title: event.title,
        start: event.startAt,
        end: event.dueAt,
        allDay: event.allDay,
      })) || []
    );
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
        />
      </div>
    </div>
  );
}

