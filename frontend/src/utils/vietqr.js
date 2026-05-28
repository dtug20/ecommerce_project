// VietQR URL builder using img.vietqr.io.
// Docs: https://www.vietqr.io/danh-sach-api/link-tao-ma-vietqr

const BASE = 'https://img.vietqr.io/image';

export function buildVietQrUrl({
  bin,
  accountNumber,
  accountName,
  amount,
  addInfo,
  template = 'compact2',
} = {}) {
  if (!bin || !accountNumber) return '';

  const params = new URLSearchParams();
  if (amount != null && amount > 0) params.set('amount', String(Math.round(amount)));
  if (addInfo) params.set('addInfo', addInfo);
  if (accountName) params.set('accountName', accountName);

  const qs = params.toString();
  return `${BASE}/${bin}-${accountNumber}-${template}.png${qs ? `?${qs}` : ''}`;
}

export function resolveBankQrSrc(bankTransfer, { amount, addInfo } = {}) {
  if (!bankTransfer) return '';

  if (bankTransfer.qrImageUrl) return bankTransfer.qrImageUrl;

  return buildVietQrUrl({
    bin: bankTransfer.vietqrBankBin,
    accountNumber: bankTransfer.accountNumber,
    accountName: bankTransfer.accountName,
    amount,
    addInfo,
  });
}
