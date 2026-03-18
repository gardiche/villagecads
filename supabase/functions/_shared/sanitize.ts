/**
 * Sanitize user input before injecting into AI prompts.
 * Prevents prompt injection attacks.
 */
export function sanitizeForPrompt(value: string, maxLength: number = 2000): string {
  if (!value || typeof value !== 'string') return '';
  
  let sanitized = value.slice(0, maxLength);
  
  // Remove dangerous sequences
  const dangerousPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/gi,
    /system\s+prompt/gi,
    /###\s*(system|instruction|prompt)/gi,
    /<\/?script[^>]*>/gi,
    /<\/?iframe[^>]*>/gi,
    /\[SYSTEM\]/gi,
    /\[INST\]/gi,
    /<<SYS>>/gi,
    /<\/SYS>/gi,
  ];
  
  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '[FILTRÉ]');
  }
  
  return sanitized;
}

/**
 * Wrap user input with explicit delimiters for AI prompts.
 */
export function wrapUserInput(label: string, value: string, maxLength: number = 2000): string {
  const sanitized = sanitizeForPrompt(value, maxLength);
  if (!sanitized) return '';
  return `[DEBUT_${label}]${sanitized}[FIN_${label}]`;
}

/**
 * Escape HTML entities to prevent XSS in email templates.
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
