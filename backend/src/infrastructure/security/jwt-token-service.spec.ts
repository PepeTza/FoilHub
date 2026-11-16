import { JwtService } from '@nestjs/jwt';
import { BcryptPasswordHasher } from './bcrypt-password-hasher.js';
import { JwtTokenService, parseExpiresIn } from './jwt-token-service.js';

describe('parseExpiresIn', () => {
  it.each([
    [undefined, 3600],
    ['3600', 3600],
    ['30m', 1800],
    ['1h', 3600],
    ['7d', 604800],
    ['45s', 45],
  ])('%s → %d segundos', (raw, seconds) => {
    expect(parseExpiresIn(raw)).toBe(seconds);
  });

  it('rechaza formatos desconocidos', () => {
    expect(() => parseExpiresIn('una hora')).toThrow(/JWT_EXPIRES_IN/);
  });
});

describe('JwtTokenService', () => {
  const jwt = new JwtService({
    secret: 'test',
    signOptions: { expiresIn: 60, algorithm: 'HS256' },
  });
  const tokens = new JwtTokenService(jwt, 60);

  it('firma y verifica sub y username', async () => {
    const token = await tokens.sign({ sub: 'u1', username: 'ana' });
    await expect(tokens.verify(token)).resolves.toEqual({
      sub: 'u1',
      username: 'ana',
    });
  });

  it('rechaza un token firmado con otro secreto', async () => {
    const other = await new JwtService({ secret: 'otro' }).signAsync({
      sub: 'u1',
      username: 'ana',
    });
    await expect(tokens.verify(other)).rejects.toThrow();
  });

  it('rechaza un token vencido', async () => {
    const expired = await jwt.signAsync(
      { sub: 'u1', username: 'ana' },
      { expiresIn: -10 },
    );
    await expect(tokens.verify(expired)).rejects.toThrow();
  });

  it('rechaza un token sin username', async () => {
    await expect(
      tokens.verify(await jwt.signAsync({ sub: 'u1' })),
    ).rejects.toThrow(/sub\/username/);
  });
});

describe('BcryptPasswordHasher', () => {
  it('verifica la contraseña correcta y rechaza otra', async () => {
    const hasher = new BcryptPasswordHasher(4); // costo bajo solo para que el test sea rápido
    const hash = await hasher.hash('secreta123');

    expect(hash).not.toContain('secreta123');
    expect(await hasher.verify('secreta123', hash)).toBe(true);
    expect(await hasher.verify('otra', hash)).toBe(false);
  });

  it('usa costo 12 por defecto', async () => {
    expect(await new BcryptPasswordHasher().hash('x')).toMatch(
      /^\$2[aby]\$12\$/,
    );
  });
});
