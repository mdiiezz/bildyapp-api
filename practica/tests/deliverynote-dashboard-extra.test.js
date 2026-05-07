import { address, app, createAuthUser, request } from './helpers.js';

const createClientProject = async (token) => {
  const client = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Cliente Albaranes Extra',
      cif: `B${Date.now().toString().slice(-8)}`,
      email: 'cliente-albaranes@example.com',
      phone: '600000002',
      address
    })
    .expect(201);

  const project = await request(app)
    .post('/api/project')
    .set('Authorization', `Bearer ${token}`)
    .send({
      client: client.body.data._id,
      name: 'Proyecto Albaranes Extra',
      projectCode: `ALB-${Date.now().toString().slice(-6)}`,
      address,
      email: 'albaranes@example.com',
      notes: 'Proyecto para tests de albaranes',
      active: true
    })
    .expect(201);

  return {
    client: client.body.data,
    project: project.body.data
  };
};

describe('Albaranes y dashboard - operaciones extra', () => {
  it('gestiona albaranes de material, dashboard y borrado de no firmados', async () => {
    const { token } = await createAuthUser();
    const { project } = await createClientProject(token);

    const hoursNote = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: project._id,
        format: 'hours',
        description: 'Horas de trabajo',
        workDate: '2026-05-03',
        workers: [
          { name: 'Operario 1', hours: 4 },
          { name: 'Operario 2', hours: 4 }
        ]
      })
      .expect(201);

    expect(hoursNote.body.data.format).toBe('hours');
    expect(hoursNote.body.data.hours).toBeUndefined();
    expect(hoursNote.body.data.workers).toHaveLength(2);

    const materialNote = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: project._id,
        format: 'material',
        description: 'Entrega de material',
        workDate: '2026-05-03',
        material: 'Cemento',
        quantity: 10,
        unit: 'sacos'
      })
      .expect(201);

    const materialId = materialNote.body.data._id;

    expect(materialNote.body.data.format).toBe('material');
    expect(materialNote.body.data.material).toBe('Cemento');
    expect(materialNote.body.data.signed).toBe(false);

    const list = await request(app)
        .get('/api/deliverynote?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

    expect(list.body.pagination.totalItems).toBeGreaterThanOrEqual(2);
    expect(list.body.data.some((item) => item._id === materialId)).toBe(true);

    const detail = await request(app)
      .get(`/api/deliverynote/${materialId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(detail.body.data.project._id).toBe(project._id);
    expect(detail.body.data.client._id).toBe(project.client);

    const dashboard = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(dashboard.body.data.byMonth.length).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.data.hoursByProject.length).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.data.materialsByClient.length).toBeGreaterThanOrEqual(1);

    await request(app)
      .delete(`/api/deliverynote/${materialId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app)
      .get(`/api/deliverynote/${materialId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('rechaza datos inválidos en albaranes', async () => {
    const { token } = await createAuthUser();
    const { project } = await createClientProject(token);

    await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: project._id,
        format: 'material',
        description: 'Material incompleto',
        workDate: '2026-05-03'
      })
      .expect(400);

    await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: project._id,
        format: 'hours',
        description: 'Horas incompletas',
        workDate: '2026-05-03'
      })
      .expect(400);
  });
});