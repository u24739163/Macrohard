document.addEventListener('DOMContentLoaded', function() {
    //init
    checkAdminSession();
    loadStockists();
    
    // Setup event listeners
    document.getElementById('add-stockist-btn').addEventListener('click', showStockistModal);
    document.getElementById('search-stockist-btn').addEventListener('click', searchStockists);
    document.getElementById('prev-stockist-page').addEventListener('click', prevStockistPage);
    document.getElementById('next-stockist-page').addEventListener('click', nextStockistPage);
    document.getElementById('stockist-form').addEventListener('submit', saveStockist);
    document.querySelector('#stockist-modal .close').addEventListener('click', closeStockistModal);
    
    // Modal close when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('stockist-modal')) {
            closeStockistModal();
        }
    });
});

let currentStockistPage = 1;
let totalStockistPages = 1;

function loadStockists(page = 1, search = '') {
    let url = `../API/adminAPI.php?action=get_stockists&page=${page}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const tbody = document.querySelector('#stockists-table tbody');
                tbody.innerHTML = '';
                
                data.stockists.forEach(stockist => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${stockist.RetailerID}</td>
                        <td>${stockist.Name}</td>
                        <td><a href="${stockist.Website}" target="_blank">${stockist.Website}</a></td>
                        <td>${stockist.LogoURL ? '<img src="' + stockist.LogoURL + '" height="30">' : 'N/A'}</td>
                        <td>
                            <button class="btn-secondary edit-stockist" data-id="${stockist.RetailerID}">Edit</button>
                            <button class="btn-danger delete-stockist" data-id="${stockist.RetailerID}">Delete</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                
                // Update pagination
                currentStockistPage = page;
                totalStockistPages = data.pages;
                document.getElementById('stockist-page-info').textContent = `Page ${currentStockistPage} of ${totalStockistPages}`;
                
                // Add event listeners to edit/delete buttons
                document.querySelectorAll('.edit-stockist').forEach(btn => {
                    btn.addEventListener('click', editStockist);
                });
                
                document.querySelectorAll('.delete-stockist').forEach(btn => {
                    btn.addEventListener('click', deleteStockist);
                });
            }
        })
        .catch(error => {
            console.error('Error loading stockists:', error);
            alert('Error loading stockists. Please try again.');
        });
}

function showStockistModal(stockistId = null) {
    const modal = document.getElementById('stockist-modal');
    const form = document.getElementById('stockist-form');
    const title = document.getElementById('stockist-modal-title');
    
    if (stockistId) {
        // Edit mode
        title.textContent = 'Edit Stockist';
        fetch(`../API/adminAPI.php?action=get_stockist&id=${stockistId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('stockist-id').value = data.stockist.RetailerID;
                    document.getElementById('stockist-name').value = data.stockist.Name;
                    document.getElementById('stockist-website').value = data.stockist.Website;
                    document.getElementById('stockist-logo').value = data.stockist.LogoURL || '';
                    modal.style.display = 'block';
                }
            })
            .catch(error => {
                console.error('Error loading stockist:', error);
                alert('Error loading stockist data. Please try again.');
            });
    } else {
        // Add mode
        title.textContent = 'Add New Stockist';
        form.reset();
        document.getElementById('stockist-id').value = '';
        modal.style.display = 'block';
    }
}

function closeStockistModal() {
    document.getElementById('stockist-modal').style.display = 'none';
}

function editStockist(e) {
    const stockistId = e.target.dataset.id;
    showStockistModal(stockistId);
}

function deleteStockist(e) {
    if (confirm('Are you sure you want to delete this stockist?')) {
        const stockistId = e.target.dataset.id;
        makeApiCall('delete_stockist', 'POST', { id: stockistId })
            .then(data => {
                if (data.success) {
                    loadStockists(currentStockistPage);
                } else {
                    alert(data.message || 'Error deleting stockist');
                }
            })
            .catch(error => {
                console.error('Error deleting stockist:', error);
                alert('Error deleting stockist. Please try again.');
            });
    }
}

function saveStockist(e) {
    e.preventDefault();
    
    const formData = {
        id: document.getElementById('stockist-id').value,
        name: document.getElementById('stockist-name').value,
        website: document.getElementById('stockist-website').value,
        logoUrl: document.getElementById('stockist-logo').value
    };
    
    makeApiCall('add_edit_stockist', 'POST', formData)
        .then(data => {
            if (data.success) {
                closeStockistModal();
                loadStockists(currentStockistPage);
            } else {
                alert(data.message || 'Error saving stockist');
            }
        })
        .catch(error => {
            console.error('Error saving stockist:', error);
            alert('Error saving stockist. Please try again.');
        });
}

function searchStockists() {
    const searchTerm = document.getElementById('stockist-search').value;
    loadStockists(1, searchTerm);
}

function prevStockistPage() {
    if (currentStockistPage > 1) {
        loadStockists(currentStockistPage - 1);
    }
}

function nextStockistPage() {
    if (currentStockistPage < totalStockistPages) {
        loadStockists(currentStockistPage + 1);
    }
}