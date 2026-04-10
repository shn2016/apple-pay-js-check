import { useEffect, useState } from 'react';
import { ensureApplePaySdkLoaded, getEnvironmentReport } from './utils/applePayEnvironment';

export default function App() {
  const [environmentReport, setEnvironmentReport] = useState(() => getEnvironmentReport());

  useEffect(() => {
    const refreshEnvironmentReport = () => {
      setEnvironmentReport(getEnvironmentReport());
    };

    const handleSdkStatusChange = () => {
      refreshEnvironmentReport();
    };

    ensureApplePaySdkLoaded();
    refreshEnvironmentReport();
    window.addEventListener('resize', refreshEnvironmentReport);
    window.addEventListener('load', refreshEnvironmentReport);
    window.addEventListener('apple-pay-sdk-statuschange', handleSdkStatusChange);

    return () => {
      window.removeEventListener('resize', refreshEnvironmentReport);
      window.removeEventListener('load', refreshEnvironmentReport);
      window.removeEventListener('apple-pay-sdk-statuschange', handleSdkStatusChange);
    };
  }, []);

  const {
    applePayAvailableWithQrCode,
    applePayAvailableWithoutQrCode,
    applePaySdkStatus,
    applePaySupport,
    canMakePaymentsResult,
    hasApplePaySession,
    hasPaymentRequest,
    isSafariOnMac,
    userAgent,
  } = environmentReport;

  const rows = [
    {
      label: 'isApplePayAvailable(true)',
      value: applePayAvailableWithQrCode ? 'Yes' : 'No',
      tone: applePayAvailableWithQrCode ? 'success' : 'danger',
      hint: 'Mobile: Apple mobile device and Apple Pay supported. Desktop with QR enabled: Apple Pay support only.',
    },
    {
      label: 'isApplePayAvailable(false)',
      value: applePayAvailableWithoutQrCode ? 'Yes' : 'No',
      tone: applePayAvailableWithoutQrCode ? 'success' : 'danger',
      hint: 'Mobile: Apple mobile device and Apple Pay supported. Desktop without QR: Safari on Mac and Apple Pay supported.',
    },
    {
      label: 'Apple Pay SDK',
      value: applePaySdkStatus.label,
      tone: applePaySdkStatus.tone,
      hint: 'Loaded at runtime so Apple SDK failures do not block the page from rendering.',
    },
    {
      label: 'Apple Pay Supported',
      value: applePaySupport.label,
      tone: applePaySupport.tone,
      hint: applePaySupport.hint,
    },
    {
      label: 'canMakePayments()',
      value: canMakePaymentsResult,
      tone: canMakePaymentsResult === 'true' ? 'success' : canMakePaymentsResult === 'false' ? 'danger' : 'info',
      hint: 'Raw ApplePaySession.canMakePayments() result shown as true, false, or undefined.',
    },
    {
      label: 'PaymentRequest Available',
      value: hasPaymentRequest ? 'Yes' : 'No',
      tone: hasPaymentRequest ? 'success' : 'danger',
      hint: 'Checks whether window.PaymentRequest exists.',
    },
    {
      label: 'Safari on macOS',
      value: isSafariOnMac ? 'Yes' : 'No',
      tone: isSafariOnMac ? 'success' : 'danger',
      hint: 'User-agent based Safari and macOS detection.',
    },
    {
      label: 'ApplePaySession Present',
      value: hasApplePaySession ? 'Yes' : 'No',
      tone: hasApplePaySession ? 'success' : 'danger',
      hint: 'Checks whether window.ApplePaySession exists.',
    },
  ];

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

      <section className="details-panel" aria-label="Environment checks">
        <h2>Checks</h2>
        <div className="table-wrap">
          <table className="diagnostics-table">
            <thead>
              <tr>
                <th scope="col">Check</th>
                <th scope="col">Value</th>
                <th scope="col">Definition</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" data-label="Check">
                    {row.label}
                  </th>
                  <td data-label="Value">
                    <span className={`status-pill status-pill--${row.tone}`}>{row.value}</span>
                  </td>
                  <td data-label="Definition">{row.hint}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
