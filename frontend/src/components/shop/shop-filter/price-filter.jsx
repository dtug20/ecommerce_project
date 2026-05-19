import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import InputRange from "@/ui/input-range";
import useCurrency from "@/hooks/use-currency";

const PRICE_PRESETS = [
  { kind: 'all', min: 0, max: null },
  { kind: 'under', cap: 20, min: 0, max: 20 },
  { kind: 'range', min: 25, max: 100 },
  { kind: 'range', min: 100, max: 300 },
  { kind: 'range', min: 300, max: 500 },
  { kind: 'range', min: 500, max: 1000 },
  { kind: 'range', min: 1000, max: 10000 },
];

const PriceFilter = ({ priceFilterValues, maxPrice }) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { priceValue, handleChanges } = priceFilterValues;
  const [activePreset, setActivePreset] = useState(-1);

  const presetLabel = (preset) => {
    if (preset.kind === 'all') return t('shop.allPrice');
    if (preset.kind === 'under') return t('shop.underAmount', { amount: formatPrice(preset.cap) });
    return t('shop.amountRange', { min: formatPrice(preset.min), max: formatPrice(preset.max) });
  };

  const handlePresetClick = (preset, index) => {
    setActivePreset(index);
    const max = preset.max === null ? maxPrice : preset.max;
    handleChanges([preset.min, max]);
  };

  const handleMinChange = (e) => {
    const val = parseInt(e.target.value) || 0;
    handleChanges([val, priceValue[1]]);
    setActivePreset(-1);
  };

  const handleMaxChange = (e) => {
    const val = parseInt(e.target.value) || maxPrice;
    handleChanges([priceValue[0], val]);
    setActivePreset(-1);
  };

  return (
    <div className="cl-shop__widget">
      <h3 className="cl-shop__widget-title">{t('shop.priceRange')}</h3>
      <div className="cl-shop__price-range">
        <div className="mb-10">
          <InputRange
            STEP={1}
            MIN={0}
            MAX={maxPrice}
            values={priceValue}
            handleChanges={(val) => { handleChanges(val); setActivePreset(-1); }}
          />
        </div>
        <div className="cl-shop__price-inputs">
          <input
            type="number"
            className="cl-shop__price-input"
            placeholder={t('shop.minPricePlaceholder')}
            value={priceValue[0] || ''}
            onChange={handleMinChange}
          />
          <input
            type="number"
            className="cl-shop__price-input"
            placeholder={t('shop.maxPricePlaceholder')}
            value={priceValue[1] || ''}
            onChange={handleMaxChange}
          />
        </div>
        <ul className="cl-shop__price-presets">
          {PRICE_PRESETS.map((preset, i) => (
            <li key={i}>
              <label className={`cl-shop__price-preset${activePreset === i ? ' cl-shop__price-preset--active' : ''}`}>
                <input
                  type="radio"
                  name="price-preset"
                  checked={activePreset === i}
                  onChange={() => handlePresetClick(preset, i)}
                />
                {presetLabel(preset)}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PriceFilter;
