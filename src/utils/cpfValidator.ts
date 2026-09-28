/**
 * Utilitários de Validação e Formatação para CPF e Telefone (Brasil)
 * Módulo 01 - Validação robusta de entrada conforme normas brasileiras (Volume 01-E02).
 */

export function stripNonDigits(val: string): string {
  return (val || '').replace(/\D/g, '');
}

/**
 * Validação algorítmica real do CPF (Módulo 11 com 2 dígitos verificadores).
 * Rejeita CPFs com todos os dígitos iguais e validações matemáticas incorretas.
 */
export function isValidCPF(cpfRaw: string): boolean {
  const cpf = stripNonDigits(cpfRaw);

  if (cpf.length !== 11) return false;

  // Rejeita sequências conhecidas de dígitos repetidos
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  let digit1 = rev >= 10 ? 0 : rev;
  if (digit1 !== parseInt(cpf.charAt(9), 10)) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  let digit2 = rev >= 10 ? 0 : rev;
  if (digit2 !== parseInt(cpf.charAt(10), 10)) return false;

  return true;
}

/**
 * Aplica máscara progressiva de CPF: 000.000.000-00
 */
export function formatCPF(value: string): string {
  const digits = stripNonDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Aplica máscara progressiva de telefone: (00) 0 0000-0000 ou (00) 0000-0000
 */
export function formatPhone(value: string): string {
  const digits = stripNonDigits(value).slice(0, 11);

  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    // Formato fixo: (00) 0000-0000
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Formato celular: (00) 0 0000-0000
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}
