import React from 'react';
import Icon from '../components/Icon.jsx';
import Reveal from '../components/Reveal.jsx';
import VehicleSelect from '../components/VehicleSelect.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useBusiness } from '../hooks/useBusiness.jsx';
import { useRouter } from '../hooks/useRouter.jsx';
import { useVehicle } from '../hooks/useVehicle.jsx';
import { api } from '../services/api.js';
import { buildMessage, whatsappLink } from '../utils/business.js';
import { vehicleUrl } from '../utils/catalogUrl.js';

/** "Tu camión": se elige marca/modelo/año y se abre el catálogo con esos filtros aplicados. */
export default function VehicleFinder() {
  const business = useBusiness();
  const { navigate } = useRouter();
  const { vehicle, setVehicle, clearVehicle } = useVehicle();
  const { data } = useAsync(
    (opts) => (vehicle.brand ? api.search({ marca: vehicle.brand, modelo: vehicle.model, porPagina: 1 }, opts) : Promise.resolve(null)),
    [vehicle.brand, vehicle.model],
  );
  const matches = data?.total;
  const wa = whatsappLink(business, buildMessage({ vehicle }));
  const brand = business?.brands?.find((b) => b.name === vehicle.brand);
  const photo = brand?.gallery?.find((g) => g.model === vehicle.model)?.image || brand?.image;
  const single = business?.brands?.length === 1;

  return (
    <section className="finder" id="buscador">
      <div className="container">
        <Reveal className="finder__card">
          {photo && <img key={photo} className="finder__photo" src={photo.replace('.webp', '-sm.webp')} alt="" />}
          <div className="finder__head">
            <p className="eyebrow"><span className="tick" /> Tu camión</p>
            <h2>{single ? `¿Qué ${vehicle.brand || 'IVECO'} tenés?` : '¿Qué camión tenés?'}</h2>
            <p>{single ? 'Elegí modelo y año' : 'Elegí marca, modelo y año'}: te llevamos al catálogo con los filtros aplicados y el mensaje de WhatsApp sale con los datos de la unidad.</p>
          </div>
          <VehicleSelect value={vehicle} onChange={setVehicle} dark />
          <div className="finder__actions">
            <button className="btn btn--accent btn--lg" disabled={!vehicle.brand} onClick={() => navigate(vehicleUrl(vehicle))}>
              {vehicle.brand ? <>Ver {matches ?? ''} {matches === 1 ? 'repuesto' : 'repuestos'}{vehicle.model ? ` para ${vehicle.model}` : ''}</> : 'Elegí una marca'} <Icon name="arrow" size={18} />
            </button>
            {wa && <a className="btn btn--ghost btn--lg" href={wa} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18} /> Consultar con estos datos</a>}
            {(single ? vehicle.model || vehicle.year : vehicle.brand) && <button className="finder__clear" onClick={clearVehicle}>Limpiar</button>}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
