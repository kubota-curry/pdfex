const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs').promises; // Using promises version of fs
const { PDFDocument } = require('pdf-lib');
const path = require('path');


// Helper function to parse page ranges like "1-3, 5, 7-9"
// Returns a zero-based array of page numbers
function parsePageRanges(pageRangesStr, totalPages) {
    const result = new Set();
    if (!pageRangesStr) return [];

    const ranges = pageRangesStr.split(',');
    for (const range of ranges) {
        const trimmedRange = range.trim();
        if (trimmedRange.includes('-')) {
            const [start, end] = trimmedRange.split('-').map(num => parseInt(num.trim(), 10));
            if (!isNaN(start) && !isNaN(end) && start <= end && start > 0 && end <= totalPages) {
                for (let i = start; i <= end; i++) {
                    result.add(i - 1); // pdf-lib is 0-indexed
                }
            } else {
                throw new Error(`Invalid page range: ${trimmedRange}. Ensure start <= end, and pages are within document bounds (1-${totalPages}).`);
            }
        } else {
            const pageNum = parseInt(trimmedRange, 10);
            if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
                result.add(pageNum - 1); // pdf-lib is 0-indexed
            } else {
                throw new Error(`Invalid page number: ${trimmedRange}. Page must be within document bounds (1-${totalPages}).`);
            }
        }
    }
    return Array.from(result).sort((a,b) => a-b); // Sort them to ensure correct order for copying
}

contextBridge.exposeInMainWorld('electronAPI', {
    extractPages: async (filePath, pageRangeStr) => {
        try {
            const pdfBytes = await fs.readFile(filePath);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const totalPages = pdfDoc.getPageCount();

            const pagesToExtract = parsePageRanges(pageRangeStr, totalPages);

            if (pagesToExtract.length === 0) {
                throw new Error('No valid pages selected or page range is empty.');
            }

            const newPdfDoc = await PDFDocument.create();
            const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToExtract);
            copiedPages.forEach(page => newPdfDoc.addPage(page));

            const newPdfBytes = await newPdfDoc.save();

            // Ask main process to show save dialog
            const result = await ipcRenderer.invoke('save-dialog', {
                title: 'Save Extracted PDF',
                defaultPath: `extracted-pages-${path.basename(filePath)}`,
                filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
            });

            if (result.canceled || !result.filePath) {
                console.log('Save dialog cancelled by user.');
                return null; // Indicate cancellation
            }

            await fs.writeFile(result.filePath, newPdfBytes);
            return result.filePath; // Return the path where file was saved
        } catch (error) {
            console.error("Error in extractPages:", error);
            throw error; // Re-throw to be caught in renderer.js
        }
    },
    mergePdfs: async (filePaths) => {
        try {
            const newPdfDoc = await PDFDocument.create();

            for (const filePath of filePaths) {
                const pdfBytes = await fs.readFile(filePath);
                const pdfDoc = await PDFDocument.load(pdfBytes);
                const pageIndices = pdfDoc.getPageIndices(); // 0-indexed array of all page indices
                const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
                copiedPages.forEach(page => newPdfDoc.addPage(page));
            }

            const newPdfBytes = await newPdfDoc.save();

            const result = await ipcRenderer.invoke('save-dialog', {
                title: 'Save Merged PDF',
                defaultPath: 'merged.pdf',
                filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
            });

            if (result.canceled || !result.filePath) {
                console.log('Save dialog cancelled by user.');
                return null; // Indicate cancellation
            }

            await fs.writeFile(result.filePath, newPdfBytes);
            return result.filePath;
        } catch (error) {
            console.error("Error in mergePdfs:", error);
            throw error;
        }
    },
    showError: (title, content) => {
        ipcRenderer.invoke('show-error-message', title, content);
    }
});

console.log("Preload.js executed and electronAPI exposed.");
