import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser, requireAdmin, unauthorized } from '@/lib/auth';

// GET /api/events — List calendar events (Event records + Holiday records merged)
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) return unauthorized();

    const [events, holidays] = await Promise.all([
      db.event.findMany({ orderBy: { date: 'asc' }, take: 500 }),
      db.holiday.findMany({ orderBy: { date: 'asc' }, take: 500 }),
    ]);

    // Surface holidays through the same shape so the calendar's holiday lane is populated
    const holidayEvents = holidays.map((h) => ({
      id: `holiday-${h.id}`,
      title: h.name,
      description: null as string | null,
      date: h.date,
      startTime: null as string | null,
      endTime: null as string | null,
      venue: null as string | null,
      type: h.type || 'Holiday',
      isHoliday: true,
    }));

    return NextResponse.json({ events: [...events, ...holidayEvents] });
  } catch (error) {
    console.error('List events error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/events — Create a calendar event
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { title, description, date, startTime, endTime, venue, type, isHoliday } = body;

    if (!title || !date) {
      return NextResponse.json({ error: 'title and date are required' }, { status: 400 });
    }

    const event = await db.event.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        startTime: startTime || null,
        endTime: endTime || null,
        venue: venue || null,
        type: type || null,
        isHoliday: Boolean(isHoliday),
      },
    });

    return NextResponse.json({ message: 'Event created successfully', event }, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
