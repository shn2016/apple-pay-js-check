const DEFAULT_REPORT = {
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
  canMakePaymentsResult: 'undefined',
  applePayAvailableWithQrCode: false,
  applePayAvailableWithoutQrCode: false,
  userAgent: '',
};

const APPLE_PAY_SDK_ID = 'apple-pay-sdk';
const APPLE_PAY_SDK_SRC = 'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';
const APPLE_PAY_SDK_EVENT = 'apple-pay-sdk-statuschange';

function setApplePaySdkStatus(status) {
  window.__applePaySdkStatus = status;
  window.dispatchEvent(new CustomEvent(APPLE_PAY_SDK_EVENT, { detail: status }));
}

export function ensureApplePaySdkLoaded() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  if ('ApplePaySession' in window) {
    setApplePaySdkStatus('loaded');
    return;
  }

  const existingScript = document.getElementById(APPLE_PAY_SDK_ID);
  if (existingScript) {
    return;
  }

  const handleWindowError = (event) => {
    const filename = event.filename || '';
    if (filename.includes('apple-pay-sdk.js')) {
      setApplePaySdkStatus('failed');
      window.removeEventListener('error', handleWindowError);
    }
  };

  window.addEventListener('error', handleWindowError);
  setApplePaySdkStatus('loading');

  const script = document.createElement('script');
  script.id = APPLE_PAY_SDK_ID;
  script.src = APPLE_PAY_SDK_SRC;
  script.crossOrigin = 'anonymous';
  script.async = true;
  script.onload = () => {
    setApplePaySdkStatus('loaded');
    window.removeEventListener('error', handleWindowError);
  };
  script.onerror = () => {
    setApplePaySdkStatus('failed');
    window.removeEventListener('error', handleWindowError);
  };

  document.head.appendChild(script);
}

function getApplePaySdkStatus() {
  const sdkStatusMap = {
    unavailable: { label: 'Unavailable', tone: 'danger' },
    loading: { label: 'Loading', tone: 'info' },
    loaded: { label: 'Loaded', tone: 'success' },
    failed: { label: 'Failed', tone: 'danger' },
  };

  return sdkStatusMap[window.__applePaySdkStatus] || sdkStatusMap.unavailable;
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

function isMobileDevice(userAgent, isIPhone, isIPad) {
  return isIPhone || isIPad || /Android|Mobile/i.test(userAgent);
}

function isSafariBrowser(userAgent) {
  return /Safari/i.test(userAgent) && !/Chrome|CriOS|Edg|OPR|Firefox|FxiOS/i.test(userAgent);
}

function getApplePaySupport() {
  const hasApplePaySession = 'ApplePaySession' in window;
  const hasPaymentRequest = 'PaymentRequest' in window;

  if (!hasPaymentRequest || !hasApplePaySession) {
    return {
      hasApplePaySession,
      hasPaymentRequest,
      isApplePaySupported: false,
      canMakePaymentsResult: 'undefined',
      applePaySupport: {
        label: 'No',
        tone: 'danger',
        hint:
          'Defined as unavailable because PaymentRequest or ApplePaySession is missing in this browser',
      },
    };
  }

  if (!window.isSecureContext) {
    return {
      hasApplePaySession,
      hasPaymentRequest,
      isApplePaySupported: false,
      canMakePaymentsResult: 'undefined',
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
      hasPaymentRequest,
      isApplePaySupported: false,
      canMakePaymentsResult: 'undefined',
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
      hasPaymentRequest,
      isApplePaySupported: Boolean(canMakePayments),
      canMakePaymentsResult: String(canMakePayments),
      applePaySupport: {
        label: canMakePayments ? 'Yes' : 'No',
        tone: canMakePayments ? 'success' : 'danger',
        hint:
          'Defined by PaymentRequest and ApplePaySession existing, plus ApplePaySession.canMakePayments() returning true',
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
        hasPaymentRequest,
        isApplePaySupported: false,
        canMakePaymentsResult: 'undefined',
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
      hasPaymentRequest,
      isApplePaySupported: false,
      canMakePaymentsResult: 'undefined',
      applePaySupport: {
        label: 'Error',
        tone: 'danger',
        hint: error instanceof Error ? error.message : 'Unexpected Apple Pay runtime error',
      },
    };
  }
}

function getApplePayAvailability({
  enableQrCode,
  isMobile,
  isAppleMobile,
  isSafariOnMac,
  isApplePaySupported,
}) {
  if (isMobile) {
    return isAppleMobile && isApplePaySupported;
  }

  if (enableQrCode) {
    return isApplePaySupported;
  }

  return isSafariOnMac && isApplePaySupported;
}

export function getEnvironmentReport() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return DEFAULT_REPORT;
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform || '';
  const touchPoints = navigator.maxTouchPoints || 0;
  const { isIPhone, isIPad, isMac } = detectAppleDevice(userAgent, platform, touchPoints);
  const isMobile = isMobileDevice(userAgent, isIPhone, isIPad);
  const isSafari = isSafariBrowser(userAgent);
  const isAppleMobile = isIPhone || isIPad;
  const {
    hasApplePaySession,
    hasPaymentRequest,
    isApplePaySupported,
    canMakePaymentsResult,
    applePaySupport,
  } = getApplePaySupport();
  const safariOnMac = isSafari && isMac;
  const applePayAvailableWithQrCode = getApplePayAvailability({
    enableQrCode: true,
    isMobile,
    isAppleMobile,
    isSafariOnMac: safariOnMac,
    isApplePaySupported,
  });
  const applePayAvailableWithoutQrCode = getApplePayAvailability({
    enableQrCode: false,
    isMobile,
    isAppleMobile,
    isSafariOnMac: safariOnMac,
    isApplePaySupported,
  });

  return {
    applePaySdkStatus: getApplePaySdkStatus(),
    applePaySupport,
    isSafariOnMac: safariOnMac,
    hasApplePaySession,
    hasPaymentRequest,
    canMakePaymentsResult,
    applePayAvailableWithQrCode,
    applePayAvailableWithoutQrCode,
    userAgent,
  };
}
