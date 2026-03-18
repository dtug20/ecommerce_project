import { Tag } from 'antd';

interface StatusBadgeProps {
  status: string;
  type?: 'general' | 'payment' | 'order';
}

type ColorMap = Record<string, string>;

const GENERAL_COLORS: ColorMap = {
  show: 'green',
  hide: 'default',
  active: 'green',
  inactive: 'default',
  blocked: 'red',
};

const PAYMENT_COLORS: ColorMap = {
  pending: 'orange',
  paid: 'green',
  failed: 'red',
  refunded: 'blue',
};

const ORDER_COLORS: ColorMap = {
  pending: 'orange',
  confirmed: 'blue',
  processing: 'geekblue',
  shipped: 'cyan',
  delivered: 'green',
  cancelled: 'red',
};

const COLOR_MAP: Record<NonNullable<StatusBadgeProps['type']>, ColorMap> = {
  general: GENERAL_COLORS,
  payment: PAYMENT_COLORS,
  order: ORDER_COLORS,
};

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function StatusBadge({ status, type = 'general' }: StatusBadgeProps) {
  const colorMap = COLOR_MAP[type];
  const color = colorMap[status.toLowerCase()] ?? 'default';

  return <Tag color={color}>{capitalize(status)}</Tag>;
}
