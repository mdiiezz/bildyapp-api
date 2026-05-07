import Client from '../models/Client.js';
import { ensureCompany } from '../services/company.service.js';
import { buildPagination, buildSort, paginatedResponse } from '../services/query.service.js';
import { emitToCompany } from '../socket/index.js';
import { AppError } from '../utils/AppError.js';

export const createClient = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);

    const existing = await Client.findOne({ company, cif: req.body.cif, deleted: { $ne: true } });
    if (existing) throw AppError.conflict('Ya existe un cliente con ese CIF en la compañía', 'CLIENT_CIF_EXISTS');

    const client = await Client.create({
      ...req.body,
      user: req.user._id,
      company
    });

    emitToCompany(company, 'client:new', client);
    res.status(201).json({ data: client });
  } catch (error) {
    next(error);
  }
};

export const listClients = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const { page, limit, skip } = buildPagination(req.queryData || req.query);
    const { name, sort } = req.queryData || req.query;

    const filter = { company, deleted: { $ne: true } };
    if (name) filter.name = { $regex: name, $options: 'i' };

    const [clients, totalItems] = await Promise.all([
      Client.find(filter).sort(buildSort(sort)).skip(skip).limit(limit),
      Client.countDocuments(filter)
    ]);

    res.json(paginatedResponse(clients, totalItems, page, limit));
  } catch (error) {
    next(error);
  }
};

export const listArchivedClients = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const clients = await Client.find({ company, deleted: true }).sort({ deletedAt: -1 });
    res.json({ data: clients });
  } catch (error) {
    next(error);
  }
};

export const getClient = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const client = await Client.findOne({ _id: req.paramsData?.id || req.params.id, company, deleted: { $ne: true } });
    if (!client) throw AppError.notFound('Cliente');
    res.json({ data: client });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const id = req.paramsData?.id || req.params.id;

    if (req.body.cif) {
      const existing = await Client.findOne({ _id: { $ne: id }, company, cif: req.body.cif, deleted: { $ne: true } });
      if (existing) throw AppError.conflict('Ya existe otro cliente con ese CIF en la compañía', 'CLIENT_CIF_EXISTS');
    }

    const client = await Client.findOneAndUpdate(
      { _id: id, company, deleted: { $ne: true } },
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) throw AppError.notFound('Cliente');
    res.json({ data: client });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const id = req.paramsData?.id || req.params.id;
    const soft = (req.queryData || req.query).soft !== false;

    if (soft) {
      const client = await Client.findOneAndUpdate(
        { _id: id, company, deleted: { $ne: true } },
        { deleted: true, deletedAt: new Date() },
        { new: true }
      );
      if (!client) throw AppError.notFound('Cliente');
      return res.json({ message: 'Cliente archivado correctamente', data: client });
    }

    const client = await Client.findOneAndDelete({ _id: id, company });
    if (!client) throw AppError.notFound('Cliente');
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const restoreClient = async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const client = await Client.findOneAndUpdate(
      { _id: req.paramsData?.id || req.params.id, company, deleted: true },
      { deleted: false, deletedAt: null },
      { new: true }
    );
    if (!client) throw AppError.notFound('Cliente archivado');
    res.json({ message: 'Cliente restaurado correctamente', data: client });
  } catch (error) {
    next(error);
  }
};
