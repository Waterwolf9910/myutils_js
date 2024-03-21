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

export enum bmp_compressions {
    BI_RGB = 0,
    BI_RLE8,
    BI_RLE4,
    BI_BITFIELDS,
    BI_JPEG,
    BI_PNG,
    BI_ALPHABITFIELDS,
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

export type bmp_infoheader = {
    type: 'info',
    header_size: number,
    width: number,
    height: number,
    color_planes: number,
    color_depth: 1 | 4 | 8 | 16 | 24 | 32
    compression: bmp_compressions,
    image_size: number,
    h_res: number,
    v_res: number,
    colors_in_palette: number,
    important_colors: number,
}

export type bmp_v2infoheader = Omit<bmp_infoheader, 'type'> & {
    type: 'v2'
    red_mask: number,
    green_mask: number,
    blue_mask: number,
}

export type bmp_v3infoheader = Omit<bmp_v2infoheader, 'type'> & {
    type: 'v3'
    alpha_mask: number,
}

export type bmp_v4header = Omit<bmp_v3infoheader, 'type'> & {
    type: 'v4'
    cs_type: ColorSpaceType,
    endpoints: CIEXYZTRIPLE,
    gamma_red: number,
    gamma_green: number,
    gamma_blue: number,
}

export type bmp_v5header = Omit<bmp_v4header, 'type'> & {
    type: 'v5'
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
     * Index = y.toString(2).padStart(5, 0) + x.toString(2).padStart(5, 0)
     * 
     * Temp Key solution (currently expects 32x32) [Should work with any size, just very big string] 
     */
    pixel_data: {
        [pos: string]: {
            a?: number
            r: number,
            g: number,
            b: number,
            /**
             * Encoded as RGB
             */
            hex_encoded: string
        }
    },
    /**
     * img width*height
     */
    length: number
}

export const createReader = (buf: Buffer) => {
    let offset = 0

    return {
        readByte: () => buf.readInt8(offset++),
        /**SWord */
        readInt16: () => {
            offset += 2
            return buf.readInt16LE(offset - 2)
        },
        /**SDWord */
        readInt32: () => {
            offset += 4
            return buf.readInt32LE(offset - 4)
        },
        /**SQWord */
        readInt64: () => {
            offset += 8
            return buf.readBigInt64LE(offset - 8)
        },
        readUByte: () => buf[offset++],
        /**Word */
        readUInt16: () => {
            offset += 2
            return buf.readUInt16LE(offset - 2)
        },
        /**DWord */
        readUInt32: () => {
            offset += 4
            return buf.readUInt32LE(offset - 4)
        },
        /**QWord */
        readUInt64: () => {
            offset += 8
            return buf.readBigUInt64LE(offset - 8)
        },

        get length() {
            return buf.length
        },
        get offset() {
            return offset
        },
        set offset(val) {
            offset = val
        }
    }
}

export const bmp_parser = (data: ArrayBuffer): parsed_bmp => {
    let reader = createReader(Buffer.from(data))
    let file_header: bmp_file_header = {
        size: 0,
        data_offset: 0,
        reserved_1: 0,
        reserved_2: 0
    }
    // This is the magic header for bitmap images
    if (reader.readUInt16() != 0x4d42) {
        throw "Buffer does not start with Bitmap Magic Number or this magic number has not been implemented yet"
    }
    file_header.size = reader.readUInt32()
    file_header.reserved_1 = reader.readUInt16()
    file_header.reserved_2 = reader.readUInt16()
    file_header.data_offset = reader.readUInt32()
    let header_size = reader.readUInt32()
    let _header: bmp_header
    let base_header = {
        header_size,
        width: reader.readInt32(),
        height: reader.readInt32(),
        color_planes: reader.readUInt16(),
        color_depth: reader.readUInt16() as 24,
        compression: reader.readUInt32(),
        image_size: reader.readUInt32(),
        h_res: reader.readInt32(),
        v_res: reader.readInt32(),
        colors_in_palette: reader.readUInt32(),
        important_colors: reader.readUInt32(),
    }

    switch (header_size) {
        case 40: {
            let header: bmp_header = {
                type: "info",
                ...base_header
            }
            _header = header
            break
        }
        case 52: {
            let header: bmp_header = {
                type: "v2",
                ...base_header,
                red_mask: reader.readUInt32(),
                green_mask: reader.readUInt32(),
                blue_mask: reader.readUInt32()
            }
            _header = header
            break
        }
        case 56: {
            let header: bmp_header = {
                type: "v3",
                ...base_header,
                red_mask: reader.readUInt32(),
                green_mask: reader.readUInt32(),
                blue_mask: reader.readUInt32(),
                alpha_mask: reader.readUInt32(),
            }
            _header = header
            break
        }
        case 108: {
            let header: bmp_header = {
                type: "v4",
                ...base_header,
                red_mask: reader.readUInt32(),
                green_mask: reader.readUInt32(),
                blue_mask: reader.readUInt32(),
                alpha_mask: reader.readUInt32(),
                cs_type: reader.readUInt32(),
                endpoints: {
                    red: {
                        x: reader.readInt32(),
                        y: reader.readInt32(),
                        z: reader.readInt32(),
                    },
                    green: {
                        x: reader.readInt32(),
                        y: reader.readInt32(),
                        z: reader.readInt32(),
                    },
                    blue: {
                        x: reader.readInt32(),
                        y: reader.readInt32(),
                        z: reader.readInt32(),
                    }
                },
                gamma_red: reader.readUInt32(),
                gamma_green: reader.readUInt32(),
                gamma_blue: reader.readUInt32(),
            }
            _header = header
            break
        }
        case 124: {
            let header: bmp_v5header = {
                type: 'v5',
                ...base_header,
                red_mask: reader.readUInt32(),
                green_mask: reader.readUInt32(),
                blue_mask: reader.readUInt32(),
                alpha_mask: reader.readUInt32(),
                cs_type: reader.readUInt32(),
                endpoints: {
                    red: {
                        x: reader.readInt32(),
                        y: reader.readInt32(),
                        z: reader.readInt32(),
                    },
                    green: {
                        x: reader.readInt32(),
                        y: reader.readInt32(),
                        z: reader.readInt32(),
                    },
                    blue: {
                        x: reader.readInt32(),
                        y: reader.readInt32(),
                        z: reader.readInt32(),
                    }
                },
                gamma_red: reader.readUInt32(),
                gamma_green: reader.readUInt32(),
                gamma_blue: reader.readUInt32(),
                intent: reader.readUInt32(),
                profile_data: reader.readUInt32(),
                profile_size: reader.readUInt32(),
                reserved: reader.readUInt32()
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
    /**
     * Index = y.toString(2).padStart(5, 0) + x.toString(2).padStart(5, 0)
     * 
     * Temp Key solution (currently expects 32x32) [Should work with any size, just very big string] 
     */
    let pixel_data: parsed_bmp['pixel_data'] = {}
    let length = 0
    reader.offset = file_header.data_offset
    switch (_header.compression) {
        case bmp_compressions.BI_ALPHABITFIELDS:
        case bmp_compressions.BI_BITFIELDS:
        case bmp_compressions.BI_RGB: {
            let read_to: (index: string) => any;
            switch (_header.color_depth) {
                case 16: {
                    read_to = (index) => {
                        let colors = reader.readUInt16()
                        pixel_data[index] = {
                            a: colors & (<bmp_v3infoheader> _header).alpha_mask,
                            r: colors & (<bmp_v3infoheader> _header).red_mask,
                            g: colors & (<bmp_v3infoheader> _header).green_mask,
                            b: colors & (<bmp_v3infoheader> _header).blue_mask,
                            hex_encoded: colors.toString(16).padStart(16, '0')
                        }
                    }
                    break
                }
                case 24: {
                    read_to = (index) => {
                        let b = reader.readUByte()
                        let g = reader.readUByte()
                        let r = reader.readUByte()
                        pixel_data[index] = {
                            r,
                            g,
                            b,
                            hex_encoded: r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0')
                        }
                    }
                    break
                }
                case 32: {
                    read_to = (index) => {
                        let a = reader.readUByte()
                        let b = reader.readUByte()
                        let g = reader.readUByte()
                        let r = reader.readUByte()
                        pixel_data[index] = {
                            a,
                            r,
                            g,
                            b,
                            hex_encoded: r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0')
                        }
                    }
                    break
                }
                default: {
                    throw `Color Depth (${_header.color_depth}) Not Yet Implemented`
                }
            }
            if (_header.height > 0) {
                for (let y = _header.height; y > 0; --y) {
                    let upper_index = (y-1).toString(2) //.padStart(5, '0') // padding for debug readablity 
                    for (let x = 1; x <= _header.width; ++x) {
                        let lower_index = (x-1).toString(2) // .padStart(5, '0')
                        read_to(upper_index + lower_index)
                        ++length
                    }
                }
            }
            break
        }
        default: {
            throw `Compression [${bmp_compressions[_header.compression]}]: Not Yet Implemented`
        }
    }
    return {
        file_header,
        header: _header,
        pixel_data,
        length
    }
}

export default bmp_parser
