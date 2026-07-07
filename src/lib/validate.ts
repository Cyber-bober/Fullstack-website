// src/lib/validate.ts

// Проверка на SQL Injection
export function hasSqlInjection(input: string): boolean {
  if (!input) return false;
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /(--|\/\*|\*\/|;|')/i,
    /(\b(CHAR|VARCHAR|INT|INTEGER|FLOAT|DECIMAL|DATE|DATETIME|TIMESTAMP)\b)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

// Проверка на XSS
export function hasXSS(input: string): boolean {
  if (!input) return false;
  
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onload, onerror и т.д.
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<link\b[^>]*>/gi,
    /<meta\b[^>]*>/gi,
    /data:text\/html/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

// Валидация длины строки
export function validateLength(
  input: string, 
  minLength: number, 
  maxLength: number, 
  fieldName: string
): string | null {
  if (!input || input.length < minLength) {
    return `${fieldName} должен быть не менее ${minLength} символов`;
  }
  if (input.length > maxLength) {
    return `${fieldName} должен быть не более ${maxLength} символов`;
  }
  return null;
}

// Проверка размера payload
export function validatePayloadSize(req: Request, maxSizeMB: number = 10): string | null {
  const contentLength = req.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength);
    if (size > maxSizeMB * 1024 * 1024) {
      return `Payload слишком большой (максимум ${maxSizeMB}MB)`;
    }
  }
  return null;
}