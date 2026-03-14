import {buildSampleMadridTrip} from '../../shared/seedTrip';
import type {Stop, Trip, TripDay, TripSummary} from '../../shared/tripTypes';

type D1DatabaseLike = {
  prepare: (sql: string) => {
    bind: (...values: unknown[]) => {
      all: <T = unknown>() => Promise<{results: T[]}>;
      first: <T = unknown>() => Promise<T | null>;
      run: () => Promise<unknown>;
    };
  };
};

const schemaSql = [
  `CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      destination TEXT NOT NULL,
      country_or_region TEXT NOT NULL,
      hero_image_url TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      travelers_summary TEXT NOT NULL,
      interests_json TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  `CREATE TABLE IF NOT EXISTS trip_days (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      day_index INTEGER NOT NULL,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
    )`,
  `CREATE TABLE IF NOT EXISTS stops (
      id TEXT PRIMARY KEY,
      day_id TEXT NOT NULL,
      stop_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      time TEXT NOT NULL,
      description TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      type TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      booking_link TEXT,
      source TEXT,
      FOREIGN KEY (day_id) REFERENCES trip_days(id) ON DELETE CASCADE
    )`,
];

function getDb(env: any): D1DatabaseLike {
  if (!env.DB) {
    throw new Response(JSON.stringify({error: 'D1 binding DB not configured'}), {
      status: 500,
      headers: {'Content-Type': 'application/json'},
    });
  }

  return env.DB as D1DatabaseLike;
}

export async function ensureSchema(env: any) {
  const db = getDb(env);
  for (const statement of schemaSql) {
    await db.prepare(statement).bind().run();
  }
  try {
    await db.prepare('ALTER TABLE trips ADD COLUMN hero_image_url TEXT').bind().run();
  } catch {
    // Column already exists.
  }
  try {
    await db.prepare('ALTER TABLE stops ADD COLUMN completed INTEGER NOT NULL DEFAULT 0').bind().run();
  } catch {
    // Column already exists.
  }
}

export async function seedIfNeeded(env: any) {
  const db = getDb(env);
  const countRow = await db.prepare('SELECT COUNT(*) as count FROM trips').bind().first<{count: number}>();
  if ((countRow?.count ?? 0) > 0) {
    return;
  }

  await saveTrip(env, buildSampleMadridTrip());
}

export async function listTrips(env: any): Promise<TripSummary[]> {
  await ensureSchema(env);
  await seedIfNeeded(env);
  const db = getDb(env);
  const {results} = await db
    .prepare(
      `SELECT
        trips.id,
        trips.title,
        trips.destination,
        trips.country_or_region as countryOrRegion,
        trips.hero_image_url as heroImageUrl,
        trips.start_date as startDate,
        trips.end_date as endDate,
        trips.status,
        trips.created_at as createdAt,
        trips.updated_at as updatedAt,
        COUNT(trip_days.id) as dayCount
      FROM trips
      LEFT JOIN trip_days ON trip_days.trip_id = trips.id
      GROUP BY trips.id
      ORDER BY trips.updated_at DESC`,
    )
    .bind()
    .all<TripSummary>();

  return results.map((row) => ({...row, dayCount: Number(row.dayCount)}));
}

export async function getTrip(env: any, tripId: string): Promise<Trip | null> {
  await ensureSchema(env);
  await seedIfNeeded(env);
  const db = getDb(env);
  const tripRow = await db
    .prepare(
      `SELECT
        id,
        title,
        destination,
        country_or_region as countryOrRegion,
        hero_image_url as heroImageUrl,
        start_date as startDate,
        end_date as endDate,
        travelers_summary as travelersSummary,
        interests_json as interestsJson,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM trips WHERE id = ?`,
    )
    .bind(tripId)
    .first<any>();

  if (!tripRow) {
    return null;
  }

  const {results: dayRows} = await db
    .prepare(
      `SELECT id, trip_id as tripId, day_index as dayIndex, date, title, summary
       FROM trip_days
       WHERE trip_id = ?
       ORDER BY day_index ASC`,
    )
    .bind(tripId)
    .all<any>();

  const days: TripDay[] = [];
  for (const dayRow of dayRows) {
    const {results: stopRows} = await db
      .prepare(
        `SELECT
          id,
          day_id as dayId,
          stop_index as stopIndex,
          name,
          time,
          description,
          lat,
          lng,
          type,
          completed,
          image,
          booking_link as bookingLink,
          source
        FROM stops
        WHERE day_id = ?
        ORDER BY stop_index ASC`,
      )
      .bind(dayRow.id)
      .all<any>();

    days.push({
      id: dayRow.id,
      date: dayRow.date,
      title: dayRow.title,
      summary: dayRow.summary,
      stops: stopRows.map(
        (stopRow): Stop => ({
          id: stopRow.id,
          name: stopRow.name,
          time: stopRow.time,
          description: stopRow.description,
          coords: [Number(stopRow.lat), Number(stopRow.lng)],
          type: stopRow.type,
          completed: Boolean(stopRow.completed),
          image: stopRow.image || undefined,
          bookingLink: stopRow.bookingLink || undefined,
          source: stopRow.source || undefined,
        }),
      ),
    });
  }

  return {
    id: tripRow.id,
    title: tripRow.title,
    destination: tripRow.destination,
    countryOrRegion: tripRow.countryOrRegion,
    heroImageUrl: tripRow.heroImageUrl || undefined,
    startDate: tripRow.startDate,
    endDate: tripRow.endDate,
    travelersSummary: tripRow.travelersSummary,
    interests: JSON.parse(tripRow.interestsJson),
    status: tripRow.status,
    createdAt: tripRow.createdAt,
    updatedAt: tripRow.updatedAt,
    days,
  };
}

export async function saveTrip(env: any, trip: Trip) {
  await ensureSchema(env);
  const db = getDb(env);

  await db
    .prepare(
      `INSERT OR REPLACE INTO trips
       (id, title, destination, country_or_region, hero_image_url, start_date, end_date, travelers_summary, interests_json, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      trip.id,
      trip.title,
      trip.destination,
      trip.countryOrRegion,
      trip.heroImageUrl ?? null,
      trip.startDate,
      trip.endDate,
      trip.travelersSummary,
      JSON.stringify(trip.interests),
      trip.status,
      trip.createdAt,
      trip.updatedAt,
    )
    .run();

  const existingDays = await db.prepare('SELECT id FROM trip_days WHERE trip_id = ?').bind(trip.id).all<{id: string}>();
  for (const row of existingDays.results) {
    await db.prepare('DELETE FROM stops WHERE day_id = ?').bind(row.id).run();
  }
  await db.prepare('DELETE FROM trip_days WHERE trip_id = ?').bind(trip.id).run();

  for (const [dayIndex, day] of trip.days.entries()) {
    await db
      .prepare(
        `INSERT INTO trip_days
         (id, trip_id, day_index, date, title, summary)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(day.id, trip.id, dayIndex, day.date, day.title, day.summary)
      .run();

    for (const [stopIndex, stop] of day.stops.entries()) {
      await db
        .prepare(
          `INSERT INTO stops
           (id, day_id, stop_index, name, time, description, lat, lng, type, completed, image, booking_link, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          stop.id,
          day.id,
          stopIndex,
          stop.name,
          stop.time,
          stop.description,
          stop.coords[0],
          stop.coords[1],
          stop.type,
          stop.completed ? 1 : 0,
          stop.image ?? null,
          stop.bookingLink ?? null,
          stop.source ?? null,
        )
        .run();
    }
  }

  return trip;
}

export async function deleteTrip(env: any, tripId: string) {
  await ensureSchema(env);
  const db = getDb(env);
  const dayRows = await db.prepare('SELECT id FROM trip_days WHERE trip_id = ?').bind(tripId).all<{id: string}>();
  for (const row of dayRows.results) {
    await db.prepare('DELETE FROM stops WHERE day_id = ?').bind(row.id).run();
  }
  await db.prepare('DELETE FROM trip_days WHERE trip_id = ?').bind(tripId).run();
  await db.prepare('DELETE FROM trips WHERE id = ?').bind(tripId).run();
}
