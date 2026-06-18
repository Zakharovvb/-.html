// ===== CONFIGURATION =====
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const SHEET_CATALOG = 'catalog';
const SHEET_OFFERS = 'offers';
const SHEET_ORDERS = 'orders';

// ===== MAIN ENTRY POINT =====
function doGet(e) {
  const action = e.parameter.action || 'config';
  
  try {
    let result;
    
    if (action === 'config') {
      result = getConfig();
    } else if (action === 'previewResult') {
      result = getPreviewResult(e.parameter);
    } else if (action === 'paidResult') {
      result = getPaidResult(e.parameter);
    } else {
      result = { error: 'Unknown action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const action = e.parameter.action || 'createOrder';
  
  try {
    let result;
    const payload = JSON.parse(e.postData.contents || '{}');
    
    if (action === 'createOrder') {
      result = createOrder(payload);
    } else {
      result = { error: 'Unknown action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== CONFIG =====
function getConfig() {
  return {
    plans: {
      start: { models: 2, price: 490 },
      smart: { models: 4, price: 890 },
      pro: { models: 6, price: 1490 }
    }
  };
}

// ===== PREVIEW RESULT (FREE) =====
function getPreviewResult(params) {
  const models = getModelsFromCatalog(params);
  return {
    models: models.slice(0, 2), // free preview
    total: models.length
  };
}

// ===== PAID RESULT =====
function getPaidResult(params) {
  const plan = params.plan || 'start';
  const limits = { start: 2, smart: 4, pro: 6 };
  const limit = limits[plan] || 2;
  
  const models = getModelsFromCatalog(params);
  return {
    models: models.slice(0, limit),
    plan: plan,
    total: models.length
  };
}

// ===== GET MODELS FROM CATALOG =====
function getModelsFromCatalog(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const catalog = ss.getSheetByName(SHEET_CATALOG);
  const offers = ss.getSheetByName(SHEET_OFFERS);
  
  const catalogData = catalog.getDataRange().getValues();
  const offersData = offers.getDataRange().getValues();
  
  // Parse headers
  const catalogHeaders = catalogData[0];
  const offersHeaders = offersData[0];
  
  // Build models
  const models = [];
  for (let i = 1; i < catalogData.length; i++) {
    const row = catalogData[i];
    const model = {};
    
    catalogHeaders.forEach((h, idx) => {
      model[h] = row[idx];
    });
    
    // Fallback price from offers
    if (!model.price || model.price === 0) {
      const offerRow = offersData.find(r => r[0] === model.id);
      if (offerRow) {
        model.price = offerRow[offersHeaders.indexOf('price')];
      }
    }
    
    models.push(model);
  }
  
  // Filter by params
  let filtered = models.filter(m => {
    const budgetMatch = checkBudget(m.price, params.budget);
    const formatMatch = !params.format || m.type === params.format;
    return budgetMatch && formatMatch;
  });
  
  // Score and sort
  filtered = filtered.map(m => {
    m.score = calculateScore(m, params);
    return m;
  }).sort((a, b) => b.score - a.score);
  
  return filtered;
}

function checkBudget(price, budget) {
  if (!budget) return true;
  if (budget === 'low') return price < 30000;
  if (budget === 'mid') return price >= 30000 && price < 70000;
  if (budget === 'high') return price >= 70000;
  return true;
}

function calculateScore(model, params) {
  let score = 0;
  
  // Brand bonus
  const topBrands = ['YAMAHA', 'ROLAND', 'KORG', 'CASIO'];
  if (topBrands.includes(model.brand)) score += 10;
  
  // Keys bonus
  if (model.keys >= 88) score += 5;
  
  // Price fit
  const budget = params.budget;
  if (budget === 'low' && model.price < 30000) score += 5;
  if (budget === 'mid' && model.price >= 30000 && model.price < 70000) score += 5;
  if (budget === 'high' && model.price >= 70000) score += 5;
  
  return score;
}

// ===== CREATE ORDER =====
function createOrder(payload) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const orders = ss.getSheetByName(SHEET_ORDERS);
  
  const orderid = 'ORD' + Date.now();
  const date = new Date().toISOString();
  
  orders.appendRow([
    orderid,
    date,
    'pending',
    payload.plan || '',
    payload.goal || '',
    payload.budget || '',
    payload.experience || '',
    payload.format || '',
    payload.email || '',
    payload.amount || 0
  ]);
  
  return {
    success: true,
    orderid: orderid
  };
}
