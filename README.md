# CPI-XSLT Editor

A powerful web-based XSLT editor designed specifically for SAP Cloud Integration. This tool provides an intuitive interface for developing, testing, and debugging XSLT transformations with real-time validation, syntax highlighting, and built-in examples.

## Features

- **Monaco Editor Integration**: Professional code editing experience with syntax highlighting for XML and XSLT
- **Real-time XSLT Validation**: Instant feedback on syntax errors and validation issues
- **Live Transformation Engine**: Powered by SaxonJS for accurate XSLT 3.0 processing
- **File Upload/Download**: Easily import and export XML and XSLT files
- **Built-in Examples**: Six comprehensive examples covering various XSLT scenarios
- **Code Formatting**: Automatic XML/XSLT formatting with pretty-printing
- **Console Output**: Detailed error reporting and transformation logs
- **Keyboard Shortcuts**: Efficient workflow with common shortcuts (Ctrl+Enter to run, etc.)
- **Responsive Design**: Works seamlessly across different screen sizes

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server installation required - runs entirely in the browser

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SunilPharswan/CPI-XSLT.git
   cd cpi-xslt
   ```

2. Start a local HTTP server (required for ES6 modules):

   **Using Python 3:**
   ```bash
   python -m http.server 8000
   ```

   **Using Python 2:**
   ```bash
   python -m SimpleHTTPServer 8000
   ```

   **Using Node.js (if available):**
   ```bash
   npx http-server -p 8000
   ```

   **Using PHP:**
   ```bash
   php -S localhost:8000
   ```

3. Open `http://localhost:8000` in your web browser

The application runs entirely client-side but requires a web server due to ES6 module imports.

## Usage

### Basic Workflow

1. **Input XML**: Enter or paste your source XML data in the left panel
2. **XSLT Stylesheet**: Write your XSLT transformation in the middle panel
3. **Run Transformation**: Click the "▶️ RUN TRANSFORMATION" button or press `Ctrl+Enter`
4. **View Output**: See the transformation results in the right panel

### Key Features

- **File Operations**:
  - Upload XML/XSLT files using the upload buttons
  - Download content using the download buttons
  - Copy content to clipboard

- **Code Formatting**:
  - Click the format button (🔧) in each panel to auto-format code
  - XML pretty-printing with proper indentation

- **Examples**: Select from the dropdown to load pre-built examples:
  - **Basic**: Simple XML to XML transformation
  - **HTML Table**: Convert XML data to HTML table
  - **Data Filtering**: Filter and transform data based on conditions
  - **Grouping**: Group data and perform aggregations
  - **JSON-like Output**: Generate JSON-like text output
  - **Complex Document**: Invoice processing with advanced formatting

- **Console**: Monitor transformation errors and runtime information

## Examples

### Basic XML Transformation
Transforms user data into a structured report with timestamps.

### HTML Table Generation
Converts book library data into a formatted HTML table with CSS styling.

### Data Filtering
Filters employee data based on department, status, and salary criteria.

### Grouping and Aggregation
Groups sales data by category and calculates totals.

### JSON Output
Generates JSON-like text from XML API responses.

### Complex Invoice Processing
Creates a professional HTML invoice with calculations and styling.

## Technologies Used

- **Monaco Editor**: Microsoft's code editor component
- **SaxonJS**: XSLT 3.0 processor for JavaScript
- **HTML5/CSS3**: Modern web standards
- **ES6 Modules**: Modular JavaScript architecture
- **Font Awesome**: Icon library for UI elements

## Keyboard Shortcuts

- `Ctrl+Enter`: Run transformation
- `Ctrl+S`: Download output
- `Ctrl+P`: Format all code

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- Powered by [SaxonJS](https://www.saxonica.com/saxon-js/index.xml)
- Icons from [Font Awesome](https://fontawesome.com/)
