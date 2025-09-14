import React from "react";
import Nav from "./componenets/Nav";
import Dashboard from "./componenets/Dashboard";
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

const App = () => {
  return (
    <div className="">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/CompanyResult" element={<CompanyResult />} />
        <Route path="/MedicineRes" element={<MedicineRes />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/adminpanel" element={<AdminPanel />} />
        <Route path="/adminCreateStockist" element={<AdminCreateStockist />} />
        <Route path="/adminCreateCompany" element={<AdminCreateCompany />} />
        <Route path="/adminCreateMedicine" element={<AdminCreateMedicine />} />
        <Route path="/purchaser" element={<Purchaser />} />
        <Route path="/purchaser/:id" element={<PurchaserDetails />} />
      </Routes>
    </div>
  );
};

export default App;
