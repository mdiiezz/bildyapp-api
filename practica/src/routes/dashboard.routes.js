import { Router } from 'express';
import DeliveryNote from '../models/DeliveryNote.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { ensureCompany } from '../services/company.service.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const company = ensureCompany(req.user);
    const [byMonth, hoursByProject, materialsByClient] = await Promise.all([
      DeliveryNote.aggregate([
        { $match: { company, deleted: { $ne: true } } },
        { $group: { _id: { year: { $year: '$workDate' }, month: { $month: '$workDate' } }, total: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      DeliveryNote.aggregate([
        { $match: { company, deleted: { $ne: true }, format: 'hours' } },
        { $addFields: { computedHours: { $cond: [{ $gt: ['$hours', null] }, '$hours', { $sum: '$workers.hours' }] } } },
        { $group: { _id: '$project', totalHours: { $sum: '$computedHours' } } },
        { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
        { $unwind: '$project' },
        { $project: { project: '$project.name', projectCode: '$project.projectCode', totalHours: 1 } }
      ]),
      DeliveryNote.aggregate([
        { $match: { company, deleted: { $ne: true }, format: 'material' } },
        { $group: { _id: '$client', totalMaterials: { $sum: '$quantity' } } },
        { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
        { $unwind: '$client' },
        { $project: { client: '$client.name', cif: '$client.cif', totalMaterials: 1 } }
      ])
    ]);

    res.json({ data: { byMonth, hoursByProject, materialsByClient } });
  } catch (error) {
    next(error);
  }
});

export default router;
