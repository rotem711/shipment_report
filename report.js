import XLSX from "xlsx";
import fs from "fs";
import {
  ACCOUNT_IDENTIFIERS,
  LOOKUP_KEYS,
  MARKUPS,
  INPUT_PATH,
  OUTPUT_PATH,
} from "./constant.js";
import { writeCSV, generateFolderPath } from "./utils.js";

const main = () => {
  var workbook = XLSX.readFile(`${INPUT_PATH}/source.csv`);
  var sheet_name_list = workbook.SheetNames;
  var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

  const rowsByAccount = [];
  xlData.map((item) => {
    for (let i = 0; i < ACCOUNT_IDENTIFIERS.length; i++) {
      for (const key in LOOKUP_KEYS) {
        for (let j = 0; j < LOOKUP_KEYS[key].length; j++) {
          const lookupKey = LOOKUP_KEYS[key][j];
          if (
            item[ACCOUNT_IDENTIFIERS[i]]
              .toLowerCase()
              .indexOf(lookupKey.toLowerCase()) > -1
          ) {
            rowsByAccount[key] = rowsByAccount[key] || [];
            rowsByAccount[key].push(item);
            return;
          }
        }
      }
    }
    rowsByAccount[item["Senders Name"]] =
      rowsByAccount[item["Senders Name"]] || [];
    rowsByAccount[item["Senders Name"]].push(item);
    return;
  });
  const accountList = Object.keys(rowsByAccount);

  const headers = Object.keys(xlData[0]);

  const todayFolderPath = generateFolderPath();
  if (!fs.existsSync(`${OUTPUT_PATH}/${todayFolderPath}`)) {
    fs.mkdirSync(`${OUTPUT_PATH}/${todayFolderPath}`, { recursive: true });
  }

  accountList.map((account) => {
    const data = rowsByAccount[account].map((item) => {
      const weightCharge = item["Weight Charge"] * (MARKUPS[account] || 1);
      const totalCharge = weightCharge + item["Total Extra Charges (XC)"];
      const totalAmount = weightCharge + item["Total Extra Charges (XC)"];
      return {
        ...item,
        "Weight Charge": weightCharge.toFixed(2),
        "Total Charge": totalCharge.toFixed(2),
        "Total Amount": totalAmount.toFixed(2),
      };
    });
    const filename = `shipment-report_${account
      .replace(/ /g, "-")
      .toLowerCase()}_${todayFolderPath}.csv`;
    writeCSV(`${OUTPUT_PATH}/${todayFolderPath}/${filename}`, headers, data);
  });
};

main();
