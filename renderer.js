// Basic structure, will be filled in later steps
console.log("Renderer.js loaded");

// Example of how to use exposed functions from preload.js
// window.electronAPI.saveFile(...);

document.addEventListener('DOMContentLoaded', () => {
    const extractDropArea = document.getElementById('extractDropArea');
    const extractFileInfo = document.getElementById('extractFileInfo');
    const pageRangeInput = document.getElementById('pageRange');
    const extractButton = document.getElementById('extractButton');

    const mergeDropArea = document.getElementById('mergeDropArea');
    const mergeFileList = document.getElementById('mergeFileList');
    const mergeButton = document.getElementById('mergeButton');
    const statusMessages = document.getElementById('statusMessages');

    // Placeholder for file paths
    let currentFileForExtraction = null;
    let filesForMerging = [];

    function displayMessage(message, type = 'info') {
        statusMessages.textContent = message;
        statusMessages.className = ''; // Clear previous classes
        statusMessages.classList.add(`status-${type}`);
        console.log(`Status (${type}): ${message}`);
    }

    // --- Extraction Specific Logic ---
    extractDropArea.addEventListener('dragover', (event) => {
        event.preventDefault(); // Necessary to allow drop
        extractDropArea.style.borderColor = '#007bff';
    });

    extractDropArea.addEventListener('dragleave', (event) => {
        extractDropArea.style.borderColor = '#ccc';
    });

    extractDropArea.addEventListener('drop', (event) => {
        event.preventDefault();
        extractDropArea.style.borderColor = '#ccc';
        const files = event.dataTransfer.files;

        if (files.length === 1 && files[0].type === 'application/pdf') {
            currentFileForExtraction = files[0];
            extractFileInfo.innerHTML = `<div class="file-item">Selected for extraction: ${currentFileForExtraction.name}</div>`;
            displayMessage(`File selected: ${currentFileForExtraction.name}`, 'info');
        } else if (files.length > 1) {
            currentFileForExtraction = null;
            extractFileInfo.innerHTML = '';
            displayMessage('Please drop only a single PDF file for extraction.', 'error');
        } else {
            currentFileForExtraction = null;
            extractFileInfo.innerHTML = '';
            displayMessage('Invalid file type. Please drop a PDF file.', 'error');
        }
    });

    extractButton.addEventListener('click', async () => {
        if (!currentFileForExtraction) {
            displayMessage('Please drop a PDF file first.', 'error');
            return;
        }
        const range = pageRangeInput.value.trim();
        if (!range) {
            displayMessage('Please enter a page range.', 'error');
            return;
        }

        displayMessage('Starting page extraction...', 'info');
        console.log(`Extracting from: ${currentFileForExtraction.path}, Range: ${range}`);

        try {
            const newFilePath = await window.electronAPI.extractPages(currentFileForExtraction.path, range);
            if (newFilePath) {
                displayMessage(`Pages extracted successfully! Saved to: ${newFilePath}`, 'success');
                currentFileForExtraction = null;
                extractFileInfo.innerHTML = '';
                pageRangeInput.value = '';
            } else {
                // User cancelled save dialog
                displayMessage('Page extraction cancelled by user.', 'info');
            }
        } catch (error) {
            console.error('Extraction error:', error);
            displayMessage(`Error during extraction: ${error.message}`, 'error');
            // Also show a native error dialog via main process
            window.electronAPI.showError('Extraction Error', error.message);
        }
    });


    // --- Merging Specific Logic ---
    mergeDropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        mergeDropArea.style.borderColor = '#007bff';
    });

    mergeDropArea.addEventListener('dragleave', (event) => {
        mergeDropArea.style.borderColor = '#ccc';
    });

    mergeDropArea.addEventListener('drop', (event) => {
        event.preventDefault();
        mergeDropArea.style.borderColor = '#ccc';
        const droppedFiles = event.dataTransfer.files;

        let newFilesAdded = false;
        for (let i = 0; i < droppedFiles.length; i++) {
            const file = droppedFiles[i];
            if (file.type === 'application/pdf') {
                // Avoid adding duplicates by path
                if (!filesForMerging.find(f => f.path === file.path)) {
                    filesForMerging.push(file);
                    newFilesAdded = true;
                }
            }
        }

        if (newFilesAdded) {
            updateMergeFileList();
            displayMessage(`${droppedFiles.length} file(s) processed for merging. Check list below.`, 'info');
        } else if (droppedFiles.length > 0) {
            displayMessage('Only PDF files can be added for merging, or files already added.', 'error');
        }
    });

    function updateMergeFileList() {
        mergeFileList.innerHTML = ''; // Clear current list
        if (filesForMerging.length > 0) {
            const list = document.createElement('ul');
            filesForMerging.forEach((file, index) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${index + 1}. ${file.name}`;
                listItem.className = 'file-item';
                list.appendChild(listItem);
            });
            mergeFileList.appendChild(list);
        } else {
            mergeFileList.innerHTML = '<p>No files queued for merging.</p>';
        }
    }

    mergeButton.addEventListener('click', async () => {
        if (filesForMerging.length < 2) {
            displayMessage('Please add at least two PDF files to merge.', 'error');
            return;
        }

        displayMessage('Starting PDF merge...', 'info');
        const filePaths = filesForMerging.map(f => f.path);
        console.log('Merging files:', filePaths);

        try {
            const newFilePath = await window.electronAPI.mergePdfs(filePaths);
            if (newFilePath) {
                displayMessage(`PDFs merged successfully! Saved to: ${newFilePath}`, 'success');
                filesForMerging = []; // Clear the list
                updateMergeFileList();
            } else {
                // User cancelled save dialog
                displayMessage('PDF merge cancelled by user.', 'info');
            }
        } catch (error) {
            console.error('Merging error:', error);
            displayMessage(`Error during merging: ${error.message}`, 'error');
            window.electronAPI.showError('Merge Error', error.message);
        }
    });

    // Initial UI updates
    updateMergeFileList(); // Show "No files queued" initially
});
