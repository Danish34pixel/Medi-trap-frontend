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
import StaffLogin from "./componenets/staff/StaffLogin";
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
import PrivacyPolicy from "./componenets/Routes/PrivacyPolicy";
import PurchaserLogin from "./componenets/purchaser/PurchaserLogin";
import PurchserVerfifcation from "./componenets/purchaser/PurchserVerfifcation";
import PublicRoute from "./componenets/Routes/PublicRoute";
import ProtectedRoute from "./componenets/Routes/ProtectedRoute";
import PaymentPending from "./componenets/Routes/PaymentPending";
import CompanyManagement from "./componenets/Routes/CompanyManagement";
import MedicineManagement from "./componenets/Routes/MedicineManagement";
import SubscriptionPlans from "./componenets/Routes/SubscriptionPlans";
import Payment from "./componenets/Routes/Payment";
import AdsManagement from "./componenets/AdsManagement";
import AdModal from "./componenets/AdModal";
import AnnouncementModal from "./componenets/AnnouncementModal";
import AnnouncementsManagement from "./componenets/AnnouncementsManagement";
import AnnouncementButton from "./componenets/AnnouncementButton";
import AnnouncementCenter from "./componenets/AnnouncementCenter";
import UrgentRequestOwner from "./componenets/urgentRequest/UrgentRequestOwner";
import UrgentRequestPurchaser from "./componenets/urgentRequest/UrgentRequestPurchaser";
import UrgentRequestChat from "./componenets/urgentRequest/UrgentRequestChat";
import DemandInbox from "./componenets/Stockist/DemandInbox";
import DemandHistory from "./componenets/Routes/DemandHistory";
import DemandChat from "./componenets/DemandChat";

// Every "medical owner" role alias seen in the backend response across
// nebula and this app (LOGIC_REFERENCE.md §1.5 / getHomeRouteForRole.js).
const MEDICAL_ROLES = [
  "medicalOwner",
  "medical",
  "retailer",
  "medicalretailer",
  "user",
];

const App = () => {
  return (
    <div className="">
      <Routes>
        <Route path="/" element={<RoleSelector />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={[...MEDICAL_ROLES, "admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="/CompanyResult"
          element={
            <ProtectedRoute>
              <CompanyResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/company/:id/products"
          element={
            <ProtectedRoute>
              <CompanyProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/MedicineRes"
          element={
            <ProtectedRoute>
              <MedicineRes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminpanel"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ads"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AnnouncementsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcement"
          element={
            <ProtectedRoute>
              <AnnouncementCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminCreateStockist"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminCreateStockist />
            </ProtectedRoute>
          }
        />
        <Route path="/stockist-login" element={<StockistLogin />} />
        <Route
          path="/stockist-outcode"
          element={
            <ProtectedRoute roles={["stockist"]}>
              <Stockistoutcode />
            </ProtectedRoute>
          }
        />
        {/* Public "verify with password" printable/QR card view — no guard by design (nebula: StockistCardView). */}
        <Route path="/stockist-card" element={<StockistCardView />} />
        {/* No token yet at this point for a just-registered stockist
            (stockist-signup.jsx stores pendingStockistId, not a token, per
            LOGIC_REFERENCE.md) — must stay unguarded or signup breaks. */}
        <Route path="/stockist/verification" element={<Verification />} />
        <Route
          path="/adminCreateCompany"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminCreateCompany />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/companies"
          element={
            <ProtectedRoute roles={["admin"]}>
              <CompanyManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/medicines"
          element={
            <ProtectedRoute roles={["admin"]}>
              <MedicineManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminCreateMedicine"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminCreateMedicine />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adminCreateStaff"
          element={
            <ProtectedRoute roles={["admin", "stockist"]}>
              <StaffCreate />
            </ProtectedRoute>
          }
        />
        <Route path="/staff-login" element={<StaffLogin />} />
        <Route
          path="/staffs"
          element={
            <ProtectedRoute roles={["staff", "stockist", "admin"]}>
              <StaffList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/:id"
          element={
            <ProtectedRoute roles={["staff", "stockist", "admin"]}>
              <StaffDetails />
            </ProtectedRoute>
          }
        />
        {/* Redirect legacy or accidental /staff/create to the admin create form */}
        <Route
          path="/staff/create"
          element={<Navigate to="/adminCreateStaff" replace />}
        />
        <Route path="/purchaser-signup" element={<PurchaserSignup />} />
        <Route
          path="/purchaser/:id"
          element={
            <ProtectedRoute roles={["purchaser"]}>
              <PurchaserDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/demand"
          element={
            <ProtectedRoute roles={[...MEDICAL_ROLES, "admin"]}>
              <Demand />
            </ProtectedRoute>
          }
        />
        <Route
          path="/MedicalOwner/urgent-request"
          element={
            <ProtectedRoute roles={[...MEDICAL_ROLES, "admin"]}>
              <UrgentRequestOwner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchaser/urgent-requests"
          element={
            <ProtectedRoute roles={["purchaser"]}>
              <UrgentRequestPurchaser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/urgent-request-chat/:id"
          element={
            <ProtectedRoute>
              <UrgentRequestChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Stockist/demand-inbox"
          element={
            <ProtectedRoute roles={["stockist"]}>
              <DemandInbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/MedicalOwner/demand-history"
          element={
            <ProtectedRoute roles={[...MEDICAL_ROLES, "admin"]}>
              <DemandHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/demand-chat/:id"
          element={
            <ProtectedRoute>
              <DemandChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stockists"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        {/* Same as stockist verification above — unconfirmed whether a
            token exists this early in the medical-owner signup flow, so
            left unguarded rather than risk breaking signup. */}
        <Route path="/medical-middle" element={<MedicalMiddle />} />
        <Route
          path="/user-admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <UserAdmin />
            </ProtectedRoute>
          }
        />
        <Route path="/purchaserLogin" element={<PurchaserLogin />} />
        <Route
          path="/purchasermiddle"
          element={
            <ProtectedRoute>
              <PurchserVerfifcation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-pending"
          element={
            <ProtectedRoute>
              <PaymentPending />
            </ProtectedRoute>
          }
        />
        <Route
          path="/SubscriptionPlans"
          element={
            <ProtectedRoute>
              <SubscriptionPlans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/privacy-policy/*" element={<PrivacyPolicy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AdModal />
      <AnnouncementModal />
      <AnnouncementButton />
    </div>
  );
};

export default App;
