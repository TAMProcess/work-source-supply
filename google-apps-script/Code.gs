/**
 * Work Source Supply — Booking Backend
 * Deploy as Google Apps Script Web App (free)
 *
 * SETUP:
 * 1. Go to https://script.google.com → New Project
 * 2. Paste this entire file into Code.gs
 * 3. Click Run → doGet (authorize permissions when prompted)
 * 4. Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the web app URL and paste it into BOOKINGS_API in app.js
 * 6. Create a Google Sheet and paste its ID below (the long string in the sheet URL)
 */

// ═══════════ CONFIGURATION ═══════════
var SHEET_ID = '';  // Paste your Google Sheet ID here (from the URL)
var OWNER_EMAIL = 'info@worksource.supplies';
var BUSINESS_NAME = 'Work Source Supply';
var CONFIRM_EXPIRY_MINUTES = 30;      // Unconfirmed bookings expire after 30 min
var MAX_BOOKINGS_PER_EMAIL_PER_DAY = 2; // Rate limit per email per day

// ═══════════ GET — Return booked (confirmed) slots ═══════════
function doGet(e) {
  // If this is a confirmation click
  if (e && e.parameter && e.parameter.action === 'confirm') {
    return handleConfirmation(e.parameter.id);
  }
  if (e && e.parameter && e.parameter.action === 'cancel') {
    return handleCancellation(e.parameter.id);
  }

  cleanExpired();
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var slots = [];
  for (var i = 1; i < data.length; i++) {
    // Columns: date, time, name, email, status, confirmId, createdAt
    var status = data[i][4];
    if (status === 'confirmed' || status === 'pending') {
      slots.push({ date: data[i][0], time: data[i][1] });
    }
  }
  return ContentService.createTextOutput(JSON.stringify(slots))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════ POST — Save a new booking ═══════════
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var date = String(body.date || '').substring(0, 20);
    var time = String(body.time || '').substring(0, 20);
    var name = String(body.name || '').substring(0, 100);
    var email = String(body.email || '').substring(0, 100);

    if (!date || !time || !email) {
      return jsonResp({ error: 'Missing required fields' });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResp({ error: 'Invalid email' });
    }

    cleanExpired();
    var sheet = getSheet();
    var data = sheet.getDataRange().getValues();

    // Check if slot is already booked
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === date && data[i][1] === time &&
          (data[i][4] === 'confirmed' || data[i][4] === 'pending')) {
        return jsonResp({ error: 'Slot already booked' });
      }
    }

    // Rate limit: max bookings per email per day
    var todayCount = 0;
    var today = new Date().toISOString().split('T')[0];
    for (var j = 1; j < data.length; j++) {
      if (data[j][3] === email && String(data[j][6]).indexOf(today) === 0 &&
          (data[j][4] === 'confirmed' || data[j][4] === 'pending')) {
        todayCount++;
      }
    }
    if (todayCount >= MAX_BOOKINGS_PER_EMAIL_PER_DAY) {
      return jsonResp({ error: 'Booking limit reached. Try again tomorrow.' });
    }

    // Generate confirmation ID
    var confirmId = Utilities.getUuid();
    var now = new Date().toISOString();

    // Save as pending
    sheet.appendRow([date, time, name, email, 'pending', confirmId, now]);

    // Send confirmation email to customer
    sendConfirmationEmail(name, email, date, time, confirmId);

    // Notify owner
    sendOwnerNotification(name, email, date, time);

    return jsonResp({ success: true, message: 'Booking pending confirmation' });
  } catch (err) {
    return jsonResp({ error: 'Server error' });
  }
}

// ═══════════ CONFIRMATION HANDLER ═══════════
function handleConfirmation(id) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][5] === id) {
      if (data[i][4] === 'confirmed') {
        return htmlResp('Already Confirmed', 'This booking was already confirmed. You\'re all set!');
      }
      if (data[i][4] === 'expired' || data[i][4] === 'cancelled') {
        return htmlResp('Booking Expired', 'This booking has expired. Please book a new time at <a href="https://tamprocess.github.io/schedule.html">our scheduling page</a>.');
      }
      // Mark confirmed
      sheet.getRange(i + 1, 5).setValue('confirmed');

      // Send confirmed notification to owner
      MailApp.sendEmail({
        to: OWNER_EMAIL,
        subject: '✅ Booking CONFIRMED — ' + data[i][2],
        htmlBody: '<h2>Booking Confirmed</h2>' +
          '<p><strong>' + data[i][2] + '</strong> (' + data[i][3] + ') confirmed their booking.</p>' +
          '<p>📅 ' + data[i][0] + ' at ' + data[i][1] + '</p>'
      });

      return htmlResp('Booking Confirmed!',
        '<p>Your consultation with ' + BUSINESS_NAME + ' is confirmed.</p>' +
        '<p>📅 <strong>' + data[i][0] + '</strong> at <strong>' + data[i][1] + '</strong></p>' +
        '<p>We\'ll see you then!</p>');
    }
  }
  return htmlResp('Not Found', 'Booking not found. It may have expired.');
}

// ═══════════ CANCELLATION HANDLER ═══════════
function handleCancellation(id) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][5] === id) {
      sheet.getRange(i + 1, 5).setValue('cancelled');

      MailApp.sendEmail({
        to: OWNER_EMAIL,
        subject: '❌ Booking Cancelled — ' + data[i][2],
        htmlBody: '<p>' + data[i][2] + ' (' + data[i][3] + ') cancelled their booking for ' + data[i][0] + ' at ' + data[i][1] + '.</p>'
      });

      return htmlResp('Booking Cancelled', 'Your booking has been cancelled. You can book a new time at <a href="https://tamprocess.github.io/schedule.html">our scheduling page</a>.');
    }
  }
  return htmlResp('Not Found', 'Booking not found.');
}

// ═══════════ CLEAN EXPIRED PENDING BOOKINGS ═══════════
function cleanExpired() {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var now = new Date().getTime();
  var expiryMs = CONFIRM_EXPIRY_MINUTES * 60 * 1000;

  for (var i = 1; i < data.length; i++) {
    if (data[i][4] === 'pending') {
      var created = new Date(data[i][6]).getTime();
      if (now - created > expiryMs) {
        sheet.getRange(i + 1, 5).setValue('expired');
      }
    }
  }
}

// ═══════════ EMAIL: Confirmation to Customer ═══════════
function sendConfirmationEmail(name, email, date, time, confirmId) {
  var scriptUrl = ScriptApp.getService().getUrl();
  var confirmUrl = scriptUrl + '?action=confirm&id=' + confirmId;
  var cancelUrl = scriptUrl + '?action=cancel&id=' + confirmId;

  var html = '<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">' +
    '<h2 style="color:#00d4ff">Confirm Your Consultation</h2>' +
    '<p>Hi ' + (name || 'there') + ',</p>' +
    '<p>You requested a consultation with <strong>' + BUSINESS_NAME + '</strong>:</p>' +
    '<div style="background:#f5f5f5;padding:15px;border-radius:8px;margin:15px 0">' +
    '<p style="margin:5px 0">📅 <strong>' + date + '</strong></p>' +
    '<p style="margin:5px 0">🕐 <strong>' + time + '</strong></p>' +
    '</div>' +
    '<p><strong>Please confirm within ' + CONFIRM_EXPIRY_MINUTES + ' minutes</strong> or this slot will be released.</p>' +
    '<div style="margin:20px 0">' +
    '<a href="' + confirmUrl + '" style="background:#00d4ff;color:#000;padding:12px 30px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block">✅ Confirm Booking</a>' +
    '</div>' +
    '<p style="font-size:13px;color:#888">Changed your mind? <a href="' + cancelUrl + '">Cancel this booking</a></p>' +
    '</div>';

  MailApp.sendEmail({
    to: email,
    subject: 'Confirm your consultation — ' + BUSINESS_NAME,
    htmlBody: html
  });
}

// ═══════════ EMAIL: Notify Owner ═══════════
function sendOwnerNotification(name, email, date, time) {
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: '🗓️ New Booking (pending) — ' + name,
    htmlBody: '<h2>New Consultation Request</h2>' +
      '<p><strong>Name:</strong> ' + name + '</p>' +
      '<p><strong>Email:</strong> ' + email + '</p>' +
      '<p><strong>Date:</strong> ' + date + '</p>' +
      '<p><strong>Time:</strong> ' + time + '</p>' +
      '<p><em>Status: Pending confirmation (expires in ' + CONFIRM_EXPIRY_MINUTES + ' min)</em></p>'
  });
}

// ═══════════ HELPER: Get or create sheet ═══════════
function getSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('Bookings');
  if (!sheet) {
    sheet = ss.insertSheet('Bookings');
    sheet.appendRow(['date', 'time', 'name', 'email', 'status', 'confirmId', 'createdAt']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
  return sheet;
}

// ═══════════ HELPER: JSON response ═══════════
function jsonResp(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════ HELPER: HTML response (for confirm/cancel pages) ═══════════
function htmlResp(title, bodyHtml) {
  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + title + ' — ' + BUSINESS_NAME + '</title>' +
    '<style>body{font-family:Arial,sans-serif;background:#050510;color:#e0e0e0;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}' +
    '.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:40px;max-width:450px;text-align:center}' +
    'h1{color:#00d4ff;font-size:1.5rem}a{color:#00d4ff}</style></head>' +
    '<body><div class="card"><h1>' + title + '</h1>' + bodyHtml + '</div></body></html>';
  return HtmlService.createHtmlOutput(html);
}