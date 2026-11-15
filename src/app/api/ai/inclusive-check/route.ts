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
import { sameOrigin } from '@/lib/same-origin';

const inputSchema = z.object({
  companyId: z.string().cuid(),
  description: z.string().trim().min(80).max(12000),
});
const outputSchema = z.object({
  issues: z
    .array(z.object({ phrase: z.string(), suggestion: z.string(), reason: z.string() }))
    .max(12),
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) return forbidden();
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const limited = await rateLimit(request, 'ai-inclusive-language', user.id, 12);
  if (limited) return limited;
  const body: unknown = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { errors: { description: 'Add a job description of at least 80 characters.' } },
      { status: 400 },
    );
  const membership = await requireCompanyMember(user.id, parsed.data.companyId);
  if (!membership) return forbidden();
  try {
    const result = outputSchema.parse(
      await generateObject({
        task: 'classification',
        messages: [
          {
            role: 'system',
            content:
              'Review only the supplied job description for language that could exclude qualified applicants based on gender, age, disability, caregiving status, caste, religion, or background. Return JSON with an issues array; each item has phrase, suggestion, reason. Return an empty array if no specific concern is present. Do not invent legal conclusions, candidate scores, or automated hiring decisions.',
          },
          { role: 'user', content: parsed.data.description },
        ],
      }),
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'ai_unavailable', message: 'The language check could not be completed right now.' },
      { status: 502 },
    );
  }
}
