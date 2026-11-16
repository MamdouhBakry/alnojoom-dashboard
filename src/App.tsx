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

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
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
