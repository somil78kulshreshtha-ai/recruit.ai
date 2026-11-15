// @polsia:user-owned
import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  errorFields,
  forbidden,
  rateLimit,
  requestUser,
  unauthorized,
} from '@/lib/business/recruitai-server';
import { alertInputSchema } from '@/lib/contracts/recruitai';
import { prisma } from '@/lib/db';
import { sameOrigin } from '@/lib/same-origin';

const deleteSchema = z.object({ id: z.string().cuid() });
const updateSchema = alertInputSchema.extend({ id: z.string().cuid() });

export async function GET(request: Request) {
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const rows = await prisma.jobAlert.findMany({
    where: { userId: user.id, isDemo: false },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({
    items: rows.map((item) => ({
      id: item.id,
      label: item.label,
      criteria: item.criteria,
      emailEnabled: item.emailEnabled,
      whatsappEnabled: item.whatsappEnabled,
      active: item.active,
    })),
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const limited = await rateLimit(request, 'job-alert-create', user.id, 20);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = alertInputSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ errors: errorFields(parsed.error) }, { status: 400 });
  const alert = await prisma.jobAlert.create({
    data: {
      userId: user.id,
      label: parsed.data.label,
      criteria: parsed.data.criteria,
      emailEnabled: parsed.data.emailEnabled,
      whatsappEnabled: false,
    },
  });
  return NextResponse.json({ id: alert.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const limited = await rateLimit(request, 'job-alert-update', user.id, 30);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ errors: errorFields(parsed.error) }, { status: 400 });
  const updated = await prisma.jobAlert.updateMany({
    where: { id: parsed.data.id, userId: user.id, isDemo: false },
    data: {
      label: parsed.data.label,
      criteria: parsed.data.criteria,
      emailEnabled: parsed.data.emailEnabled,
      whatsappEnabled: false,
    },
  });
  if (!updated.count) return NextResponse.json({ error: 'alert_not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const limited = await rateLimit(request, 'job-alert-delete', user.id, 40);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ errors: { id: 'Choose a valid alert.' } }, { status: 400 });
  const deleted = await prisma.jobAlert.deleteMany({
    where: { id: parsed.data.id, userId: user.id, isDemo: false },
  });
  if (deleted.count === 0) return NextResponse.json({ error: 'alert_not_found' }, { status: 404 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
