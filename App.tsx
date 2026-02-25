import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './views/Landing';
import FullGallery from './views/FullGallery';

// Admin Imports
// Admin Imports
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './views/admin/Dashboard';
import AdminLeads from './views/admin/Leads';
import AdminAgenda from './views/admin/Agenda';
import LoggedOutView from './views/admin/Login'; // Renamed to simple Login in route
import PlaceholderView from './views/admin/Placeholder';
import AdminSiteContent from './views/admin/SiteContent';
import AdminGallery from './views/admin/GalleryManager';
import AdminTestimonials from './views/admin/TestimonialsManager';
import AdminFeatures from './views/admin/FeaturesManager'; // Note: You might want to link this somewhere, but maybe keep structure inside general content
import AdminFinanceiro from './views/admin/Financeiro';
import AdminClients from './views/admin/Clients';
import AdminSuppliers from './views/admin/Suppliers';
import AdminPackages from './views/admin/Packages';
import AdminReports from './views/admin/Reports';
import AdminContractGenerator from './views/admin/ContractGenerator';
import AdminContracts from './views/admin/Contracts';
import AdminNotaFiscal from './views/admin/NotaFiscal';
import ProtectedRoute from './layouts/ProtectedRoute';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/galeria" element={<FullGallery />} />
                <Route path="/admin/login" element={<LoggedOutView />} />

                {/* Admin Routes (Protected) */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="orcamentos" element={<AdminLeads />} />
                        <Route path="agenda" element={<AdminAgenda />} />

                        {/* Placeholders for other sections */}
                        <Route path="clientes" element={<AdminClients />} />
                        <Route path="fornecedores" element={<AdminSuppliers />} />
                        <Route path="financeiro" element={<AdminFinanceiro />} />
                        <Route path="relatorios" element={<AdminReports />} />
                        <Route path="conteudo" element={<AdminSiteContent />} />
                        <Route path="galeria" element={<AdminGallery />} />
                        <Route path="depoimentos" element={<AdminTestimonials />} />
                        <Route path="pacotes" element={<AdminPackages />} />
                        <Route path="contratos" element={<AdminContracts />} />
                        <Route path="nota-fiscal" element={<AdminNotaFiscal />} />
                        <Route path="contratos/novo" element={<AdminContractGenerator />} />
                        <Route path="contratos/:id" element={<AdminContractGenerator />} />
                        <Route path="config" element={<PlaceholderView title="Configurações" />} />
                    </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;