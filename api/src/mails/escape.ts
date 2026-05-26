import sanitizeHtml from 'sanitize-html'

// HTML-escape policy: every tag is escaped to entities. Used by textToSafeHtml
// to turn caller-supplied plain text into safe-to-substitute HTML.
const textToSafeHtmlOptions: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'escape'
}

// HTML sanitization policy: conservative allow-list, http/https/mailto hrefs
// only. Used by sanitizeMailHtml on caller-supplied html for /api/mails.
const sanitizeMailHtmlOptions: sanitizeHtml.IOptions = {
  allowedTags: ['a', 'b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  allowedAttributes: {
    a: ['href'],
    '*': ['style']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false
}

export const textToSafeHtml = (text: string) =>
  sanitizeHtml(text, textToSafeHtmlOptions).replace(/\r?\n/g, '<br>')

export const sanitizeMailHtml = (html: string) =>
  sanitizeHtml(html, sanitizeMailHtmlOptions)
