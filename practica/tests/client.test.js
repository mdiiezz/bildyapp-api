import { address, app, createAuthUser, request } from './helpers.js';

describe('Clientes', () => {
  it('crea, lista, obtiene, actualiza, archiva y restaura un cliente', async () => {
    const { token } = await createAuthUser();

    const create = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cliente Uno', cif: 'B11111111', email: 'cliente@example.com', phone: '600000000', address })
      .expect(201);

    const id = create.body.data._id;

    const list = await request(app)
      .get('/api/client?page=1&limit=10&name=Cliente')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body.pagination.totalItems).toBe(1);

    await request(app).get(`/api/client/${id}`).set('Authorization', `Bearer ${token}`).expect(200);

    const update = await request(app)
      .put(`/api/client/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cliente Actualizado' })
      .expect(200);
    expect(update.body.data.name).toBe('Cliente Actualizado');

    await request(app).delete(`/api/client/${id}?soft=true`).set('Authorization', `Bearer ${token}`).expect(200);
    const archived = await request(app).get('/api/client/archived').set('Authorization', `Bearer ${token}`).expect(200);
    expect(archived.body.data.length).toBe(1);

    await request(app).patch(`/api/client/${id}/restore`).set('Authorization', `Bearer ${token}`).expect(200);
  });
});
