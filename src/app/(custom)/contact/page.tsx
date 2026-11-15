// @polsia:user-owned
import type { Metadata } from 'next';
import { ContactForm } from '@/components/custom/contact-form';

export const metadata: Metadata = {
  title: 'Contact RecruitAI',
  description: 'Send RecruitAI a message about roles, company access or support.',
};

export default function ContactPage() {
  return (
    <main className="mx-auto grid min-h-[75vh] max-w-6xl gap-10 px-5 py-16 md:grid-cols-[0.8fr_1.2fr] md:items-start md:py-24">
      <section className="pt-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          RecruitAI support
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Let’s make the next step clear.
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Ask us about job seeker access, a company workspace, a role or platform support.
        </p>
        <p className="mt-8 text-sm text-muted-foreground">
          Use the form to send a message to the RecruitAI team.
        </p>
      </section>
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold">Send a message</h2>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">
          Your message is sent to the RecruitAI team.
        </p>
        <ContactForm />
      </section>
    </main>
  );
}
