import { addConfirmation, createDeal, getDealById, listDeals } from '../services/dealService.js';

export async function getDeals(req, res, next) {
  try {
    const deals = await listDeals(req.query);
    res.json({ deals });
  } catch (error) {
    next(error);
  }
}

export async function getDeal(req, res, next) {
  try {
    const deal = await getDealById(req.params.id);
    res.json({ deal });
  } catch (error) {
    next(error);
  }
}

export async function postDeal(req, res, next) {
  try {
    const deal = await createDeal({ body: req.body, file: req.file, user: req.user });
    res.status(201).json({ deal });
  } catch (error) {
    next(error);
  }
}

export async function confirmDeal(req, res, next) {
  try {
    const deal = await addConfirmation(req.params.id, req.user.id, req.body.confirmationStatus);
    res.status(201).json({ deal });
  } catch (error) {
    next(error);
  }
}
