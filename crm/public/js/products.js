// Products Management JavaScript

let products = [];
let categories = [];
let currentFilters = {};

// Initialize products page
document.addEventListener('DOMContentLoaded', function() {
  loadCategories();
  loadProducts();
  setupEventListeners();
});

// Setup event listeners
const setupEventListeners = () => {
  // Search input with debounce
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', CRMUtils.debounce(() => {
    currentFilters.search = searchInput.value;
    loadProducts();
  }, 500));

  // Filter change handlers
  document.getElementById('categoryFilter').addEventListener('change', (e) => {
    currentFilters.category = e.target.value;
    loadProducts();
  });

  document.getElementById('statusFilter').addEventListener('change', (e) => {
    currentFilters.status = e.target.value;
    loadProducts();
  });

  // Form submit handler
  document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
};

// Load categories for dropdown
const loadCategories = async () => {
  try {
    const response = await CRMUtils.apiRequest('/api/categories?status=Show');
    categories = response.data;
    
    const categorySelects = document.querySelectorAll('#categoryFilter, #category');
    categorySelects.forEach(select => {
      select.innerHTML = select.id === 'categoryFilter' ? '<option value="">All Categories</option>' : '<option value="">Select Category</option>';
      
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category._id;
        option.textContent = category.parent || category.name;
        select.appendChild(option);
      });
    });
  } catch (error) {
    console.error('Error loading categories:', error);
  }
};

// Load products with filters
const loadProducts = async (page = 1) => {
  try {
    const params = new URLSearchParams({
      page,
      limit: 10,
      ...currentFilters
    });

    CRMUtils.showLoading(document.querySelector('.card-body'));
    
    const response = await CRMUtils.apiRequest(`/api/products?${params}`);
    products = response.data;
    
    updateProductsTable(products);
    updatePagination(response.pagination);
    
  } catch (error) {
    console.error('Error loading products:', error);
    CRMUtils.showAlert('Error loading products', 'danger');
  } finally {
    CRMUtils.hideLoading(document.querySelector('.card-body'));
  }
};

// Update products table
const updateProductsTable = (products) => {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = '';
  
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No products found</td></tr>';
    return;
  }
  
  products.forEach(product => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        ${product.img ? 
          `<img src="${product.img}" class="img-thumbnail" alt="${product.title}">` : 
          '<div class="img-thumbnail bg-light d-flex align-items-center justify-content-center">No Image</div>'
        }
      </td>
      <td>
        <div class="fw-bold">${product.title}</div>
        <small class="text-muted">SKU: ${product.slug || 'N/A'}</small>
      </td>
      <td>${product.category?.parent || 'N/A'}</td>
      <td>
        <div>${CRMUtils.formatCurrency(product.price)}</div>
        ${product.discount > 0 ? `<small class="text-success">${product.discount}% off</small>` : ''}
      </td>
      <td>
        <span class="${product.quantity <= 10 ? 'text-danger' : 'text-success'}">${product.quantity}</span>
        ${product.quantity <= 10 ? '<i class="bi bi-exclamation-triangle-fill text-warning ms-1"></i>' : ''}
      </td>
      <td>${CRMUtils.getStatusBadge(product.status)}</td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" onclick="editProduct('${product._id}')" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-info" onclick="viewProduct('${product._id}')" title="View">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="deleteProduct('${product._id}')" title="Delete">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
};

// Update pagination
const updatePagination = (pagination) => {
  currentPage = pagination.currentPage;
  totalPages = pagination.totalPages;
  
  CRMUtils.generatePagination('#productsPagination', totalPages, currentPage, 'goToPage');
};

// Go to specific page
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages) {
    loadProducts(page);
  }
};

// Clear filters
const clearFilters = () => {
  currentFilters = {};
  document.getElementById('searchInput').value = '';
  document.getElementById('categoryFilter').value = '';
  document.getElementById('statusFilter').value = '';
  loadProducts();
};

// Handle product form submission
const handleProductSubmit = async (e) => {
  e.preventDefault();
  
  if (!CRMUtils.validateForm('#productForm')) {
    CRMUtils.showAlert('Please fill in all required fields', 'danger');
    return;
  }
  
  const formData = new FormData(e.target);
  const productData = {};
  
  // Convert form data to object
  for (let [key, value] of formData.entries()) {
    // Skip the 'id' field since it's in the URL, not the body
    if (key === 'id') continue;
    
    // Skip empty values for optional fields during update
    const productId = document.getElementById('productId').value;
    if (productId && !value) continue;
    
    if (key === 'colors' || key === 'sizes' || key === 'tags') {
      productData[key] = value.split(',').map(item => item.trim()).filter(item => item);
    } else if (key === 'featured') {
      productData[key] = formData.has('featured');
    } else if (['price', 'discount', 'quantity', 'shipping'].includes(key)) {
      productData[key] = parseFloat(value) || 0;
    } else {
      productData[key] = value;
    }
  }
  
  try {
    const productId = document.getElementById('productId').value;
    const url = productId ? `/api/products/${productId}` : '/api/products';
    const method = productId ? 'PUT' : 'POST';
    
    console.log('Product Data to Send:', productData);
    console.log('Product ID:', productId);
    
    await CRMUtils.apiRequest(url, {
      method,
      body: JSON.stringify(productData)
    });
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
    modal.hide();
    
    CRMUtils.showAlert(productId ? 'Product updated successfully' : 'Product created successfully');
    CRMUtils.clearForm('#productForm');
    loadProducts();
    
  } catch (error) {
    console.error('Error saving product:', error);
    CRMUtils.showAlert(error.message, 'danger');
  }
};

// Edit product
const editProduct = async (productId) => {
  try {
    const response = await CRMUtils.apiRequest(`/api/products/${productId}`);
    const product = response.data;
    
    // Populate form
    document.getElementById('productModalLabel').textContent = 'Edit Product';
    document.getElementById('productId').value = product._id;
    document.getElementById('title').value = product.title;
    document.getElementById('description').value = product.description;
    document.getElementById('price').value = product.price;
    document.getElementById('discount').value = product.discount || 0;
    document.getElementById('quantity').value = product.quantity;
    document.getElementById('shipping').value = product.shipping || 0;
    document.getElementById('category').value = product.category?._id || '';
    document.getElementById('status').value = product.status;
    document.getElementById('featured').checked = product.featured || false;
    document.getElementById('img').value = product.img || '';
    document.getElementById('colors').value = product.colors ? product.colors.join(', ') : '';
    document.getElementById('sizes').value = product.sizes ? product.sizes.join(', ') : '';
    document.getElementById('tags').value = product.tags ? product.tags.join(', ') : '';
    
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
    
  } catch (error) {
    console.error('Error loading product:', error);
    CRMUtils.showAlert('Error loading product details', 'danger');
  }
};

// View product details
const viewProduct = async (productId) => {
  try {
    const response = await CRMUtils.apiRequest(`/api/products/${productId}`);
    const product = response.data;
    
    // Create a simple view modal or redirect to detail page
    alert(`Product: ${product.title}\nPrice: ${CRMUtils.formatCurrency(product.price)}\nQuantity: ${product.quantity}\nCategory: ${product.category?.parent || 'N/A'}`);
    
  } catch (error) {
    console.error('Error loading product:', error);
    CRMUtils.showAlert('Error loading product details', 'danger');
  }
};

// Delete product
const deleteProduct = async (productId) => {
  if (await CRMUtils.deleteItem('/api/products', productId, 'product')) {
    loadProducts();
  }
};

// Reset product modal when hidden
document.getElementById('productModal').addEventListener('hidden.bs.modal', function() {
  document.getElementById('productModalLabel').textContent = 'Add Product';
  CRMUtils.clearForm('#productForm');
});

// Export functions for global access
window.goToPage = goToPage;
window.editProduct = editProduct;
window.viewProduct = viewProduct;
window.deleteProduct = deleteProduct;
window.clearFilters = clearFilters;
window.loadProducts = loadProducts;