import React from 'react';
import Hero from '../sections/Hero.jsx';
import CategoryTicker from '../sections/CategoryTicker.jsx';
import Showcase from '../sections/Showcase.jsx';
import VehicleFinder from '../sections/VehicleFinder.jsx';
import Brands from '../sections/Brands.jsx';
import Categories from '../sections/Categories.jsx';
import NewArrivals from '../sections/NewArrivals.jsx';
import Payments from '../sections/Payments.jsx';
import Process from '../sections/Process.jsx';
import Reviews from '../sections/Reviews.jsx';
import Location from '../sections/Location.jsx';
import Contact from '../sections/Contact.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { api } from '../services/api.js';

export default function Home() {
  // Una sola consulta liviana: las facetas dan los contadores por marca y por rubro.
  const overview = useAsync((opts) => api.search({ porPagina: 1 }, opts), []);
  const facets = overview.data?.facets;

  return (
    <>
      <Hero />
      <CategoryTicker />
      <Showcase />
      <VehicleFinder />
      <Brands counts={facets?.marca} />
      <Categories categories={overview.data?.categories} counts={facets?.categoria} />
      <NewArrivals />
      <Payments />
      <Process />
      <Reviews />
      <Location />
      <Contact />
    </>
  );
}
