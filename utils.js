import fs from "fs";
import { stringify } from "csv-stringify";

const writeCSV = (filename, header, data) => {
  const writableStream = fs.createWriteStream(filename);

  const stringifier = stringify({ header: true, columns: header });
  data.map((row) => {
    stringifier.write(row);
  });
  stringifier.pipe(writableStream);
  console.log("Finished writing data");
};

export { writeCSV };
