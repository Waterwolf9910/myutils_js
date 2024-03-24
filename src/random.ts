import * as assert from 'assert/strict'

let doNumberCheck = (num: number) => {
    if (typeof num != 'number' || isNaN(num)) {
        throw new SyntaxError(`${num} is not a number`)
    }
}

let checkMaxMin = (max: number, min: number) => assert.notEqual(max < min, true, new SyntaxError(`max cannot be less then min (${max} < ${min})`))

/**
 * Creates a list of random generators
 * @param base_length The base max length of each string returning function
 * @param base_max The max number [0-9] to use in number generation
 * @param base_min The min number [0-9] to use in number generation
 * @returns a list of random generator functions
 */
export const createRandom = (base_length = 25, base_max = 9, base_min = 0) => {

    let doBaseCheck = (max: number, min: number) => {
        doNumberCheck(max)
        doNumberCheck(min)
        checkMaxMin(max, min)
    }

    base_max = Math.min(base_max, 9)
    base_min = Math.max(-9, base_min)
    let charset_1 = Array(16).fill('').map((_, i) => String.fromCharCode(0x20 + i))
    let charset_2 = Array(7).fill('').map((_, i) => String.fromCharCode(0x3a + i))
    let charset_3 = Array(6).fill('').map((_, i) => String.fromCharCode(0x5b + i))
    let charset_4 = Array(4).fill('').map((_, i) => String.fromCharCode(0x7b + i))
    let specialCharMap: string[] = [].concat(charset_1, charset_2, charset_3, charset_4)

    doNumberCheck(base_length)
    doBaseCheck(base_max, base_min)

    /**
     * Get a random number
     * @param max max number
     * @param min minimum number
     * @returns a number between [min (inclusive), max (inclusive)]
     */
    let num = (max: number, min = 0) => {
        doBaseCheck(max, min)

        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    /**
     * @param length Overrides string length
     * @param max Overrides max number
     * @param min Overrides min number
     * @returns A string of random numbers
     */
    let lengthNum = (length = base_length, max = base_max, min = base_min) => {
        doBaseCheck(max, min)
        doNumberCheck(length)

        max = Math.min(max, 9)
        min = Math.max(-9, min)
        let val = ''
        while (val.length < length) {
            val = `${val}${num(max, min)}`
        }

        return parseInt(val.slice(0, length))
    }

    /**
     * @param caps Add some caps into the string
     * @param length Overrides string length
     * @returns A string of random characters
     */
    let alpha = (caps = false, length = base_length) => {
        doNumberCheck(length)

        let val = ''
        while (val.length < length) {
            let new_char = String.fromCharCode(((caps && num(1, 0) == 1) ? 41 : 0x61) + num(25, 0))
            if (val.length < 1) {
                val = `${new_char}`
                continue 
            }
            val += new_char
        }

        return val
    }

    /**
     * @param length Overrides string length
     * @param exclude a regex of chars to remove
     * @returns A string of random special characters
     */
    let special = (exclude: RegExp = null, length = base_length) => {
        doNumberCheck(length)

        let useExclude = exclude && exclude instanceof RegExp
        if (exclude && !useExclude) {
            throw `${exclude} is not regex`
        }
        let val = ''
        while (val.length < length) {
            let new_char = specialCharMap[num(specialCharMap.length - 1, 0)]
            if (val.length < 1) {
                val = new_char
            } else {
                val += new_char
            }
            if (useExclude) {
                val = val.replace(exclude, '')
            }
        }

        return val
    }

    /**
     * @param caps Add some caps into the string
     * @param length Overrides string length
     * @param max Overrides max number
     * @param min Overrides min number
     * @returns A string of random numbers and characters
     */
    let alphaNum = (cap = false, length = base_length, max = base_max, min = base_min) => {
        doBaseCheck(max, min)
        doNumberCheck(length)
        
        max = Math.min(max, 9)
        min = Math.max(-9, min)
        let val = ''
        while (val.length < length) {
            let new_char = num(1, 0) == 1 ? alpha(cap, 1) : num(max, min)
            if (val.length < 1) {
                val = `${new_char}`
                continue
            }
            val += new_char
        }

        return val
    }

    /**
     * @param exclude a regex of chars to remove
     * @param length Overrides string length
     * @param max Overrides max number
     * @param min Overrides min number
     * @returns A string of random numbers and special characters
     */
    let numSpecial = (exclude: RegExp = null, length = base_length, max = base_max, min = base_min) => {
        doBaseCheck(max, min)
        doNumberCheck(length)

        max = Math.min(max, 9)
        min = Math.max(-9, min)
        let useExclude = exclude && exclude instanceof RegExp
        let val = ''

        if (exclude && !useExclude) {
            throw `${exclude} is not regex`
        }

        while (val.length < length) {
            let new_char = num(1, 0) == 1 ? special(exclude, 1) : num(max, min)
            if (val.length < 1) {
                val = `${new_char}`
                continue
            }
            val += new_char
        }

        return val
    }

    /**
     * @param caps Add some caps into the string
     * @param exclude a regex of chars to remove
     * @param length Overrides string length
     * @returns A string of random characters and special characters
     */
    let alphaSpecial = (caps = false, exclude: RegExp = null, length = base_length) => {
        doNumberCheck(length)

        let useExclude = exclude && exclude instanceof RegExp
        let val = ''

        if (exclude && !useExclude) {
            throw `${exclude} is not regex`
        }

        while (val.length < length) {
            let new_char = num(1, 0) == 1 ? special(exclude, 1) : alpha(caps, 1)
            if (val.length < 1) {
                val = `${new_char}`
                continue
            }
            val += new_char
        }
    }

    /**
     * @param caps Add some caps into the string
     * @param exclude a regex of chars to remove
     * @param length Overrides string length
     * @param max Overrides max number
     * @param min Overrides min number
     * @returns A string of random numbers, characters and special characters
     */
    let alphaNumSpecial = (caps = false, exclude: RegExp = null, length = base_length, max = base_max, min = base_min) => {
        doBaseCheck(max, min)
        doNumberCheck(length)

        max = Math.min(max, 9)
        min = Math.max(-9, min)
        let useExclude = exclude && exclude instanceof RegExp
        let val = ''

        if (exclude && !useExclude) {
            throw `${exclude} is not regex`
        }

        while (val.length < length) {
            let choice = num(2, 0)
            let new_char = choice == 2 ? special(exclude, 1) : choice == 1 ? num(max, min) : alpha(caps, 1)
            if (val.length < 1) {
                val = `${new_char}`
                continue
            }
            val += new_char
        }

        return val
    }

    return {
        get base_length() {
            return base_length
        },
        get base_max() {
            return base_max
        },
        get base_min() {
            return base_min
        },
        letter: (caps = false) => alpha(caps, 1),
        lengthNum,
        alphaNum,
        numSpecial,
        alphaSpecial,
        alphaNumSpecial,
        num,
        alpha,
        special
    }
    
}

export default createRandom
