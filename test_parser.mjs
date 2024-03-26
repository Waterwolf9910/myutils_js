import fs from "fs"
import pkg from "."
const {bmpParser, bmpWritter, HeaderType} = pkg.bmp_parser

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
        console.log("(Reading) Error in: ", filename)
        throw err
    }

    if (img.length != Object.keys(img.pixel_data).length) {
        throw `Image length != pixel length in: ${filename}`
    }
    fs.writeFileSync(`./parsed_imgs/${filename}.parsed`, JSON.stringify(img, null, 4))
    /**
     * @type {Buffer}
     */
    let img_buf
    try {
        img_buf = bmpWritter(img)
    } catch (err) {
        console.log("(Writing) Error In:", filename)
        throw err
    }

    if (img_buf.length < file.length && img.header.type != HeaderType.v5) {
        throw `Buffer Sizes are not the same in: ${filename}`
    }

    let is_extra = true
    for (let i = 0; i < img_buf.length; ++i) {
        if (img_buf[i] != file[i]) {
            is_extra = false
            break
        }
    }

    if (!is_extra) {
        throw `Error Recreating: ${filename}`
    }
}
