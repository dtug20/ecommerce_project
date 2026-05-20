'use strict';

const ExchangeRate = require('../../model/ExchangeRate');
const respond = require('../../utils/respond');

/**
 * @swagger
 * /api/v1/store/exchange-rates:
 *   get:
 *     summary: Get current exchange rates (base VND)
 *     tags: [Store]
 *     responses:
 *       200:
 *         description: Exchange rates document
 *         headers:
 *           Cache-Control:
 *             schema:
 *               type: string
 *             description: public, max-age=3600
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     base:
 *                       type: string
 *                       example: VND
 *                     rates:
 *                       type: object
 *                     stale:
 *                       type: boolean
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 */
exports.getExchangeRates = async (req, res, next) => {
  try {
    let doc = await ExchangeRate.findOne({});
    if (!doc) {
      // Cron may not have fired yet on first boot — seed defaults
      doc = await ExchangeRate.create({
        base: 'VND',
        rates: { USD: 25450, EUR: 27600, GBP: 32100, JPY: 168 },
        source: 'seed',
        stale: true,
        fetchedAt: new Date(),
      });
    }
    res.set('Cache-Control', 'public, max-age=3600');
    return respond.success(res, {
      base: doc.base,
      rates: doc.rates,
      stale: doc.stale,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    next(err);
  }
};
