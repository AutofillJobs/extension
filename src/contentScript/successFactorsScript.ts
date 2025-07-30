// SuccessFactors Application Autofill Script
// This script will autofill the SAP SuccessFactors application form using dummy data.
// TODO: Add field mapping logic once column insights are provided.

import dummyData from '../../dummy_data.json';

const SUCCESS_FACTORS_URL = 'https://career5.successfactors.eu/portalcareer?company=SAP&rcm%5fsite%5flocale=en%5fUS&&navBarLevel=MY_PROFILE&_s.crb=iRRbzDWOwqWS01Akt5mZBHH4aqIwg%252b84BNnZKk%252byACQ%253d#sfPanelHeaderAnchor_249_';

function isSuccessFactorsPage(): boolean {
  return window.location.href.startsWith(SUCCESS_FACTORS_URL);
}

function autofillSuccessFactorsForm() {
  if (!isSuccessFactorsPage()) return;
  // TODO: Add logic to select and fill form fields using dummyData
  console.log('Autofill SuccessFactors: dummy data loaded', dummyData);
}

document.addEventListener('DOMContentLoaded', autofillSuccessFactorsForm);
