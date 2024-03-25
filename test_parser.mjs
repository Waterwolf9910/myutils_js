import fs from "fs"
import {bmpParser} from "./lib/bmp_parser.js"

// let _file = fs.readFileSync("./test_img/_blue.bmp")
// let _img = bmp_parser(_file)
// console.log(_file.length, _img.file_header, _img.header)
fs.mkdirSync("./parsed_imgs", { recursive: true })
for (let filename of fs.readdirSync("./test_imgs").filter(v => v.endsWith(".bmp"))) {
    let file = fs.readFileSync(`./test_imgs/${filename}`)
    /**
     * @type {import('./src/bmp_parser.js').parsed_bmp}
     */
    let img
    try {
        img = bmpParser(file)
    } catch (err) {
        console.log("Error in: ", filename)
        throw err
    }
    console.log(file.length)
    console.log(img.file_header, img.header)
    fs.writeFileSync(`./parsed_imgs/${filename}.parsed`, JSON.stringify(img, null, 4))
}
