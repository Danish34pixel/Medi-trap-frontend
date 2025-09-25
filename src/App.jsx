import React from "react";
import Nav from "./componenets/Nav";
import Dashboard from "./componenets/Dashboard";
import RoleSelector from "./componenets/Role";
import { Route, Routes } from "react-router-dom";
import Login from "./componenets/Routes/Login";
import Signup from "./componenets/Routes/Signup";
import CompanyResult from "./componenets/Routes/CompanyResult";
import MedicineRes from "./componenets/MedicineRes";
import Profile from "./componenets/Profile";
import AdminPanel from "./componenets/AdminPanel";
import AdminCreateStockist from "./componenets/AdminCreateStockist";
import AdminCreateCompany from "./componenets/AdminCreateCompany";
import AdminCreateMedicine from "./componenets/AdminCreateMedicine";
import Purchaser from "./componenets/Purchaser";
import PurchaserDetails from "./componenets/PurchaserDetails";
import StaffList from "./componenets/StaffList";
import StaffCreate from "./componenets/StaffCreate";
import StaffDetails from "./componenets/StaffDetails";
import Demand from "./componenets/Demand";
import StockistLogin from "./componenets/StockistLogin";
import Stockistoutcode from "./componenets/Stockistoutcode";
import StockistCardView from "./componenets/StockistCardView";

const App = () => {
  return (
    <div className="">
      <Routes>
        <Route path="/" element={<RoleSelector />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/CompanyResult" element={<CompanyResult />} />
        <Route path="/MedicineRes" element={<MedicineRes />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/adminpanel" element={<AdminPanel />} />
        <Route path="/adminCreateStockist" element={<AdminCreateStockist />} />
        <Route path="/stockist-login" element={<StockistLogin />} />
        <Route path="/stockist-outcode" element={<Stockistoutcode />} />
        <Route path="/stockist-card" element={<StockistCardView />} />
        <Route path="/adminCreateCompany" element={<AdminCreateCompany />} />
        <Route path="/adminCreateMedicine" element={<AdminCreateMedicine />} />
        <Route path="/adminCreateStaff" element={<StaffCreate />} />
        <Route path="/staffs" element={<StaffList />} />
        <Route path="/staff/:id" element={<StaffDetails />} />
        <Route path="/purchaser" element={<Purchaser />} />
        <Route path="/purchaser/:id" element={<PurchaserDetails />} />
        <Route path="/demand" element={<Demand />} />
      </Routes>
    </div>
  );
};

export default App;
