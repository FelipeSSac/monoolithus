const WHATSAPP_MESSAGE = "Olá! Quero começar um projeto."

/** Personal WhatsApp number, digits only (country + area + number). */
export const WHATSAPP_NUMBER = "5512991256102"

/** Display form used in contact surfaces. */
export const WHATSAPP_DISPLAY = "+55 12 99125-6102"

/** wa.me deep link with a pre-filled message. Single source for every CTA. */
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE,
)}`
