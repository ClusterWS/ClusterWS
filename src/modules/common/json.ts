const objKeys: any = Object.keys
const objToString: any = Object.prototype.toString


const toStringify: any = (value: any, isArrayProp: boolean): any => {
    let i: number

    if (value === true) return "true"
    if (value === false) return "false"

    switch (typeof value) {
        case "object":
            if (value === null) return null

            const toJson: any = value.toJSON
            if (toJson && typeof toJson === 'function') return toStringify(toJson(), isArrayProp)

            const toStr: any = objToString.call(value)
            if (toStr === "[object Array]") {
                let str: string = '['
                const max: number = value.length
                for (i = 0; i <= max; i++) str += toStringify(value[i], true) + ','
                if (max > 0) str += toStringify(value[i], true)

                return str + ']'
            }

            if (toStr === "[object Object]") {
                const keys: any = objKeys(value).sort()
                const max: number = keys.length
                let str: string = ''
                i = 0

                while (i < max) {
                    const key: any = keys[i]
                    const propVal: any = toStringify(value[key], false)

                    if (propVal !== undefined) {
                        if (str) str += ','
                        str += JSON.stringify(key) + ':' + propVal
                    }
                    i++
                }

                return '{' + str + '}'
            }

            return JSON.stringify(value)
        case "function":
        case "undefined":
            return isArrayProp ? null : undefined
        default:
            return isFinite(value) ? value : null
    }
}

export function stringify(value: any): any {
    const returnVal: string = toStringify(value, false)
    if (returnVal !== undefined) return '' + returnVal
}