import fs from "fs"
import { stringify } from "csv-stringify"
import moment from "moment"

const writeCSV = (filename, header, data) => {
  const writableStream = fs.createWriteStream(filename)

  const stringifier = stringify({ header: true, columns: header })
  data.map((row) => {
    stringifier.write(row)
  })
  stringifier.pipe(writableStream)
  console.log("Finished writing data")
}

const generateFolderPath = () => {
  return moment().format("MM-DD-YY")
}

const round2digits = (num) => {
  return Math.round(num * 100) / 100
}

export { writeCSV, generateFolderPath, round2digits }
