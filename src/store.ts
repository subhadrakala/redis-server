export interface KeyValue {
  value: string;
  expiresAt?: number;
}

export class Store {
    data = new Map<string, KeyValue>();

    get(key: string): string | null {
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

    exists(key: string): boolean {
        return this.get(key) !== null;
    }

    delete(key: string): boolean {
        if (!this.exists(key)) {
            return false;
        }
        return this.data.delete(key);
    }

    set(key: string, value: string, expiresAt?: number): void {
        this.data.set(key, { value, expiresAt });
    }
  
}

export const store = new Store();