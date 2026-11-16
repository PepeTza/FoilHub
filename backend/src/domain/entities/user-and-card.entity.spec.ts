import { T0 } from '../../../test/fixtures/trade-offers.fixture.js';
import { CardCode } from '../value-objects/card-code.vo.js';
import { Username } from '../value-objects/username.vo.js';
import { Card } from './card.entity.js';
import { User } from './user.entity.js';

describe('User', () => {
  const props = {
    id: 'u1',
    username: Username.create('Ana'),
    passwordHash: 'hash',
    createdAt: T0,
  };

  it('create recorta contactInfo y guarda null si viene vacío', () => {
    expect(
      User.create({ ...props, contactInfo: '  ana#1234 ' }).contactInfo,
    ).toBe('ana#1234');
    expect(
      User.create({ ...props, contactInfo: '   ' }).contactInfo,
    ).toBeNull();
    expect(User.create({ ...props, contactInfo: null }).contactInfo).toBeNull();
  });

  it('restore expone los datos tal cual', () => {
    const user = User.restore({ ...props, contactInfo: 'x' });
    expect(user).toMatchObject({
      id: 'u1',
      passwordHash: 'hash',
      contactInfo: 'x',
      createdAt: T0,
    });
    expect(user.username.value).toBe('ana');
  });
});

describe('Card', () => {
  const props = {
    id: 'c1',
    code: CardCode.create('bt1-084'),
    name: ' Agumon ',
    setName: 'BT1',
    rarity: 'C',
    color: 'Red',
    cardType: 'Digimon',
    imageUrl: null,
  };

  it('create recorta el nombre', () => {
    expect(Card.create(props).name).toBe('Agumon');
  });

  it('restore expone los datos tal cual', () => {
    const card = Card.restore(props);
    expect(card).toMatchObject({
      id: 'c1',
      name: ' Agumon ',
      setName: 'BT1',
      rarity: 'C',
      color: 'Red',
      cardType: 'Digimon',
      imageUrl: null,
    });
    expect(card.code.value).toBe('BT1-084');
  });
});
