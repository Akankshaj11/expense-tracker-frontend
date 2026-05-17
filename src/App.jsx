import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import CurrencySelect from './pages/CurrencySelect'
import CreateOrganization from './pages/CreateOrganization'
import ManageOrganization from './pages/ManageOrganization'
import Dashboard from './pages/Dashboard'
import AddTransaction from './pages/AddTransaction'
import ModuleTransactions from './pages/ModuleTransactions'

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/select-currency" element={<CurrencySelect />} />
        <Route path="/create-organization" element={<CreateOrganization />} />
        <Route path="/manage-organization" element={<ManageOrganization />} />
        <Route path="/add-transaction" element={<AddTransaction />} />
        <Route path="/module/:moduleName" element={<ModuleTransactions />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}