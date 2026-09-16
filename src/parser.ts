export type RESPValue =
    | string
    | null
    | RESPValue[];

export function parseRESP(message: string, offset: number = 0): { value: RESPValue; next: number } {
    const type = message[offset];

    if (type === '+' || type === '-' || type === ':') {
        const end = message.indexOf('\r\n', offset + 1);
        const value = message.substring(offset + 1, end);
        return { value, next: end + 2 };
    }

    if (type === '$') {
        const lineEnd = message.indexOf('\r\n', offset + 1);
        const length = parseInt(message.substring(offset + 1, lineEnd), 10);

        if (length === -1) {
            return { value: null, next: lineEnd + 2 };
        }

        const dataStart = lineEnd + 2;
        const value = message.substring(dataStart, dataStart + length);
        return { value, next: dataStart + length + 2 };
    }

    if (type === '*') {
        const lineEnd = message.indexOf('\r\n', offset + 1);
        const count = parseInt(message.substring(offset + 1, lineEnd), 10);

        if (count === -1) {
            return { value: null, next: lineEnd + 2 };
        }

        let cursor = lineEnd + 2;
        const elements: RESPValue[] = [];
        for (let j = 0; j < count; j++) {
            const element = parseRESP(message, cursor);
            elements.push(element.value);
            cursor = element.next;
        }
        return { value: elements, next: cursor };
    }

    throw new Error(`Unknown RESP type byte: '${type}'`);
}

export function encodeSimpleString(value: string): string {
    return `+${value}\r\n`;
}

export function encodeError(message: string): string {
    return `-${message}\r\n`;
}

export function encodeInteger(value: number | bigint | string): string {
    return `:${value}\r\n`;
}

export function encodeBulkString(value: string | null): string {
    if (value === null) return '$-1\r\n';
    return `$${value.length}\r\n${value}\r\n`;
}

export function encodeRESP(value: RESPValue): string {
    if (value === null) return '$-1\r\n';
    if (Array.isArray(value)) return `*${value.length}\r\n${value.map(encodeRESP).join('')}`;
    return encodeBulkString(value);
}