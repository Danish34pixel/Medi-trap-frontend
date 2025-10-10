import React from "react";
import Nav from "./componenets/Nav";
import Dashboard from "./componenets/Dashboard";
import RoleSelector from "./componenets/Role";
import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./componenets/Routes/Login";
import Signup from "./componenets/Routes/Signup";
import CompanyResult from "./componenets/Routes/CompanyResult";
import CompanyProducts from "./componenets/Routes/CompanyProducts";
import MedicineRes from "./componenets/MedicineRes";
import Profile from "./componenets/Profile";
import AdminPanel from "./componenets/AdminPanel";
import AdminCreateStockist from "./componenets/Stockist/AdminCreateStockist";
import AdminCreateCompany from "./componenets/AdminCreateCompany";
import AdminCreateMedicine from "./componenets/AdminCreateMedicine";
import PurchaserDetails from "./componenets/PurchaserDetails";
import StaffList from "./componenets/staff/StaffList";
import StaffCreate from "./componenets/staff/StaffCreate";
import StaffDetails from "./componenets/staff/StaffDetails";
import Demand from "./componenets/Demand";
import StockistLogin from "./componenets/Stockist/StockistLogin";
import Stockistoutcode from "./componenets/Stockist/Stockistoutcode";
import StockistCardView from "./componenets/Stockist/StockistCardView";
import Verification from "./componenets/Stockist/Verification";
import ForgotPassword from "./componenets/Routes/ForgotPassword";
import ResetPassword from "./componenets/Routes/ResetPassword";
import PurchaserSignup from "./componenets/purchaser/PurchaserSignup";
import AdminPage from "./componenets/Routes/AdminPage";
import MedicalMiddle from "./componenets/Routes/medicalmiddle";
import UserAdmin from "./componenets/Routes/UserAdmin";
import PurchaserLogin from "./componenets/purchaser/PurchaserLogin";
import PurchserVerfifcation from "./componenets/purchaser/PurchserVerfifcation";

const App = () => {
  return (
    <div className="">
      <Routes>
        <Route path="/" element={<RoleSelector />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/CompanyResult" element={<CompanyResult />} />
        <Route path="/company/:id/products" element={<CompanyProducts />} />
        <Route path="/MedicineRes" element={<MedicineRes />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/adminpanel" element={<AdminPanel />} />
        <Route path="/adminCreateStockist" element={<AdminCreateStockist />} />
        <Route path="/stockist-login" element={<StockistLogin />} />
        <Route path="/stockist-outcode" element={<Stockistoutcode />} />
        <Route path="/stockist-card" element={<StockistCardView />} />
        <Route path="/stockist/verification" element={<Verification />} />
        <Route path="/adminCreateCompany" element={<AdminCreateCompany />} />
        <Route path="/adminCreateMedicine" element={<AdminCreateMedicine />} />
        <Route path="/adminCreateStaff" element={<StaffCreate />} />
        <Route path="/staffs" element={<StaffList />} />
        <Route path="/staff/:id" element={<StaffDetails />} />
        {/* Redirect legacy or accidental /staff/create to the admin create form */}
        <Route
          path="/staff/create"
          element={<Navigate to="/adminCreateStaff" replace />}
        />
        <Route path="/purchaser" element={<PurchaserSignup />} />
        <Route path="/purchaser/:id" element={<PurchaserDetails />} />
        <Route path="/demand" element={<Demand />} />
        <Route path="/admin/stockists" element={<AdminPage />} />
        <Route path="/medical-middle" element={<MedicalMiddle />} />
        <Route path="/user-admin" element={<UserAdmin />} />
        <Route path="/purchaserLogin" element={<PurchaserLogin />} />
        <Route path="/purchasermiddle" element={<PurchserVerfifcation />} />
      </Routes>
    </div>
  );
};

export default App;
