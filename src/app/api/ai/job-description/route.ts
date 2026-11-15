// @polsia:user-owned
import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { chat } from '@/lib/ai/client';
import {
  forbidden,
  rateLimit,
  requestUser,
  requireCompanyMember,
  unauthorized,
} from '@/lib/business/recruitai-server';
import { sameOrigin } from '@/lib/same-origin';

const inputSchema = z.object({
  companyId: z.string().cuid(),
  title: z.string().trim().min(3).max(140),
  skills: z.array(z.string().trim().min(1).max(64)).max(30),
  experienceMinYears: z.number().min(0).max(60),
  experienceMaxYears: z.number().min(0).max(60).nullable(),
  location: z.string().trim().min(2).max(120),
  workMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
  industry: z.string().trim().min(2).max(100),
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const limited = await rateLimit(request, 'ai-job-description', user.id, 10);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { errors: { title: 'Add the role details before generating a draft.' } },
      { status: 400 },
    );
  const membership = await requireCompanyMember(user.id, parsed.data.companyId);
  if (!membership) return forbidden();
  try {
    const description = await chat({
      task: 'writing',
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'Write a clear, inclusive job description for a hiring team in India. Do not add salary, benefits, company claims, requirements, or facts that the user did not supply. Use sections for role overview, responsibilities, required qualifications, and preferred qualifications. Do not rank or score candidates. Return plain text only.',
        },
        { role: 'user', content: JSON.stringify(parsed.data) },
      ],
    });
    if (description.trim().length < 80)
      return NextResponse.json({ error: 'ai_empty_result' }, { status: 502 });
    return NextResponse.json({ description });
  } catch {
    return NextResponse.json(
      {
        error: 'ai_unavailable',
        message: 'The description could not be generated right now. Your job draft is unchanged.',
      },
      { status: 502 },
    );
  }
}
