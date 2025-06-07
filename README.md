# pdfex
pdfから好きなページを抜き出す


## How to Use

This application allows you to extract pages from a PDF and merge multiple PDF files.

### Prerequisites

*   **Node.js and npm:** You need to have Node.js installed, which includes npm (Node Package Manager). You can download it from [nodejs.org](https://nodejs.org/).

### Installation

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```
    (Replace `<repository-url>` and `<repository-folder>` with actual values if known, otherwise leave as placeholder)
2.  **Install dependencies:**
    Open your terminal in the project folder and run:
    ```bash
    npm install
    ```
    This will install Electron, pdf-lib, and other necessary packages.

### Running the Application

1.  **Start the application:**
    In your terminal, from the project folder, run:
    ```bash
    npm start
    ```
    This will launch the Electron application window.

### Features

#### 1. Extract Pages from a PDF

*   **Drag and Drop:** Drag a single PDF file and drop it onto the "Extract Pages from PDF" area. The name of the file will appear below the drop area.
*   **Enter Page Range:** In the "Page Range" input field, type the pages you want to extract. Examples:
    *   `1-5` (extracts pages 1 through 5)
    *   `3,7,10` (extracts pages 3, 7, and 10)
    *   `1-3,5,8-10` (extracts pages 1, 2, 3, 5, 8, 9, and 10)
    *   Page numbers should be valid and within the document's total page count.
*   **Click "Extract Pages":** A dialog box will appear asking you where to save the new PDF containing only the extracted pages.
*   **Feedback:** Status messages will indicate if the operation was successful or if any errors occurred.

#### 2. Merge PDFs

*   **Drag and Drop:** Drag one or more PDF files and drop them onto the "Merge PDFs" area. You can drag multiple files at once, or drag files/groups of files sequentially.
*   **File Queue:** The names of the PDFs you've dropped will appear in a numbered list, showing the order in which they will be merged. Dropping the same file path multiple times will only add it once.
*   **Click "Merge PDFs":** Ensure at least two PDFs are in the queue. A dialog box will appear asking you where to save the combined PDF.
*   **Feedback:** Status messages will indicate if the merge was successful or if any errors occurred. The file queue will clear after a successful merge.

---
