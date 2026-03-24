import React, { useState, useEffect } from 'react';

const ProductVariantSelector = ({ variants = [], onVariantSelected }) => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [selectedStorage, setSelectedStorage] = useState(null);

  // Derive unique colors
  const uniqueColors = [];
  const colorMap = {};
  variants.forEach((v) => {
    const colorKey = v.color || v.colorName || '';
    const colorCode = v.colorCode || v.clrCode || '#ccc';
    if (colorKey && !colorMap[colorKey]) {
      colorMap[colorKey] = colorCode;
      uniqueColors.push({ name: colorKey, code: colorCode });
    }
  });

  // Derive unique sizes for selected color
  const availableSizes = [];
  const sizeSet = new Set();
  variants.forEach((v) => {
    const colorKey = v.color || v.colorName || '';
    const size = v.size || '';
    if ((!selectedColor || colorKey === selectedColor) && size && !sizeSet.has(size)) {
      sizeSet.add(size);
      availableSizes.push(size);
    }
  });

  // Derive unique memory options (conditional)
  const uniqueMemory = [...new Set(variants.map(v => v.memory).filter(Boolean))];

  // Derive unique storage options (conditional)
  const uniqueStorage = [...new Set(variants.map(v => v.storage).filter(Boolean))];

  // Find matching variant
  useEffect(() => {
    if (selectedColor && selectedSize) {
      const match = variants.find((v) => {
        const colorKey = v.color || v.colorName || '';
        const size = v.size || '';
        const memMatch = !uniqueMemory.length || !selectedMemory || v.memory === selectedMemory;
        const storMatch = !uniqueStorage.length || !selectedStorage || v.storage === selectedStorage;
        return colorKey === selectedColor && size === selectedSize && memMatch && storMatch;
      });
      if (match) {
        onVariantSelected({
          sku: match.sku,
          color: match.color || match.colorName,
          colorCode: match.colorCode || match.clrCode,
          size: match.size,
          price: match.price,
          stock: match.stock,
          image: Array.isArray(match.images) ? match.images[0] : match.image,
        });
      } else {
        onVariantSelected(null);
      }
    } else {
      onVariantSelected(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor, selectedSize, selectedMemory, selectedStorage, variants, onVariantSelected]);

  const handleColorSelect = (colorName) => {
    setSelectedColor(colorName === selectedColor ? null : colorName);
    setSelectedSize(null);
  };

  if (!variants || variants.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cl-spacing-md)' }}>
      {/* Color swatches */}
      {uniqueColors.length > 0 && (
        <div className="cl-pd__color-swatches">
          <span className="cl-pd__color-swatches-label">Color</span>
          <div className="cl-pd__color-swatches-list">
            {uniqueColors.map((color, i) => (
              <button
                key={i}
                type="button"
                title={color.name}
                onClick={() => handleColorSelect(color.name)}
                className={`cl-pd__color-swatch${selectedColor === color.name ? ' cl-pd__color-swatch--active' : ''}`}
              >
                <span style={{ backgroundColor: color.code }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size dropdown */}
      {availableSizes.length > 0 && (
        <div className="cl-pd__select">
          <span className="cl-pd__select-label">Size</span>
          <select
            value={selectedSize || ''}
            onChange={(e) => setSelectedSize(e.target.value || null)}
          >
            <option value="">Select Size</option>
            {availableSizes.map((size, i) => {
              const isAvailable = variants.some((v) => {
                const colorKey = v.color || v.colorName || '';
                return (!selectedColor || colorKey === selectedColor) && v.size === size && v.stock > 0;
              });
              return (
                <option key={i} value={size} disabled={!isAvailable}>
                  {size}{!isAvailable ? ' (Out of Stock)' : ''}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Memory dropdown (conditional) */}
      {uniqueMemory.length > 0 && (
        <div className="cl-pd__select">
          <span className="cl-pd__select-label">Memory</span>
          <select
            value={selectedMemory || ''}
            onChange={(e) => setSelectedMemory(e.target.value || null)}
          >
            <option value="">Select Memory</option>
            {uniqueMemory.map((mem, i) => (
              <option key={i} value={mem}>{mem}</option>
            ))}
          </select>
        </div>
      )}

      {/* Storage dropdown (conditional) */}
      {uniqueStorage.length > 0 && (
        <div className="cl-pd__select">
          <span className="cl-pd__select-label">Storage</span>
          <select
            value={selectedStorage || ''}
            onChange={(e) => setSelectedStorage(e.target.value || null)}
          >
            <option value="">Select Storage</option>
            {uniqueStorage.map((stor, i) => (
              <option key={i} value={stor}>{stor}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default ProductVariantSelector;
