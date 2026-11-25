/*
  Switches for everything that waits on the client. Nothing here is live until it is turned on.
*/

/** Commercial claim in the hero. Off until the commercial conditions are validated. */
export const PRICE_CLAIM = { enabled: false, amount: '993', unit: '€/m²' };

/** The original logotype. Put the file in public/brand/ and set its path; until then the name is set in type. */
export const LOGO: { src: string | null; width: number; height: number } = { src: null, width: 168, height: 28 };

/** WhatsApp button in the closing. Needs a verified number in international format, digits only. */
export const WHATSAPP: { enabled: boolean; number: string | null } = { enabled: false, number: null };

/** Lead forms post here once the CRM is connected (see src/lib/crm.ts). */
export const CRM: { enabled: boolean; endpoint: string | null } = { enabled: false, endpoint: null };

/*
  The closing picture. `03-mansio-nocturna.png` is still not in the repository, so a frame of the
  exterior stands in, graded towards night in CSS. To use the real picture: save it as
  public/stills/closing.webp (about 2560 px wide) and set { still: 'closing', standIn: false }.
*/
export const CLOSING = { still: 'closing-standin', standIn: true };
