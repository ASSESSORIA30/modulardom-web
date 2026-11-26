'use client';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { href, type Dictionary, type Locale } from '@/content/i18n';
import { COMPANY } from '@/content/site';

/*
  What the configurator is for: download the budget, or ask to see the show house.

  "Download budget" opens a short form (name, e-mail, phone; the rest optional), and only when the
  server has validated, priced, registered and stored the budget does the PDF arrive. If any step
  fails the visitor is told so, and trying again repeats nothing: each click carries its own id.
  What was typed stays for the session, so the visit button does not ask twice.

  After a download, the visitor gets a private link to come back to the same budget. The link
  carries a random token in the URL fragment, which browsers do not send to servers; no name,
  e-mail or phone is ever in an address.
*/

export type Mode = 'download' | 'visit' | null;
type Contact = { name: string; email: string; phone: string; city: string; plot: number | null; message: string };
type Result = { ref: string; reissued: boolean; token: string; days: string };
type Status = 'idle' | 'busy' | 'notSent' | 'noPrice' | 'error' | 'rate';
type VisitStatus = 'idle' | 'busy' | 'done' | 'again' | 'notSent' | 'error' | 'rate';

const EMPTY: Contact = { name: '', email: '', phone: '', city: '', plot: null, message: '' };
const STORE = 'md-contact';
const PLOT = ['yes', 'no', 'searching'] as const;

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function BudgetActions({
  dict, lang, payload, snapshot, canPrice, mode, setMode, token, setToken, onContact,
}: {
  dict: Dictionary; lang: Locale;
  /** the configuration as the server expects it */
  payload: () => { config: unknown; visual: unknown };
  snapshot: () => string | null;
  /** a budget is on screen: without it there is nothing to download */
  canPrice: boolean;
  mode: Mode; setMode: (m: Mode) => void;
  /** private link of the budget in hand (after a download or a recovery) */
  token: string | null; setToken: (t: string | null) => void;
  onContact?: (known: boolean) => void;
}) {
  const b = dict.budget;
  const f = dict.forms;
  const id = useId();
  const [c, setC] = useState<Contact>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<Result | null>(null);
  const [visit, setVisit] = useState<VisitStatus>('idle');
  const [copied, setCopied] = useState(false);
  const started = useRef(0);
  const website = useRef<HTMLInputElement>(null);
  const requestId = useRef<string | null>(null);
  const form = useRef<HTMLFormElement>(null);

  // what was typed earlier in this session
  useEffect(() => {
    started.current = Date.now();
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE) ?? 'null') as (Contact & { consent?: boolean }) | null;
      if (saved && typeof saved.name === 'string') {
        setC({ ...EMPTY, ...saved });
        setConsent(saved.consent === true);
      }
    } catch {
      /* a private window without storage: the form simply starts empty */
    }
  }, []);
  const remember = (next: Contact, ok = consent) => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ ...next, consent: ok }));
    } catch {
      /* see above */
    }
  };
  const set = (patch: Partial<Contact>) =>
    setC((v) => {
      const next = { ...v, ...patch };
      remember(next);
      return next;
    });

  useEffect(() => {
    if (mode) form.current?.querySelector<HTMLInputElement>('input[name=name]')?.focus({ preventScroll: true });
  }, [mode]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (c.name.trim().length < 2) e.name = f.required;
    if (!c.email.trim()) e.email = f.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = f.invalidEmail;
    if (c.phone.replace(/\D/g, '').length < 9) e.phone = c.phone.trim() ? f.invalidPhone : f.required;
    if (!consent) e.consent = f.needConsent;
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) form.current?.querySelector<HTMLElement>(`[name=${first}]`)?.focus();
    return !first;
  };
  const contactBody = () => ({
    lang, name: c.name.trim(), email: c.email.trim(), phone: c.phone.trim(), city: c.city.trim() || null,
    plot: c.plot === null ? null : PLOT[c.plot], message: c.message.trim() || null,
    consent: true, website: website.current?.value ?? '', startedAt: started.current, page: location.pathname,
  });

  const download = async () => {
    setStatus('busy');
    // the same id for every retry of this click; a new one once it has succeeded
    requestId.current ??= crypto.randomUUID();
    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contactBody(), ...payload(), image: snapshot(), requestId: requestId.current }),
      });
      if (res.status === 429) return setStatus('rate');
      if (res.ok && (res.headers.get('content-type') ?? '').startsWith('application/pdf')) {
        const ref = res.headers.get('X-Reference') ?? '';
        save(await res.blob(), `ModularDom-${ref || 'pressupost'}.pdf`);
        const t = res.headers.get('X-Recover') ?? '';
        requestId.current = null;
        setResult({ ref, reissued: res.headers.get('X-Reissued') === '1', token: t, days: res.headers.get('X-Recover-Days') ?? '' });
        if (t) setToken(t);
        onContact?.(true);
        setStatus('idle');
        return setMode(null);
      }
      const out = (await res.json().catch(() => ({}))) as { reason?: string; errors?: { field: string; code: string }[] };
      if (res.status === 422 && out.errors) {
        setErrors(Object.fromEntries(out.errors.map((x) => [x.field, x.field === 'consent' ? f.needConsent : x.code === 'invalid' ? (x.field === 'email' ? f.invalidEmail : f.invalidPhone) : f.required])));
        return setStatus('idle');
      }
      setStatus(out.reason === 'no_price' ? 'noPrice' : res.status === 202 ? 'notSent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  /** with a budget in hand the visit needs no form; without one, it is an ordinary visit request */
  const askVisit = async (withForm: boolean) => {
    setVisit('busy');
    try {
      const res = withForm
        ? await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'visit', ...contactBody(), ...payload() }) })
        : await fetch('/api/quote-visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
      if (res.status === 429) return setVisit('rate');
      const out = (await res.json().catch(() => ({}))) as { delivered?: boolean; duplicate?: boolean; errors?: { field: string }[] };
      if (res.status === 422 && out.errors) {
        setErrors(Object.fromEntries(out.errors.map((x) => [x.field, x.field === 'consent' ? f.needConsent : f.required])));
        return setVisit('idle');
      }
      if (out.delivered) {
        setVisit(out.duplicate ? 'again' : 'done');
        if (withForm) setMode(null);
        return;
      }
      setVisit(res.ok ? 'notSent' : 'error');
    } catch {
      setVisit('error');
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'busy' || visit === 'busy' || !validate()) return;
    if (mode === 'download') void download();
    else void askVisit(true);
  };
  const onVisitClick = () => {
    if (token) return void askVisit(false);
    setVisit('idle');
    setMode(mode === 'visit' ? null : 'visit');
  };

  const fill = (s: string) => s.replace('{email}', COMPANY.email).replace('{phone}', COMPANY.phoneLabel);
  const link = result?.token && typeof location !== 'undefined' ? `${location.origin}${href(lang, 'configurator')}#r=${result.token}` : '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* the link is on screen to be selected by hand */
    }
  };
  const busy = status === 'busy' || visit === 'busy';
  const failure = status === 'notSent' ? fill(f.notSent) : status === 'noPrice' ? fill(b.noPrice) : status === 'error' ? b.error : status === 'rate' ? f.rate : '';
  const visitMsg = visit === 'done' ? b.visitDone : visit === 'again' ? b.visitAgain : visit === 'notSent' ? fill(f.notSent) : visit === 'error' ? b.error : visit === 'rate' ? f.rate : '';

  const field = (name: 'name' | 'email' | 'phone' | 'city', type: string, auto: string, req: boolean, label: string, cls = '') => (
    <label className={`field ${cls}`}>
      <span>
        {label}
        {req ? <span aria-hidden="true"> *</span> : <span className="opacity-60"> ({b.optional})</span>}
      </span>
      <input
        name={name} type={type} autoComplete={auto} required={req} value={c[name]} onChange={(e) => set({ [name]: e.target.value })}
        aria-invalid={errors[name] ? true : undefined} aria-describedby={errors[name] ? `${id}-${name}-err` : undefined}
      />
      {errors[name] && (
        <span id={`${id}-${name}-err`} className="field-error">
          {errors[name]}
        </span>
      )}
    </label>
  );

  return (
    <div id="pressupost-accions" className="mt-8 scroll-mt-24">
      <div className="flex flex-wrap gap-3">
        <button type="button" data-testid="budget-download" onClick={() => { setStatus('idle'); setMode(mode === 'download' ? null : 'download'); }} disabled={!canPrice || busy} aria-expanded={mode === 'download'} className="btn btn-paper disabled:opacity-50">
          {status === 'busy' ? b.preparing : b.download}
        </button>
        <button type="button" data-testid="budget-visit" onClick={onVisitClick} disabled={busy || visit === 'done' || visit === 'again'} aria-expanded={mode === 'visit'} className="btn btn-line disabled:opacity-60">
          {visit === 'busy' ? b.sending : b.visit}
        </button>
      </div>
      <p role="status" className="t-note mt-3 max-w-[46ch] text-paper/85" data-testid="budget-visit-status">
        {visitMsg}
      </p>

      {mode && (
        <form ref={form} onSubmit={onSubmit} noValidate className="mt-4 grid content-start gap-x-8 gap-y-5 border-t border-paper/20 pt-6 md:grid-cols-2" data-testid="budget-form">
          <div className="md:col-span-2">
            <h3 className="t-serif text-[1.45rem] leading-tight">{mode === 'download' ? b.formTitle : b.visitTitle}</h3>
            <p className="mt-2 max-w-[44ch] text-[0.9375rem] text-paper/75">{mode === 'download' ? b.formText : b.visitText}</p>
          </div>
          {field('name', 'text', 'name', true, f.name, 'md:col-span-2')}
          {field('email', 'email', 'email', true, f.email)}
          {field('phone', 'tel', 'tel', true, f.phone)}
          {field('city', 'text', 'address-level2', false, b.city, 'md:col-span-2')}
          <fieldset className="md:col-span-2">
            <legend className="mb-2 text-[0.8125rem] opacity-75">
              {f.plot.label} <span className="opacity-60">({b.optional})</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {f.plot.options.map((o, i) => (
                <label key={o} className={`flex min-h-11 cursor-pointer items-center border px-3 text-[0.875rem] font-medium transition-colors duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${c.plot === i ? 'border-paper bg-paper text-ink' : 'border-paper/30 hover:border-paper'}`}>
                  <input type="checkbox" name="plotChoice" className="sr-only" checked={c.plot === i} onChange={() => set({ plot: c.plot === i ? null : i })} />
                  {o}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="field md:col-span-2">
            <span>
              {f.message} <span className="opacity-60">({b.optional})</span>
            </span>
            <textarea name="message" rows={2} maxLength={2000} value={c.message} onChange={(e) => set({ message: e.target.value })} />
          </label>
          {/* not for people: left empty by anyone who can see the form */}
          <div className="absolute -left-[200vw] h-0 w-0 overflow-hidden" aria-hidden="true">
            <label>
              Website
              <input ref={website} name="website" type="text" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem]">
              <input
                type="checkbox" name="consent" checked={consent} className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-gold-light)]"
                onChange={(e) => { setConsent(e.target.checked); remember(c, e.target.checked); }}
                aria-invalid={errors.consent ? true : undefined} aria-describedby={errors.consent ? `${id}-consent-err` : undefined}
              />
              <span>
                {f.consent}{' '}
                <Link href={href(lang, 'privacy')} target="_blank" className="underline underline-offset-4">
                  {f.privacy}
                </Link>
                . <span aria-hidden="true">*</span>
              </span>
            </label>
            {errors.consent && (
              <span id={`${id}-consent-err`} className="field-error mt-1 block">
                {errors.consent}
              </span>
            )}
            <p className="t-note mt-3 max-w-[52ch] text-paper/70">{b.privacyNote}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:col-span-2">
            <button type="submit" disabled={busy} className="btn btn-paper disabled:opacity-60" data-testid="budget-submit">
              {mode === 'download' ? (status === 'busy' ? b.preparing : b.submitDownload) : visit === 'busy' ? b.sending : b.submitVisit}
            </button>
            <button type="button" onClick={() => setMode(null)} className="link text-[0.9375rem]">
              {b.close}
            </button>
          </div>
        </form>
      )}
      <p role="alert" className="t-note mt-3 max-w-[46ch] text-paper/90" data-testid="budget-error">
        {failure}
      </p>

      {result && (
        <div className="mt-2 border-t border-paper/20 pt-5" data-testid="budget-done" aria-live="polite">
          <p className="t-serif text-[1.3rem] leading-snug">{(result.reissued ? b.reissued : b.done).replace('{ref}', result.ref)}</p>
          {link && (
            <div className="mt-4">
              <p className="text-[0.9375rem] font-medium">{b.recoverTitle}</p>
              <p className="t-note mt-1 max-w-[48ch] text-paper/70">{b.recoverText.replace('{days}', result.days)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label={b.recoverTitle} data-testid="budget-link" className="min-h-11 min-w-0 flex-1 border border-paper/30 bg-transparent px-3 text-[0.8125rem] text-paper/85" />
                <button type="button" onClick={copy} className="btn btn-sm btn-line">
                  {copied ? b.copied : b.copy}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
