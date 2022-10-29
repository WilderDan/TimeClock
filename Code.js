function doGet(request) {
  let output = HtmlService.createTemplateFromFile('Page')
      .evaluate();
  output.setTitle('Time Clock');

  return output;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function getMostRecentClockInOut() {
  let ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName('Recent');

  // Day | Date | Time In | Time Out | Week Total
  let mostRecentClockInOut = sheet.getRange(2, 1, 1, 5).getValues()[0];

  // Convert date to string if applicable
  if (mostRecentClockInOut[1]) {
    mostRecentClockInOut[1] = mostRecentClockInOut[1].toLocaleDateString();
  }

  // Convert times if applicable
  if (mostRecentClockInOut[2]) {
    mostRecentClockInOut[2] = 
      mostRecentClockInOut[2].toLocaleTimeString('en-us', {hour: '2-digit', minute:'2-digit'});
  }
  if (mostRecentClockInOut[3]) {
    mostRecentClockInOut[3] = 
      mostRecentClockInOut[3].toLocaleTimeString('en-us', {hour: '2-digit', minute:'2-digit'});
  }

  if (mostRecentClockInOut[4]) {
    mostRecentClockInOut[4] = mostRecentClockInOut[4].toFixed(2);
  }

  return {mostRecentClockInOut: mostRecentClockInOut};
}

function clockIn({dateStr, time}) {
  let ss = SpreadsheetApp.getActive();
  let recentSheet = ss.getSheetByName('Recent');
  let range = recentSheet.getRange(2, 1, 1, 4);
  let day = new Date(Date.parse(dateStr)).toLocaleDateString('en-us', { weekday: 'long' });

  let clockInValues = [day, dateStr, time, ""];
  range.setValues([ clockInValues ]);

  saveToWeekSheet(clockInValues);

  return {dateStr, time, weekTotal: null};
}

function clockOut({dateStr, time}) {
  let ss = SpreadsheetApp.getActive();

  let recentSheet = ss.getSheetByName('Recent');
  let recentClockOutRange = recentSheet.getRange(2, 4, 1, 1);
  let recentWeekTotalRange = recentSheet.getRange(2, 5, 1, 1);

  let weekSheet = ss.getSheetByName(getWeekSheetName());
  let firstBlank = weekSheet.getRange(2, 4, 7, 1).getValues().map((row) => row[0]).indexOf("");
  let clockOutRange = weekSheet.getRange(2 + firstBlank, 4, 1, 1);
  let weekTotalRange = weekSheet.getRange(2, 7, 1, 1);
  let weekTotal = weekTotalRange.getValue();

  clockOutRange.setValue(time);
  weekTotal = weekTotalRange.getValue();

  recentClockOutRange.setValue(time);
  recentWeekTotalRange.setValue(weekTotal);
  
  return {dateStr, time, weekTotal: weekTotal.toFixed(2)};
}

function getWeekSheetName() {
  let now = new Date();
  let dateOfCurrentWeeksEnd = new Date(now.getTime());
  dateOfCurrentWeeksEnd.setDate(now.getDate() - now.getDay() + 6)

  return `Week Ending ${dateOfCurrentWeeksEnd.toLocaleDateString()}`;
}

function saveToWeekSheet([day, dateStr, time]) {
  let ss = SpreadsheetApp.getActive();

  let sheetTitle = getWeekSheetName();
  let sheet = ss.getSheetByName(sheetTitle);
  if (!sheet) {
     sheet = ss.getSheetByName('Week Template').copyTo(ss);
     sheet.setName(sheetTitle);
  }
  
  let values = sheet.getRange(2, 1, 7, 3).getValues();
  let firstBlank = values.map((row) => row[0]).indexOf("");
  let clockInRange = sheet.getRange(2 + firstBlank, 1, 1, 3);

  clockInRange.setValues([ [day, dateStr, time] ]);
}