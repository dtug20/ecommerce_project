'use strict';

const User = require('../../model/User');
const respond = require('../../utils/respond');

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
    if (currency !== undefined) update['preferences.currency'] = currency;
    if (language !== undefined) update['preferences.language'] = language;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true }
    )
      .select('preferences')
      .lean();

    if (!user) return respond.notFound(res, 'USER_NOT_FOUND', 'User not found');
    return respond.success(res, user.preferences, 'Preferences updated');
  } catch (err) {
    next(err);
  }
};
