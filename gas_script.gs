// ═══════════════════════════════════════════════════════════════════
//  ANTIGRAVITY — Google Apps Script
//  Déployer comme "Application Web" (accès : Tout le monde)
// ═══════════════════════════════════════════════════════════════════

const SHEET_NAME = 'Scores';   // Nom de l'onglet dans Google Sheets

// ── Points d'entrée HTTP ──────────────────────────────────────────

function doGet(e) {
  const action = e.parameter.action || '';

  if (action === 'getScores') {
    return handleGetScores();
  }

  // Ping de test
  return jsonResponse({ status: 'ok', message: 'Antigravity GAS opérationnel' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    return handleSaveScore(body);
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ── GET : récupérer tous les scores ──────────────────────────────

function handleGetScores() {
  const sheet = getOrCreateSheet();
  const data  = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    // Seulement l'en-tête ou vide
    return jsonResponse([]);
  }

  const headers = data[0];  // ['name','score','time','hint','date']
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });

  // Tri par score décroissant côté serveur
  rows.sort((a, b) => Number(b.score) - Number(a.score));

  return jsonResponse(rows);
}

// ── POST : sauvegarder un score ───────────────────────────────────

function handleSaveScore(body) {
  const name  = String(body.name  || 'Anonyme').substring(0, 50);
  const score = Number(body.score || 0);
  const time  = Number(body.time  || 0);
  const hint  = Number(body.hint  || 1);
  const date  = new Date().toISOString();

  const sheet = getOrCreateSheet();
  sheet.appendRow([name, score, time, hint, date]);

  return jsonResponse({ status: 'saved', name, score });
}

// ── Utilitaires ───────────────────────────────────────────────────

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // En-têtes
    sheet.appendRow(['name', 'score', 'time', 'hint', 'date']);
    // Mise en forme de l'en-tête
    const header = sheet.getRange(1, 1, 1, 5);
    header.setFontWeight('bold');
    header.setBackground('#1a1a1a');
    header.setFontColor('#ffd700');
    sheet.setFrozenRows(1);
    // Largeurs
    sheet.setColumnWidth(1, 180);
    sheet.setColumnWidth(2, 100);
    sheet.setColumnWidth(3, 100);
    sheet.setColumnWidth(4, 80);
    sheet.setColumnWidth(5, 200);
  }

  return sheet;
}

function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
