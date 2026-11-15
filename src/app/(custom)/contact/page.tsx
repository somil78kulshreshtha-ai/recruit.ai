// @polsia:user-owned
import type { Metadata } from 'next';
import { ContactForm } from '@/components/custom/contact-form';
import { T } from '@/i18n/t';

export const metadata: Metadata = {
  title: 'Contact RecruitAI',
  description: 'Send RecruitAI a message about roles, company access or support.',
};

export default function ContactPage() {
  return (
    <main className="mx-auto grid min-h-[75vh] max-w-6xl gap-10 px-5 py-16 md:grid-cols-[0.8fr_1.2fr] md:items-start md:py-24">
      <section className="pt-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          <T k="contactKicker" />
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          <T k="contactTitle" />
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          <T k="contactIntro" />
        </p>
        <p className="mt-8 text-sm text-muted-foreground">
          <T k="contactNote" />
        </p>
      </section>
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold">
          <T k="sendMessage" />
        </h2>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">
          <T k="contactSendIntro" />
        </p>
        <ContactForm />
      </section>
    </main>
  );
}
