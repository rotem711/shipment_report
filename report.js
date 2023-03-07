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

  const headers = Object.keys(xlData[0]);

  accountList.map((account) => {
    const data = rowsByAccount[account].map((item) => {
      const weightCharge = item["Weight Charge"] * (MARKUPS[account] || 1);
      const totalCharge = weightCharge + item["Total Extra Charges (XC)"];
      const totalAmount = weightCharge + item["Total Extra Charges (XC)"];
      return {
        ...item,
        "Weight Charge": weightCharge,
        "Total Charge": totalCharge,
        "Total Amount": totalAmount,
      };
    });
    writeCSV(
      `report/shipment-report_${account.replace(/ /g, "-")}.csv`,
      headers,
      data
    );
  });
};

main();
