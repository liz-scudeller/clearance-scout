import {
  getMyAlertPreferences,
  getMyProfile,
  hideDealForUser,
  listMyHiddenDealIds,
  listMySavedDealIds,
  saveDealForUser,
  unsaveDealForUser,
  unhideDealForUser,
  updateMyAlertPreferences,
  updateMyProfile
} from '../services/userPreferenceService.js';

export async function getProfile(req, res, next) {
  try {
    res.json({ profile: await getMyProfile(req.user) });
  } catch (error) {
    next(error);
  }
}

export async function putProfile(req, res, next) {
  try {
    res.json({ profile: await updateMyProfile(req.user, req.body) });
  } catch (error) {
    next(error);
  }
}

export async function getAlertPreferences(req, res, next) {
  try {
    res.json({ preferences: await getMyAlertPreferences(req.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function putAlertPreferences(req, res, next) {
  try {
    res.json({ preferences: await updateMyAlertPreferences(req.user.id, req.body) });
  } catch (error) {
    next(error);
  }
}

export async function getSavedDeals(req, res, next) {
  try {
    res.json({ dealIds: await listMySavedDealIds(req.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function putSavedDeal(req, res, next) {
  try {
    await saveDealForUser(req.user.id, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function deleteSavedDeal(req, res, next) {
  try {
    await unsaveDealForUser(req.user.id, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function getHiddenDeals(req, res, next) {
  try {
    res.json({ dealIds: await listMyHiddenDealIds(req.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function putHiddenDeal(req, res, next) {
  try {
    await hideDealForUser(req.user.id, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function deleteHiddenDeal(req, res, next) {
  try {
    await unhideDealForUser(req.user.id, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
