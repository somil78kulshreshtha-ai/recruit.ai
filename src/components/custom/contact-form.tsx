// @polsia:user-owned
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api-client';

// Composes the template's base shadcn primitives (Button/Input/Label/Textarea)
// styled through the theme tokens. Restyle via the brand_tokens slot + cva
// variants, or pull more primitives with `npx shadcn add` and compose them.
export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [ok, setOk] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, message }),
      });
      setOk(true);
    } catch (err) {
      const cause = (
        err as { cause?: { errors?: { name?: string; email?: string; message?: string } } }
      ).cause;
      setErrors(cause?.errors ?? { message: 'Something went wrong. Please try again.' });
    } finally {
      setPending(false);
    }
  }

  if (ok) {
    return (
      <p className="py-4 text-center text-sm font-medium text-foreground">
        Thanks — we&apos;ll be in touch.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <Label htmlFor="contact-name">Name</Label>
      <Input
        id="contact-name"
        name="name"
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        aria-invalid={errors.name ? true : undefined}
      />
      {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
      <Label htmlFor="contact-email">Email address</Label>
      <Input
        id="contact-email"
        name="email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        aria-invalid={errors.email ? true : undefined}
      />
      {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
      <Label htmlFor="contact-message">Message</Label>
      <Textarea
        id="contact-message"
        name="message"
        placeholder="How can we help?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        aria-invalid={errors.message ? true : undefined}
      />
      {errors.message ? <p className="text-sm text-destructive">{errors.message}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
