import _random from "./random.js";
let random = _random(0, 9)

export const array = {
    /**
     * 
     * @param array The array to shuffle
     * @param curIndex an index to return the new position
     * @returns the new position of curIndex
     */
    shuffle: (array: any[], curIndex = 0) => {
        if (array == null) {
            throw new SyntaxError("array cannot be null");
        }
        let newIndex = curIndex;

        let size = array.length;

        while (size > 1) {
            --size;
            let i = random.num(size + 1);
            if (newIndex == size) {
                newIndex = i;
            } else if (newIndex == i) {
                newIndex = size;
            }
            
            let temp = array[size];
            array[size] = array[i];
            array[i] = temp;
        }

        for (let i = 0; i < array.length; ++i) { 
            let item = array.shift();
            if (item != null) {
                array.push(item)
            }
        }
        if (array[0] == null) { // The above doesn't always seem to clean up fully?
            array.unshift()
        }
        return newIndex;
    }
}

/**
 * Buffer's read/write operations with holding offset
*/
export interface OffsetBuffer {
    readByte: () => number,
    /**SWord */
    readInt16: () => number,
    /**SDWord */
    readInt32: () => number,
    /**SQWord */
    readInt64: () => bigint,
    readUByte: () => number,
    /**Word */
    readUInt16: () => number,
    /**DWord */
    readUInt32: () => number,
    /**QWord */
    readUInt64: () => bigint,
    writeByte: (value: number) => number,
    /**SWord */
    writeInt16: (value: number) => number,
    /**SDWord */
    writeInt32: (value: number) => number,
    /**SQWord */
    writeInt64: (value: bigint) => number,
    writeUByte: (value: number) => number,
    /**Word */
    writeUInt16: (value: number) => number,
    /**DWord */
    writeUInt32: (value: number) => number,
    /**QWord */
    writeUInt64: (value: bigint) => number,
    get length(): number
    get offset(): number
    set offset(val: number)
    get le_mode(): boolean
    set le_mode(val: boolean)
}

export const createOffsetBuffer = (buf: Buffer, le_mode: boolean): OffsetBuffer => {
    let offset = 0
    let mode = le_mode

    return {
        readByte: () => buf.readInt8(offset++),
        readInt16: () => {
            offset += 2
            return mode ? buf.readInt16LE(offset - 2) : buf.readInt16BE(offset - 2)
        },
        readInt32: () => {
            offset += 4
            return mode ? buf.readInt32LE(offset - 4) : buf.readInt32BE(offset - 4)
        },
        readInt64: () => {
            offset += 8
            return mode ? buf.readBigInt64LE(offset - 8) : buf.readBigInt64BE(offset - 8)
        },
        readUByte: () => buf[offset++],
        readUInt16: () => {
            offset += 2
            return mode ? buf.readUInt16LE(offset - 2) : buf.readUInt16BE(offset - 2)
        },
        readUInt32: () => {
            offset += 4
            return mode ? buf.readUInt32LE(offset - 4) : buf.readUInt32BE(offset - 4)
        },
        readUInt64: () => {
            offset += 8
            return mode ? buf.readBigUInt64LE(offset - 8) : buf.readBigUInt64BE(offset - 8)
        },
        writeByte: (value: number) => buf.writeInt8(value, offset++),
        writeInt16: (value: number) => {
            offset += 2
            return mode ? buf.writeInt16LE(value, offset - 2) : buf.writeInt16BE(value, offset - 2)
        },
        writeInt32: (value: number) => {
            offset += 4
            return mode ? buf.writeInt32LE(value, offset - 4) : buf.writeInt32BE(value, offset - 4)
        },
        writeInt64: (value: bigint) => {
            offset += 8
            return mode ? buf.writeBigInt64LE(value, offset - 8) : buf.writeBigInt64BE(value, offset - 8)
        },
        writeUByte: (value: number) => buf[offset++] = value,
        writeUInt16: (value: number) => {
            offset += 2
            return mode ? buf.writeUInt16LE(value, offset - 2) : buf.writeUInt16BE(value, offset - 2)
        },
        writeUInt32: (value: number) => {
            offset += 4
            return mode ? buf.writeUInt32LE(value, offset - 4) : buf.writeUInt32BE(value, offset - 4)
        },
        writeUInt64: (value: bigint) => {
            offset += 8
            return mode ? buf.writeBigUInt64LE(value, offset - 8) : buf.writeBigUInt64BE(value, offset - 8)
        },

        get length() {
            return buf.length
        },
        get offset() {
            return offset
        },
        set offset(val) {
            offset = val
        },
        get le_mode() {
            return mode
        },
        set le_mode(val) {
            mode = val
        }
    }
}

export default {
    array,
    createOffsetBuffer,
}
