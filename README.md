# Ramya Goyam Inventory & Billing System

A high-performance MERN-stack web application for managing inventory, generating bills, and tracking sales with automated WhatsApp integration.

## Features

### 🏪 Inventory Management
- **Stock Entry**: Add items with SKU, Name, Quantity, Cost Price, and Selling Price
- **Live Stock Sync**: Automatic inventory updates on sales and bill edits
- **Zero-Stock Guard**: Prevents selection of out-of-stock items

### 💰 Dynamic Billing System
- **Tally-Style Interface**: Professional billing interface
- **Auto Bill Numbers**: Automatic generation (RG-001, RG-002, etc.)
- **Search Functionality**: Find bills by Bill Number or Customer Phone
- **Multi-Item Entry**: Add unlimited items with real-time calculations
- **Searchable Dropdown**: Real-time product search with stock display
- **Item-Level Details**: Quantity, Price, Discount, and Comments
- **Global Discount**: Apply discounts to entire bill
- **Automatic Calculations**: Real-time Subtotal, Discounts, and Grand Total

### ✏️ Bill Editing (Delta System)
- Edit existing bills with automatic inventory reconciliation
- Calculates differences and updates master inventory accordingly
- Maintains complete history

### 📱 WhatsApp Integration
- Automatic WhatsApp link generation on bill save
- Formatted message with shop details, items, and totals
- One-click sharing to customers

### 📊 Advanced Reporting
- **Daily Reports**: Today's performance snapshot
- **Monthly Reports**: Comparative sales trends
- **All-Time Reports**: Cumulative business growth
- **Metrics Included**:
  - Sales: Total Bills, Discounts, Gross Revenue
  - Inventory: Items Sold, Remaining Stock, Inventory Value
  - Cash: Total Sales, Discounts, Cash in Hand

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js & Express.js
- **Database**: MongoDB
- **State Management**: React Hooks

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "inventory and billing"
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ramya-goyam
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   npm run dev
   ```
   This will start both backend (port 5000) and frontend (port 3000) servers.

   Or run separately:
   ```bash
   # Backend only
   npm run server

   # Frontend only (in another terminal)
   npm run client
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
inventory and billing/
├── backend/
│   ├── models/
│   │   ├── Product.js
│   │   ├── Bill.js
│   │   └── Settings.js
│   ├── routes/
│   │   ├── products.js
│   │   ├── bills.js
│   │   ├── reports.js
│   │   └── settings.js
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Inventory.js
│   │   │   ├── Billing.js
│   │   │   └── Reports.js
│   │   ├── api/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── package.json
└── README.md
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/stock/available` - Get products with stock > 0

### Bills
- `GET /api/bills` - Get all bills
- `GET /api/bills/:id` - Get bill by ID
- `POST /api/bills` - Create new bill
- `PUT /api/bills/:id` - Update bill (delta system)
- `DELETE /api/bills/:id` - Delete bill
- `GET /api/bills/search/:query` - Search bills
- `GET /api/bills/:id/whatsapp` - Get WhatsApp link

### Reports
- `GET /api/reports/sales/:period` - Sales report (daily/monthly/all-time)
- `GET /api/reports/inventory/:period` - Inventory report
- `GET /api/reports/cash/:period` - Cash report
- `GET /api/reports/comprehensive/:period` - Comprehensive report

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

## Security Features

- ✅ Zero-stock validation prevents overselling
- ✅ Negative stock prevention
- ✅ Input validation on all forms
- ✅ Bill deletion restores inventory

## Usage Guide

### Adding Products
1. Navigate to Inventory page
2. Click "Add New Product"
3. Fill in SKU, Name, Quantity, Cost Price, and Selling Price
4. Click "Add Product"

### Creating a Bill
1. Navigate to Billing page
2. Enter Customer Name and Phone Number
3. Search and add products using the search box
4. Adjust quantities, prices, and discounts as needed
5. Add optional comments per item
6. Apply global discount if needed
7. Review totals and click "Save Bill"
8. Click "WhatsApp" button to share bill with customer

### Editing a Bill
1. Search for the bill using Bill Number or Phone Number
2. Click "Edit" on the desired bill
3. Modify items, quantities, or discounts
4. Click "Update Bill"
5. Inventory automatically adjusts based on changes

### Viewing Reports
1. Navigate to Reports page
2. Select period (Daily/Monthly/All-Time)
3. View comprehensive metrics including:
   - Sales statistics
   - Inventory status
   - Cash in hand

## Notes

- Bill numbers are auto-generated and increment automatically
- Inventory updates in real-time when bills are created, edited, or deleted
- WhatsApp links open in a new tab/window
- All monetary values are in Indian Rupees (₹)

## License

ISC

## Support

For issues or questions, please contact the development team.
