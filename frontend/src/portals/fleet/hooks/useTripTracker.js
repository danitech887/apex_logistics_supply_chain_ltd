import { useState, useEffect } from 'react';

export const useTripTracker = (initialTrips = []) => {
  const [trips, setTrips] = useState(initialTrips);

  const dispatchTruck = (tripId, startOdometer) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? {
              ...t,
              status: 'IN_TRANSIT',
              actualDeparture: new Date().toISOString(),
              startOdometer: startOdometer || t.startOdometer,
            }
          : t
      )
    );
  };

  const completeTrip = (tripId, endOdometer) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? {
              ...t,
              status: 'COMPLETED',
              actualArrival: new Date().toISOString(),
              endOdometer: endOdometer,
              distanceKm: endOdometer - (t.startOdometer || 0),
              reconciled: true,
            }
          : t
      )
    );
  };

  return {
    trips,
    setTrips,
    dispatchTruck,
    completeTrip,
  };
};
