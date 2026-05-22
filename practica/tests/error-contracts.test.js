import mongoose from 'mongoose';
import { join } from 'node:path';
import { errorHandler } from '../src/middleware/error-handler.js';
import DeliveryNote from '../src/models/DeliveryNote.js';
import { address, app, createAuthUser, request } from './helpers.js';

// Imagen usada como archivo válido en las pruebas multipart.
const logoPath = join(process.cwd(), 'requests', 'logo.png');

// Request falsa para probar directamente el middleware errorHandler.
const createMockReq = (overrides = {}) => ({
  method: 'GET',
  originalUrl: '/test/error-contract',
  ...overrides
});

// Response falsa mínima: guarda status y body para poder hacer expects.
const createMockRes = () => {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };

  return res;
};

// Ejecuta errorHandler sin levantar una ruta real de Express.
const runErrorHandler = async (err) => {
  const req = createMockReq();
  const res = createMockRes();

  await errorHandler(err, req, res, () => {});

  return res;
};

// Crea cliente y proyecto válidos para poder crear albaranes en tests.
const createClientProject = async (token) => {
  const unique = `${Date.now()}${Math.round(Math.random() * 1000)}`.slice(-8);

  const client = await request(app)
    .post('/api/client')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Cliente Error Contracts SL',
      cif: `B${unique}`,
      email: `cliente_${unique}@example.com`,
      phone: '600000003',
      address
    })
    .expect(201);

  const project = await request(app)
    .post('/api/project')
    .set('Authorization', `Bearer ${token}`)
    .send({
      client: client.body.data._id,
      name: 'Proyecto Error Contracts',
      projectCode: `ERR-${unique}`,
      address,
      email: `obra_${unique}@example.com`,
      notes: 'Proyecto para contratos de error',
      active: true
    })
    .expect(201);

  return {
    client: client.body.data,
    project: project.body.data
  };
};

describe('Contratos de error', () => {
  it('devuelve contrato 400 VALIDATION_ERROR para ValidationError de Mongoose', async () => {
    // Fuerza un error real de validación de Mongoose creando un albarán vacío.
    const validationError = new DeliveryNote({}).validateSync();

    expect(validationError).toBeInstanceOf(mongoose.Error.ValidationError);

    const res = await runErrorHandler(validationError);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({
      error: true,
      message: 'Error de validación',
      code: 'VALIDATION_ERROR'
    });
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details.length).toBeGreaterThan(0);
    expect(res.body.details[0]).toHaveProperty('field');
    expect(res.body.details[0]).toHaveProperty('message');
  });

  it('devuelve contrato 409 DUPLICATE_KEY para err.code 11000', async () => {
    // Simula el error de índice único duplicado que lanza MongoDB.
    const duplicateError = new Error('E11000 duplicate key error');

    duplicateError.code = 11000;
    duplicateError.keyValue = { email: 'duplicado@example.com' };

    const res = await runErrorHandler(duplicateError);

    expect(res.statusCode).toBe(409);
    expect(res.body).toMatchObject({
      error: true,
      code: 'DUPLICATE_KEY',
      message: 'Ya existe un registro con ese email'
    });
  });

  it('devuelve contrato 404 NOT_FOUND para una ruta inexistente', async () => {
    // Pide una ruta que no existe para comprobar el contrato del notFoundHandler.
    const res = await request(app)
      .get('/ruta-inexistente-error-contracts')
      .expect(404);

    expect(res.body).toMatchObject({
      error: true,
      code: 'NOT_FOUND'
    });
    expect(res.body.message).toContain('Ruta GET /ruta-inexistente-error-contracts');
  });

  it('devuelve contrato 409 DELIVERYNOTE_ALREADY_SIGNED al firmar dos veces el mismo albarán', async () => {
    // Crea un albarán, lo firma correctamente y luego intenta firmarlo otra vez.
    const { token } = await createAuthUser();
    const { project } = await createClientProject(token);

    const deliveryNote = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: project._id,
        format: 'hours',
        description: 'Albarán para firma duplicada',
        workDate: '2026-05-05',
        hours: 8
      })
      .expect(201);

    const deliveryNoteId = deliveryNote.body.data._id;

    await request(app)
      .patch(`/api/deliverynote/${deliveryNoteId}/sign`)
      .set('Authorization', `Bearer ${token}`)
      .attach('signature', logoPath)
      .expect(200);

    const res = await request(app)
      .patch(`/api/deliverynote/${deliveryNoteId}/sign`)
      .set('Authorization', `Bearer ${token}`)
      .attach('signature', logoPath)
      .expect(409);

    expect(res.body).toMatchObject({
      error: true,
      code: 'DELIVERYNOTE_ALREADY_SIGNED',
      message: 'El albarán ya está firmado'
    });
  });

  it('devuelve contrato 400 INVALID_FILE_TYPE si la firma no es una imagen', async () => {
    // Cubre la validación de tipo de archivo del middleware upload.
    const { token } = await createAuthUser();
    const { project } = await createClientProject(token);

    const deliveryNote = await request(app)
      .post('/api/deliverynote')
      .set('Authorization', `Bearer ${token}`)
      .send({
        project: project._id,
        format: 'hours',
        description: 'Albarán con firma inválida',
        workDate: '2026-05-05',
        hours: 4
      })
      .expect(201);

    const res = await request(app)
      .patch(`/api/deliverynote/${deliveryNote.body.data._id}/sign`)
      .set('Authorization', `Bearer ${token}`)
      .attach('signature', Buffer.from('no soy una imagen'), {
        filename: 'firma.txt',
        contentType: 'text/plain'
      })
      .expect(400);

    expect(res.body).toMatchObject({
      error: true,
      code: 'INVALID_FILE_TYPE'
    });
  });

  it('permite subir logo de compañía para cubrir uploadLogo con diskStorage', async () => {
    // Cubre la rama de subida de logo usando archivo válido.
    const { token } = await createAuthUser();

    const res = await request(app)
      .patch('/api/user/logo')
      .set('Authorization', `Bearer ${token}`)
      .attach('logo', logoPath)
      .expect(200);

    expect(res.body.data.logo).toContain('/uploads/logo-');
  });
});