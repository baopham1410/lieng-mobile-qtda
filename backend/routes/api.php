<?php

use App\Http\Controllers\Api\StoreOwnerController;
use App\Http\Controllers\Api\TradeConversationController;
use App\Http\Controllers\Api\QuanEntryController;
use App\Http\Controllers\Api\QuanProductController;
use App\Http\Controllers\Api\QuanCostController;
use App\Http\Controllers\Api\QuanStatementController;
use App\Http\Controllers\Api\CatalogMediaController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PosController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PayOSWebhookController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\StockImportController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WarehouseController;
use App\Http\Controllers\Api\WarrantyController;
use App\Http\Controllers\Api\AssistantController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/payments/payos/webhook', PayOSWebhookController::class);

    // Cửa hàng online (public)
    Route::get('/store/catalog', [StoreController::class, 'catalog']);
    Route::post('/store/inquiry', [StoreController::class, 'inquiry']);
    Route::get('/media/catalog/{path}', [CatalogMediaController::class, 'show'])->where('path', '.*');

    // Chatbot RAG (public bot khách)
    Route::get('/assistant/health', [AssistantController::class, 'health']);
    Route::post('/assistant/public-chat', [AssistantController::class, 'publicChat']);

    Route::middleware('auth:sanctum')->group(function () {
        // Chatbot RAG (bot nội bộ NV)
        Route::post('/assistant/chat', [AssistantController::class, 'chat']);

        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);

        Route::get('/search', [SearchController::class, 'index']);
        Route::get('/notifications', [NotificationController::class, 'index']);

        // Dashboard & Reports
        Route::get('/reports/dashboard', [DashboardController::class, 'index']);
        Route::get('/reports/revenue', [ReportController::class, 'revenue'])->middleware('permission:finance.reports');
        Route::get('/reports/inventory', [ReportController::class, 'inventory']);

        // Products
        Route::get('/product-categories', [CategoryController::class, 'index']);
        Route::post('/product-categories', [CategoryController::class, 'store'])->middleware('permission:products.create');
        Route::put('/product-categories/{category}', [CategoryController::class, 'update'])->middleware('permission:products.update');
        Route::delete('/product-categories/{category}', [CategoryController::class, 'destroy'])->middleware('permission:products.delete');
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/import-variants', [ProductController::class, 'importVariants']);
        Route::get('/products/{product}', [ProductController::class, 'show']);
        Route::post('/products', [ProductController::class, 'store'])->middleware('permission:products.create');
        Route::put('/products/{product}', [ProductController::class, 'update'])->middleware('permission:products.update');
        Route::post('/products/{product}/image', [ProductController::class, 'uploadImage'])->middleware('permission:products.update');
        Route::delete('/products/{product}/image', [ProductController::class, 'removeImage'])->middleware('permission:products.update');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])->middleware('permission:products.delete');

        // Customers
        Route::get('/customers', [CustomerController::class, 'index']);
        Route::post('/customers', [CustomerController::class, 'store'])->middleware('permission:customers.create');
        Route::get('/customers/{customer}', [CustomerController::class, 'show']);
        Route::put('/customers/{customer}', [CustomerController::class, 'update'])->middleware('permission:customers.update');

        // Orders
        Route::get('/orders', [OrderController::class, 'index']);
        Route::post('/orders', [OrderController::class, 'store'])->middleware('permission:orders.create');
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::get('/orders/{order}/payment-status', [PosController::class, 'paymentStatus']);
        Route::post('/orders/{order}/items', [OrderController::class, 'addItem'])->middleware('permission:orders.create');
        Route::delete('/orders/{order}/items/{item}', [OrderController::class, 'removeItem'])->middleware('permission:orders.create');
        Route::post('/orders/{order}/checkout', [OrderController::class, 'checkout'])->middleware('permission:orders.checkout');
        Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel'])->middleware('permission:orders.create');
        Route::post('/orders/{order}/approve-discount', [OrderController::class, 'approveDiscount']);
        Route::post('/orders/{order}/cancel-and-refund', [OrderController::class, 'cancelAndRefund']);
        Route::post('/orders/{order}/remind-payment', [OrderController::class, 'remindPayment']);
        Route::post('/orders/{order}/print-receipt', [OrderController::class, 'printReceipt']);

        // POS
        Route::get('/pos/categories', [PosController::class, 'categories']);
        Route::get('/pos/available', [PosController::class, 'available']);
        Route::get('/pos/customers/suggest', [PosController::class, 'suggestCustomers']);
        Route::get('/pos/customers/lookup', [PosController::class, 'lookupCustomer']);
        Route::get('/pos/customers', [PosController::class, 'customers']);
        Route::post('/pos/checkout', [PosController::class, 'checkout'])->middleware('permission:orders.checkout');

        // Profile
        Route::get('/profile/summary', [ProfileController::class, 'summary']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/change-password', [ProfileController::class, 'changePassword']);
        Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
        Route::get('/profile/activity', [ProfileController::class, 'activity']);
        Route::get('/profile/login-history', [ProfileController::class, 'loginHistory']);

        // Finance
        Route::get('/transactions', [TransactionController::class, 'index'])->middleware('permission:finance.view');
        Route::post('/transactions', [TransactionController::class, 'store'])->middleware('permission:finance.create');
        Route::get('/expense-categories', [TransactionController::class, 'expenseCategories'])->middleware('permission:finance.view');

        Route::get('/trade-conversations', [TradeConversationController::class, 'index']);
        Route::post('/trade-conversations', [TradeConversationController::class, 'store']);
        Route::put('/trade-conversations/{tradeConversation}', [TradeConversationController::class, 'update']);
        Route::delete('/trade-conversations/{tradeConversation}', [TradeConversationController::class, 'destroy']);

        Route::get('/quan/products', [QuanProductController::class, 'index'])->middleware('permission:quan.view');
        Route::post('/quan/products', [QuanProductController::class, 'store'])->middleware('permission:quan.create');
        Route::put('/quan/products/{quanProduct}', [QuanProductController::class, 'update'])->middleware('permission:quan.create');
        Route::delete('/quan/products/{quanProduct}', [QuanProductController::class, 'destroy'])->middleware('permission:quan.delete');
        Route::get('/quan/costs', [QuanCostController::class, 'index'])->middleware('permission:quan.view');

        Route::get('/quan/entries', [QuanEntryController::class, 'index'])->middleware('permission:quan.view');
        Route::post('/quan/entries', [QuanEntryController::class, 'store'])->middleware('permission:quan.create');
        Route::put('/quan/entries/{quanEntry}', [QuanEntryController::class, 'update'])->middleware('permission:quan.create');
        Route::delete('/quan/entries/{quanEntry}', [QuanEntryController::class, 'destroy'])->middleware('permission:quan.delete');

        Route::get('/quan/statements', [QuanStatementController::class, 'index'])->middleware('permission:quan.statements');
        Route::post('/quan/statements', [QuanStatementController::class, 'store'])->middleware('permission:quan.statements');
        Route::get('/quan/statements/{quanStatement}', [QuanStatementController::class, 'show'])->middleware('permission:quan.statements');
        Route::delete('/quan/statements/{quanStatement}', [QuanStatementController::class, 'destroy'])->middleware('permission:quan.statements');

        // Warranty
        Route::get('/warranties', [WarrantyController::class, 'index']);
        Route::get('/warranties/hub-tickets', [WarrantyController::class, 'getHubTickets']);
        Route::get('/warranties/lookup/{imei}', [WarrantyController::class, 'lookup']);
        Route::post('/warranties/trade-in/evaluate', [WarrantyController::class, 'evaluateTradeIn']);
        Route::post('/warranties/tickets/{ticket}/approve-special-buyback', [WarrantyController::class, 'approveSpecialBuyback']);
        Route::post('/warranties/repairs', [WarrantyController::class, 'storeRepairByImei'])->middleware('permission:warranty.repair');
        Route::post('/warranties/{warranty}/repairs', [WarrantyController::class, 'storeRepair'])->middleware('permission:warranty.repair');

        // Store Owner Privileges & Showroom Management
        Route::get('/owner/dashboard', [StoreOwnerController::class, 'dashboard']);
        Route::post('/owner/approvals/{id}/approve', [StoreOwnerController::class, 'approve']);
        Route::post('/owner/approvals/{id}/reject', [StoreOwnerController::class, 'reject']);
        Route::get('/owner/vault', [StoreOwnerController::class, 'getVaultStatus']);
        Route::post('/owner/vault/expense', [StoreOwnerController::class, 'recordExpense']);
        Route::post('/owner/vault/audit', [StoreOwnerController::class, 'auditVault']);
        Route::post('/owner/vault/settle', [StoreOwnerController::class, 'settleVault']);

        // Warehouse Management (Nghiệp vụ Thủ kho & Nhập kho)
        Route::get('/warehouse/dashboard', [WarehouseController::class, 'dashboard']);
        Route::get('/warehouse/imports', [WarehouseController::class, 'imports']);
        Route::post('/warehouse/imports', [WarehouseController::class, 'storeImport']);
        Route::get('/warehouse/imei/{imei}', [WarehouseController::class, 'scanImei']);
        Route::get('/warehouse/orders/{code}/verify', [WarehouseController::class, 'verifyExportOrder']);
        Route::post('/warehouse/audit', [WarehouseController::class, 'auditStock']);

        // Suppliers & Stock imports
        Route::get('/suppliers', [SupplierController::class, 'index']);
        Route::post('/suppliers', [SupplierController::class, 'store'])->middleware('permission:stock_imports.create');
        Route::get('/stock-imports/stats', [StockImportController::class, 'stats']);
        Route::get('/stock-imports/next-code', [StockImportController::class, 'nextCode']);
        Route::get('/stock-imports', [StockImportController::class, 'index']);
        Route::post('/stock-imports', [StockImportController::class, 'store'])->middleware('permission:stock_imports.create');
        Route::get('/stock-imports/{code}', [StockImportController::class, 'show']);
        Route::put('/stock-imports/{code}', [StockImportController::class, 'update'])->middleware('permission:stock_imports.create');
        Route::post('/stock-imports/{code}/confirm', [StockImportController::class, 'confirm'])->middleware('permission:stock_imports.confirm');

        // Users & Roles
        Route::get('/roles', [RoleController::class, 'index']);
        Route::middleware('permission:users.view')->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::get('/users/{user}', [UserController::class, 'show']);
        });
        Route::post('/users', [UserController::class, 'store'])->middleware('permission:users.create');
        Route::put('/users/{user}', [UserController::class, 'update'])->middleware('permission:users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware('permission:users.delete');
    });
});
