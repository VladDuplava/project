// tests/__mocks__/User.js

const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$hashedPasswordForAdmin',
    role: 'admin',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  },
  {
    id: 2,
    username: 'user1',
    password: '$2a$10$hashedPasswordForUser1',
    role: 'user',
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02'),
  },
];

function makeUserInstance(data) {
  return {
    ...data,
    update:  jest.fn(function (fields) { Object.assign(this, fields); return Promise.resolve(this); }),
    destroy: jest.fn().mockResolvedValue(1),
  };
}

const User = {
  findAll: jest.fn(() => Promise.resolve(mockUsers.map(makeUserInstance))),

  findByPk: jest.fn((id) => {
    const user = mockUsers.find((u) => u.id === Number(id));
    return Promise.resolve(user ? makeUserInstance(user) : null);
  }),

  findOne: jest.fn(({ where } = {}) => {
    const user = mockUsers.find((u) => {
      if (where.username && u.username !== where.username) return false;
      return true;
    });
    return Promise.resolve(user ? makeUserInstance(user) : null);
  }),

  create: jest.fn((data) => {
    const user = makeUserInstance({
      id:        99,
      username:  data.username,
      password:  data.password,
      role:      data.role || 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return Promise.resolve(user);
  }),

  count: jest.fn().mockResolvedValue(2),
};

User.__resetMocks = () => {
  User.findAll.mockClear();
  User.findByPk.mockClear();
  User.findOne.mockClear();
  User.create.mockClear();
  User.count.mockClear();
};

module.exports = User;
