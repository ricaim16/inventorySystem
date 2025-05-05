import { Routes, Route } from "react-router-dom";
import SupplierCreditList from "./SupplierCreditList";
import Sidebar from "../../../components/Sidebar";

const OwedToSupplier = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4">
        <Routes>
          <Route path="/" element={<SupplierCreditList />} />
          <Route path="/credits" element={<SupplierCreditList />} />
        </Routes>
      </div>
    </div>
  );
};

export default OwedToSupplier;
