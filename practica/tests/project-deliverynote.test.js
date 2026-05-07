import { address, app, createAuthUser, request } from './helpers.js';

const createClientAndProject = async (token) => {
  const client = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Cliente Proyecto', cif: 'B22222222', email: 'cliente2@example.com', phone: '611111111', address })
    .expect(201);

  const project = await request(app)
    .post('/api/project')
    .set('Authorization', `Bearer ${token}`)
    .send({ client: client.body.data._id, name: 'Proyecto Uno', projectCode: 'PRJ-001', address, email: 'obra@example.com', notes: 'Notas', active: true })
    .expect(201);

  return { client: client.body.data, project: project.body.data };
};

describe('Proyectos y albaranes', () => {
  it('gestiona proyectos y albaranes de horas', async () => {
    const { token } = await createAuthUser();
    const { project } = await createClientAndProject(token);

    const projects = await request(app).get('/api/project?name=Proyecto').set('Authorization', `Bearer ${token}`).expect(200);
    expect(projects.body.pagination.totalItems).toBe(1);

    const note = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({ project: project._id, format: 'hours', description: 'Trabajo de pintura', workDate: '2026-05-03', hours: 8 })
      .expect(201);

    const id = note.body.data._id;
    const detail = await request(app).get(`/api/deliverynote/${id}`).set('Authorization', `Bearer ${token}`).expect(200);
    expect(detail.body.data.project._id).toBe(project._id);

    await request(app).get(`/api/deliverynote/pdf/${id}`).set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).delete(`/api/deliverynote/${id}`).set('Authorization', `Bearer ${token}`).expect(204);
  });
});
