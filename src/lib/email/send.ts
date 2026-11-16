// @polsia:user-owned — email transport rewritten to use Resend (https://resend.com) instead of the
// Polsia email proxy. Same exports as before, so every caller keeps working unchanged.
//
// Server-only. Environment variables (set them in Render → Environment):
//   RESEND_API_KEY  — your Resend API key (starts with "re_"). Required.
//   EMAIL_FROM      — sender, e.g. "RecruitAI <hello@yourdomain.com>". Optional. Until you verify a
//                     domain in Resend it defaults to "RecruitAI <onboarding@resend.dev>", which can
//                     only send to the email address you used to sign up at Resend.

import 'server-only';
import { env } from '@/lib/env';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  // Kept for compatibility with older callers. Resend does not use it.
  replyToEmailId?: string;
}

export interface SendEmailResult {
  // Resend's message id. Callers treat an empty id as "not delivered".
  id: string;
}

/**
 * Kept because ./submissions imports it. It only matters for the Polsia dashboard; the contact
 * form skips that path when POLSIA_API_KEY is not set (see submissions.ts).
 */
export function proxyBaseUrl(): string {
  return env.POLSIA_EMAIL_PROXY_URL.replace(/\/+$/, '').replace(/\/send$/, '');
}

const DEFAULT_FROM = 'RecruitAI <onboarding@resend.dev>';

export async function sendEmail(
  input: SendEmailInput,
  options?: { signal?: AbortSignal },
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Email is not configured: RESEND_API_KEY is missing.');

  const text =
    input.text ??
    input.html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: options?.signal
      ? AbortSignal.any([options.signal, AbortSignal.timeout(20_000)])
      : AbortSignal.timeout(20_000),
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend send failed: ${res.status} ${detail}`.trim());
  }

  const json = (await res.json()) as { id?: string };
  return { id: json.id ?? '' };
}
