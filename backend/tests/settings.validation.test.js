'use strict';

const { updateSettings } = require('../validations/cms.validation');

describe('updateSettings Joi validation', () => {
  test('accepts payload with bank-transfer disabled and no bankTransfer block', () => {
    const { error } = updateSettings.validate({
      payment: { enabledGateways: ['cod', 'vnpay'] },
    });
    expect(error).toBeUndefined();
  });

  test('accepts bank-transfer with all required bank fields filled', () => {
    const { error } = updateSettings.validate({
      payment: {
        enabledGateways: ['cod', 'bank-transfer'],
        bankTransfer: {
          bankName: 'Vietcombank',
          accountNumber: '0123456789',
          accountName: 'SHOFY CO LTD',
        },
      },
    });
    expect(error).toBeUndefined();
  });

  test('rejects bank-transfer when bankName is missing', () => {
    const { error } = updateSettings.validate({
      payment: {
        enabledGateways: ['bank-transfer'],
        bankTransfer: {
          bankName: '',
          accountNumber: '0123456789',
          accountName: 'SHOFY',
        },
      },
    });
    expect(error).toBeDefined();
    expect(error.message).toMatch(/bank/i);
  });

  test('rejects bank-transfer when bankTransfer block is missing entirely', () => {
    const { error } = updateSettings.validate({
      payment: { enabledGateways: ['bank-transfer'] },
    });
    expect(error).toBeDefined();
  });

  test('rejects unknown gateway value', () => {
    const { error } = updateSettings.validate({
      payment: { enabledGateways: ['paypal'] },
    });
    expect(error).toBeDefined();
  });

  test('still allows unknown top-level keys (back-compat)', () => {
    const { error } = updateSettings.validate({
      payment: { enabledGateways: ['cod'] },
      theme: { primary: '#ff0000' },
      contact: { email: 'a@b.c' },
    });
    expect(error).toBeUndefined();
  });
});
