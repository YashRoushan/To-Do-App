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

  // Fetch tags to match with event tags
  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => api.getTags(),
  });

  const tags = tagsData?.tags || [];
  const tagMap = useMemo(() => {
    const map = new Map();
    tags.forEach((tag: any) => {
      map.set(tag._id || tag.id, tag);
    });
    return map;
  }, [tags]);

  // Automatically refetch when tasks query is invalidated
  // This is handled by invalidating ['calendar'] queries when tasks change

  const events = useMemo(() => {
    if (!data?.events) return [];
    
    return data.events.map((event: any) => {
      // Determine color based on tags (use first tag's color, or fallback to status)
      let eventColor = '#3B82F6'; // Default blue
      
      if (event.tagColors && event.tagColors.length > 0) {
        // Use the first tag's color
        eventColor = event.tagColors[0];
      } else if (event.tags && event.tags.length > 0) {
        // Try to find tag color from tagMap
        const firstTagId = event.tags[0];
        const tag = tagMap.get(firstTagId);
        if (tag && tag.color) {
          eventColor = tag.color;
        }
      } else {
        // Fallback to status-based coloring if no tags
        eventColor = event.status === 'done' ? '#10B981' : event.status === 'in_progress' ? '#F59E0B' : '#3B82F6';
      }
      
      return {
        id: event.taskId,
        title: event.title,
        start: event.startAt || event.dueAt, // Use dueAt as start if no startAt
        end: event.dueAt || event.startAt, // Use startAt as end if no dueAt
        allDay: event.allDay,
        color: eventColor,
        extendedProps: {
          status: event.status,
          priority: event.priority,
          tags: event.tags || [],
          tagColors: event.tagColors || [],
        },
      };
    });
  }, [data, tagMap]);

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
            // Custom event rendering with tag colors
            const tagColors = eventInfo.event.extendedProps.tagColors || [];
            const tags = eventInfo.event.extendedProps.tags || [];
            
            return (
              <div className="fc-event-main-frame">
                <div className="fc-event-time">{eventInfo.timeText}</div>
                <div className="fc-event-title-container">
                  <div className="fc-event-title">{eventInfo.event.title}</div>
                  {tagColors.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {tagColors.slice(0, 3).map((color: string, idx: number) => (
                        <span
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

