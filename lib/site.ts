const WHATSAPP_MESSAGE = "Olá! Quero começar um projeto."

/** Personal WhatsApp number, digits only (country + area + number). */
export const WHATSAPP_NUMBER = "5512992337325"

/** Display form used in contact surfaces. */
export const WHATSAPP_DISPLAY = "+55 12 99233-7325"

/** wa.me deep link with a pre-filled message. Single source for every CTA. */
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE,
)}`
