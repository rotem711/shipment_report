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

  const headers = [
    "Account",
    "Invoice Number",
    "Invoice Type",
    "Invoice Date",
    "Invoice Due Date",
    "Weight Charge",
    "Total Extra Charges",
    "Total Charge",
    "Customer Weight Charge",
    "Customer Total Extra Charges",
    "Total Customer Charge",
  ];

  let newData = [];

  accountList.map((account) => {
    const data = rowsByAccount[account].map((item) => {
      const weightCharge = item["Weight Charge"] * (MARKUPS[account] || 1);
      const totalCharge =
        item["Weight Charge"] + item["Total Extra Charges (XC)"];
      const customerCharge = weightCharge + item["Total Extra Charges (XC)"];
      let invoiceType = item["Product Name"];
      invoiceType = invoiceType
        .replace("EXPRESS WORLDWIDE nondoc", "Express Worldwide")
        .replace("DESTINATION CHARGES", "Destination Charges");
      return {
        Account: account,
        "Invoice Number": item["Invoice Number"],
        "Invoice Type": invoiceType,
        "Invoice Date": item["Invoice Date"],
        "Invoice Due Date": item["Due Date"],
        "Weight Charge": item["Weight Charge"],
        "Total Extra Charges": item["Total Extra Charges (XC)"],
        "Total Charge": totalCharge.toFixed(2),
        "Customer Weight Charge": weightCharge.toFixed(2),
        "Customer Total Extra Charges": (
          customerCharge - item["Weight Charge"]
        ).toFixed(2),
        "Total Customer Charge": customerCharge.toFixed(2),
      };
    });
    newData = [...newData, ...data];
  });

  const todayFolderPath = generateFolderPath();
  if (!fs.existsSync(`${OUTPUT_PATH}/${todayFolderPath}`)) {
    fs.mkdirSync(`${OUTPUT_PATH}/${todayFolderPath}`, { recursive: true });
  }
  writeCSV(`${OUTPUT_PATH}/${todayFolderPath}/summary.csv`, headers, newData);
};

main();
