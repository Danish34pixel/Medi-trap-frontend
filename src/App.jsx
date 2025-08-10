import React, { useEffect } from "react";
import Nav from "./componenets/Nav";
import Dashboard from "./componenets/Dashboard";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Login from "./componenets/Routes/Login";
import Signup from "./componenets/Routes/Signup";
import CompanyResult from "./componenets/Routes/CompanyResult";
import MedicineRes from "./componenets/MedicineRes";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "./features/authSlice";

const App = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, loading } = useSelector((state) => state.auth);

  // Run checkAuth only once on mount
  useEffect(() => {
    dispatch(checkAuth());
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const publicRoutes = ["/", "/login", "/signup"];
    if (!loading && !user && !publicRoutes.includes(location.pathname)) {
      navigate("/login");
    }
  }, [loading, user, navigate, location]);
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
