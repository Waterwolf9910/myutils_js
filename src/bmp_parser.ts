import { OffsetBuffer, createOffsetBuffer } from "./utils"

export type bmp_file_header = {
    /**Total File Size */
    size: number,
    /**Reserved 1 */
    reserved_1: number,
    /**Reserved 2 */
    reserved_2: number,
    /**Offset for image data */
    data_offset: number
}

export enum CompressionType {
    BI_RGB = 0,
    BI_RLE8,
    BI_RLE4,
    BI_BITFIELDS,
    BI_ALPHABITFIELDS = 6,
    BI_CMYK = 11,
    BI_CMYKRLE8,
    BI_CMYKRLE4
}

export enum ColorSpaceType {
    LCS_CALIBRATED_RGB,
    LCD_sRGB,
    LCS_WINDOWS_COLOR_SPACE,
    PROFILE_LINKED,
    PROFILE_EMBEDDED
}

export type CIEXYZ = {
    x: number,
    y: number,
    z: number
}

export type CIEXYZTRIPLE = {
    red: CIEXYZ,
    green: CIEXYZ,
    blue: CIEXYZ
}

export enum RenderingIntent {
    LCS_GM_ABS_COLORIMETRIC,
    LCS_GM_BUSINESS,
    LCS_GM_GRAPHICS,
    LCS_GM_IMAGES
}

export enum HeaderType {
    info,
    v2,
    v3,
    v4,
    v5
}

export type bmp_infoheader = {
    type: HeaderType.info,
    header_size: number,
    width: number,
    height: number,
    color_planes: number,
    color_depth: 1 | 4 | 8 | 16 | 24 | 32
    compression: CompressionType,
    image_size: number,
    h_res: number,
    v_res: number,
    colors_in_palette: number,
    important_colors: number,
}

export type bmp_v2infoheader = Omit<bmp_infoheader, 'type'> & {
    type: HeaderType.v2
    red_mask: number,
    green_mask: number,
    blue_mask: number,
}

export type bmp_v3infoheader = Omit<bmp_v2infoheader, 'type'> & {
    type: HeaderType.v3
    alpha_mask: number,
}

export type bmp_v4header = Omit<bmp_v3infoheader, 'type'> & {
    type: HeaderType.v4
    cs_type: ColorSpaceType,
    endpoints: CIEXYZTRIPLE,
    gamma_red: number,
    gamma_green: number,
    gamma_blue: number,
}

export type bmp_v5header = Omit<bmp_v4header, 'type'> & {
    type: HeaderType.v5
    intent: RenderingIntent,
    profile_data: number,
    profile_size: number,
    reserved: number
}

export type bmp_header = bmp_v5header | bmp_v4header| bmp_v3infoheader | bmp_v2infoheader | bmp_infoheader

export type parsed_bmp = {
    file_header: bmp_file_header,
    header: bmp_header,
    /**
     * Index = y.toString(2).padStart(header.height.length - 1, 0) + x.toString(2).padStart(header.width.length - 1, 0)
     * 
     * Temp Key solution (currently expects 32x32) [Should work with any size, just very big string] 
     */
    pixel_data: {
        [pos: string]: {
            a: number
            r: number,
            g: number,
            b: number,
            /**
             * Encoded as ARGB
            */
            hex_encoded: string
        }
    },
    /**
     * img width*height
    */
   length: number
}

export const parseHeader = (buf: OffsetBuffer) => {
    let header_size = buf.readUInt32()
    let _header: bmp_header
    let base_header = { // All headers have these fields
        header_size,
        width: buf.readInt32(),
        height: buf.readInt32(),
        color_planes: buf.readUInt16(),
        color_depth: buf.readUInt16() as 24,
        compression: buf.readUInt32(),
        image_size: buf.readUInt32(),
        h_res: buf.readInt32(),
        v_res: buf.readInt32(),
        colors_in_palette: buf.readUInt32(),
        important_colors: buf.readUInt32(),
    }

    switch (header_size) {
        case 40: { // Info length is 40
            let header: bmp_header = {
                type: HeaderType.info,
                ...base_header
            }
            _header = header
            break
        }
        case 52: { // Header v2 is 52 (+ rgb masks)
            let header: bmp_header = {
                type: HeaderType.v2,
                ...base_header,
                red_mask: buf.readUInt32(),
                green_mask: buf.readUInt32(),
                blue_mask: buf.readUInt32()
            }
            _header = header
            break
        }
        case 56: { // Header v3 is 56 (+ alpha mask)
            let header: bmp_header = {
                type: HeaderType.v3,
                ...base_header,
                red_mask: buf.readUInt32(),
                green_mask: buf.readUInt32(),
                blue_mask: buf.readUInt32(),
                alpha_mask: buf.readUInt32(),
            }
            _header = header
            break
        }
        case 108: { // Header v4 is 108
            let header: bmp_header = {
                type: HeaderType.v4,
                ...base_header,
                red_mask: buf.readUInt32(),
                green_mask: buf.readUInt32(),
                blue_mask: buf.readUInt32(),
                alpha_mask: buf.readUInt32(),
                cs_type: buf.readUInt32(),
                endpoints: {
                    red: {
                        x: buf.readInt32(),
                        y: buf.readInt32(),
                        z: buf.readInt32(),
                    },
                    green: {
                        x: buf.readInt32(),
                        y: buf.readInt32(),
                        z: buf.readInt32(),
                    },
                    blue: {
                        x: buf.readInt32(),
                        y: buf.readInt32(),
                        z: buf.readInt32(),
                    }
                },
                gamma_red: buf.readUInt32(),
                gamma_green: buf.readUInt32(),
                gamma_blue: buf.readUInt32(),
            }
            _header = header
            break
        }
        case 124: { // Header v5 is 124
            //TODO: Read icc profile from v5 image
            let header: bmp_v5header = {
                type: HeaderType.v5,
                ...base_header,
                red_mask: buf.readUInt32(),
                green_mask: buf.readUInt32(),
                blue_mask: buf.readUInt32(),
                alpha_mask: buf.readUInt32(),
                cs_type: buf.readUInt32(),
                endpoints: {
                    red: {
                        x: buf.readInt32(),
                        y: buf.readInt32(),
                        z: buf.readInt32(),
                    },
                    green: {
                        x: buf.readInt32(),
                        y: buf.readInt32(),
                        z: buf.readInt32(),
                    },
                    blue: {
                        x: buf.readInt32(),
                        y: buf.readInt32(),
                        z: buf.readInt32(),
                    }
                },
                gamma_red: buf.readUInt32(),
                gamma_green: buf.readUInt32(),
                gamma_blue: buf.readUInt32(),
                intent: buf.readUInt32(),
                profile_data: buf.readUInt32(),
                profile_size: buf.readUInt32(),
                reserved: buf.readUInt32()
            }
            _header = header
            break
        }
        default: {
            console.warn("Header Size:", header_size)
            throw `Invalid or unsupported header size: ${header_size}`
            // console.warn("This type of bitmap format is not yet implemented, header data may be incomplete")
        }
    }

    // TODO: Throw with invalid header (i.e depth = 24 && compression = BI_BITFIELDS)

    return _header
}

export const writeHeader = (header: bmp_header): Buffer => {
    let _buf = Buffer.alloc(header.header_size)
    let buf = createOffsetBuffer(_buf, true)
    
    buf.writeUInt32(header.header_size) // Size of header buf
    buf.writeInt32(header.width) // Image Width
    buf.writeInt32(header.height) // Height Width
    buf.writeInt16(header.color_planes) // Color Planes (should be 1)
    buf.writeUInt16(header.color_depth) // Color Depth
    buf.writeUInt32(header.compression) // Compression Type
    buf.writeUInt32(header.image_size) // Size of image buf
    buf.writeInt32(header.h_res) // Horizontal Resolution
    buf.writeInt32(header.v_res) // Vertical Resolution
    buf.writeUInt32(header.colors_in_palette) // Colors in Palette
    buf.writeUInt32(header.important_colors) // Important Colors

    if (header.header_size >= 52) {
        buf.writeUInt32((<bmp_v2infoheader> header).red_mask)
        buf.writeUInt32((<bmp_v2infoheader> header).green_mask)
        buf.writeUInt32((<bmp_v2infoheader> header).blue_mask)
    }

    if (header.header_size >= 56) {
        buf.writeUInt32((<bmp_v3infoheader> header).alpha_mask)
    }

    if (header.header_size >= 108) {
        buf.writeUInt32((<bmp_v4header> header).cs_type) // Color Space Type
        // Endpoints
        // Red
        buf.writeInt32((<bmp_v4header> header).endpoints.red.x)
        buf.writeInt32((<bmp_v4header> header).endpoints.red.y)
        buf.writeInt32((<bmp_v4header> header).endpoints.red.z)
        // Green
        buf.writeInt32((<bmp_v4header> header).endpoints.green.x)
        buf.writeInt32((<bmp_v4header> header).endpoints.green.y)
        buf.writeInt32((<bmp_v4header> header).endpoints.green.z)
        // Blue
        buf.writeInt32((<bmp_v4header> header).endpoints.blue.x)
        buf.writeInt32((<bmp_v4header> header).endpoints.blue.y)
        buf.writeInt32((<bmp_v4header> header).endpoints.blue.z)
        
        // Gamma
        buf.writeUInt32((<bmp_v4header> header).gamma_red)
        buf.writeUInt32((<bmp_v4header> header).gamma_green)
        buf.writeUInt32((<bmp_v4header> header).gamma_blue)
    }

    if (header.header_size == 124) {
        buf.writeUInt32((<bmp_v5header> header).intent) // Rendering Intent
        buf.writeUInt32((<bmp_v5header> header).profile_data) // Profile Data
        buf.writeUInt32((<bmp_v5header> header).profile_size) // Profile Size
        buf.writeUInt32((<bmp_v5header> header).reserved) // Reserved
    }

    return _buf
}

/**
 * Utility to get index from (x,y) (w,h) pair
 * @param x the x position of the pixel
 * @param y the y position of the pixel
 * @param width the width of the image (header.width)
 * @param height the height of the image (header.height)
 * @returns the index of the requested pixel
 */
export const xyToIndex = (x: number, y: number, width: number, height: number) => y.toString(2).padStart(height.toString(2).length - 1, '0') + x.toString(2).padStart(width.toString(2).length - 1, '0')

export const bmpParser = (data: ArrayBuffer): parsed_bmp => {
    let buf = createOffsetBuffer(Buffer.from(data), true)
    let file_header: bmp_file_header = {
        size: 0,
        data_offset: 0,
        reserved_1: 0,
        reserved_2: 0
    }
    // This is the magic header for bitmap images
    if (buf.readUInt16() != 0x4d42) {
        throw "Buffer does not start with Bitmap Magic Number or this magic number has not been implemented yet"
    }
    file_header.size = buf.readUInt32()
    file_header.reserved_1 = buf.readUInt16()
    file_header.reserved_2 = buf.readUInt16()
    file_header.data_offset = buf.readUInt32()
    let header = parseHeader(buf)    
    /**
     * Index = y.toString(2).padStart(5, 0) + x.toString(2).padStart(5, 0)
     * 
     * Temp Key solution (currently expects 32x32) [Should work with any size, just very big string] 
     */
    let pixel_data: parsed_bmp['pixel_data'] = {}
    let length = 0
    buf.offset = file_header.data_offset
    switch (header.compression) {
        case CompressionType.BI_ALPHABITFIELDS:
        case CompressionType.BI_BITFIELDS:
        case CompressionType.BI_RGB: {
            let read_to: (index: string) => any;
            switch (header.color_depth) {
                case 16: {
                    read_to = (index) => {
                        let colors = buf.readUInt16()
                        // pixel_data[index] = {
                        //     a: (<bmp_v3infoheader> header).alpha_mask ? ((colors & (<bmp_v3infoheader> header).alpha_mask) >> 15) ? 255 : 0 : 255,
                        //     r: ((<bmp_v3infoheader> header).green_mask == 0x07e0 ? ((colors & (<bmp_v3infoheader> header).red_mask) >>> 11) : (colors & (<bmp_v3infoheader> header).red_mask) >>> 10) << 3,
                        //     g: ((<bmp_v3infoheader> header).green_mask == 0x07e0 ? ((colors & (<bmp_v3infoheader> header).green_mask) >> 6) : ((colors & (<bmp_v3infoheader> header).green_mask) >> 5)) << 3,
                        //     b: (colors & (<bmp_v3infoheader> header).blue_mask) << 3,
                        //     hex_encoded: '' //colors.toString(16).padStart(4, '0')
                        // }
                        let red_shift = (<bmp_v3infoheader> header).red_mask.toString(2).length - (<bmp_v3infoheader> header).blue_mask.toString(2).length
                        let green_shift = (<bmp_v3infoheader> header).green_mask.toString(2).length - (<bmp_v3infoheader> header).blue_mask.toString(2).length
                        pixel_data[index] = {
                            a: (<bmp_v3infoheader> header).alpha_mask ? ((colors & (<bmp_v3infoheader> header).alpha_mask) >>> 15) ? 255 : 0 : 255,
                            r: ((colors & (<bmp_v3infoheader> header).red_mask) >>> red_shift) << 3,
                            g: ((colors & (<bmp_v3infoheader> header).green_mask) >>> green_shift) << 3,
                            b: (colors & (<bmp_v3infoheader> header).blue_mask) << 3,
                            hex_encoded: '' //colors.toString(16).padStart(4, '0')
                        }
                        pixel_data[index].hex_encoded = pixel_data[index].a.toString(16).padStart(2, '0') +
                            pixel_data[index].r.toString(16).padStart(2, '0') +
                            pixel_data[index].g.toString(16).padStart(2, '0') +
                            pixel_data[index].b.toString(16).padStart(2, '0')
                    }
                    break
                }
                case 24: {
                    read_to = (index) => {
                        let b = buf.readUByte()
                        let g = buf.readUByte()
                        let r = buf.readUByte()
                        pixel_data[index] = {
                            a: 255,
                            r,
                            g,
                            b,
                            hex_encoded: 'ff' +
                                r.toString(16).padStart(2, '0') +
                                g.toString(16).padStart(2, '0') +
                                b.toString(16).padStart(2, '0')
                        }
                    }
                    break
                }
                case 32: {
                    read_to = (index) => {
                        let data = buf.readUInt32()
                        pixel_data[index] = {
                            a: (<bmp_v3infoheader> header).alpha_mask ? (data & (<bmp_v3infoheader>header).alpha_mask) >>> 24 : 255,
                            r: (data & (<bmp_v3infoheader> header).red_mask) >>> 16,
                            g: (data & (<bmp_v3infoheader> header).green_mask) >>> 8,
                            b: (data & (<bmp_v3infoheader> header).blue_mask),
                            hex_encoded: data.toString(16).padStart(8, '0')
                        }
                    }
                    break
                }
                default: {
                    throw `Color Depth (${header.color_depth}) Not Yet Implemented`
                }
            }
            for (let y = header.height > 0 ? header.height : 0; header.height > 0 ? y > 0 : y > header.height; header.height > 0 ? --y : ++y) {
                let upper_index = (header.height > 0 ? y - 1 : y + 1).toString(2).padStart(header.height.toString(2).length - 1, '0') // padding for debug readablity 
                for (let x = 1; x <= header.width; ++x) {
                    let lower_index = (x-1).toString(2).padStart(header.width.toString(2).length - 1, '0')
                    read_to(upper_index + lower_index)
                    ++length
                }
            }
            break
        }
        default: {
            throw `Compression [${CompressionType[header.compression]}]: Not Yet Implemented`
        }
    }
    return {
        file_header,
        header: header,
        pixel_data,
        length
    }
}

export const bmpWritter = (data: parsed_bmp): Buffer => {
    let fh_buf = Buffer.alloc(2+4+2+2+4)
    let file_header = createOffsetBuffer(fh_buf, true)
    
    file_header.writeUInt16(0x4d42)
    file_header.writeUInt32(data.file_header.size)
    file_header.writeUInt16(data.file_header.reserved_1)
    file_header.writeUInt16(data.file_header.reserved_2)
    file_header.writeUInt16(data.file_header.data_offset)

    let invaild_compression = () => {
        throw `Compression: ${CompressionType[data.header.compression]} cannot be used with a color depth of ${data.header.color_depth}`
    }

    if (data.header.compression == CompressionType.BI_ALPHABITFIELDS && data.header.color_depth == 24) {
        invaild_compression()
    } else if (data.header.compression == CompressionType.BI_BITFIELDS && (data.header.color_depth < 16 || data.header.color_depth == 24)) {
        invaild_compression()
    }

    let img_data_buf: Buffer
    // May be zero in when BI_RGB
    if (data.header.image_size == 0) {
        img_data_buf = Buffer.alloc((data.header.color_depth * data.length) / 8)
    } else {
        img_data_buf = Buffer.alloc(data.header.image_size)
    }

    let img_data = createOffsetBuffer(img_data_buf, true)

    switch (data.header.compression) {
        case CompressionType.BI_ALPHABITFIELDS:
        case CompressionType.BI_BITFIELDS:
        case CompressionType.BI_RGB: {
            let write: (index: string) => any;
            switch (data.header.color_depth) {
                case 16: {
                    write = (index) => {
                        let val = 0
                        let rgb = data.pixel_data[index]
                        let red_shift = (<bmp_v3infoheader> data.header).red_mask.toString(2).length - (<bmp_v3infoheader> data.header).blue_mask.toString(2).length
                        let green_shift = (<bmp_v3infoheader> data.header).green_mask.toString(2).length - (<bmp_v3infoheader> data.header).blue_mask.toString(2).length

                        if ((<bmp_v3infoheader> data.header).alpha_mask) {
                            val = rgb.a ? 0b1000000000000000 : 0
                        }
                        val |= (rgb.r >> 3) << red_shift
                        val |= (rgb.g >> 3) << green_shift
                        val |= rgb.b >> 3

                        img_data.writeUInt16(val)
                    }
                    break
                }
                case 24: {
                    write = (index) => {
                        let rgb = data.pixel_data[index]

                        img_data.writeUByte(rgb.b)
                        img_data.writeUByte(rgb.g)
                        img_data.writeUByte(rgb.r)
                    }
                    break
                }
                case 32: {
                    write = (index) => {
                        let rgb = data.pixel_data[index]
                        let alpha_shift = (<bmp_v3infoheader> data.header).alpha_mask.toString(2).length - (<bmp_v3infoheader> data.header).blue_mask.toString(2).length
                        let red_shift = (<bmp_v3infoheader> data.header).red_mask.toString(2).length - (<bmp_v3infoheader> data.header).blue_mask.toString(2).length
                        let green_shift = (<bmp_v3infoheader> data.header).green_mask.toString(2).length - (<bmp_v3infoheader> data.header).blue_mask.toString(2).length
                        let val = (((<bmp_v3infoheader> data.header).alpha_mask ? (rgb.a << alpha_shift) : 0) |
                            (rgb.r << red_shift) | (rgb.g << green_shift) | rgb.b) >>> 0
                        
                        img_data.writeUInt32(val)
                    }
                    break
                }
                default: {
                    throw `Color Depth (${data.header.color_depth}) Not Yet Implemented`
                }
            }
            for (let y = data.header.height > 0 ? data.header.height : 0; data.header.height > 0 ? y > 0 : y > data.header.height; data.header.height > 0 ? --y : ++y) {
                let upper_index = (data.header.height > 0 ? y - 1 : y + 1).toString(2).padStart(data.header.height.toString(2).length - 1, '0') // padding for debug readablity 
                for (let x = 1; x <= data.header.width; ++x) {
                    let lower_index = (x - 1).toString(2).padStart(data.header.width.toString(2).length - 1, '0')
                    write(upper_index + lower_index)
                }
            }
            break
        }
        default: {
            throw `Compression [${CompressionType[data.header.compression]}]: Not Yet Implemented`
        }
    }

    return Buffer.concat([fh_buf, writeHeader(data.header), img_data_buf])
}

export default bmpParser
