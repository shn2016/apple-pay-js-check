import { useEffect, useState } from 'react';
import StatusCard from './components/StatusCard';
import { getEnvironmentReport } from './utils/applePayEnvironment';

export default function App() {
  const [environmentReport, setEnvironmentReport] = useState(() => getEnvironmentReport());

  useEffect(() => {
    const refreshEnvironmentReport = () => {
      setEnvironmentReport(getEnvironmentReport());
    };

    refreshEnvironmentReport();
    window.addEventListener('resize', refreshEnvironmentReport);
    window.addEventListener('load', refreshEnvironmentReport);

    return () => {
      window.removeEventListener('resize', refreshEnvironmentReport);
      window.removeEventListener('load', refreshEnvironmentReport);
    };
  }, []);

  const {
    appleDevice,
    applePaySdkStatus,
    applePaySupport,
    formFactor,
    hasApplePaySession,
    hasPaymentRequest,
    isSafariOnMac,
    userAgent,
  } = environmentReport;

  return (
    <main className="page-shell">
      <div className="hero">
        <p className="hero__eyebrow">Apple Pay Device Check</p>
        <h1>Check whether this browser is ready for Apple Pay.</h1>
        <p className="hero__copy">
          This page inspects the current browser environment and reports the Apple Pay and payment
          API signals that are available to your JavaScript runtime.
        </p>
      </div>

      <section className="status-grid" aria-label="Environment checks">
        <StatusCard label="View Type" value={formFactor} tone="info" />
        <StatusCard label="Apple Device" value={appleDevice} tone="info" />
        <StatusCard
          label="Apple Pay SDK"
          value={applePaySdkStatus.label}
          tone={applePaySdkStatus.tone}
          hint="Tracks whether apple-pay-sdk.js finished loading"
        />
        <StatusCard
          label="Apple Pay Supported"
          value={applePaySupport.label}
          tone={applePaySupport.tone}
          hint={applePaySupport.hint}
        />
        <StatusCard
          label="PaymentRequest Available"
          value={hasPaymentRequest ? 'Yes' : 'No'}
          tone={hasPaymentRequest ? 'success' : 'danger'}
          hint="Checks whether window.PaymentRequest exists"
        />
        <StatusCard
          label="Safari on macOS"
          value={isSafariOnMac ? 'Yes' : 'No'}
          tone={isSafariOnMac ? 'success' : 'danger'}
        />
        <StatusCard
          label="ApplePaySession Present"
          value={hasApplePaySession ? 'Yes' : 'No'}
          tone={hasApplePaySession ? 'success' : 'danger'}
        />
      </section>

      <section className="details-panel">
        <h2>Browser details</h2>
        <p className="details-panel__copy">
          User agent checks are best used for display logic. The Apple Pay status above comes from
          the runtime APIs, including safe handling for insecure-document errors.
        </p>
        <pre className="ua-box">{userAgent}</pre>
      </section>
    </main>
  );
}
