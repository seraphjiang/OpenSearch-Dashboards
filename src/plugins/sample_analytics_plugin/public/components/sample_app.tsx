/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageHeader,
  EuiPageContent,
  EuiButton,
  EuiTabs,
  EuiTab,
  EuiSpacer,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiText,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { useTelemetry } from './telemetry_context';

const TABS = [
  { id: 'actions', name: 'User Actions' },
  { id: 'performance', name: 'Performance' },
  { id: 'errors', name: 'Error Tracking' },
  { id: 'workflow', name: 'Workflow' },
];

export const SampleApp: React.FC = () => {
  const telemetry = useTelemetry();
  const [selectedTab, setSelectedTab] = useState('actions');

  // Track page load time on mount
  useEffect(() => {
    const loadStart = performance.now();
    // Use requestAnimationFrame to measure after the first paint
    requestAnimationFrame(() => {
      telemetry.trackPageLoad('sample_analytics', performance.now() - loadStart);
    });
  }, [telemetry]);

  const onTabChange = useCallback(
    (tabId: string) => {
      telemetry.trackTabChange(tabId, selectedTab);
      setSelectedTab(tabId);
    },
    [telemetry, selectedTab]
  );

  return (
    <EuiPage paddingSize="l">
      <EuiPageBody>
        <EuiPageHeader pageTitle="Sample Analytics — Telemetry Demo" />
        <EuiPageContent>
          <EuiText size="s">
            <p>
              This plugin demonstrates how to integrate with the core telemetry service. Each tab
              shows a different tracking pattern. Open the browser console to see telemetry calls.
            </p>
          </EuiText>
          <EuiSpacer />
          <EuiTabs>
            {TABS.map((tab) => (
              <EuiTab
                key={tab.id}
                isSelected={tab.id === selectedTab}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.name}
              </EuiTab>
            ))}
          </EuiTabs>
          <EuiSpacer />
          {selectedTab === 'actions' && <UserActionsDemo />}
          {selectedTab === 'performance' && <PerformanceDemo />}
          {selectedTab === 'errors' && <ErrorTrackingDemo />}
          {selectedTab === 'workflow' && <WorkflowDemo />}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

// -- Tab: User Actions -------------------------------------------------------

const UserActionsDemo: React.FC = () => {
  const telemetry = useTelemetry();

  return (
    <>
      <EuiText>
        <h3>User Action Tracking</h3>
        <p>Click buttons to record user action events.</p>
      </EuiText>
      <EuiSpacer />
      <EuiFlexGroup>
        <EuiFlexItem grow={false}>
          <EuiButton onClick={() => telemetry.trackButtonClick('primary_action')}>
            Primary Action
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            color="secondary"
            onClick={() => telemetry.trackButtonClick('secondary_action', { variant: 'alt' })}
          >
            Secondary Action
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            color="danger"
            onClick={() => telemetry.trackButtonClick('danger_action', { requiresConfirm: 'true' })}
          >
            Danger Action
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};

// -- Tab: Performance --------------------------------------------------------

const PerformanceDemo: React.FC = () => {
  const telemetry = useTelemetry();
  const [result, setResult] = useState<string>('');

  const simulateApiCall = useCallback(async () => {
    // trackAsync wraps a function, automatically recording duration and errors
    const data = await telemetry.trackAsync(
      'simulated_api',
      async () => {
        const delay = Math.floor(Math.random() * 500) + 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return `Response received in ~${delay}ms`;
      },
      { endpoint: '/api/sample' }
    );
    setResult(data);
  }, [telemetry]);

  return (
    <>
      <EuiText>
        <h3>Performance Tracking</h3>
        <p>
          Use <code>trackAsync</code> to automatically measure duration and capture errors.
        </p>
      </EuiText>
      <EuiSpacer />
      <EuiButton onClick={simulateApiCall}>Simulate API Call</EuiButton>
      {result && (
        <>
          <EuiSpacer size="s" />
          <EuiCallOut title={result} color="success" size="s" />
        </>
      )}
    </>
  );
};

// -- Tab: Error Tracking -----------------------------------------------------

const ErrorTrackingDemo: React.FC = () => {
  const telemetry = useTelemetry();

  const triggerHandledError = useCallback(() => {
    try {
      JSON.parse('{ invalid json }');
    } catch (e) {
      if (e instanceof Error) {
        telemetry.trackCaughtError(e, { action: 'parse_config' });
      }
    }
  }, [telemetry]);

  const triggerCustomError = useCallback(() => {
    telemetry.trackError('ValidationError', 'Email field is invalid', {
      field: 'email',
      value: 'not-an-email',
    });
  }, [telemetry]);

  return (
    <>
      <EuiText>
        <h3>Error Tracking</h3>
        <p>Record caught exceptions and custom validation errors.</p>
      </EuiText>
      <EuiSpacer />
      <EuiFlexGroup>
        <EuiFlexItem grow={false}>
          <EuiButton color="warning" onClick={triggerHandledError}>
            Trigger Caught Exception
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton color="warning" onClick={triggerCustomError}>
            Trigger Validation Error
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};

// -- Tab: Workflow ------------------------------------------------------------

const WorkflowDemo: React.FC = () => {
  const telemetry = useTelemetry();
  const [step, setStep] = useState(0);
  const [tracker, setTracker] = useState<ReturnType<typeof telemetry.startWorkflow> | null>(null);
  const [name, setName] = useState('');

  const startWorkflow = useCallback(() => {
    const wf = telemetry.startWorkflow('onboarding', { source: 'demo' });
    setTracker(wf);
    setStep(1);
  }, [telemetry]);

  const nextStep = useCallback(() => {
    if (!tracker) return;
    tracker.completeStep(`step_${step}`, { name });
    if (step >= 3) {
      tracker.complete({ finalName: name });
      setStep(0);
      setTracker(null);
      setName('');
    } else {
      setStep(step + 1);
    }
  }, [tracker, step, name]);

  const abandonWorkflow = useCallback(() => {
    tracker?.abandon('user_cancelled');
    setStep(0);
    setTracker(null);
    setName('');
  }, [tracker]);

  return (
    <>
      <EuiText>
        <h3>Workflow Tracking</h3>
        <p>Track multi-step workflows with step completions, total duration, and abandonment.</p>
      </EuiText>
      <EuiSpacer />
      {step === 0 ? (
        <EuiButton onClick={startWorkflow}>Start Onboarding Workflow</EuiButton>
      ) : (
        <EuiForm>
          <EuiCallOut title={`Step ${step} of 3`} size="s" />
          <EuiSpacer size="s" />
          <EuiFormRow label={`Enter value for step ${step}`}>
            <EuiFieldText value={name} onChange={(e) => setName(e.target.value)} />
          </EuiFormRow>
          <EuiSpacer size="s" />
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiButton fill onClick={nextStep}>
                {step >= 3 ? 'Complete' : 'Next Step'}
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton color="danger" onClick={abandonWorkflow}>
                Abandon
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiForm>
      )}
    </>
  );
};
