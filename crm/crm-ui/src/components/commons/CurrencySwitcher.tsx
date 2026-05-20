import { Dropdown, Button, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, WarningOutlined } from '@ant-design/icons';
import { useCurrencyStore, type CurrencyCode } from '@/stores/useCurrencyStore';
import { useExchangeRates } from '@/hooks/useExchangeRates';

const OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'VND', label: 'VND — Vietnamese Dong', symbol: '₫' },
  { code: 'USD', label: 'USD — US Dollar', symbol: '$' },
  { code: 'EUR', label: 'EUR — Euro', symbol: '€' },
  { code: 'GBP', label: 'GBP — British Pound', symbol: '£' },
  { code: 'JPY', label: 'JPY — Japanese Yen', symbol: '¥' },
];

export default function CurrencySwitcher() {
  const currency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const { data: ratesData } = useExchangeRates();
  const current = OPTIONS.find((o) => o.code === currency)!;

  const items: MenuProps['items'] = OPTIONS.map((o) => ({
    key: o.code,
    label: `${o.code} ${o.symbol}  ${o.label}`,
    onClick: () => setCurrency(o.code),
  }));

  return (
    <Dropdown menu={{ items, selectedKeys: [currency] }}>
      <Button type="text" size="small">
        {currency} {current.symbol}
        {ratesData?.stale && (
          <Tooltip title="Exchange rate may be outdated">
            <WarningOutlined style={{ color: '#faad14', marginLeft: 4 }} />
          </Tooltip>
        )}
        <DownOutlined style={{ marginLeft: 6, fontSize: 10 }} />
      </Button>
    </Dropdown>
  );
}
