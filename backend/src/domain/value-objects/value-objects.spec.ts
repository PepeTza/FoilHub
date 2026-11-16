import {
  InvalidCardCodeError,
  InvalidQuantityError,
  InvalidUsernameError,
  WeakPasswordError,
} from '../errors/domain-errors.js';
import { CardCode } from './card-code.vo.js';
import { PlainPassword } from './plain-password.vo.js';
import { Quantity } from './quantity.vo.js';
import { Username } from './username.vo.js';

describe('Username', () => {
  it.each(['abc', 'Ana_123', 'a'.repeat(20), '___'])('acepta "%s"', (raw) => {
    expect(Username.create(raw).value).toBe(raw.toLowerCase());
  });

  it('normaliza a minúsculas y recorta espacios', () => {
    expect(Username.create('  AnaBeto ').value).toBe('anabeto');
  });

  it.each(['ab', 'a'.repeat(21), 'ana beto', 'ana-beto', 'añá', ''])(
    'rechaza "%s"',
    (raw) => {
      expect(() => Username.create(raw)).toThrow(InvalidUsernameError);
    },
  );

  it('compara por valor sin distinguir mayúsculas', () => {
    expect(Username.create('ANA').equals(Username.create('ana'))).toBe(true);
    expect(Username.create('ana').equals(Username.create('beto'))).toBe(false);
  });

  it('restore no revalida', () => {
    expect(Username.restore('ana').toString()).toBe('ana');
  });
});

describe('CardCode', () => {
  it.each(['BT1-084', 'ST1-01', 'EX2-039', 'P-001', 'BT10-112'])(
    'acepta "%s"',
    (raw) => {
      expect(CardCode.create(raw).value).toBe(raw);
    },
  );

  it('normaliza a mayúsculas y sin espacios', () => {
    expect(CardCode.create(' bt1 - 084 ').value).toBe('BT1-084');
  });

  it.each(['BT1084', 'BT1-1', 'BT1-0841', 'ABCDEFG-01', '-01', 'BT1_084', ''])(
    'rechaza "%s"',
    (raw) => {
      expect(() => CardCode.create(raw)).toThrow(InvalidCardCodeError);
    },
  );

  it('compara por valor', () => {
    expect(CardCode.create('bt1-084').equals(CardCode.restore('BT1-084'))).toBe(
      true,
    );
    expect(CardCode.restore('BT1-084').toString()).toBe('BT1-084');
  });
});

describe('Quantity', () => {
  it.each([1, 99, 50])('acepta %d', (raw) => {
    expect(Quantity.create(raw).value).toBe(raw);
  });

  it.each([0, 100, -1, 1.5, Number.NaN])('rechaza %d', (raw) => {
    expect(() => Quantity.create(raw)).toThrow(InvalidQuantityError);
  });

  it('compara por valor', () => {
    expect(Quantity.create(3).equals(Quantity.restore(3))).toBe(true);
    expect(Quantity.create(3).equals(Quantity.create(4))).toBe(false);
  });
});

describe('PlainPassword', () => {
  it.each(['a'.repeat(8), 'a'.repeat(72)])('acepta longitud %#', (raw) => {
    expect(PlainPassword.create(raw).value).toBe(raw);
  });

  it.each(['a'.repeat(7), 'a'.repeat(73), ''])('rechaza longitud %#', (raw) => {
    expect(() => PlainPassword.create(raw)).toThrow(WeakPasswordError);
  });

  it('no expone el valor al convertirse en texto o JSON', () => {
    const password = PlainPassword.create('supersecreta');
    expect(String(password)).not.toContain('supersecreta');
    expect(JSON.stringify({ password })).not.toContain('supersecreta');
  });
});
