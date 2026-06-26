import bcrypt from 'bcryptjs';

describe('Auth — хэширование паролей', () => {
  it('должен создать хэш и проверить пароль', async () => {
    const password = '123456';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it('должен отклонить неверный пароль', async () => {
    const hash = await bcrypt.hash('123456', 10);
    const isValid = await bcrypt.compare('wrong', hash);
    expect(isValid).toBe(false);
  });

  it('разные пароли — разные хэши', async () => {
    const hash1 = await bcrypt.hash('123456', 10);
    const hash2 = await bcrypt.hash('123456', 10);
    expect(hash1).not.toBe(hash2);
  });

  it('пустая строка не падает (bcrypt так работает)', async () => {
    const hash = await bcrypt.hash('', 10);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });
});

describe('Auth — валидация', () => {
  const isValidUsername = (u: unknown): boolean => typeof u === 'string' && u.length >= 3;
  const isValidPassword = (p: unknown): boolean => typeof p === 'string' && p.length >= 6;

  it('username минимум 3 символа', () => {
    expect(isValidUsername('admin')).toBe(true);
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('')).toBe(false);
  });

  it('password минимум 6 символов', () => {
    expect(isValidPassword('123456')).toBe(true);
    expect(isValidPassword('12345')).toBe(false);
  });
});
