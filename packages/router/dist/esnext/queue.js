/**
 * A first-in-first-out queue that only processes the next queued item
 * when the current one has been resolved or rejected. Sends queued items
 * one at a time to a specified callback function. The callback function
 * should resolve or reject the queued item when processing is done.
 * Enqueued items can be awaited. Enqueued items can specify an (arbitrary)
 * execution cost and the queue can be set up (activated) to only process
 * a specific amount of execution cost per RAF/tick.
 */
export class Queue {
    constructor(callback) {
        this.callback = callback;
        this.isActive = false;
        this.pending = [];
        this.processing = null;
        this.allowedExecutionCostWithinTick = null;
        this.currentExecutionCostInCurrentTick = 0;
        this.lifecycle = null;
    }
    get length() {
        return this.pending.length;
    }
    activate(options) {
        if (this.isActive) {
            throw new Error('Queue has already been activated');
        }
        this.isActive = true;
        this.lifecycle = options.lifecycle;
        this.allowedExecutionCostWithinTick = options.allowedExecutionCostWithinTick;
        this.lifecycle.enqueueRAF(this.dequeue, this, 32768 /* preempt */);
    }
    deactivate() {
        if (!this.isActive) {
            throw new Error('Queue has not been activated');
        }
        this.lifecycle.dequeueRAF(this.dequeue, this);
        this.allowedExecutionCostWithinTick = null;
        this.clear();
        this.isActive = false;
    }
    enqueue(itemOrItems, costOrCosts) {
        const list = Array.isArray(itemOrItems);
        const items = list ? itemOrItems : [itemOrItems];
        const costs = items
            .map((value, index) => !Array.isArray(costOrCosts) ? costOrCosts : costOrCosts[index])
            .map(value => value !== undefined ? value : 1);
        const promises = [];
        for (const item of items) {
            const qItem = { ...item };
            qItem.cost = costs.shift();
            promises.push(new Promise((resolve, reject) => {
                qItem.resolve = () => {
                    resolve();
                    this.processing = null;
                    this.dequeue();
                };
                qItem.reject = (reason) => {
                    reject(reason);
                    this.processing = null;
                    this.dequeue();
                };
            }));
            this.pending.push(qItem);
        }
        this.dequeue();
        return list ? promises : promises[0];
    }
    dequeue(delta) {
        if (this.processing !== null) {
            return;
        }
        if (delta !== undefined) {
            this.currentExecutionCostInCurrentTick = 0;
        }
        if (!this.pending.length) {
            return;
        }
        if (this.allowedExecutionCostWithinTick !== null && delta === undefined && this.currentExecutionCostInCurrentTick + (this.pending[0].cost || 0) > this.allowedExecutionCostWithinTick) {
            return;
        }
        this.processing = this.pending.shift() || null;
        if (this.processing) {
            this.currentExecutionCostInCurrentTick += this.processing.cost || 0;
            this.callback(this.processing);
        }
    }
    clear() {
        this.pending.splice(0, this.pending.length);
    }
}
//# sourceMappingURL=queue.js.map