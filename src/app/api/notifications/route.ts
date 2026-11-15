// @polsia:user-owned
import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { forbidden, rateLimit, requestUser, unauthorized } from '@/lib/business/recruitai-server';
import { prisma } from '@/lib/db';
import { sameOrigin } from '@/lib/same-origin';

const readSchema = z.object({ id: z.string().cuid().optional(), all: z.boolean().optional() });

export async function GET(request: Request) {
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id, isDemo: false },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      title: true,
      body: true,
      href: true,
      kind: true,
      readAt: true,
      createdAt: true,
    },
  });
  return NextResponse.json({
    items: notifications.map((item) => ({
      ...item,
      readAt: item.readAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const limited = await rateLimit(request, 'notification-read', user.id, 120);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = readSchema.safeParse(body);
  if (!parsed.success || (!parsed.data.id && !parsed.data.all))
    return NextResponse.json({ errors: { id: 'Choose a notification.' } }, { status: 400 });
  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      isDemo: false,
      readAt: null,
      ...(parsed.data.id ? { id: parsed.data.id } : {}),
    },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
