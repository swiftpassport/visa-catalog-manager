// In-memory storage for the application
let memoryStorage = {
    visaData: []
};

// Global variables
let visaData = [];
let filteredData = [];
let bulkEditMode = false;
let selectedRows = new Set();
let currentEditRow = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    setupKeyboardShortcuts();
    updateStats();
});

// Storage functions using in-memory storage
function saveData() {
    memoryStorage.visaData = visaData;
}

function loadData() {
    // Check if we have data in memory
    if (memoryStorage.visaData && memoryStorage.visaData.length > 0) {
        visaData = memoryStorage.visaData;
    } else {
        // Start with empty data - user will import their CSV files
        visaData = [];
    }
    filteredData = [...visaData];
    renderTable();
}

// Event Listeners
function setupEventListeners() {
    // Import file button - simplified approach
    document.getElementById('importBtn').addEventListener('click', function() {
        document.getElementById('importFile').click();
    });
    
    // Import file input
    document.getElementById('importFile').addEventListener('change', handleFileImport);
    
    // Export dropdown
    document.getElementById('exportBtn').addEventListener('click', toggleExportDropdown);
    document.querySelectorAll('#exportDropdown a').forEach(link => {
        link.addEventListener('click', handleExport);
    });
    
    // Bulk edit
    document.getElementById('bulkEditBtn').addEventListener('click', toggleBulkEdit);
    document.getElementById('selectAll').addEventListener('change', handleSelectAll);
    document.getElementById('bulkEditFeesBtn').addEventListener('click', () => openBulkEditModal('fees'));
    document.getElementById('bulkEditDocsBtn').addEventListener('click', () => openBulkEditModal('docs'));
    document.getElementById('bulkDeleteBtn').addEventListener('click', handleBulkDelete);
    
    // Search
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // Add service
    document.getElementById('addRowBtn').addEventListener('click', openAddServiceModal);
    document.getElementById('addServiceForm').addEventListener('submit', handleAddService);
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Document form
    document.getElementById('docForm').addEventListener('submit', handleDocumentSave);
    
    // Bulk edit form
    document.getElementById('bulkEditForm').addEventListener('submit', handleBulkEditSave);
    
    // Click outside modal to close
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 's':
                    e.preventDefault();
                    saveData();
                    showTooltip('Data saved!', e.clientX, e.clientY);
                    break;
                case 'e':
                    e.preventDefault();
                    toggleExportDropdown();
                    break;
                case 'b':
                    e.preventDefault();
                    toggleBulkEdit();
                    break;
            }
        } else if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
}

// Table rendering
function renderTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 40px; color: #718096;">No data loaded. Please import your CSV files to begin.</td></tr>';
        return;
    }
    
    filteredData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="display: ${bulkEditMode ? 'table-cell' : 'none'};" class="select-column">
                <input type="checkbox" class="row-select" data-id="${row.id}">
            </td>
            <td>${row.country || row.destinationCountry || 'N/A'}</td>
            <td>${row.passportOrigin || 'N/A'}</td>
            <td>${row.service || row.visaType || 'N/A'}</td>
            <td>${row.provider || row.partnerGroup || 'N/A'}</td>
            <td>
                <input type="number" class="fee-input" value="${row.fee || row.cost || ''}" 
                       data-id="${row.id}" min="0" step="0.01">
            </td>
            <td>${row.processingTime || row.processingDuration || 'N/A'}</td>
            <td>${row.entries || row.numberOfEntries || 'N/A'}</td>
            <td>${row.validity || row.visaValidity || 'N/A'}</td>
            <td class="doc-cell" data-id="${row.id}">
                ${getDocumentDisplay(row.documents)}
            </td>
            <td>${getStatusBadge(row)}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteRow(${row.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add event listeners to new elements
    document.querySelectorAll('.fee-input').forEach(input => {
        input.addEventListener('input', handleFeeChange);
        input.addEventListener('blur', validateFee);
    });
    
    document.querySelectorAll('.doc-cell').forEach(cell => {
        cell.addEventListener('click', openDocumentModal);
    });
    
    document.querySelectorAll('.row-select').forEach(checkbox => {
        checkbox.addEventListener('change', handleRowSelect);
    });
    
    updateStats();
}

// Document display
function getDocumentDisplay(documents) {
    if (!documents || (!documents.required?.length && !documents.special?.length)) {
        return '<span class="no-docs missing-docs">No documents specified</span>';
    }
    
    const docCount = (documents.required?.length || 0) + (documents.special?.length || 0);
    const preview = documents.required?.slice(0, 2).join(', ') || 'Special requirements only';
    
    return `${preview}${documents.required?.length > 2 ? '...' : ''} 
            <span class="doc-count">${docCount}</span>`;
}

// Status badge
function getStatusBadge(row) {
    const hasFee = (row.fee || row.cost) && (row.fee > 0 || row.cost > 0);
    const hasDocs = row.documents && row.documents.required && row.documents.required.length > 0;
    const isComplete = hasFee && hasDocs;
    
    return `<span class="status-badge ${isComplete ? 'status-complete' : 'status-incomplete'}">
            ${isComplete ? 'Complete' : 'Incomplete'}
            </span>`;
}

// Fee handling
function handleFeeChange(e) {
    const id = parseInt(e.target.dataset.id);
    const value = parseFloat(e.target.value) || 0;
    
    const row = visaData.find(r => r.id === id);
    if (row) {
        row.fee = value;
        row.cost = value; // Support both field names
        e.target.classList.add('edited-cell');
        setTimeout(() => e.target.classList.remove('edited-cell'), 1000);
        saveData();
        updateStats();
    }
}

function validateFee(e) {
    const value = e.target.value;
    
    if (value && (isNaN(value) || parseFloat(value) < 0)) {
        e.target.classList.add('error');
        showTooltip('Please enter a valid positive number', e.target.offsetLeft, e.target.offsetTop);
    } else {
        e.target.classList.remove('error');
    }
}

// Document modal
function openDocumentModal(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    const row = visaData.find(r => r.id === id);
    currentEditRow = row;
    
    if (row) {
        const serviceInfo = `${row.country || row.destinationCountry} - ${row.service || row.visaType} (${row.passportOrigin || 'All'})`;
        document.getElementById('docServiceInfo').value = serviceInfo;
        document.getElementById('docList').value = row.documents?.required?.join('\n') || '';
        document.getElementById('specialReqs').value = row.documents?.special?.join('\n') || '';
        document.getElementById('docModal').style.display = 'block';
    }
}

function handleDocumentSave(e) {
    e.preventDefault();
    
    if (currentEditRow) {
        const docList = document.getElementById('docList').value
            .split('\n')
            .filter(doc => doc.trim());
        const specialReqs = document.getElementById('specialReqs').value
            .split('\n')
            .filter(req => req.trim());
        
        currentEditRow.documents = {
            required: docList,
            special: specialReqs
        };
        
        saveData();
        renderTable();
        document.getElementById('docModal').style.display = 'none';
        showTooltip('Documents updated successfully!', window.innerWidth / 2, window.innerHeight / 2);
    }
}

// Bulk edit
function toggleBulkEdit() {
    bulkEditMode = !bulkEditMode;
    selectedRows.clear();
    
    document.querySelectorAll('.select-column').forEach(col => {
        col.style.display = bulkEditMode ? 'table-cell' : 'none';
    });
    
    document.getElementById('bulkActions').classList.toggle('show', bulkEditMode);
    document.getElementById('bulkEditBtn').textContent = bulkEditMode ? '✖️ Cancel Bulk Edit' : '✏️ Bulk Edit';
    document.getElementById('selectAll').checked = false;
}

function handleSelectAll(e) {
    const isChecked = e.target.checked;
    
    document.querySelectorAll('.row-select').forEach(checkbox => {
        checkbox.checked = isChecked;
        const id = parseInt(checkbox.dataset.id);
        if (isChecked) {
            selectedRows.add(id);
        } else {
            selectedRows.delete(id);
        }
    });
}

function handleRowSelect(e) {
    const id = parseInt(e.target.dataset.id);
    
    if (e.target.checked) {
        selectedRows.add(id);
    } else {
        selectedRows.delete(id);
    }
    
    // Update select all checkbox
    const allCheckboxes = document.querySelectorAll('.row-select');
    const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
    document.getElementById('selectAll').checked = allChecked;
}

function openBulkEditModal(type) {
    if (selectedRows.size === 0) {
        alert('Please select at least one row to edit');
        return;
    }
    
    const modal = document.getElementById('bulkEditModal');
    const title = document.getElementById('bulkEditTitle');
    const content = document.getElementById('bulkEditContent');
    
    if (type === 'fees') {
        title.textContent = 'Bulk Edit Fees';
        content.innerHTML = `
            <div class="form-group">
                <label>New Fee for ${selectedRows.size} selected items:</label>
                <input type="number" id="bulkFee" min="0" step="0.01" required>
            </div>
        `;
    } else if (type === 'docs') {
        title.textContent = 'Bulk Edit Documents';
        content.innerHTML = `
            <div class="form-group">
                <label>Add Required Documents (one per line):</label>
                <textarea id="bulkDocs" placeholder="These will be added to existing documents"></textarea>
            </div>
            <div class="form-group">
                <label>Add Special Requirements (one per line):</label>
                <textarea id="bulkSpecial" placeholder="These will be added to existing requirements"></textarea>
            </div>
        `;
    }
    
    modal.style.display = 'block';
}

function handleBulkEditSave(e) {
    e.preventDefault();
    
    const bulkFee = document.getElementById('bulkFee');
    const bulkDocs = document.getElementById('bulkDocs');
    
    selectedRows.forEach(id => {
        const row = visaData.find(r => r.id === id);
        if (row) {
            if (bulkFee) {
                row.fee = parseFloat(bulkFee.value) || 0;
                row.cost = row.fee; // Support both field names
            }
            if (bulkDocs) {
                const newDocs = bulkDocs.value.split('\n').filter(d => d.trim());
                const newSpecial = document.getElementById('bulkSpecial').value.split('\n').filter(s => s.trim());
                
                if (!row.documents) row.documents = { required: [], special: [] };
                row.documents.required = [...new Set([...row.documents.required, ...newDocs])];
                row.documents.special = [...new Set([...row.documents.special, ...newSpecial])];
            }
        }
    });
    
    saveData();
    renderTable();
    document.getElementById('bulkEditModal').style.display = 'none';
    toggleBulkEdit();
    showTooltip('Bulk changes applied successfully!', window.innerWidth / 2, window.innerHeight / 2);
}

function handleBulkDelete() {
    if (selectedRows.size === 0) {
        alert('Please select at least one row to delete');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedRows.size} selected items?`)) {
        visaData = visaData.filter(row => !selectedRows.has(row.id));
        saveData();
        filteredData = [...visaData];
        renderTable();
        toggleBulkEdit();
    }
}

// Search
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    
    if (!query) {
        filteredData = [...visaData];
    } else {
        filteredData = visaData.filter(row => {
            const searchFields = [
                row.country,
                row.destinationCountry,
                row.service,
                row.visaType,
                row.provider,
                row.partnerGroup,
                row.passportOrigin,
                row.processingTime,
                row.processingDuration,
                row.entries,
                row.numberOfEntries,
                row.validity,
                row.visaValidity,
                ...(row.documents?.required || []),
                ...(row.documents?.special || [])
            ].filter(Boolean).join(' ').toLowerCase();
            
            return searchFields.includes(query);
        });
    }
    
    renderTable();
}

// Add service
function openAddServiceModal() {
    document.getElementById('addServiceModal').style.display = 'block';
}

function handleAddService(e) {
    e.preventDefault();
    
    const newRow = {
        id: Date.now(),
        country: document.getElementById('newCountry').value,
        destinationCountry: document.getElementById('newCountry').value,
        passportOrigin: document.getElementById('newPassportOrigin').value,
        service: document.getElementById('newService').value,
        visaType: document.getElementById('newService').value,
        provider: document.getElementById('newProvider').value,
        partnerGroup: document.getElementById('newProvider').value,
        fee: parseFloat(document.getElementById('newFee').value) || 0,
        cost: parseFloat(document.getElementById('newFee').value) || 0,
        processingTime: document.getElementById('newProcessingTime').value || 'N/A',
        processingDuration: document.getElementById('newProcessingTime').value || 'N/A',
        entries: document.getElementById('newEntries').value,
        numberOfEntries: document.getElementById('newEntries').value,
        validity: document.getElementById('newValidity').value || 'N/A',
        visaValidity: document.getElementById('newValidity').value || 'N/A',
        documents: { required: [], special: [] }
    };
    
    visaData.push(newRow);
    saveData();
    filteredData = [...visaData];
    renderTable();
    
    document.getElementById('addServiceModal').style.display = 'none';
    document.getElementById('addServiceForm').reset();
}

// Delete row
function deleteRow(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        visaData = visaData.filter(row => row.id !== id);
        saveData();
        filteredData = [...visaData];
        renderTable();
    }
}

// Import/Export functions
function handleFileImport(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    console.log('Files selected:', files.length); // Debug log
    
    let importedData = [];
    let filesProcessed = 0;
    
    files.forEach(file => {
        const reader = new FileReader();
        const fileType = file.name.split('.').pop().toLowerCase();
        
        reader.onload = function(event) {
            try {
                let data;
                
                if (fileType === 'csv') {
                    const parsed = Papa.parse(event.target.result, {
                        header: true,
                        dynamicTyping: true,
                        skipEmptyLines: true
                    });
                    data = parsed.data;
                } else if (fileType === 'json') {
                    data = JSON.parse(event.target.result);
                } else {
                    alert(`${file.name}: Excel files require manual CSV export first.`);
                    filesProcessed++;
                    return;
                }
                
                console.log(`Processing ${file.name} with ${data.length} rows`); // Debug log
                
                // Process based on file structure
                if (file.name.includes('feesexport')) {
                    // Main export file
                    data.forEach((row, index) => {
                        if (row['Destination Country'] && row.Cost !== null) {
                            importedData.push({
                                id: Date.now() + index,
                                country: row['Destination Country'],
                                destinationCountry: row['Destination Country'],
                                passportOrigin: row['Passport Origin'] || 'All',
                                service: row.Title || row['Product Type'] || 'Visa',
                                visaType: row['Trip Purpose'] || 'General',
                                provider: row['Partner Group'] || 'Partner',
                                partnerGroup: row['Partner Group'] || 'Partner',
                                fee: parseFloat(row.Cost) || parseFloat(row['Total Fee']) || 0,
                                cost: parseFloat(row.Cost) || parseFloat(row['Total Fee']) || 0,
                                processingTime: row['Processing Duration'] || 'N/A',
                                processingDuration: row['Processing Duration'] || 'N/A',
                                entries: row['Number of Entries'] || 'Single',
                                numberOfEntries: row['Number of Entries'] || 'Single',
                                validity: row['Visa Validity'] || 'N/A',
                                visaValidity: row['Visa Validity'] || 'N/A',
                                documents: { required: [], special: [] },
                                feeType: row['Fee Type'] || 'Standard'
                            });
                        }
                    });
                } else if (file.name.includes('feescorrected') || file.name.includes('feespage')) {
                    // Corrected fees files
                    data.forEach((row, index) => {
                        if (row.Countries_Applied_To && row.Countries_Applied_To !== '-') {
                            // Split countries if multiple
                            const countriesText = row.Countries_Applied_To || row.Destination;
                            const isMultiCountry = countriesText && countriesText.includes(',') && countriesText.length > 100;
                            
                            if (isMultiCountry) {
                                // This is a multi-country visa (like Schengen)
                                importedData.push({
                                    id: Date.now() + index * 1000,
                                    country: "Multiple Countries",
                                    destinationCountry: "Multiple Countries",
                                    passportOrigin: row.Passport_Origin || 'All',
                                    service: row.Title || row.Visa_Type || 'Multi-Country Visa',
                                    visaType: row.Visa_Type || row['Trip Purpose'] || 'General',
                                    provider: row.Partner_Group || 'Partner',
                                    partnerGroup: row.Partner_Group || 'Partner',
                                    fee: parseFloat(row.Cost) || 0,
                                    cost: parseFloat(row.Cost) || 0,
                                    processingTime: row.Processing_Time || 'N/A',
                                    processingDuration: row.Processing_Time || 'N/A',
                                    entries: row.Number_of_Entries || row.Entries || 'Multiple',
                                    numberOfEntries: row.Number_of_Entries || row.Entries || 'Multiple',
                                    validity: row.Visa_Validity || row.Validity || 'Varies',
                                    visaValidity: row.Visa_Validity || row.Validity || 'Varies',
                                    documents: { required: [], special: [] },
                                    feeType: row.Fee_Type || 'Standard',
                                    applicableCountries: countriesText
                                });
                            } else if (countriesText) {
                                // Single country or small list
                                const countries = countriesText.split(',').map(c => c.trim());
                                countries.forEach((country, idx) => {
                                    if (country && country !== '-') {
                                        importedData.push({
                                            id: Date.now() + index * 1000 + idx,
                                            country: country,
                                            destinationCountry: country,
                                            passportOrigin: row.Passport_Origin || 'All',
                                            service: row.Title || row.Visa_Type || 'Visa',
                                            visaType: row.Visa_Type || row['Trip Purpose'] || 'General',
                                            provider: row.Partner_Group || 'Partner',
                                            partnerGroup: row.Partner_Group || 'Partner',
                                            fee: parseFloat(row.Cost) || 0,
                                            cost: parseFloat(row.Cost) || 0,
                                            processingTime: row.Processing_Time || 'N/A',
                                            processingDuration: row.Processing_Time || 'N/A',
                                            entries: row.Number_of_Entries || row.Entries || 'Single',
                                            numberOfEntries: row.Number_of_Entries || row.Entries || 'Single',
                                            validity: row.Visa_Validity || row.Validity || '30 days',
                                            visaValidity: row.Visa_Validity || row.Validity || '30 days',
                                            documents: { required: [], special: [] },
                                            feeType: row.Fee_Type || 'Standard'
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                
                filesProcessed++;
                
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                alert(`Error importing ${file.name}: ${error.message}`);
                filesProcessed++;
            }
            
            // Check if all files are processed
            if (filesProcessed === files.length) {
                // All files processed
                console.log(`Import complete. Total entries: ${importedData.length}`); // Debug log
                
                if (importedData.length > 0) {
                    // Merge with existing data or replace
                    if (visaData.length === 0 || confirm('Do you want to replace existing data? (Cancel to append)')) {
                        visaData = importedData;
                    } else {
                        visaData = [...visaData, ...importedData];
                    }
                    
                    saveData();
                    filteredData = [...visaData];
                    renderTable();
                    showTooltip(`Successfully imported ${importedData.length} entries!`, window.innerWidth / 2, window.innerHeight / 2);
                } else {
                    alert('No valid data found in the imported files. Please check your CSV format.');
                }
            }
        };
        
        reader.readAsText(file);
    });
    
    // Reset file input
    e.target.value = '';
}

function toggleExportDropdown() {
    document.getElementById('exportDropdown').classList.toggle('show');
}

function handleExport(e) {
    e.preventDefault();
    const format = e.target.dataset.format;
    
    document.getElementById('exportDropdown').classList.remove('show');
    
    if (format === 'csv') {
        exportCSV();
    } else if (format === 'json') {
        exportJSON();
    }
}

function exportCSV() {
    const headers = [
        'ID', 'Destination Country', 'Passport Origin', 'Visa Type/Service', 
        'Service Provider', 'Fee', 'Processing Time', 'Number of Entries', 
        'Visa Validity', 'Documents Required', 'Special Requirements', 'Status'
    ];
    
    const rows = visaData.map(row => [
        row.id,
        row.country || row.destinationCountry,
        row.passportOrigin || 'All',
        row.service || row.visaType,
        row.provider || row.partnerGroup,
        row.fee || row.cost || 0,
        row.processingTime || row.processingDuration,
        row.entries || row.numberOfEntries,
        row.validity || row.visaValidity,
        row.documents?.required?.join('; ') || '',
        row.documents?.special?.join('; ') || '',
        getStatusText(row)
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    downloadFile(csv, 'visa-catalog-' + getTimestamp() + '.csv', 'text/csv');
}

function exportJSON() {
    const json = JSON.stringify(visaData, null, 2);
    downloadFile(json, 'visa-catalog-' + getTimestamp() + '.json', 'application/json');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function getTimestamp() {
    const date = new Date();
    return date.toISOString().split('T')[0];
}

function getStatusText(row) {
    const hasFee = (row.fee || row.cost) && (row.fee > 0 || row.cost > 0);
    const hasDocs = row.documents && row.documents.required && row.documents.required.length > 0;
    return hasFee && hasDocs ? 'Complete' : 'Incomplete';
}

// Stats
function updateStats() {
    document.getElementById('totalCountries').textContent = visaData.length;
    
    const complete = visaData.filter(row => {
        const hasFee = (row.fee || row.cost) && (row.fee > 0 || row.cost > 0);
        const hasDocs = row.documents?.required?.length > 0;
        return hasFee && hasDocs;
    }).length;
    document.getElementById('completeEntries').textContent = complete;
    
    const totalCost = visaData.reduce((sum, row) => sum + (row.fee || row.cost || 0), 0);
    document.getElementById('totalCost').textContent = '$' + totalCost.toFixed(2);
    
    const totalDocs = visaData.reduce((sum, row) => 
        sum + (row.documents?.required?.length || 0) + (row.documents?.special?.length || 0), 0
    );
    document.getElementById('totalDocs').textContent = totalDocs;
}

// Tooltip
function showTooltip(message, x, y) {
    const tooltip = document.getElementById('tooltip');
    tooltip.textContent = message;
    tooltip.style.left = x + 'px';
    tooltip.style.top = (y - 40) + 'px';
    tooltip.classList.add('show');
    
    setTimeout(() => {
        tooltip.classList.remove('show');
    }, 2000);
}