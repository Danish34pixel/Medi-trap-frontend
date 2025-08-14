import React from "react";
import Nav from "./componenets/Nav";
import Dashboard from "./componenets/Dashboard";
import { Route, Routes } from "react-router-dom";
import Login from "./componenets/Routes/Login";
import Signup from "./componenets/Routes/Signup";
import CompanyResult from "./componenets/Routes/CompanyResult";
import MedicineRes from "./componenets/MedicineRes";
import Profile from "./componenets/Profile";

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
      </Routes>
    </div>
  );
};

export default App;
