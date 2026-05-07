import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';

export const address = {
  street: 'Calle Mayor',
  number: '1',
  postal: '28013',
  city: 'Madrid',
  province: 'Madrid'
};

export const createAuthUser = async () => {
  const email = `tester_${Date.now()}_${Math.round(Math.random() * 100000)}@example.com`;
  const password = 'Password123';
  const register = await request(app).post('/api/user/register').send({ email, password }).expect(201);
  let token = register.body.data.accessToken;

  const userWithCode = await User.findOne({ email }).select('+verificationCode');
  await request(app)
    .put('/api/user/validation')
    .set('Authorization', `Bearer ${token}`)
    .send({ code: userWithCode.verificationCode })
    .expect(200);

  await request(app)
    .put('/api/user/register')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test', lastName: 'User', nif: '12345678Z', address })
    .expect(200);

  const companyRes = await request(app)
    .patch('/api/user/company')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Test Company SL', cif: `B${Date.now().toString().slice(-8)}`, address, isFreelance: false })
    .expect(200);

  token = register.body.data.accessToken;
  return { token, user: companyRes.body.data };
};

export { app, request };
