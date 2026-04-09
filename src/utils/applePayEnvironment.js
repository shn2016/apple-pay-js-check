const DEFAULT_REPORT = {
  formFactor: 'Desktop',
  appleDevice: 'Other',
  applePaySdkStatus: {
    label: 'Unavailable',
    tone: 'danger',
  },
  applePaySupport: {
    label: 'No',
    tone: 'danger',
    hint: 'Apple Pay runtime APIs are not available in this environment',
  },
  isSafariOnMac: false,
  hasApplePaySession: false,
  hasPaymentRequest: false,
  userAgent: '',
};

function getApplePaySdkStatus() {
  const sdkStatusMap = {
    loading: { label: 'Loading', tone: 'info' },
    loaded: { label: 'Loaded', tone: 'success' },
    failed: { label: 'Failed', tone: 'danger' },
  };

  return sdkStatusMap[window.__applePaySdkStatus] || { label: 'Unknown', tone: 'info' };
}

function detectAppleDevice(userAgent, platform, touchPoints) {
  const isIPhone = /iPhone/i.test(userAgent);
  const isIPad =
    /iPad/i.test(userAgent) ||
    (platform === 'MacIntel' && touchPoints > 1) ||
    (/Macintosh/i.test(userAgent) && touchPoints > 1);
  const isMac = /Mac/i.test(platform) && !isIPad;

  let appleDevice = 'Other';
  if (isIPhone) appleDevice = 'iPhone';
  else if (isIPad) appleDevice = 'iPad';
  else if (isMac) appleDevice = 'Mac';

  return { appleDevice, isIPhone, isIPad, isMac };
}

function getApplePaySupport() {
  const hasApplePaySession = 'ApplePaySession' in window;

  if (!hasApplePaySession) {
    return {
      hasApplePaySession,
      applePaySupport: {
        label: 'No',
        tone: 'danger',
        hint: 'Defined as unavailable because window.ApplePaySession is missing in this browser',
      },
    };
  }

  if (!window.isSecureContext) {
    return {
      hasApplePaySession,
      applePaySupport: {
        label: 'Insecure',
        tone: 'warning',
        hint:
          'Defined as insecure because ApplePaySession exists, but canMakePayments() cannot run from this document context',
      },
    };
  }

  if (typeof window.ApplePaySession.canMakePayments !== 'function') {
    return {
      hasApplePaySession,
      applePaySupport: {
        label: 'Unknown',
        tone: 'info',
        hint:
          'Defined as unknown because ApplePaySession exists, but canMakePayments() is not callable',
      },
    };
  }

  try {
    const canMakePayments = window.ApplePaySession.canMakePayments();

    return {
      hasApplePaySession,
      applePaySupport: {
        label: canMakePayments ? 'Yes' : 'No',
        tone: canMakePayments ? 'success' : 'danger',
        hint:
          'Defined by window.ApplePaySession existing and ApplePaySession.canMakePayments() returning true',
      },
    };
  } catch (error) {
    const isInsecureDocumentError =
      error instanceof DOMException &&
      error.name === 'InvalidAccessError' &&
      /insecure document/i.test(error.message);

    if (isInsecureDocumentError) {
      return {
        hasApplePaySession,
        applePaySupport: {
          label: 'Insecure',
          tone: 'warning',
          hint:
            'Defined as insecure because ApplePaySession.canMakePayments() threw an insecure document error',
        },
      };
    }

    return {
      hasApplePaySession,
      applePaySupport: {
        label: 'Error',
        tone: 'danger',
        hint: error instanceof Error ? error.message : 'Unexpected Apple Pay runtime error',
      },
    };
  }
}

export function getEnvironmentReport() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return DEFAULT_REPORT;
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform || '';
  const touchPoints = navigator.maxTouchPoints || 0;
  const { appleDevice, isIPhone, isIPad, isMac } = detectAppleDevice(
    userAgent,
    platform,
    touchPoints,
  );

  const isMobile = isIPhone || isIPad || /Android|Mobile/i.test(userAgent);
  const isSafari =
    /Safari/i.test(userAgent) && !/Chrome|CriOS|Edg|OPR|Firefox|FxiOS/i.test(userAgent);
  const { hasApplePaySession, applePaySupport } = getApplePaySupport();

  return {
    formFactor: isMobile ? 'Mobile' : 'Desktop',
    appleDevice,
    applePaySdkStatus: getApplePaySdkStatus(),
    applePaySupport,
    isSafariOnMac: isSafari && isMac,
    hasApplePaySession,
    hasPaymentRequest: 'PaymentRequest' in window,
    userAgent,
  };
}
