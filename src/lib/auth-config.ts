// @polsia:user-owned — configure better-auth here (spread into betterAuth() by @/lib/auth).
// Add emailAndPassword options, plugins, session, socialProviders, databaseHooks, etc.
// Framework owns db/secret/baseURL/admin(), verified-owner bootstrap, and disables
// session cookie caching so verification/role changes appear on the next session read.
// Verification delivery through the email module and sendOnSignUp are provided
// by auth.ts. Override emailVerification here only for intentional customization.
// The supplied profile and admin screens expose a resend button. Email/password
// owners receive admin access only after following their verification link.
// A verified social-provider email can also bootstrap the owner.
//
// Welcome email / signup side-effect (runs alongside the owner-admin grant — install `email`):
//   import { sendEmail } from '@/lib/email/send';
//   databaseHooks: { user: { create: { after: async (user) => {
//     await sendEmail({ to: user.email, subject: 'Welcome', html: '<p>Welcome!</p>' }).catch(() => {});
//   } } } },
// Add a plugin: `plugins: [organization()]` (admin() is added for you).
//
// Per-user fields (a `username`, profile, prefs): don't add a column to `User` (auth.prisma
// is locked) or use `user.additionalFields` (needs that locked column). Make a user-owned
// `prisma/schema/profile.prisma` (model UserProfile { userId String @unique /* fields */ },
// scalar userId) and create the row at signup:
//   import { prisma } from '@/lib/db';
//   databaseHooks: { user: { create: { after: async (user) => {
//     await prisma.userProfile.create({ data: { userId: user.id } }).catch(() => {});
//   } } } },

import type { BetterAuthOptions } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
import { sendEmail } from '@/lib/email/send';

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ??
      character,
  );
}

export const authConfig: BetterAuthOptions = {
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      const result = await sendEmail({
        to: user.email,
        subject: 'Reset your RecruitAI password',
        text: `Reset your password: ${url}`,
        html: `<p><a href="${escapeHtml(url)}">Reset your RecruitAI password</a></p>`,
      });
      if (!result.id) throw new Error('Password reset email could not be delivered');
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      storeOTP: 'hashed',
      sendVerificationOTP: async ({ email, otp, type }) => {
        const purpose =
          type === 'sign-in'
            ? 'sign in'
            : type === 'forget-password'
              ? 'reset your password'
              : 'verify your email';
        const safeOtp = escapeHtml(otp);
        const result = await sendEmail({
          to: email,
          subject: `Your RecruitAI code to ${purpose}`,
          text: `Your RecruitAI code is ${otp}. It expires in five minutes. If you did not request it, ignore this email.`,
          html: `<p>Your RecruitAI code to ${purpose} is <strong>${safeOtp}</strong>.</p><p>It expires in five minutes. If you did not request it, ignore this email.</p>`,
        });
        if (!result.id) throw new Error('Email code could not be delivered');
      },
    }),
  ],
};
