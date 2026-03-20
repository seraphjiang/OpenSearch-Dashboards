/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext } from 'react';
import { AnalyticsTelemetryService } from '../services/telemetry_service';

const TelemetryContext = createContext<AnalyticsTelemetryService | null>(null);

/**
 * Provides the telemetry service to the React component tree.
 * Wrap your app root with this provider.
 */
export const TelemetryProvider: React.FC<{ service: AnalyticsTelemetryService }> = ({
  service,
  children,
}) => <TelemetryContext.Provider value={service}>{children}</TelemetryContext.Provider>;

/**
 * Hook to access the telemetry service from any component.
 *
 * @example
 * ```tsx
 * const telemetry = useTelemetry();
 * telemetry.trackButtonClick('save_button');
 * ```
 */
export const useTelemetry = (): AnalyticsTelemetryService => {
  const service = useContext(TelemetryContext);
  if (!service) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return service;
};
