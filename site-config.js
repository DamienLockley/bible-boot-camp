/* Safe public configuration. Never put private tokens, admin keys or personal email addresses here. */
window.SITE_CONFIG = {
  contactWebAppUrl: 'https://script.google.com/macros/s/AKfycbx11Rg4Rxci8lULnHSAQPTgldV530_XMWkTZkgOhNGFKAq61i6UWyhdRdk-LW1OYmYz8w/exec',
  firebaseConfig: {
    apiKey: 'AIzaSyD6E9DOClmq5ZmzBniI1LTrDS4MlPT5rY4',
    authDomain: 'getting-to-know-jesus.firebaseapp.com',
    projectId: 'getting-to-know-jesus',
    storageBucket: 'getting-to-know-jesus.firebasestorage.app',
    messagingSenderId: '1095983293750',
    appId: '1:1095983293750:web:d2838594f0655008d4bf97'
  }
};


// Creation section and lesson pages share this configuration.
if (location.pathname.startsWith('/creation/')) {
  const loadCreationReader = () => {
    const reader = document.createElement('script');
    reader.src = '/scripture-auto.js?v=2';
    document.head.append(reader);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadCreationReader);
  else loadCreationReader();
}
