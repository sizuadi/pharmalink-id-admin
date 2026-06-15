import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Transactions } from "@/pages/Transactions";
import { UsersPage } from "@/pages/Users";
import { Pharmacies } from "@/pages/Pharmacies";
import { Reviews } from "@/pages/Reviews";
import { Prescriptions } from "@/pages/Prescriptions";
import { Admins } from "@/pages/Admins";
import { Settings } from "@/pages/Settings";
import { ROLE } from "@/lib/types";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route
            path="/pharmacists"
            element={
              <UsersPage
                roleId={ROLE.PHARMACIST}
                title="Pharmacists"
                subtitle="Kelola akun apoteker"
              />
            }
          />
          <Route
            path="/patients"
            element={
              <UsersPage
                roleId={ROLE.PATIENT}
                title="Patients"
                subtitle="Kelola akun pasien"
              />
            }
          />
          <Route path="/pharmacies" element={<Pharmacies />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/admins" element={<Admins />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
