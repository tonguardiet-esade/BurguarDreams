/**
 * Apps Script — suministros Burguar Dreams.
 *
 * Facturas (agua/luz):
 *   a_pagar = importe_mes / días_mes * días_ocupados
 *
 * A compte: lo que el inquilino aporta cada mes de suministros (negativo en hoja).
 *   Si agua+luz > |a compte| → el inquilino debe (saldo sube).
 *   Si agua+luz < |a compte| → a favor del inquilino (saldo baja).
 *
 * Saldo (fórmula):
 *   saldo = saldo_mes_anterior + agua + luz + a_compte
 *
 * Dates vacío = mes completo; con fecha = entrada/salida.
 *
 * Tras editar: Implementar → Nueva versión. SECRET = burguar-sheets-local
 */

var SHEET_ID = "11RT8uFbMS3CD1TfrdEdJUyoz0HZFcKs0L7q6pq_6F1k";

/** Columnas 1-based */
var BLOCKS = {
  "prop-urgell": { month: 2, date: 3, water: 4, light: 5, aCompte: 6, saldo: 7 },
  "prop-can-bruixa": { month: 9, date: 10, water: 11, light: 12, aCompte: 13, saldo: 14 },
  "prop-valencia": { month: 16, date: 17, water: 18, light: 19, aCompte: 20, saldo: 21 },
  "prop-gran-via": { month: 23, date: 24, water: 25, light: 26, aCompte: 27, saldo: 28 },
};

var TENANCIES = {
  "prop-urgell": { start: "2026-07-01", end: "2027-05-31", aCompte: 150 },
  "prop-can-bruixa": { start: "2026-07-13", end: "2027-06-12", aCompte: 35 },
  "prop-valencia": { start: "2026-09-16", end: "2027-08-15", aCompte: 100 },
  "prop-gran-via": { start: "2026-10-03", end: "2027-09-02", aCompte: 100 },
};

var MONTH_ABBR = {
  "01": "ene",
  "02": "feb",
  "03": "mar",
  "04": "abr",
  "05": "may",
  "06": "jun",
  "07": "jul",
  "08": "ago",
  "09": "sep",
  "10": "oct",
  "11": "nov",
  "12": "dic",
};

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var expected = PropertiesService.getScriptProperties().getProperty("SECRET") || "";
    if (expected && body.secret !== expected) {
      return json_({ ok: false, error: "forbidden", message: "Secreto inválido" });
    }

    var action = String(body.action || "invoice");
    if (action === "syncTenancyDates") {
      return json_(syncTenancyDates_());
    }

    return json_(writeInvoice_(body));
  } catch (err) {
    return json_({ ok: false, error: "server_error", message: String(err) });
  }
}

function doGet() {
  return json_({
    ok: true,
    service: "burguar-utilities-sheets",
    proration: true,
    aCompte: true,
  });
}

/**
 * Dates entrada/salida + A compte prorrateado + fórmulas de Saldo.
 */
function syncTenancyDates_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheets()[0];
  var updated = [];

  Object.keys(TENANCIES).forEach(function (propertyId) {
    var block = BLOCKS[propertyId];
    var tenancy = TENANCIES[propertyId];
    var start = parseIso_(tenancy.start);
    var end = parseIso_(tenancy.end);
    var cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    var last = new Date(end.getFullYear(), end.getMonth(), 1);

    while (cursor <= last) {
      var y = cursor.getFullYear();
      var m = cursor.getMonth() + 1;
      var abbr = MONTH_ABBR[pad2_(m)];
      var row = findMonthRow_(sheet, block.month, block.date, abbr, y);
      if (row) {
        var isStartMonth = y === start.getFullYear() && m === start.getMonth() + 1;
        var isEndMonth = y === end.getFullYear() && m === end.getMonth() + 1;
        var dateCell = sheet.getRange(row, block.date);
        if (isStartMonth) {
          dateCell.setValue(formatSheetDate_(start));
        } else if (isEndMonth) {
          dateCell.setValue(formatSheetDate_(end));
        } else {
          dateCell.clearContent();
        }

        var info = occupancyForMonth_(tenancy.start, tenancy.end, y, m);
        var aCompte = round2_(
          -tenancy.aCompte * (info.occupiedDays / info.daysInMonth),
        );
        sheet.getRange(row, block.aCompte).setValue(aCompte);
        writeSaldoFormula_(sheet, block, row);

        updated.push({
          propertyId: propertyId,
          month: y + "-" + pad2_(m),
          row: row,
          date: isStartMonth
            ? formatSheetDate_(start)
            : isEndMonth
              ? formatSheetDate_(end)
              : "",
          aCompte: aCompte,
        });
      }
      cursor = new Date(y, m, 1);
    }
  });

  SpreadsheetApp.flush();
  return { ok: true, action: "syncTenancyDates", updated: updated };
}

function writeInvoice_(body) {
  var propertyId = String(body.propertyId || "");
  var block = BLOCKS[propertyId];
  if (!block) {
    return { ok: false, error: "unknown_property", message: "Apartamento desconocido" };
  }

  var tenancy = TENANCIES[propertyId];
  if (!tenancy) {
    return { ok: false, error: "unknown_tenancy", message: "Sin periodo de alquiler" };
  }

  var monthIso = String(body.month || "");
  var parts = monthIso.split("-");
  if (parts.length !== 2) {
    return { ok: false, error: "invalid_month", message: "Mes inválido (usa YYYY-MM)" };
  }
  var year = Number(parts[0]);
  var monthNum = Number(parts[1]);
  var abbr = MONTH_ABBR[pad2_(monthNum)];
  if (!abbr || !year || !monthNum) {
    return { ok: false, error: "invalid_month", message: "Mes inválido" };
  }

  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheets()[0];
  var row = findMonthRow_(sheet, block.month, block.date, abbr, year);
  if (!row) {
    return {
      ok: false,
      error: "month_not_found",
      message: "No se encontró la fila " + abbr + " " + year,
    };
  }

  var waterFull = formatEuro_(body.water);
  var lightFull = formatEuro_(body.electricity);
  var info = occupancyForMonth_(tenancy.start, tenancy.end, year, monthNum);

  var waterPay =
    waterFull === null ? null : round2_(waterFull * (info.occupiedDays / info.daysInMonth));
  var lightPay =
    lightFull === null ? null : round2_(lightFull * (info.occupiedDays / info.daysInMonth));

  // A compte: aportación mensual del inquilino (negativo), también prorrateada.
  var aCompte = round2_(-tenancy.aCompte * (info.occupiedDays / info.daysInMonth));

  if (waterPay !== null) sheet.getRange(row, block.water).setValue(waterPay);
  if (lightPay !== null) sheet.getRange(row, block.light).setValue(lightPay);
  sheet.getRange(row, block.aCompte).setValue(aCompte);
  writeSaldoFormula_(sheet, block, row);

  SpreadsheetApp.flush();
  return {
    ok: true,
    propertyId: propertyId,
    month: monthIso,
    row: row,
    daysInMonth: info.daysInMonth,
    occupiedDays: info.occupiedDays,
    fullMonth: info.fullMonth,
    waterFull: waterFull,
    electricityFull: lightFull,
    water: waterPay,
    electricity: lightPay,
    aCompte: aCompte,
    aCompteFull: -tenancy.aCompte,
    formula: "saldo = anterior + agua + luz + a_compte",
  };
}

/** saldo = N(saldo_fila_anterior) + agua + luz + a_compte */
function writeSaldoFormula_(sheet, block, row) {
  var prev = colToA1_(block.saldo) + (row - 1);
  var water = colToA1_(block.water) + row;
  var light = colToA1_(block.light) + row;
  var aCompte = colToA1_(block.aCompte) + row;
  var formula = "=N(" + prev + ")+" + water + "+" + light + "+" + aCompte;
  sheet.getRange(row, block.saldo).setFormula(formula);
}

function colToA1_(col) {
  var s = "";
  var n = col;
  while (n > 0) {
    var m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function occupancyForMonth_(startIso, endIso, year, month) {
  var start = parseIso_(startIso);
  var end = parseIso_(endIso);
  var monthStart = new Date(year, month - 1, 1);
  var daysInMonth = new Date(year, month, 0).getDate();
  var monthEnd = new Date(year, month - 1, daysInMonth);

  var occStart = start > monthStart ? start : monthStart;
  var occEnd = end < monthEnd ? end : monthEnd;
  if (occStart > occEnd) {
    return { daysInMonth: daysInMonth, occupiedDays: 0, fullMonth: false };
  }
  var occupiedDays =
    Math.round((occEnd.getTime() - occStart.getTime()) / 86400000) + 1;
  return {
    daysInMonth: daysInMonth,
    occupiedDays: occupiedDays,
    fullMonth: occupiedDays === daysInMonth,
  };
}

function findMonthRow_(sheet, monthCol, dateCol, abbr, year) {
  var last = Math.max(sheet.getLastRow(), 30);
  var values = sheet.getRange(1, monthCol, last, monthCol).getDisplayValues();
  var dates = sheet.getRange(1, dateCol, last, dateCol).getDisplayValues();
  var candidates = [];
  for (var i = 0; i < values.length; i++) {
    var label = String(values[i][0] || "")
      .trim()
      .toLowerCase();
    if (label !== abbr) continue;
    var row = i + 1;
    var dateYear = parseYear_(String(dates[i][0] || ""));
    candidates.push({ row: row, dateYear: dateYear });
  }
  if (!candidates.length) return null;

  for (var c = 0; c < candidates.length; c++) {
    if (candidates[c].dateYear === year) return candidates[c].row;
  }

  if (year <= 2026) return candidates[0].row;
  return candidates[candidates.length - 1].row;
}

function parseIso_(iso) {
  var p = String(iso).split("-");
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

function parseYear_(text) {
  var m = String(text).match(/(20\d{2})/);
  return m ? Number(m[1]) : null;
}

function formatSheetDate_(d) {
  return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
}

function pad2_(n) {
  return (n < 10 ? "0" : "") + n;
}

function round2_(n) {
  return Math.round(n * 100) / 100;
}

function formatEuro_(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") return null;
  var s = String(raw).trim().replace(/\s/g, "").replace("€", "");
  if (s.indexOf(",") >= 0 && s.indexOf(".") >= 0) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.indexOf(",") >= 0) {
    s = s.replace(",", ".");
  }
  var n = Number(s);
  if (!isFinite(n)) return null;
  return n;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
