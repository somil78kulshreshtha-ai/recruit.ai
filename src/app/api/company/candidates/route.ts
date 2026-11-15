// @polsia:user-owned
import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateObject } from '@/lib/ai/client';
import {
  forbidden,
  rateLimit,
  requestUser,
  requireCompanyMember,
  unauthorized,
} from '@/lib/business/recruitai-server';
import { candidateSearchSchema } from '@/lib/contracts/recruitai';
import { prisma } from '@/lib/db';
import { sameOrigin } from '@/lib/same-origin';

const criteriaSchema = z.object({
  skills: z.array(z.string().trim().min(1).max(64)).max(20),
  city: z.string().trim().max(100).nullable(),
  minExperienceYears: z.number().min(0).max(60).nullable(),
  maxNoticePeriodDays: z.number().int().min(0).max(365).nullable(),
});
const searchRequestSchema = candidateSearchSchema.extend({
  companyId: z.string().cuid(),
  save: z.boolean().default(false),
});
const deleteSchema = z.object({ id: z.string().cuid(), companyId: z.string().cuid() });

export async function GET(request: Request) {
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified) return forbidden();
  const companyId = new URL(request.url).searchParams.get('companyId');
  if (!companyId) return NextResponse.json({ error: 'company_required' }, { status: 400 });
  const membership = await requireCompanyMember(user.id, companyId);
  if (!membership) return forbidden();
  const searches = await prisma.savedCandidateSearch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({
    items: searches.map((item) => ({
      id: item.id,
      query: item.query,
      criteria: item.criteria,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified) return forbidden();
  const limited = await rateLimit(request, 'candidate-search', user.id, 15);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = searchRequestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { errors: { query: 'Enter a search of at least four characters.' } },
      { status: 400 },
    );
  const membership = await requireCompanyMember(user.id, parsed.data.companyId);
  if (!membership) return forbidden();
  try {
    const criteria = criteriaSchema.parse(
      await generateObject({
        task: 'classification',
        messages: [
          {
            role: 'system',
            content:
              'Extract only explicit candidate search filters from the recruiter query. Return JSON with skills (array of skill strings), city (string or null), minExperienceYears (number or null), and maxNoticePeriodDays (integer or null). Do not add assumptions, candidate scores, rankings, or criteria the user did not state.',
          },
          { role: 'user', content: parsed.data.query },
        ],
      }),
    );
    const candidates = await prisma.candidateProfile.findMany({
      where: {
        isDiscoverable: true,
        isOpenToWork: true,
        isDemo: false,
        ...(criteria.skills.length ? { skills: { hasSome: criteria.skills } } : {}),
        ...(criteria.city
          ? {
              OR: [
                { city: { contains: criteria.city, mode: 'insensitive' as const } },
                { preferredLocations: { has: criteria.city } },
              ],
            }
          : {}),
        ...(criteria.minExperienceYears !== null
          ? { experienceYears: { gte: criteria.minExperienceYears } }
          : {}),
        ...(criteria.maxNoticePeriodDays !== null
          ? { noticePeriodDays: { lte: criteria.maxNoticePeriodDays } }
          : {}),
      },
      orderBy: { fullName: 'asc' },
      take: 50,
      select: {
        userId: true,
        fullName: true,
        headline: true,
        city: true,
        skills: true,
        experienceYears: true,
        education: true,
        expectedCtc: true,
        noticePeriodDays: true,
        preferredLocations: true,
        workMode: true,
      },
    });
    let savedSearchId: string | null = null;
    if (parsed.data.save) {
      const saved = await prisma.savedCandidateSearch.create({
        data: { userId: user.id, query: parsed.data.query, criteria },
        select: { id: true },
      });
      savedSearchId = saved.id;
    }
    return NextResponse.json({ criteria, items: candidates, savedSearchId });
  } catch {
    return NextResponse.json(
      {
        error: 'candidate_search_unavailable',
        message: 'Candidate search could not be completed right now. No candidates were ranked.',
      },
      { status: 502 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  if (!user.emailVerified) return forbidden();
  const limited = await rateLimit(request, 'candidate-search-delete', user.id, 40);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ errors: { id: 'Choose a valid saved search.' } }, { status: 400 });
  const membership = await requireCompanyMember(user.id, parsed.data.companyId);
  if (!membership) return forbidden();
  const result = await prisma.savedCandidateSearch.deleteMany({
    where: { id: parsed.data.id, userId: user.id },
  });
  if (!result.count) return NextResponse.json({ error: 'search_not_found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
