import XLSX from "xlsx";
import { ACCOUNT_IDENTIFIERS, LOOKUP_KEYS, MARKUPS } from "./constant.js";
import { writeCSV } from "./utils.js";

const main = () => {
  var workbook = XLSX.readFile(`source.csv`);
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
    "Customer Charge",
  ];

  let newData = [];

  accountList.map((account) => {
    const data = rowsByAccount[account].map((item) => {
      const weightCharge = item["Weight Charge"] * (MARKUPS[account] || 1);
      const totalCharge =
        item["Weight Charge"] + item["Total Extra Charges (XC)"];
      const customerCharge = weightCharge + item["Total Extra Charges (XC)"];
      return {
        Account: account,
        "Invoice Number": item["Invoice Number"],
        "Invoice Type": item["Product Name"],
        "Invoice Date": item["Invoice Date"],
        "Invoice Due Date": item["Due Date"],
        "Weight Charge": weightCharge,
        "Total Extra Charges": item["Total Extra Charges (XC)"],
        "Total Charge": totalCharge,
        "Customer Charge": customerCharge,
      };
    });
    newData = [...newData, ...data];
  });
  writeCSV(`summary.csv`, headers, newData);
};

main();
