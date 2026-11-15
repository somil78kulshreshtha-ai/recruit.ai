// @polsia:user-owned

import 'server-only';
import { auth } from '@/lib/auth';
import { hasAdminRole, requireCompanyMember } from '@/lib/business/recruitai-server';
import { prisma } from '@/lib/db';
import { DownloadAuthorization } from '@/modules/file-upload/proxy';

/**
 * Decides whether the visitor behind `request` may read the private file
 * `key`. Called first by GET /api/files/<key> (what `fileUrl(key)` renders);
 * anything but `Allow` answers 404, like an unknown file.
 *
 * The company API key only identifies the app, so this default denies every
 * download. Rename `_request`/`_key` and check that the file row belongs to
 * the session user, e.g. with better-auth and a `Document` model holding the key
 * (import { auth } from '@/lib/auth'; import { prisma } from '@/lib/db'):
 *
 *   const session = await auth.api.getSession({ headers: request.headers });
 *   if (!session?.user) {
 *     return DownloadAuthorization.Deny;
 *   }
 *   const owned = await prisma.document.findFirst({
 *     where: { fileKey: key, userId: session.user.id },
 *     select: { id: true },
 *   });
 *   return owned ? DownloadAuthorization.Allow : DownloadAuthorization.Deny;
 *
 * Make that column unique (`fileKey String @unique`): the client sends the
 * key, so without it a signed-in user could save another account's key on
 * their own row and pass this check.
 */
export async function authorizeDownload(
  request: Request,
  key: string,
): Promise<DownloadAuthorization> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || session.user.banned || !session.user.emailVerified)
    return DownloadAuthorization.Deny;
  const resume = await prisma.resume.findUnique({
    where: { fileKey: key },
    include: { profile: { select: { userId: true } } },
  });
  if (!resume) return DownloadAuthorization.Deny;
  if (resume.profile.userId === session.user.id) return DownloadAuthorization.Allow;
  if (hasAdminRole(session.user.role ?? 'user')) return DownloadAuthorization.Allow;

  const applications = await prisma.application.findMany({
    where: {
      resumeId: resume.id,
      isDemo: false,
      job: { isDemo: false },
    },
    select: { job: { select: { companyId: true } } },
  });
  for (const application of applications) {
    const membership = await requireCompanyMember(session.user.id, application.job.companyId);
    if (membership) return DownloadAuthorization.Allow;
  }
  return DownloadAuthorization.Deny;
}
