document.addEventListener('DOMContentLoaded', function() {
    //init
    checkAdminSession();
    loadProducts();
    loadBrands();
    loadCategories();
    
    // Setup event listeners
    document.getElementById('add-product-btn').addEventListener('click', showProductModal);
    document.getElementById('search-product-btn').addEventListener('click', searchProducts);
    document.getElementById('prev-product-page').addEventListener('click', prevProductPage);
    document.getElementById('next-product-page').addEventListener('click', nextProductPage);
    document.getElementById('product-form').addEventListener('submit', saveProduct);
    document.querySelector('#product-modal .close').addEventListener('click', closeProductModal);
    
    // Modal close when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('product-modal')) {
            closeProductModal();
        }
    });
});

let currentProductPage = 1;
let totalProductPages = 1;

function loadProducts(page = 1, search = '') {
    let url = `../API/adminAPI.php?action=get_products&page=${page}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.querySelector('#products-table tbody');
                tbody.innerHTML = '';
                
                data.products.forEach(product => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${product.ProductID}</td>
                        <td>${product.Name}</td>
                        <td>${product.BrandName}</td>
                        <td>${product.CategoryName}</td>
                        <td>
                            <button class="btn-secondary edit-product" data-id="${product.ProductID}">Edit</button>
                            <button class="btn-danger delete-product" data-id="${product.ProductID}">Delete</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                
                // Update pagination
                currentProductPage = page;
                totalProductPages = data.pages;
                document.getElementById('product-page-info').textContent = `Page ${currentProductPage} of ${totalProductPages}`;
                
                // Add event listeners to edit/delete buttons
                document.querySelectorAll('.edit-product').forEach(btn => {
                    btn.addEventListener('click', editProduct);
                });
                
                document.querySelectorAll('.delete-product').forEach(btn => {
                    btn.addEventListener('click', deleteProduct);
                });
            }
        })
        .catch(error => {
            console.error('Error loading products:', error);
            alert('Error loading products. Please try again.');
        });
}

function loadBrands() {
    fetch('../API/adminAPI.php?action=get_brands')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('product-brand');
                select.innerHTML = '<option value="">Select Brand</option>';
                
                data.brands.forEach(brand => {
                    const option = document.createElement('option');
                    option.value = brand.BrandID;
                    option.textContent = brand.Name;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading brands:', error);
        });
}

function loadCategories() {
    fetch('../API/adminAPI.php?action=get_categories')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('product-category');
                select.innerHTML = '<option value="">Select Category</option>';
                
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.CategoryID;
                    option.textContent = category.Name;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading categories:', error);
        });
}

function showProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');
    const title = document.getElementById('product-modal-title');
    
    if (productId) {
        // Edit mode
        title.textContent = 'Edit Product';
        fetch(`../API/adminAPI.php?action=get_product&id=${productId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('product-id').value = data.product.ProductID;
                    document.getElementById('product-name').value = data.product.Name;
                    document.getElementById('product-description').value = data.product.Description;
                    document.getElementById('product-specs').value = data.product.Specifications;
                    document.getElementById('product-brand').value = data.product.BrandID;
                    document.getElementById('product-category').value = data.product.CategoryID;
                    modal.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Error loading product:', error);
                alert('Error loading product data. Please try again.');
            });
    } else {
        // Add mode
        title.textContent = 'Add New Product';
        form.reset();
        document.getElementById('product-id').value = '';
        modal.style.display = 'block';
    }
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

function editProduct(e) {
    const productId = e.target.dataset.id;
    showProductModal(productId);
}

function deleteProduct(e) {
    if (confirm('Are you sure you want to delete this product?')) {
        const productId = e.target.dataset.id;
        makeApiCall('delete_product', 'POST', { id: productId })
            .then(data => {
                if (data.success) {
                    loadProducts(currentProductPage);
                } else {
                    alert(data.message || 'Error deleting product');
                }
            })
            .catch(error => {
                console.error('Error deleting product:', error);
                alert('Error deleting product. Please try again.');
            });
    }
}

function saveProduct(e) {
    e.preventDefault();
    
    const formData = {
        id: document.getElementById('product-id').value,
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        specifications: document.getElementById('product-specs').value,
        brandId: document.getElementById('product-brand').value,
        categoryId: document.getElementById('product-category').value
    };
    
    makeApiCall('add_edit_product', 'POST', formData)
        .then(data => {
            if (data.success) {
                closeProductModal();
                loadProducts(currentProductPage);
            } else {
                alert(data.message || 'Error saving product');
            }
        })
        .catch(error => {
            console.error('Error saving product:', error);
            alert('Error saving product. Please try again.');
        });
}

function searchProducts() {
    const searchTerm = document.getElementById('product-search').value;
    loadProducts(1, searchTerm);
}

function prevProductPage() {
    if (currentProductPage > 1) {
        loadProducts(currentProductPage - 1);
    }
}

function nextProductPage() {
    if (currentProductPage < totalProductPages) {
        loadProducts(currentProductPage + 1);
    }
}