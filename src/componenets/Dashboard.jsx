import React from "react";
import Nav from "./Nav";
import Screen from "./Screen";
import { Routes, Route } from "react-router-dom";
import Login from "./Routes/Login";

const Dashboard = () => {
  return (
    <div>
      <Nav />
      <Screen />
    </div>
  );
};

export default Dashboard;
