import DeliveryNote from '../models/DeliveryNote.js';
import Project from '../models/Project.js';
import { ensureCompany } from '../services/company.service.js';
import { imageService } from '../services/image.service.js';
import { generateDeliveryNotePdf } from '../services/pdf.service.js';
import { buildPagination, buildSort, paginatedResponse } from '../services/query.service.js';
import { storageService } from '../services/storage.service.js';
import { emitToCompany } from '../socket/index.js';
import { AppError } from '../utils/AppError.js';

const populateDeliveryNote = (query) => query
  .populate('user', 'name lastName email nif company')
  .populate('company')
  .populate('client')
  .populate('project');

const getProjectInCompany = async (projectId, company) => {
  const project = await Project.findOne({ _id: projectId, company, deleted: { $ne: true } });
  if (!project) throw AppError.badRequest('El proyecto no existe o no pertenece a tu compañía', 'PROJECT_NOT_VALID');
  return project;
};

export const createDeliveryNote = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const project = await getProjectInCompany(req.body.project, company);

    const deliveryNote = await DeliveryNote.create({
      ...req.body,
      user: req.user._id,
      company,
      client: project.client,
      project: project._id
    });

    emitToCompany(company, 'deliverynote:new', deliveryNote);
    res.status(201).json({ data: deliveryNote });
  } catch (error) {
    next(error);
  }
};

export const listDeliveryNotes = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const { page, limit, skip } = buildPagination(req.queryData || req.query);
    const { project, client, format, signed, from, to, sort } = req.queryData || req.query;

    const filter = { company, deleted: { $ne: true } };
    if (project) filter.project = project;
    if (client) filter.client = client;
    if (format) filter.format = format;
    if (typeof signed === 'boolean') filter.signed = signed;
    if (from || to) {
      filter.workDate = {};
      if (from) filter.workDate.$gte = from;
      if (to) filter.workDate.$lte = to;
    }

    const [deliveryNotes, totalItems] = await Promise.all([
      DeliveryNote.find(filter)
        .populate('client', 'name cif')
        .populate('project', 'name projectCode')
        .sort(buildSort(sort || '-workDate'))
        .skip(skip)
        .limit(limit),
      DeliveryNote.countDocuments(filter)
    ]);

    res.json(paginatedResponse(deliveryNotes, totalItems, page, limit));
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNote = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const deliveryNote = await populateDeliveryNote(
      DeliveryNote.findOne({ _id: req.paramsData?.id || req.params.id, company, deleted: { $ne: true } })
    );

    if (!deliveryNote) throw AppError.notFound('Albarán');
    res.json({ data: deliveryNote });
  } catch (error) {
    next(error);
  }
};

export const downloadDeliveryNotePdf = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const deliveryNote = await populateDeliveryNote(
      DeliveryNote.findOne({ _id: req.paramsData?.id || req.params.id, company, deleted: { $ne: true } })
    );

    if (!deliveryNote) throw AppError.notFound('Albarán');

    if (deliveryNote.signed && deliveryNote.pdfUrl) {
      return res.redirect(deliveryNote.pdfUrl);
    }

    const pdfBuffer = await generateDeliveryNotePdf(deliveryNote);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="albaran-${deliveryNote._id}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const signDeliveryNote = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    if (!req.file) throw AppError.badRequest('Debes enviar la firma en el campo signature', 'SIGNATURE_REQUIRED');

    const deliveryNote = await populateDeliveryNote(
      DeliveryNote.findOne({ _id: req.paramsData?.id || req.params.id, company, deleted: { $ne: true } })
    );

    if (!deliveryNote) throw AppError.notFound('Albarán');
    if (deliveryNote.signed) throw AppError.conflict('El albarán ya está firmado', 'DELIVERYNOTE_ALREADY_SIGNED');

    const optimizedSignature = await imageService.optimizeSignature(req.file.buffer);
    const signatureUpload = await storageService.uploadBuffer(optimizedSignature, {
      folder: `bildyapp/signatures/${company}`,
      extension: '.webp',
      contentType: 'image/webp',
      resourceType: 'image'
    });

    deliveryNote.signed = true;
    deliveryNote.signedAt = new Date();
    deliveryNote.signatureUrl = signatureUpload.url;
    deliveryNote.signaturePublicId = signatureUpload.publicId;

    const pdfBuffer = await generateDeliveryNotePdf(deliveryNote);
    const pdfUpload = await storageService.uploadBuffer(pdfBuffer, {
      folder: `bildyapp/pdfs/${company}`,
      extension: '.pdf',
      contentType: 'application/pdf',
      resourceType: 'raw'
    });

    deliveryNote.pdfUrl = pdfUpload.url;
    deliveryNote.pdfPublicId = pdfUpload.publicId;
    await deliveryNote.save();

    emitToCompany(company, 'deliverynote:signed', deliveryNote);
    res.json({ message: 'Albarán firmado correctamente', data: deliveryNote });
  } catch (error) {
    next(error);
  }
};

export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const deliveryNote = await DeliveryNote.findOne({ _id: req.paramsData?.id || req.params.id, company, deleted: { $ne: true } });

    if (!deliveryNote) throw AppError.notFound('Albarán');
    if (deliveryNote.signed) throw AppError.conflict('No se puede borrar un albarán firmado', 'SIGNED_DELIVERYNOTE_LOCKED');

    await deliveryNote.deleteOne();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
