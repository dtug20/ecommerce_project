'use strict';

const User = require('../../model/User');
const respond = require('../../utils/respond');
const ApiError = require('../../errors/api-error');

const CURRENCY_ENUM = ['VND', 'USD', 'EUR', 'GBP', 'JPY'];
const LANGUAGE_ENUM = ['vi', 'en'];

exports.getPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('preferences').lean();
    return respond.success(res, user?.preferences ?? { currency: 'VND', language: 'vi' });
  } catch (err) {
    next(err);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const { currency, language } = req.body;
    const update = {};

    if (currency !== undefined) {
      if (!CURRENCY_ENUM.includes(currency)) throw new ApiError(400, 'Invalid currency');
      update['preferences.currency'] = currency;
    }
    if (language !== undefined) {
      if (!LANGUAGE_ENUM.includes(language)) throw new ApiError(400, 'Invalid language');
      update['preferences.language'] = language;
    }
    if (Object.keys(update).length === 0) throw new ApiError(400, 'No fields to update');

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true }
    )
      .select('preferences')
      .lean();

    return respond.success(res, user.preferences, 'Preferences updated');
  } catch (err) {
    next(err);
  }
};
