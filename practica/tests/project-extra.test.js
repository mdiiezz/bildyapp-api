import { address, app, createAuthUser, request } from './helpers.js';

describe('Proyectos - operaciones completas', () => {
  it('lista, obtiene, actualiza, archiva y restaura un proyecto', async () => {
    const { token } = await createAuthUser();

    const client = await request(app)
      .post('/api/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cliente Proyecto Extra',
        cif: `B${Date.now().toString().slice(-8)}`,
        email: 'cliente-extra@example.com',
        phone: '600000001',
        address
      })
      .expect(201);

    const project = await request(app)
      .post('/api/project')
      .set('Authorization', `Bearer ${token}`)
      .send({
        client: client.body.data._id,
        name: 'Proyecto Extra',
        projectCode: `PRJ-${Date.now().toString().slice(-6)}`,
        address,
        email: 'proyecto-extra@example.com',
        notes: 'Notas iniciales',
        active: true
      })
      .expect(201);

    const projectId = project.body.data._id;

    const list = await request(app)
      .get('/api/project?page=1&limit=10&name=Proyecto&active=true')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body.pagination.totalItems).toBeGreaterThanOrEqual(1);

    const detail = await request(app)
      .get(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(detail.body.data._id).toBe(projectId);
    expect(detail.body.data.client._id).toBe(client.body.data._id);

    const update = await request(app)
      .put(`/api/project/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Proyecto Extra Actualizado',
        notes: 'Notas actualizadas',
        active: true
      })
      .expect(200);

    expect(update.body.data.name).toBe('Proyecto Extra Actualizado');
    expect(update.body.data.notes).toBe('Notas actualizadas');

    const archived = await request(app)
      .delete(`/api/project/${projectId}?soft=true`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(archived.body.data.deleted).toBe(true);
    expect(archived.body.data.active).toBe(false);

    const archivedList = await request(app)
      .get('/api/project/archived')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(archivedList.body.data.some((item) => item._id === projectId)).toBe(true);

    const restored = await request(app)
      .patch(`/api/project/${projectId}/restore`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(restored.body.data.deleted).toBe(false);
    expect(restored.body.data.active).toBe(true);
  });
});