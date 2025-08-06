import React from "react";
import Nav from "./componenets/Nav";
import Dashboard from "./componenets/Dashboard";
import { Route, Routes } from "react-router-dom";
import Login from "./componenets/Routes/Login";
import Signup from "./componenets/Routes/Signup";
import CompanyResult from "./componenets/Routes/CompanyResult";
import MedicineRes from "./componenets/MedicineRes";

const App = () => {
  return (
    <div className="">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/CompanyResult" element={<CompanyResult />} />
        <Route path="/MedicineRes" element={<MedicineRes />} />
      </Routes>
    </div>
  );
};

export default App;
