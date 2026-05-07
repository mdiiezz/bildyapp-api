import Client from '../models/Client.js';
import Project from '../models/Project.js';
import { ensureCompany } from '../services/company.service.js';
import { buildPagination, buildSort, paginatedResponse } from '../services/query.service.js';
import { emitToCompany } from '../socket/index.js';
import { AppError } from '../utils/AppError.js';

const ensureClientInCompany = async (clientId, company) => {
  const client = await Client.findOne({ _id: clientId, company, deleted: { $ne: true } });
  if (!client) throw AppError.badRequest('El cliente no existe o no pertenece a tu compañía', 'CLIENT_NOT_VALID');
  return client;
};

export const createProject = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    await ensureClientInCompany(req.body.client, company);

    const existing = await Project.findOne({ company, projectCode: req.body.projectCode, deleted: { $ne: true } });
    if (existing) throw AppError.conflict('Ya existe un proyecto con ese código en la compañía', 'PROJECT_CODE_EXISTS');

    const project = await Project.create({ ...req.body, user: req.user._id, company });
    emitToCompany(company, 'project:new', project);
    res.status(201).json({ data: project });
  } catch (error) {
    next(error);
  }
};

export const listProjects = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const { page, limit, skip } = buildPagination(req.queryData || req.query);
    const { client, name, active, sort } = req.queryData || req.query;

    const filter = { company, deleted: { $ne: true } };
    if (client) filter.client = client;
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (typeof active === 'boolean') filter.active = active;

    const [projects, totalItems] = await Promise.all([
      Project.find(filter).populate('client').sort(buildSort(sort)).skip(skip).limit(limit),
      Project.countDocuments(filter)
    ]);

    res.json(paginatedResponse(projects, totalItems, page, limit));
  } catch (error) {
    next(error);
  }
};

export const listArchivedProjects = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const projects = await Project.find({ company, deleted: true }).populate('client').sort({ deletedAt: -1 });
    res.json({ data: projects });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const project = await Project.findOne({ _id: req.paramsData?.id || req.params.id, company, deleted: { $ne: true } }).populate('client');
    if (!project) throw AppError.notFound('Proyecto');
    res.json({ data: project });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const id = req.paramsData?.id || req.params.id;

    if (req.body.client) await ensureClientInCompany(req.body.client, company);
    if (req.body.projectCode) {
      const existing = await Project.findOne({ _id: { $ne: id }, company, projectCode: req.body.projectCode, deleted: { $ne: true } });
      if (existing) throw AppError.conflict('Ya existe otro proyecto con ese código en la compañía', 'PROJECT_CODE_EXISTS');
    }

    const project = await Project.findOneAndUpdate(
      { _id: id, company, deleted: { $ne: true } },
      req.body,
      { new: true, runValidators: true }
    ).populate('client');

    if (!project) throw AppError.notFound('Proyecto');
    res.json({ data: project });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const id = req.paramsData?.id || req.params.id;
    const soft = (req.queryData || req.query).soft !== false;

    if (soft) {
      const project = await Project.findOneAndUpdate(
        { _id: id, company, deleted: { $ne: true } },
        { deleted: true, deletedAt: new Date(), active: false },
        { new: true }
      );
      if (!project) throw AppError.notFound('Proyecto');
      return res.json({ message: 'Proyecto archivado correctamente', data: project });
    }

    const project = await Project.findOneAndDelete({ _id: id, company });
    if (!project) throw AppError.notFound('Proyecto');
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const restoreProject = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const project = await Project.findOneAndUpdate(
      { _id: req.paramsData?.id || req.params.id, company, deleted: true },
      { deleted: false, deletedAt: null, active: true },
      { new: true }
    );
    if (!project) throw AppError.notFound('Proyecto archivado');
    res.json({ message: 'Proyecto restaurado correctamente', data: project });
  } catch (error) {
    next(error);
  }
};
