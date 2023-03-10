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
        "Total Charge": totalCharge,
        "Customer Weight Charge": weightCharge,
        "Customer Total Extra Charges": customerCharge - weightCharge,
        "Total Customer Charge": customerCharge,
      };
    });
    newData = [...newData, ...data];
  });

  const transactionReportData = newData.map((item) => ({
    ...item,
    "Total Charge": item["Total Charge"].toFixed(2),
    "Customer Weight Charge": item["Customer Weight Charge"].toFixed(2),
    "Customer Total Extra Charges":
      item["Customer Total Extra Charges"].toFixed(2),
    "Total Customer Charge": item["Total Customer Charge"].toFixed(2),
  }));

  let summaryDataNested = [];

  const summaryKeys = ["Account", "Invoice Number"];
  summaryDataNested = Object.values(
    newData.reduce((r, o) => {
      const key = summaryKeys.map((k) => o[k]).join("|");
      if (!r[key])
        r[key] = {
          ...o,
          "Weight Charge": 0,
          "Total Extra Charges": 0,
          "Total Charge": 0,
          "Customer Weight Charge": 0,
          "Customer Total Extra Charges": 0,
          "Total Customer Charge": 0,
        };
      r[key]["Weight Charge"] += o["Weight Charge"];
      r[key]["Total Extra Charges"] += o["Total Extra Charges"];
      r[key]["Total Charge"] += o["Total Charge"];
      r[key]["Customer Weight Charge"] += o["Customer Weight Charge"];
      r[key]["Customer Total Extra Charges"] +=
        o["Customer Total Extra Charges"];
      r[key]["Total Customer Charge"] += o["Total Customer Charge"];
      return r;
    }, {})
  );

  summaryDataNested = summaryDataNested.map((item) => ({
    ...item,
    "Total Charge": item["Total Charge"].toFixed(2),
    "Customer Weight Charge": item["Customer Weight Charge"].toFixed(2),
    "Customer Total Extra Charges":
      item["Customer Total Extra Charges"].toFixed(2),
    "Total Customer Charge": item["Total Customer Charge"].toFixed(2),
  }));

  const todayFolderPath = generateFolderPath();
  if (!fs.existsSync(`${OUTPUT_PATH}/${todayFolderPath}`)) {
    fs.mkdirSync(`${OUTPUT_PATH}/${todayFolderPath}`, { recursive: true });
  }
  writeCSV(
    `${OUTPUT_PATH}/${todayFolderPath}/transaction-report_${todayFolderPath}.csv`,
    headers,
    transactionReportData
  );

  writeCSV(
    `${OUTPUT_PATH}/${todayFolderPath}/summary_${todayFolderPath}.csv`,
    headers,
    summaryDataNested
  );
};

main();
