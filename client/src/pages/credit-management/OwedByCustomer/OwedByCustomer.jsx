import { Routes, Route } from "react-router-dom";
import CustomerCreditList from "./CustomerCreditList";
import CustomerCreditForm from "./CustomerCreditForm";
import CustomerCreditReport from "./CustomerCreditReport";

const OwedByCustomer = () => {
  return (
    <Routes>
      <Route path="/" element={<CustomerCreditList />} />
      <Route path="/add" element={<CustomerCreditForm />} />
      <Route path="/edit/:id" element={<CustomerCreditForm />} />
      <Route path="/report" element={<CustomerCreditReport />} />
    </Routes>
  );
};

export default OwedByCustomer;
