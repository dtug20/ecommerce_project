import React, { useState, useEffect } from 'react';

/**
 * ProductVariantSelector handles products with a `variants` array.
 * Each variant has: { sku, color, colorCode, size, price, stock, images }
 *
 * When a valid color+size combination is selected, it calls:
 *   onVariantSelected({ sku, color, colorCode, size, price, stock, image })
 * When selection is cleared or incomplete, it calls onVariantSelected(null).
 */
const ProductVariantSelector = ({ variants = [], onVariantSelected }) => {
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // Derive unique colors and sizes from the variants array
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

  // Sizes available for the selected color (or all sizes if no color selected)
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

  // Find matching variant when both color and size are selected
  useEffect(() => {
    if (selectedColor && selectedSize) {
      const match = variants.find((v) => {
        const colorKey = v.color || v.colorName || '';
        const size = v.size || '';
        return colorKey === selectedColor && size === selectedSize;
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
  }, [selectedColor, selectedSize, variants, onVariantSelected]);

  // Reset size when color changes
  const handleColorSelect = (colorName) => {
    setSelectedColor(colorName === selectedColor ? null : colorName);
    setSelectedSize(null);
  };

  if (!variants || variants.length === 0) return null;

  return (
    <div className="tp-product-details-variation">
      {/* Color swatches */}
      {uniqueColors.length > 0 && (
        <div className="tp-product-details-variation-item">
          <h4 className="tp-product-details-variation-title">
            Color: <span style={{ fontWeight: 400 }}>{selectedColor || 'Select color'}</span>
          </h4>
          <div className="tp-product-details-variation-list">
            {uniqueColors.map((color, i) => (
              <button
                key={i}
                type="button"
                title={color.name}
                onClick={() => handleColorSelect(color.name)}
                className={`color tp-color-variation-btn ${selectedColor === color.name ? 'active' : ''}`}
                style={{ position: 'relative' }}
              >
                <span
                  style={{
                    backgroundColor: color.code,
                    display: 'block',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: selectedColor === color.name ? '2px solid #821F40' : '2px solid #ddd',
                  }}
                />
                <span className="tp-color-variation-tootltip">{color.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size buttons */}
      {availableSizes.length > 0 && (
        <div className="tp-product-details-variation-item mt-10">
          <h4 className="tp-product-details-variation-title">
            Size: <span style={{ fontWeight: 400 }}>{selectedSize || 'Select size'}</span>
          </h4>
          <div className="tp-product-details-variation-list">
            {availableSizes.map((size, i) => {
              // Check if this size is available for the selected color
              const isAvailable = variants.some((v) => {
                const colorKey = v.color || v.colorName || '';
                return (!selectedColor || colorKey === selectedColor) && v.size === size && (v.stock > 0);
              });
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setSelectedSize(size === selectedSize ? null : size)}
                  className={`tp-size-variation-btn ${selectedSize === size ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                  style={{
                    padding: '4px 12px',
                    marginRight: '6px',
                    border: selectedSize === size ? '2px solid #821F40' : '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: !isAvailable ? '#f5f5f5' : selectedSize === size ? '#821F40' : '#fff',
                    color: !isAvailable ? '#999' : selectedSize === size ? '#fff' : '#333',
                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                  }}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock status for selected variant */}
      {selectedColor && selectedSize && (() => {
        const match = variants.find((v) => {
          const colorKey = v.color || v.colorName || '';
          return colorKey === selectedColor && v.size === selectedSize;
        });
        if (!match) return null;
        return (
          <div className="mt-10">
            <span className={`badge ${match.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
              {match.stock > 0 ? `${match.stock} in stock` : 'Out of stock'}
            </span>
            {match.sku && (
              <span className="ms-2 text-muted" style={{ fontSize: '12px' }}>
                SKU: {match.sku}
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default ProductVariantSelector;
