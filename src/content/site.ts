/*
  Company data and the switches for everything that waits on the client.
  Nothing here is live until it is turned on.
*/

/**
 * As published on www.modulardom.com (read on the day V4 was built). The street address is not
 * published there; only the town of the show house.
 */
export const COMPANY = {
  legalName: 'MODULARDOM OBRAS Y REFORMAS, S.L.',
  taxId: 'B26624072',
  email: 'info@modulardom.com',
  phone: '+34684784887',
  phoneLabel: '684 784 887',
  region: 'Lleida',
  showHouse: 'Bellvís (Lleida)',
};

/** Commercial claim in the hero. Off until the commercial conditions are validated. */
export const PRICE_CLAIM = { enabled: false, amount: '993', unit: '€/m²' };

/*
  Budgets in the configurator are switched on the server, not here: see src/server/env.ts
  (CRM_TARIFF_URL and PRICING_PUBLIC). Nothing about prices lives in code the browser receives.
*/

/**
 * The logotype. The only file ModularDom publishes is a 200 px PNG (public/brand/modulardom-200.png),
 * used for the browser icon and the footer. For the header, put the original vector file in
 * public/brand/ and set its path here; until then the name is set in type.
 */
export const LOGO: { src: string | null; width: number; height: number; badge: string } = { src: null, width: 168, height: 28, badge: '/brand/modulardom-200.png' };

/** WhatsApp button. The number is the one on modulardom.com; the button stays off until ModularDom authorises it. */
export const WHATSAPP: { enabled: boolean; number: string | null } = { enabled: false, number: '34684784887' };

/**
 * The clients' area is the CRM's own portal (it already has its login and roles): the site only
 * links to it. Off until ModularDom confirms the address and that clients have their access.
 */
export const CLIENT_AREA: { enabled: boolean; url: string } = { enabled: false, url: 'https://crmmodulardom.vercel.app/portal' };

/** a wa.me link that opens with a message fitting where the visitor is */
export const waHref = (message: string) => (WHATSAPP.enabled && WHATSAPP.number ? `https://wa.me/${WHATSAPP.number}?text=${encodeURIComponent(message)}` : null);

/*
  The closing picture. `03-mansio-nocturna.png` is still not in the repository, so a frame of the
  exterior stands in, graded towards night in CSS. To use the real picture: save it as
  public/stills/closing.webp (about 2560 px wide) and set { still: 'closing', standIn: false }.
*/
export const CLOSING = { still: 'closing-standin', standIn: true };
