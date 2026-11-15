// @polsia:user-owned
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api-client';
import { useLocale } from '@/i18n/client-locale';

// Composes the template's base shadcn primitives (Button/Input/Label/Textarea)
// styled through the theme tokens. Restyle via the brand_tokens slot + cva
// variants, or pull more primitives with `npx shadcn add` and compose them.
export function ContactForm() {
  const { t } = useLocale();
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
      setErrors(cause?.errors ?? { message: t('error') });
    } finally {
      setPending(false);
    }
  }

  if (ok) {
    return (
      <p className="py-4 text-center text-sm font-medium text-foreground">
        {t('contactThanks')}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
      <Label htmlFor="contact-name">{t('nameLabel')}</Label>
      <Input
        id="contact-name"
        name="name"
        type="text"
        placeholder={t('placeholderName')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        aria-invalid={errors.name ? true : undefined}
      />
      {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
      <Label htmlFor="contact-email">{t('emailAddress')}</Label>
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
      <Label htmlFor="contact-message">{t('messageLabel')}</Label>
      <Textarea
        id="contact-message"
        name="message"
        placeholder={t('placeholderHelp')}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        aria-invalid={errors.message ? true : undefined}
      />
      {errors.message ? <p className="text-sm text-destructive">{errors.message}</p> : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t('sendingEllipsis') : t('sendMessage')}
      </Button>
    </form>
  );
}
