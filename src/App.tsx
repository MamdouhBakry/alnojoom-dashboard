import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Layout, RequirePermission } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { HomePage } from "./pages/HomePage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductFormPage } from "./pages/ProductFormPage";
import { OffersPage } from "./pages/OffersPage";
import { StaffPage } from "./pages/StaffPage";
import { RolesPage } from "./pages/RolesPage";
import { OrdersPage } from "./pages/orders/OrdersPage";
import { OrderDetailPage } from "./pages/orders/OrderDetailPage";
import { ReportsPage } from "./pages/ReportsPage";
import { CustomersPage } from "./pages/CustomersPage";
import { MessagesPage } from "./pages/requests/MessagesPage";
import { MessageDetailPage } from "./pages/requests/MessageDetailPage";
import { QuoteRequestsPage } from "./pages/requests/QuoteRequestsPage";
import { QuoteRequestDetailPage } from "./pages/requests/QuoteRequestDetailPage";

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
          <Route path="orders" element={<RequirePermission permission="orders.view"><OrdersPage /></RequirePermission>} />
          <Route path="orders/:id" element={<RequirePermission permission="orders.view"><OrderDetailPage /></RequirePermission>} />
          <Route path="messages" element={<RequirePermission permission="requests.manage"><MessagesPage /></RequirePermission>} />
          <Route path="messages/:id" element={<RequirePermission permission="requests.manage"><MessageDetailPage /></RequirePermission>} />
          <Route path="quote-requests" element={<RequirePermission permission="requests.manage"><QuoteRequestsPage /></RequirePermission>} />
          <Route path="quote-requests/:id" element={<RequirePermission permission="requests.manage"><QuoteRequestDetailPage /></RequirePermission>} />
          <Route path="customers" element={<RequirePermission permission="customers.view"><CustomersPage /></RequirePermission>} />
          <Route path="reports" element={<RequirePermission permission="reports.export"><ReportsPage /></RequirePermission>} />
          <Route path="products" element={<RequirePermission permission="products.manage"><ProductsPage /></RequirePermission>} />
          <Route path="products/new" element={<RequirePermission permission="products.manage"><ProductFormPage key="new" /></RequirePermission>} />
          <Route path="products/:id" element={<RequirePermission permission="products.manage"><ProductFormPage /></RequirePermission>} />
          <Route path="offers" element={<RequirePermission permission="offers.manage"><OffersPage /></RequirePermission>} />
          <Route path="staff" element={<RequirePermission permission="staff.manage"><StaffPage /></RequirePermission>} />
          <Route path="roles" element={<RequirePermission permission="staff.manage"><RolesPage /></RequirePermission>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
