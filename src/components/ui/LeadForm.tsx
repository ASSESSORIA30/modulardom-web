'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { href, type Dictionary, type Locale } from '@/content/i18n';
import { COMPANY } from '@/content/site';

/*
  The one form behind every request on the site (information, budget, show-house visit, MINERAL).

  It checks the fields here for the visitor's sake and the server checks them again for everyone
  else's. It carries a consent box, a field no person fills and the time the form was opened
  (the server's spam checks), and it tells the truth about what happened: "received" appears
  only when the server confirms the CRM took the request. While that integration is off, the
  visitor is told nothing was sent and given the e-mail and the phone instead.
*/

type Optional = 'phone' | 'city' | 'company' | 'plot' | 'message';
type Props = {
  kind: 'info' | 'quote' | 'visit' | 'mineral';
  dict: Dictionary;
  lang: Locale;
  /** which optional fields to show; `required` makes some of them compulsory */
  fields: Optional[];
  required?: Optional[];
  /** values that are not typed into this form: the configuration, the units… */
  extra?: () => Record<string, unknown>;
  submit: string;
  buttonClass: string;
  chipOn: string;
  chipOff: string;
  className?: string;
  children?: React.ReactNode;
};

type Status = { kind: 'idle' | 'sending' } | { kind: 'sent'; ref: string } | { kind: 'notSent' | 'error' | 'rate' };

export function LeadForm({ kind, dict, lang, fields, required = [], extra, submit, buttonClass, chipOn, chipOff, className, children }: Props) {
  const f = dict.forms;
  const started = useRef(Date.now());
  const [plot, setPlot] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const id = `lf-${kind}`;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const get = (k: string) => String(data.get(k) ?? '').trim();
    const bad: Record<string, string> = {};
    if (get('name').length < 2) bad.name = f.required;
    if (!get('email')) bad.email = f.required;
    else if (!/^\S+@\S+\.\S{2,}$/.test(get('email'))) bad.email = f.invalidEmail;
    const digits = get('phone').replace(/\D/g, '').length;
    if (fields.includes('phone') && ((required.includes('phone') && !digits) || (digits > 0 && digits < 9))) bad.phone = digits ? f.invalidPhone : f.required;
    for (const k of ['city', 'company'] as const) if (required.includes(k) && !get(k)) bad[k] = f.required;
    if (!data.get('consent')) bad.consent = f.needConsent;
    setErrors(bad);
    const first = Object.keys(bad)[0];
    if (first) {
      (form.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    setStatus({ kind: 'sending' });
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind, lang,
          name: get('name'), email: get('email'), phone: get('phone') || null, city: get('city') || null, company: get('company') || null,
          plot: plot === null ? null : (['yes', 'no', 'searching'] as const)[plot], plotNote: get('plotNote') || null, message: get('message') || null,
          consent: true, website: get('website'), startedAt: started.current, page: location.pathname,
          ...(extra?.() ?? {}),
        }),
      });
      if (res.status === 429) return setStatus({ kind: 'rate' });
      const out = (await res.json().catch(() => ({}))) as { delivered?: boolean; reference?: string; errors?: { field: string }[] };
      if (res.status === 422 && out.errors) {
        setErrors(Object.fromEntries(out.errors.map((x) => [x.field, x.field === 'consent' ? f.needConsent : f.required])));
        return setStatus({ kind: 'idle' });
      }
      if (out.delivered && out.reference) {
        form.reset();
        setPlot(null);
        return setStatus({ kind: 'sent', ref: out.reference });
      }
      setStatus({ kind: res.ok ? 'notSent' : 'error' });
    } catch {
      setStatus({ kind: 'error' });
    }
  };

  const fill = (s: string) => s.replace('{email}', COMPANY.email).replace('{phone}', COMPANY.phoneLabel);
  const message =
    status.kind === 'sent' ? f.sent.replace('{ref}', status.ref) : status.kind === 'notSent' ? fill(f.notSent) : status.kind === 'error' ? fill(f.error) : status.kind === 'rate' ? f.rate : '';

  const input = (name: 'name' | 'email' | 'phone' | 'city' | 'company', type: string, auto: string, req: boolean, span = '') => (
    <label key={name} className={`field ${span}`}>
      <span>
        {f[name]}
        {req && <span aria-hidden="true"> *</span>}
      </span>
      <input name={name} type={type} autoComplete={auto} required={req} aria-invalid={errors[name] ? true : undefined} aria-describedby={errors[name] ? `${id}-${name}-err` : undefined} />
      {errors[name] && (
        <span id={`${id}-${name}-err`} className="field-error">
          {errors[name]}
        </span>
      )}
    </label>
  );

  return (
    <form onSubmit={onSubmit} noValidate className={`grid content-start gap-x-8 gap-y-6 md:grid-cols-2 ${className ?? ''}`}>
      {children}
      {input('name', 'text', 'name', true, fields.includes('company') ? '' : 'md:col-span-2')}
      {fields.includes('company') && input('company', 'text', 'organization', required.includes('company'))}
      {input('email', 'email', 'email', true)}
      {fields.includes('phone') && input('phone', 'tel', 'tel', required.includes('phone'))}
      {fields.includes('city') && input('city', 'text', 'address-level2', required.includes('city'), fields.includes('plot') ? '' : 'md:col-span-2')}
      {fields.includes('plot') && (
        <fieldset>
          <legend className="mb-2 text-[0.8125rem] opacity-75">{f.plot.label}</legend>
          <div className="flex flex-wrap gap-2">
            {f.plot.options.map((o, i) => (
              <label key={o} className={`flex min-h-11 cursor-pointer items-center border px-3 text-[0.875rem] font-medium transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${plot === i ? chipOn : chipOff}`}>
                <input type="radio" name="plotChoice" className="sr-only" checked={plot === i} onChange={() => setPlot(i)} />
                {o}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {fields.includes('plot') && plot === 0 && (
        <label className="field md:col-span-2">
          <span>{f.plotNote}</span>
          <input name="plotNote" type="text" autoComplete="off" />
        </label>
      )}
      {fields.includes('message') && (
        <label className="field md:col-span-2">
          <span>{f.message}</span>
          <textarea name="message" rows={3} />
        </label>
      )}
      {/* not for people: left empty by anyone who can see the form */}
      <div className="absolute -left-[200vw] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="md:col-span-2">
        <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem]">
          <input name="consent" type="checkbox" required aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? `${id}-consent-err` : undefined} className="mt-0.5 h-5 w-5 shrink-0 accent-current" />
          <span>
            {f.consent}{' '}
            <Link href={href(lang, 'privacy')} className="underline underline-offset-4">
              {f.privacy}
            </Link>
            . <span aria-hidden="true">*</span>
          </span>
        </label>
        {errors.consent && (
          <p id={`${id}-consent-err`} className="field-error mt-1">
            {errors.consent}
          </p>
        )}
        <p className="mt-3 max-w-[52ch] text-xs leading-relaxed opacity-75">{f.privacyInfo}</p>
        <button type="submit" disabled={status.kind === 'sending'} className={`${buttonClass} mt-6 disabled:opacity-60`}>
          {status.kind === 'sending' ? f.sending : submit}
        </button>
        <p role="status" className={`mt-4 max-w-[52ch] text-[0.9375rem] ${status.kind === 'sent' ? 'font-medium' : 'opacity-90'}`}>
          {message}
        </p>
      </div>
    </form>
  );
}
