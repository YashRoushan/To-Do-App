import { format, addDays, startOfTomorrow, nextMonday, parseISO } from 'date-fns';

export interface ParsedQuickAdd {
  title: string;
  priority?: number;
  tags?: string[];
  dueAt?: Date;
  startAt?: Date;
  allDay?: boolean;
  description?: string;
}

const DAY_NAMES: Record<string, () => Date> = {
  today: () => new Date(),
  tomorrow: () => startOfTomorrow(),
  mon: () => nextMonday(new Date()),
  tue: () => addDays(nextMonday(new Date()), 1),
  wed: () => addDays(nextMonday(new Date()), 2),
  thu: () => addDays(nextMonday(new Date()), 3),
  fri: () => addDays(nextMonday(new Date()), 4),
  sat: () => addDays(nextMonday(new Date()), 5),
  sun: () => addDays(nextMonday(new Date()), 6),
};

export function parseQuickAdd(input: string, tagMap: Map<string, string>): ParsedQuickAdd {
  const parts = input.trim().split(/\s+/);
  const result: ParsedQuickAdd = {
    title: '',
    tags: [],
  };

  const titleParts: string[] = [];
  let description: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Priority: !1-5
    if (part.startsWith('!') && part.length === 2) {
      const priority = parseInt(part[1]);
      if (priority >= 1 && priority <= 5) {
        result.priority = priority;
      }
      continue;
    }

    // Date: @today, @tomorrow, @mon, etc.
    if (part.startsWith('@')) {
      const dateKey = part.substring(1).toLowerCase();
      const dateFn = DAY_NAMES[dateKey];
      if (dateFn) {
        const date = dateFn();
        result.dueAt = date;
        result.startAt = date;
      }
      continue;
    }

    // Tag: #tagname
    if (part.startsWith('#')) {
      const tagName = part.substring(1);
      const tagId = tagMap.get(tagName.toLowerCase());
      if (tagId && result.tags) {
        result.tags.push(tagId);
      }
      continue;
    }

    // All-day flag: ^allday
    if (part.toLowerCase() === '^allday') {
      result.allDay = true;
      continue;
    }

    // Description separator: --
    if (part === '--') {
      description = parts.slice(i + 1);
      break;
    }

    // Default: part of title
    titleParts.push(part);
  }

  result.title = titleParts.join(' ');
  if (description.length > 0) {
    result.description = description.join(' ');
  }

  return result;
}

