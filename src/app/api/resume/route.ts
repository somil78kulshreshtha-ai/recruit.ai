// @polsia:user-owned
import 'server-only';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { forbidden, rateLimit, requestUser, unauthorized } from '@/lib/business/recruitai-server';
import { prisma } from '@/lib/db';
import { sameOrigin } from '@/lib/same-origin';

const resumeSchema = z.object({
  key: z.string().min(3).max(512),
  filename: z.string().trim().min(1).max(255),
  mime_type: z.literal('application/pdf'),
  size: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024),
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const limited = await rateLimit(request, 'resume-save', user.id, 8, 10 * 60 * 1000);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = resumeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: { file: 'Choose a PDF resume up to 50 MB.' } },
      { status: 400 },
    );
  }
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, isDemo: true },
  });
  if (!profile || profile.isDemo)
    return NextResponse.json({ error: 'candidate_profile_required' }, { status: 409 });

  try {
    const resume = await prisma.$transaction(async (tx) => {
      await tx.resume.updateMany({
        where: { profileId: profile.id, isCurrent: true },
        data: { isCurrent: false },
      });
      return tx.resume.create({
        data: {
          profileId: profile.id,
          fileKey: parsed.data.key,
          filename: parsed.data.filename,
          isCurrent: true,
        },
        select: { id: true, filename: true, fileKey: true },
      });
    });
    return NextResponse.json(resume, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'file_already_registered' }, { status: 409 });
    }
    return NextResponse.json({ error: 'resume_save_failed' }, { status: 500 });
  }
}
