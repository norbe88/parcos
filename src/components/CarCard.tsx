/**
 * RXM Automobile / ParcOS — CarCard Component Alias & Export Proxy
 * Proxy către VehicleCard cu legături active de telemetrie micro-conversii
 */
import React from 'react';
import { VehicleCard } from './showroom/VehicleCard';
import { trackConversionEvent } from '../services/telemetryService';

export const CarCard = VehicleCard;
export { VehicleCard, trackConversionEvent };
export default VehicleCard;
