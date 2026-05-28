// Vietnamese bank BIN codes used by VietQR (img.vietqr.io) and Napas 247.
// Source: https://api.vietqr.io/v2/banks

export interface VnBank {
  bin: string;
  shortName: string;
  fullName: string;
}

export const VN_BANKS: VnBank[] = [
  { bin: '970436', shortName: 'Vietcombank', fullName: 'Ngân hàng TMCP Ngoại Thương Việt Nam' },
  { bin: '970407', shortName: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ Thương Việt Nam' },
  { bin: '970422', shortName: 'MB Bank', fullName: 'Ngân hàng TMCP Quân Đội' },
  { bin: '970418', shortName: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { bin: '970415', shortName: 'Vietinbank', fullName: 'Ngân hàng TMCP Công Thương Việt Nam' },
  { bin: '970405', shortName: 'Agribank', fullName: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn' },
  { bin: '970432', shortName: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { bin: '970416', shortName: 'ACB', fullName: 'Ngân hàng TMCP Á Châu' },
  { bin: '970423', shortName: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong' },
  { bin: '970403', shortName: 'Sacombank', fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín' },
  { bin: '970437', shortName: 'HDBank', fullName: 'Ngân hàng TMCP Phát triển TPHCM' },
  { bin: '970443', shortName: 'SHB', fullName: 'Ngân hàng TMCP Sài Gòn - Hà Nội' },
  { bin: '970441', shortName: 'VIB', fullName: 'Ngân hàng TMCP Quốc tế Việt Nam' },
  { bin: '970449', shortName: 'LPBank', fullName: 'Ngân hàng TMCP Lộc Phát Việt Nam' },
  { bin: '970448', shortName: 'OCB', fullName: 'Ngân hàng TMCP Phương Đông' },
  { bin: '970440', shortName: 'SeABank', fullName: 'Ngân hàng TMCP Đông Nam Á' },
  { bin: '970431', shortName: 'Eximbank', fullName: 'Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam' },
  { bin: '970426', shortName: 'MSB', fullName: 'Ngân hàng TMCP Hàng Hải' },
  { bin: '970419', shortName: 'NCB', fullName: 'Ngân hàng TMCP Quốc Dân' },
  { bin: '970409', shortName: 'BacABank', fullName: 'Ngân hàng TMCP Bắc Á' },
  { bin: '970433', shortName: 'VietBank', fullName: 'Ngân hàng TMCP Việt Nam Thương Tín' },
  { bin: '970412', shortName: 'PVcomBank', fullName: 'Ngân hàng TMCP Đại Chúng Việt Nam' },
  { bin: '970452', shortName: 'KienLongBank', fullName: 'Ngân hàng TMCP Kiên Long' },
  { bin: '970425', shortName: 'ABBANK', fullName: 'Ngân hàng TMCP An Bình' },
  { bin: '970454', shortName: 'BVBank', fullName: 'Ngân hàng TMCP Bản Việt' },
  { bin: '970400', shortName: 'Saigonbank', fullName: 'Ngân hàng TMCP Sài Gòn Công Thương' },
  { bin: '970438', shortName: 'BaoVietBank', fullName: 'Ngân hàng TMCP Bảo Việt' },
  { bin: '970428', shortName: 'NamABank', fullName: 'Ngân hàng TMCP Nam Á' },
  { bin: '970406', shortName: 'DongABank', fullName: 'Ngân hàng TMCP Đông Á' },
  { bin: '970429', shortName: 'SCB', fullName: 'Ngân hàng TMCP Sài Gòn' },
  { bin: '970424', shortName: 'ShinhanBank', fullName: 'Ngân hàng TNHH MTV Shinhan Việt Nam' },
  { bin: '970458', shortName: 'UOB', fullName: 'Ngân hàng UOB Việt Nam' },
  { bin: '970442', shortName: 'HongLeong', fullName: 'Ngân hàng Hong Leong Việt Nam' },
];

export const findBankByBin = (bin: string): VnBank | undefined =>
  VN_BANKS.find((b) => b.bin === bin);

export const findBankByShortName = (name: string): VnBank | undefined =>
  VN_BANKS.find((b) => b.shortName.toLowerCase() === name.toLowerCase());
