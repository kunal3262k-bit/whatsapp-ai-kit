/**
 * Google Apps Script — append leads to a Sheet.
 *
 * SETUP (5 minutes):
 * 1. Create a Google Sheet. In row 1 add headers: When | Name | Phone | Qualified | <your field keys...>
 * 2. Extensions -> Apps Script. Paste this file. Set SECRET below to any random string.
 * 3. Deploy -> New deployment -> Type: "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Click Deploy, authorize, copy the Web app URL.
 * 4. Put that URL in your .env as GOOGLE_SHEET_WEBHOOK_URL and the same SECRET as GOOGLE_SHEET_SECRET.
 */

const SECRET = 'change-me'; // must match GOOGLE_SHEET_SECRET in .env

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) {
      return ContentService.createTextOutput('forbidden').setMimeType(ContentService.MimeType.TEXT);
    }
    const lead = body.lead || {};
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Build a row: When | Name | Phone | Qualified | then all custom fields in a JSON cell.
    const row = [
      new Date(),
      lead.name || '',
      lead.phone || '',
      lead.qualified ? 'YES' : 'no',
      JSON.stringify(lead.fields || {}),
    ];
    sheet.appendRow(row);

    return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err).setMimeType(ContentService.MimeType.TEXT);
  }
}

// Optional: open the URL in a browser to confirm it is deployed.
function doGet() {
  return ContentService.createTextOutput('WhatsApp AI Kit sheet sink is live.');
}
