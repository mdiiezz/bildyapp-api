import { address, app, request } from './helpers.js';
import User from '../src/models/User.js';

describe('Usuarios y compañía', () => {
  it('registra, valida, hace login, actualiza datos y crea compañía', async () => {
    const email = `auth_${Date.now()}_${Math.round(Math.random() * 100000)}@example.com`;
    const password = 'Password123';

    const register = await request(app)
      .post('/api/user/register')
      .send({ email, password })
      .expect(201);

    expect(register.body.data).toHaveProperty('accessToken');
    expect(register.body.data.user.email).toBe(email);
    expect(register.body.data.user.status).toBe('pending');

    const token = register.body.data.accessToken;

    const userWithCode = await User.findOne({ email }).select('+verificationCode');
    expect(userWithCode.verificationCode).toBeDefined();

    await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: userWithCode.verificationCode })
      .expect(200);

    const login = await request(app)
      .post('/api/user/login')
      .send({ email, password })
      .expect(200);

    expect(login.body.data).toHaveProperty('accessToken');

    const loginToken = login.body.data.accessToken;

    const updated = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${loginToken}`)
      .send({
        name: 'Mario',
        lastName: 'Díez',
        nif: '12345678Z',
        address
      })
      .expect(200);

    expect(updated.body.data.name).toBe('Mario');
    expect(updated.body.data.lastName).toBe('Díez');

    const company = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${loginToken}`)
      .send({
        name: 'Empresa Test SL',
        cif: `B${Date.now().toString().slice(-8)}`,
        isFreelance: false,
        address
      })
      .expect(200);

    expect(company.body.data.company).toBeDefined();

    const me = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${loginToken}`)
      .expect(200);

    expect(me.body.data.email).toBe(email);
    expect(me.body.data.company).toBeDefined();
  });
});