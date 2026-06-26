type Role = 'USER' | 'EDITOR' | 'CAPTAIN' | 'ADMIN';

const canManageNews = (role: Role): boolean => role === 'ADMIN' || role === 'EDITOR';
const canManageTeam = (role: Role): boolean => role === 'ADMIN' || role === 'CAPTAIN';
const isAdmin = (role: Role): boolean => role === 'ADMIN';

describe('Role — права доступа', () => {
  describe('canManageNews', () => {
    it('ADMIN может', () => expect(canManageNews('ADMIN')).toBe(true));
    it('EDITOR может', () => expect(canManageNews('EDITOR')).toBe(true));
    it('USER не может', () => expect(canManageNews('USER')).toBe(false));
    it('CAPTAIN не может', () => expect(canManageNews('CAPTAIN')).toBe(false));
  });

  describe('canManageTeam', () => {
    it('ADMIN может', () => expect(canManageTeam('ADMIN')).toBe(true));
    it('CAPTAIN может', () => expect(canManageTeam('CAPTAIN')).toBe(true));
    it('USER не может', () => expect(canManageTeam('USER')).toBe(false));
    it('EDITOR не может', () => expect(canManageTeam('EDITOR')).toBe(false));
  });

  describe('isAdmin', () => {
    it('ADMIN — true', () => expect(isAdmin('ADMIN')).toBe(true));
    it('EDITOR — false', () => expect(isAdmin('EDITOR')).toBe(false));
    it('USER — false', () => expect(isAdmin('USER')).toBe(false));
  });
});
