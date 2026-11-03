import React, { lazy, Suspense } from 'react';
import Home from './pages/Home.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import NotFound from './pages/NotFound.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import WhatsAppFab from './components/WhatsAppFab.jsx';
import { BusinessProvider } from './hooks/useBusiness.jsx';
import { RouterProvider, useRouter } from './hooks/useRouter.jsx';
import { VehicleProvider } from './hooks/useVehicle.jsx';

// El panel se carga aparte: el visitante de la tienda no descarga su código.
const Admin = lazy(() => import('./pages/Admin.jsx'));

function Routes() {
  const { path } = useRouter();
  if (path === '/admin') return <Suspense fallback={null}><Admin /></Suspense>;

  let page;
  if (path === '/') page = <Home />;
  else if (path === '/catalogo') page = <CatalogPage />;
  else if (path.startsWith('/producto/')) page = <ProductPage id={decodeURIComponent(path.slice('/producto/'.length))} />;
  else page = <NotFound />;

  return (
    <>
      <Header />
      <main className={path === '/' ? '' : 'page'}>{page}</main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <BusinessProvider>
        <VehicleProvider>
          <Routes />
        </VehicleProvider>
      </BusinessProvider>
    </RouterProvider>
  );
}
