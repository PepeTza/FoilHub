import {
  FakePasswordHasher,
  FakeTokenService,
  FixedClock,
  InMemoryUserRepository,
  SequentialIdGenerator,
} from '../../../../test/fakes/index.js';
import {
  InvalidCredentialsError,
  InvalidUsernameError,
  UserNotFoundError,
  UsernameTakenError,
  WeakPasswordError,
} from '../../../domain/errors/domain-errors.js';
import { Username } from '../../../domain/value-objects/username.vo.js';
import { GetCurrentUserUseCase } from './get-current-user.use-case.js';
import { LoginUserUseCase } from './login-user.use-case.js';
import { RegisterUserUseCase } from './register-user.use-case.js';

function setup() {
  const users = new InMemoryUserRepository();
  const hasher = new FakePasswordHasher();
  const tokens = new FakeTokenService();
  const clock = new FixedClock();
  return {
    users,
    clock,
    register: new RegisterUserUseCase(
      users,
      hasher,
      new SequentialIdGenerator('user'),
      clock,
    ),
    login: new LoginUserUseCase(users, hasher, tokens),
    me: new GetCurrentUserUseCase(users),
  };
}

describe('RegisterUserUseCase', () => {
  it('registra al usuario con la contraseña hasheada y el username en minúsculas', async () => {
    const { register, users, clock } = setup();

    const result = await register.execute({
      username: 'Ana',
      password: 'secreta123',
      contactInfo: ' ana#1 ',
    });

    expect(result).toEqual({ id: 'user-1', username: 'ana' });
    const stored = await users.findByUsername(Username.create('ana'));
    expect(stored?.passwordHash).toBe('hashed:secreta123');
    expect(stored?.contactInfo).toBe('ana#1');
    expect(stored?.createdAt).toEqual(clock.now());
  });

  it('contactInfo es opcional', async () => {
    const { register, me } = setup();
    const { id } = await register.execute({
      username: 'ana',
      password: 'secreta123',
    });

    expect((await me.execute({ userId: id })).contactInfo).toBeNull();
  });

  it('rechaza un username repetido sin distinguir mayúsculas', async () => {
    const { register } = setup();
    await register.execute({ username: 'ana', password: 'secreta123' });

    await expect(
      register.execute({ username: 'ANA', password: 'otra12345' }),
    ).rejects.toThrow(UsernameTakenError);
  });

  it('rechaza una contraseña débil', async () => {
    await expect(
      setup().register.execute({ username: 'ana', password: 'corta' }),
    ).rejects.toThrow(WeakPasswordError);
  });

  it('rechaza un username inválido', async () => {
    await expect(
      setup().register.execute({ username: 'a b', password: 'secreta123' }),
    ).rejects.toThrow(InvalidUsernameError);
  });

  it('no guarda nada si la validación falla', async () => {
    const { register, users } = setup();
    await register
      .execute({ username: 'ana', password: 'corta' })
      .catch(() => undefined);

    expect(await users.findByUsername(Username.create('ana'))).toBeNull();
  });
});

describe('LoginUserUseCase', () => {
  async function withAna() {
    const ctx = setup();
    await ctx.register.execute({ username: 'ana', password: 'secreta123' });
    return ctx;
  }

  it('devuelve un token y el usuario con credenciales correctas', async () => {
    const { login } = await withAna();

    await expect(
      login.execute({ username: 'ANA', password: 'secreta123' }),
    ).resolves.toEqual({
      accessToken: 'token:user-1:ana',
      user: { id: 'user-1', username: 'ana' },
    });
  });

  it.each([
    ['usuario inexistente', 'beto', 'secreta123'],
    ['clave incorrecta', 'ana', 'incorrecta'],
    ['username mal formado', 'a b', 'secreta123'],
  ])(
    '%s → el mismo InvalidCredentialsError',
    async (_case, username, password) => {
      const { login } = await withAna();

      const error = await login
        .execute({ username, password })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(InvalidCredentialsError);
      expect(error).toMatchObject({
        code: 'INVALID_CREDENTIALS',
        message: 'Usuario o contraseña incorrectos',
      });
    },
  );
});

describe('GetCurrentUserUseCase', () => {
  it('devuelve el usuario del token', async () => {
    const { register, me } = setup();
    const { id } = await register.execute({
      username: 'ana',
      password: 'secreta123',
      contactInfo: 'ana#1',
    });

    await expect(me.execute({ userId: id })).resolves.toEqual({
      id,
      username: 'ana',
      contactInfo: 'ana#1',
    });
  });

  it('falla si el usuario ya no existe', async () => {
    await expect(setup().me.execute({ userId: 'nadie' })).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
