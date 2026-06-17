import DOMPurify from 'dompurify';

// Allow only the formatting tags the RichTextEditor can produce.
// Strips scripts, event handlers, iframes, etc. to prevent stored XSS in chat messages.
const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 's', 'br', 'p', 'ul', 'ol', 'li', 'a', 'span', 'div'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

export const sanitizeHtml = (dirty) => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
};

export default sanitizeHtml;
