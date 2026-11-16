// @polsia:user-owned

import 'server-only';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/business/recruitai-server';
import { prisma } from '@/lib/db';
import { sameOrigin } from '@/lib/same-origin';
import { UploadAuthorization } from '@/modules/file-upload/proxy';

/**
 * Decides whether the visitor behind `request` may upload files. Called first
 * by POST /api/upload (signed link and multipart fallback) and by
 * POST /api/upload/confirm; anything but `Allow` answers 401 `unauthorized`.
 *
 * The company API key only identifies the app, so this default denies every
 * upload. Rename `_request` to `request` and replace the body with one of:
 *
 *   // Signed-in users only (better-auth installed; import { auth } from '@/lib/auth'):
 *   const session = await auth.api.getSession({ headers: request.headers });
 *   return session?.user ? UploadAuthorization.Allow : UploadAuthorization.Deny;
 *
 *   // Anonymous uploads, only when the product explicitly wants them:
 *   return UploadAuthorization.Allow;
 */
export async function authorizeUpload(request: Request): Promise<UploadAuthorization> {
  if (!sameOrigin(request)) return UploadAuthorization.Deny;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || session.user.banned) return UploadAuthorization.Deny;
  const limited = await rateLimit(
    request,
    'private-resume-upload',
    session.user.id,
    8,
    10 * 60 * 1000,
  );
  if (limited) return UploadAuthorization.Deny;
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, isDemo: true },
  });
  if (!profile || profile.isDemo) return UploadAuthorization.Deny;

  const path = new URL(request.url).pathname;
  if (path === '/api/upload') {
    const allowedTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    const isAllowedResume = (filename: string, mimeType: string, size: number) => {
      const normalized = filename.toLocaleLowerCase();
      const extension = Object.keys(allowedTypes).find((item) => normalized.endsWith(item));
      return Boolean(
        extension &&
          allowedTypes[extension] === mimeType &&
          size > 0 &&
          size <= 5 * 1024 * 1024,
      );
    };

    if (request.headers.get('content-type')?.includes('application/json')) {
      const body: unknown = await request.clone().json().catch(() => null);
      if (!body || typeof body !== 'object') return UploadAuthorization.Deny;
      const payload = body as {
        filename?: unknown;
        mime_type?: unknown;
        size?: unknown;
        visibility?: unknown;
      };
      if (
        typeof payload.filename !== 'string' ||
        typeof payload.mime_type !== 'string' ||
        typeof payload.size !== 'number' ||
        payload.visibility !== 'private' ||
        !isAllowedResume(payload.filename, payload.mime_type, payload.size)
      )
        return UploadAuthorization.Deny;
    } else if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const form = await request.clone().formData().catch(() => null);
      const file = form?.get('file');
      if (
        !(file instanceof File) ||
        form?.get('visibility') !== 'private' ||
        !isAllowedResume(file.name, file.type, file.size)
      )
        return UploadAuthorization.Deny;
    } else {
      return UploadAuthorization.Deny;
    }
  }
  return UploadAuthorization.Allow;
}
