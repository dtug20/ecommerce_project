// Categories Management JavaScript

let categories = [];
let currentFilters = {};

// Initialize categories page
document.addEventListener('DOMContentLoaded', function() {
  loadProductTypes();
  loadCategories();
  setupEventListeners();
});

// Setup event listeners
const setupEventListeners = () => {
  // Search input with debounce
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', CRMUtils.debounce(() => {
    currentFilters.search = searchInput.value;
    loadCategories();
  }, 500));

  // Filter change handlers
  document.getElementById('statusFilter').addEventListener('change', (e) => {
    currentFilters.status = e.target.value;
    loadCategories();
  });

  document.getElementById('productTypeFilter').addEventListener('change', (e) => {
    currentFilters.productType = e.target.value;
    loadCategories();
  });

  // Form submit handler
  document.getElementById('categoryForm').addEventListener('submit', handleCategorySubmit);
};

// Load product types for filter
const loadProductTypes = async () => {
  try {
    const response = await CRMUtils.apiRequest('/api/categories/stats');
    const productTypes = response.data.productTypeStats;
    
    const productTypeFilter = document.getElementById('productTypeFilter');
    productTypeFilter.innerHTML = '<option value="">All Product Types</option>';
    
    productTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type._id;
      option.textContent = `${type._id} (${type.count})`;
      productTypeFilter.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading product types:', error);
  }
};

// Load categories with filters
const loadCategories = async (page = 1) => {
  try {
    const params = new URLSearchParams({
      page,
      limit: 10,
      ...currentFilters
    });

    CRMUtils.showLoading(document.querySelector('.card-body'));
    
    const response = await CRMUtils.apiRequest(`/api/categories?${params}`);
    categories = response.data;
    
    updateCategoriesTable(categories);
    updatePagination(response.pagination);
    
  } catch (error) {
    console.error('Error loading categories:', error);
    CRMUtils.showAlert('Error loading categories', 'danger');
  } finally {
    CRMUtils.hideLoading(document.querySelector('.card-body'));
  }
};

// Update categories table
const updateCategoriesTable = (categories) => {
  const tbody = document.getElementById('categoriesTableBody');
  tbody.innerHTML = '';
  
  if (categories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No categories found</td></tr>';
    return;
  }
  
  categories.forEach(category => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        ${category.img ? 
          `<img src="${category.img}" class="img-thumbnail" alt="${category.parent}">` : 
          '<div class="img-thumbnail bg-light d-flex align-items-center justify-content-center">No Image</div>'
        }
      </td>
      <td>
        <div class="fw-bold">${category.parent}</div>
        ${category.children.length > 0 ? 
          `<small class="text-muted">Children: ${category.children.join(', ')}</small>` : 
          ''
        }
      </td>
      <td>
        <span class="badge bg-info">${category.productType}</span>
      </td>
      <td>
        <span class="badge bg-primary">${category.products ? category.products.length : 0}</span>
      </td>
      <td>${CRMUtils.getStatusBadge(category.status)}</td>
      <td>
        <small>${CRMUtils.formatDate(category.createdAt)}</small>
      </td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" onclick="editCategory('${category._id}')" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-info" onclick="viewCategory('${category._id}')" title="View">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="deleteCategory('${category._id}')" title="Delete">
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
  
  CRMUtils.generatePagination('#categoriesPagination', totalPages, currentPage, 'goToPage');
};

// Go to specific page
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages) {
    loadCategories(page);
  }
};

// Clear filters
const clearFilters = () => {
  currentFilters = {};
  document.getElementById('searchInput').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('productTypeFilter').value = '';
  loadCategories();
};

// Handle category form submission
const handleCategorySubmit = async (e) => {
  e.preventDefault();
  
  if (!CRMUtils.validateForm('#categoryForm')) {
    CRMUtils.showAlert('Please fill in all required fields', 'danger');
    return;
  }
  
  const formData = new FormData(e.target);
  const categoryData = {};
  
  // Convert form data to object
  for (let [key, value] of formData.entries()) {
    // Skip the 'id' field since it's in the URL, not the body
    if (key === 'id') continue;
    
    // Skip empty values for optional fields during update
    const categoryId = document.getElementById('categoryId').value;
    if (categoryId && !value) continue;
    
    if (key === 'children') {
      categoryData[key] = value.split(',').map(item => item.trim()).filter(item => item);
    } else if (key === 'featured') {
      categoryData[key] = formData.has('featured');
    } else if (key === 'sortOrder') {
      categoryData[key] = parseInt(value) || 0;
    } else {
      categoryData[key] = value;
    }
  }
  
  try {
    const categoryId = document.getElementById('categoryId').value;
    const url = categoryId ? `/api/categories/${categoryId}` : '/api/categories';
    const method = categoryId ? 'PUT' : 'POST';
    
    await CRMUtils.apiRequest(url, {
      method,
      body: JSON.stringify(categoryData)
    });
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('categoryModal'));
    modal.hide();
    
    CRMUtils.showAlert(categoryId ? 'Category updated successfully' : 'Category created successfully');
    CRMUtils.clearForm('#categoryForm');
    loadCategories();
    
  } catch (error) {
    console.error('Error saving category:', error);
    CRMUtils.showAlert(error.message, 'danger');
  }
};

// Edit category
const editCategory = async (categoryId) => {
  try {
    const response = await CRMUtils.apiRequest(`/api/categories/${categoryId}`);
    const category = response.data;
    
    // Populate form
    document.getElementById('categoryModalLabel').textContent = 'Edit Category';
    document.getElementById('categoryId').value = category._id;
    document.getElementById('parent').value = category.parent;
    document.getElementById('productType').value = category.productType;
    document.getElementById('description').value = category.description || '';
    document.getElementById('img').value = category.img || '';
    document.getElementById('children').value = category.children ? category.children.join(', ') : '';
    document.getElementById('status').value = category.status;
    document.getElementById('sortOrder').value = category.sortOrder || 0;
    document.getElementById('featured').checked = category.featured || false;
    
    const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
    modal.show();
    
  } catch (error) {
    console.error('Error loading category:', error);
    CRMUtils.showAlert('Error loading category details', 'danger');
  }
};

// View category details
const viewCategory = async (categoryId) => {
  try {
    const response = await CRMUtils.apiRequest(`/api/categories/${categoryId}`);
    const category = response.data;
    
    // Create a simple view
    const details = `
      Category: ${category.parent}
      Product Type: ${category.productType}
      Products: ${category.products ? category.products.length : 0}
      Status: ${category.status}
      ${category.description ? '\nDescription: ' + category.description : ''}
      ${category.children.length > 0 ? '\nChildren: ' + category.children.join(', ') : ''}
    `;
    
    alert(details);
    
  } catch (error) {
    console.error('Error loading category:', error);
    CRMUtils.showAlert('Error loading category details', 'danger');
  }
};

// Delete category
const deleteCategory = async (categoryId) => {
  if (await CRMUtils.deleteItem('/api/categories', categoryId, 'category')) {
    loadCategories();
  }
};

// Reset category modal when hidden
document.getElementById('categoryModal').addEventListener('hidden.bs.modal', function() {
  document.getElementById('categoryModalLabel').textContent = 'Add Category';
  CRMUtils.clearForm('#categoryForm');
});

// Export functions for global access
window.goToPage = goToPage;
window.editCategory = editCategory;
window.viewCategory = viewCategory;
window.deleteCategory = deleteCategory;
window.clearFilters = clearFilters;
window.loadCategories = loadCategories;