# Swift Passport - Professional Visa Catalog Management System

🌍 A comprehensive web-based tool for managing visa requirements, fees, and documentation with enterprise-level features.

## Live Demo

Visit: [https://swiftpassport.github.io/visa-catalog-manager/](https://swiftpassport.github.io/visa-catalog-manager/)

## Features

### 🚀 Core Functionality

- **Import Multiple File Formats**: CSV, JSON (Excel requires CSV export)
- **Export Data**: CSV and JSON formats with automatic timestamping
- **Real-time Search**: Filter by country, service, passport origin, or documents
- **In-line Fee Editing**: Edit fees directly in the table
- **Document Management**: Click any document cell to add/edit requirements

### ✏️ Bulk Operations

- **Bulk Edit Mode**: Select multiple entries for batch operations
- **Bulk Fee Updates**: Update fees for multiple services at once
- **Bulk Document Updates**: Add documents to multiple services
- **Bulk Delete**: Remove multiple entries in one action
- **Select All**: Quick selection of all visible entries

### 📊 Data Management

- **Smart Import**: Handles multiple CSV formats from your export files
- **Document Requirements**: Separate fields for required documents and special requirements
- **Status Tracking**: Automatic status updates (Complete/Incomplete)
- **Statistics Dashboard**: Real-time counts and totals
- **Data Validation**: Fee validation with error highlighting

### ⌨️ Keyboard Shortcuts

- `Ctrl+S` / `Cmd+S` - Save data
- `Ctrl+E` / `Cmd+E` - Open export menu
- `Ctrl+B` / `Cmd+B` - Toggle bulk edit mode
- `Esc` - Close any open modal

## Getting Started

### 1. Import Your Data

The system accepts your visa catalog CSV files:
- `feesexport*.csv` - Main export files
- `feescorrectedpage*.csv` - Corrected fee files
- `feespage*.csv` - Additional fee files
- `documentspage*.csv` - Document requirement files

Click the "Import File" button and select multiple files at once.

### 2. Edit Your Data

- **Fees**: Click directly in any fee cell to edit
- **Documents**: Click the document cell to open the editor
- **Bulk Edit**: Use the Bulk Edit button to modify multiple entries

### 3. Export Your Data

Click "Export Data" and choose your format:
- **CSV**: For Excel and spreadsheet applications
- **JSON**: For programmatic use and backups

## Data Structure

The system handles various CSV formats and normalizes them into a consistent structure:

```javascript
{
  id: unique_identifier,
  country: "Destination Country",
  passportOrigin: "Passport Origin",
  service: "Visa Type/Service",
  provider: "Service Provider",
  fee: 100.00,
  processingTime: "5-7 business days",
  entries: "Single/Multiple",
  validity: "30 days",
  documents: {
    required: ["Passport", "Photo"],
    special: ["Bank statement"]
  }
}
```

## Technical Details

- **No Installation Required**: Runs entirely in your browser
- **No Server/Database**: All data stored in browser memory during session
- **Privacy**: Your data never leaves your computer
- **Framework**: Vanilla JavaScript with PapaParse for CSV handling
- **Responsive**: Works on desktop and mobile devices

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

Feel free to fork this repository and submit pull requests. For major changes, please open an issue first.

## License

This project is available for use by Swift Passport Services.

## Support

For questions or issues, please open an issue on GitHub or contact the Swift Passport team.

---

Built with ❤️ for Swift Passport Services