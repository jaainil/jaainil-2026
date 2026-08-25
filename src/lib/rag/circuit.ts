export interface CircuitBreakerOptions {
  name: string;
  failureThreshold: number; // number of consecutive failures to trip
  cooldownMs: number;       // time to wait before half-open probe
}

export class CircuitBreaker {
  private name: string;
  private failureThreshold: number;
  private cooldownMs: number;
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private halfOpenProbeInFlight = false;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold;
    this.cooldownMs = options.cooldownMs;
  }

  /**
   * Checks if the circuit is open. In HALF_OPEN mode, allows exactly 1 probe request through.
   */
  public isOpen(): boolean {
    const now = Date.now();

    if (this.state === 'OPEN') {
      if (now - this.lastFailureTime >= this.cooldownMs) {
        this.state = 'HALF_OPEN';
        this.halfOpenProbeInFlight = false;
      } else {
        return true;
      }
    }

    if (this.state === 'HALF_OPEN') {
      if (this.halfOpenProbeInFlight) {
        // Probe is already in flight; route concurrent requests through fallback
        return true;
      }
      this.halfOpenProbeInFlight = true;
      return false; // Allow 1 probe request
    }

    return false;
  }

  public recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.halfOpenProbeInFlight = false;
  }

  public recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.halfOpenProbeInFlight = false;
    }
  }

  public getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }

  public getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
    };
  }
}

// Global Singletons
export const rerankerCircuit = new CircuitBreaker({
  name: 'RerankerCircuit',
  failureThreshold: 3,
  cooldownMs: 45000,
});

export const primaryLlmCircuit = new CircuitBreaker({
  name: 'PrimaryLlmCircuit',
  failureThreshold: 3,
  cooldownMs: 30000,
});
