import React, { useState } from "react";
import InputRange from "@/ui/input-range";

const PRICE_PRESETS = [
  { label: 'All Price', min: 0, max: null },
  { label: 'Under $20', min: 0, max: 20 },
  { label: '$25 to $100', min: 25, max: 100 },
  { label: '$100 to $300', min: 100, max: 300 },
  { label: '$300 to $500', min: 300, max: 500 },
  { label: '$500 to $1,000', min: 500, max: 1000 },
  { label: '$1,000 to $10,000', min: 1000, max: 10000 },
];

const PriceFilter = ({ priceFilterValues, maxPrice }) => {
  const { priceValue, handleChanges } = priceFilterValues;
  const [activePreset, setActivePreset] = useState(-1);

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
      <h3 className="cl-shop__widget-title">Price Range</h3>
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
            placeholder="Min price"
            value={priceValue[0] || ''}
            onChange={handleMinChange}
          />
          <input
            type="number"
            className="cl-shop__price-input"
            placeholder="Max price"
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
                {preset.label}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PriceFilter;
