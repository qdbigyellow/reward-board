

// static/js/script.js
document.addEventListener('DOMContentLoaded', function() {
    // Load board state from hidden input
    loadBoardState();
    
    // Set up event listeners
    setupEventListeners();
});

function loadBoardState() {
    const stateJson = document.getElementById('board-state').value;
    const state = JSON.parse(stateJson);
    
    // Clear any existing rows
    const boardBody = document.getElementById('board-body');
    boardBody.innerHTML = '';
    
    if (state.rows && state.rows.length > 0) {
        // Load rows from saved state
        state.rows.forEach(rowData => {
            const row = createRowFromData(rowData);
            boardBody.appendChild(row);
        });
    } else {
        // Initialize with 6 empty rows if no saved state
        for (let i = 0; i < 6; i++) {
            addNewRow();
        }
    }
}

function createRowFromData(rowData) {
    const row = document.createElement('tr');
    
    // Add first column (editable) with saved text
    const firstCell = document.createElement('td');
    firstCell.setAttribute('contenteditable', 'true');
    firstCell.classList.add('editable');
    firstCell.textContent = rowData.description || '';
    firstCell.addEventListener('input', saveCurrentState);
    row.appendChild(firstCell);
    
    // Add cells for each day of the week with saved icons
    for (let i = 0; i < 7; i++) {
        const cell = document.createElement('td');
        cell.classList.add('droppable');
        cell.dataset.day = i;
        makeDroppable(cell);
        
        // Add icon if it exists in saved data
        const icon = rowData.icons ? rowData.icons[i] : null;
        if (icon) {
            const iconElement = document.createElement('span');
            iconElement.textContent = icon;
            iconElement.classList.add('cell-icon');
            
            // Add click event to remove the icon
            iconElement.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.parentElement.removeChild(this);
                    saveCurrentState();
                }
            });
            
            cell.appendChild(iconElement);
        }
        
        row.appendChild(cell);
    }
    
    return row;
}

function addNewRow() {
    const boardBody = document.getElementById('board-body');
    const newRow = document.createElement('tr');
    
    // Add first column (editable)
    const firstCell = document.createElement('td');
    firstCell.setAttribute('contenteditable', 'true');
    firstCell.classList.add('editable');
    firstCell.addEventListener('input', saveCurrentState);
    newRow.appendChild(firstCell);
    
    // Add cells for each day of the week
    for (let i = 0; i < 7; i++) {
        const cell = document.createElement('td');
        cell.classList.add('droppable');
        cell.dataset.day = i;
        makeDroppable(cell);
        newRow.appendChild(cell);
    }
    
    boardBody.appendChild(newRow);
    saveCurrentState();
}

function deleteLastRow() {
    const boardBody = document.getElementById('board-body');
    if (boardBody.children.length > 1) {
        boardBody.removeChild(boardBody.lastElementChild);
        saveCurrentState();
    }
}

function setupEventListeners() {
    // Add row button
    document.getElementById('add-row-btn').addEventListener('click', addNewRow);
    
    // Delete row button
    document.getElementById('delete-row-btn').addEventListener('click', deleteLastRow);
    
    // Regenerate button
    document.getElementById('regenerate-btn').addEventListener('click', confirmRegenerate);
    
    // Make icons draggable
    const icons = document.querySelectorAll('.draggable-icon');
    icons.forEach(icon => {
        icon.addEventListener('dragstart', handleDragStart);
        icon.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.textContent);
    e.dataTransfer.effectAllowed = 'copy';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function makeDroppable(element) {
    element.addEventListener('dragover', e => {
        e.preventDefault();
        element.classList.add('drop-target');
    });
    
    element.addEventListener('dragleave', () => {
        element.classList.remove('drop-target');
    });
    
    element.addEventListener('drop', e => {
        e.preventDefault();
        element.classList.remove('drop-target');
        
        const iconText = e.dataTransfer.getData('text/plain');
        
        // Create the new icon element
        const iconElement = document.createElement('span');
        iconElement.textContent = iconText;
        iconElement.classList.add('cell-icon');
        
        // Clear previous content and add the new icon
        element.innerHTML = '';
        element.appendChild(iconElement);
        
        // Add click event to remove the icon
        iconElement.addEventListener('click', function(e) {
            if (e.target === this) {
                this.parentElement.removeChild(this);
                saveCurrentState();
            }
        });
        
        saveCurrentState();
    });
}

function getCurrentState() {
    const rows = Array.from(document.getElementById('board-body').children);
    const rowsData = rows.map(row => {
        const cells = Array.from(row.children);
        const description = cells[0].textContent;
        
        // Get icons from day cells
        const icons = [];
        for (let i = 1; i < cells.length; i++) {
            const cell = cells[i];
            const iconElement = cell.querySelector('.cell-icon');
            icons.push(iconElement ? iconElement.textContent : null);
        }
        
        return {
            description,
            icons
        };
    });
    
    return {
        last_updated: new Date().toISOString(),
        date: document.getElementById('current-date').textContent,
        week: document.getElementById('week-number').textContent,
        rows: rowsData
    };
}

function saveCurrentState() {
    const state = getCurrentState();
    
    // Send state to server
    fetch('/save_state', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(state)
    })
    .catch(error => console.error('Error saving state:', error));
}

function confirmRegenerate() {
    // Create confirmation dialog
    const dialog = document.createElement('div');
    dialog.className = 'confirmation-dialog';
    
    const dialogContent = document.createElement('div');
    dialogContent.className = 'dialog-content';
    
    const message = document.createElement('p');
    message.textContent = 'Are you sure you want to regenerate the board? This will delete all current data.';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'dialog-buttons';
    
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Regenerate';
    confirmButton.className = 'confirm-btn';
    confirmButton.addEventListener('click', () => {
        regenerateBoard();
        document.body.removeChild(dialog);
    });
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.className = 'cancel-btn';
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(dialog);
    });
    
    buttonContainer.appendChild(confirmButton);
    buttonContainer.appendChild(cancelButton);
    
    dialogContent.appendChild(message);
    dialogContent.appendChild(buttonContainer);
    dialog.appendChild(dialogContent);
    
    document.body.appendChild(dialog);
}

function regenerateBoard() {
    fetch('/regenerate', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(newState => {
        // Update date and week
        document.getElementById('current-date').textContent = newState.date;
        document.getElementById('week-number').textContent = newState.week;
        
        // Clear board and add new empty rows
        const boardBody = document.getElementById('board-body');
        boardBody.innerHTML = '';
        
        for (let i = 0; i < 6; i++) {
            addNewRow();
        }
    })
    .catch(error => console.error('Error regenerating board:', error));
}
