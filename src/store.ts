export interface KeyValue {
  value: string | string[];
  expiresAt?: number;
}

export class Store {
    data = new Map<string, KeyValue>();

    get(key: string): string | null | string[] {
        const value = this.data.get(key);
        if (!value) {
            return null;
        }
        if (value.expiresAt && value.expiresAt < Date.now()) {
            this.data.delete(key);
            return null;
        }
        return value.value;
    }

    exists(key: string ): boolean {
        return this.get(key) !== null;
    }

    delete(key: string ): boolean {
        if (!this.exists(key)) {
            return false;
        }
        return this.data.delete(key);
    }

    set(key: string, value: string | string[], expiresAt?: number): void {
        this.data.set(key, { value, expiresAt });
    }

    lpush(key: string, values: string[]): number | null {
        if (!this.exists(key)) {
            const list: string[] = [];
            for (const value of values) {
                list.unshift(value);
            }
            this.data.set(key, { value: list });
            return list.length;
        }

        const entry = this.data.get(key)!;
        if (!Array.isArray(entry.value)) {
            return null;
        }

        for (const value of values) {
            entry.value.unshift(value);
        }
        return entry.value.length;
    }

    rpush(key: string, values: string[]): number | null {
        if (!this.exists(key)) {
            const list = [...values];
            this.data.set(key, { value: list });
            return list.length;
        }

        const entry = this.data.get(key)!;
        if (!Array.isArray(entry.value)) {
            return null;
        }

        entry.value.push(...values);
        return entry.value.length;
    }
  
}

export const store = new Store();