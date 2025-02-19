/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

const metadataInternalSlot = new WeakMap<any, Map<string | symbol | undefined, Map<any, any>>>();

function ensureObject(target: any): boolean {
  switch (typeof target) {
    case 'function':
      return target;
    case 'object':
      if (target === null) {
        throw new TypeError(`Attempted to perform get() or define() metadata operation on null value.`);
      }
      return target;
    default:
      throw new TypeError(`Attempted to perform get() or define() metadata operation on ${typeof target} value: ${target}.`);
  }
}

function toPropertyKeyOrUndefined(propertyKey: any): undefined | string | symbol {
  switch (typeof propertyKey) {
    case 'undefined':
    case 'string':
    case 'symbol':
      return propertyKey;
    default:
      return `${propertyKey}`;
  }
}

function toPropertyKey(propertyKey: any): string | symbol {
  switch (typeof propertyKey) {
    case 'string':
    case 'symbol':
      return propertyKey;
    default:
      return `${propertyKey}`;
  }
}

function ensurePropertyKeyOrUndefined(propertyKey: any): undefined | string | symbol {
  switch (typeof propertyKey) {
    case 'undefined':
    case 'string':
    case 'symbol':
      return propertyKey;
    default:
      throw new TypeError(`Invalid metadata propertyKey: ${propertyKey}.`);
  }
}

// 2.1.1 GetOrCreateMetadataMap(O, P, Create)
// https://rbuckton.github.io/reflect-metadata/#getorcreatemetadatamap
function GetOrCreateMetadataMap(O: any, P: string | symbol | undefined, Create: true): Map<any, any>;
function GetOrCreateMetadataMap(O: any, P: string | symbol | undefined, Create: false): Map<any, any> | undefined;
function GetOrCreateMetadataMap(O: any, P: string | symbol | undefined, Create: boolean): Map<any, any> | undefined {
  // 1. Assert: P is undefined or IsPropertyKey(P) is true.

  // 2. Let targetMetadata be the value of O's [[Metadata]] internal slot.
  let targetMetadata = metadataInternalSlot.get(O);

  // 3. If targetMetadata is undefined, then
  if (targetMetadata === void 0) {
    // 3. a. If Create is false, return undefined.
    if (!Create) {
      return void 0;
    }

    // 3. b. Set targetMetadata to be a newly created Map object.
    targetMetadata = new Map<string | symbol | undefined, Map<any, any>>();

    // 3. c. Set the [[Metadata]] internal slot of O to targetMetadata.
    metadataInternalSlot.set(O, targetMetadata);
  }

  // 4. Let metadataMap be ? Invoke(targetMetadata, "get", P).
  let metadataMap = targetMetadata.get(P);

  // 5. If metadataMap is undefined, then
  if (metadataMap === void 0) {
    // 5. a. If Create is false, return undefined.
    if (!Create) {
      return void 0;
    }

    // 5. b. Set metadataMap to be a newly created Map object.
    metadataMap = new Map<any, any>();

    // 5. c. Perform ? Invoke(targetMetadata, "set", P, metadataMap).
    targetMetadata.set(P, metadataMap);
  }

  // 6. Return metadataMap.
  return metadataMap;
}

// 3.1.2.1 OrdinaryHasOwnMetadata(MetadataKey, O, P)
// https://rbuckton.github.io/reflect-metadata/#ordinaryhasownmetadata
function OrdinaryHasOwnMetadata(MetadataKey: any, O: any, P: string | symbol | undefined): boolean {
  // 1. Assert: P is undefined or IsPropertyKey(P) is true.

  // 2. Let metadataMap be ? GetOrCreateMetadataMap(O, P, false).
  const metadataMap = GetOrCreateMetadataMap(O, P, /* Create */ false);

  // 3. If metadataMap is undefined, return false.
  if (metadataMap === void 0) {
    return false;
  }

  // 4. Return ? ToBoolean(? Invoke(metadataMap, "has", MetadataKey)).
  return metadataMap.has(MetadataKey);
}

// 3.1.1.1 OrdinaryHasMetadata(MetadataKey, O, P)
// https://rbuckton.github.io/reflect-metadata/#ordinaryhasmetadata
function OrdinaryHasMetadata(MetadataKey: any, O: any, P: string | symbol | undefined): boolean {
  // 1. Assert: P is undefined or IsPropertyKey(P) is true.

  // 2. Let hasOwn be ? OrdinaryHasOwnMetadata(MetadataKey, O, P).
  // 3. If hasOwn is true, return true.
  if (OrdinaryHasOwnMetadata(MetadataKey, O, P)) {
    return true;
  }

  // 4. Let parent be ? O.[[GetPrototypeOf]]().
  const parent = Object.getPrototypeOf(O);

  // 5. If parent is not null, Return ? parent.[[HasMetadata]](MetadataKey, P).
  if (parent !== null) {
    return OrdinaryHasMetadata(MetadataKey, parent, P);
  }

  // 6. Return false.
  return false;
}

// 3.1.4.1 OrdinaryGetOwnMetadata(MetadataKey, O, P)
// https://rbuckton.github.io/reflect-metadata/#ordinarygetownmetadata
function OrdinaryGetOwnMetadata(MetadataKey: any, O: any, P: string | symbol | undefined): any {
  // 1. Assert: P is undefined or IsPropertyKey(P) is true.

  // 2. Let metadataMap be ? GetOrCreateMetadataMap(O, P, false).
  const metadataMap = GetOrCreateMetadataMap(O, P, /* Create */ false);

  // 3. If metadataMap is undefined, return undefined.
  if (metadataMap === void 0) {
    return void 0;
  }

  // 4. Return ? Invoke(metadataMap, "get", MetadataKey).
  return metadataMap.get(MetadataKey);
}

// 3.1.3.1 OrdinaryGetMetadata(MetadataKey, O, P)
// https://rbuckton.github.io/reflect-metadata/#ordinarygetmetadata
function OrdinaryGetMetadata(MetadataKey: any, O: any, P: string | symbol | undefined): any {
  // 1. Assert: P is undefined or IsPropertyKey(P) is true.

  // 2. Let hasOwn be ? OrdinaryHasOwnMetadata(MetadataKey, O, P).
  // 3. If hasOwn is true, return ? OrdinaryGetOwnMetadata(MetadataKey, O, P).
  if (OrdinaryHasOwnMetadata(MetadataKey, O, P)) {
    return OrdinaryGetOwnMetadata(MetadataKey, O, P);
  }

  // 4. Let parent be ? O.[[GetPrototypeOf]]().
  const parent = Object.getPrototypeOf(O);

  // 5. If parent is not null, return ? parent.[[GetMetadata]](MetadataKey, P).
  if (parent !== null) {
    return OrdinaryGetMetadata(MetadataKey, parent, P);
  }

  // 6. Return undefined.
  return void 0;
}

// 3.1.5.1 OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
// https://rbuckton.github.io/reflect-metadata/#ordinarydefineownmetadata
function OrdinaryDefineOwnMetadata(MetadataKey: any, MetadataValue: any, O: any, P: string | symbol | undefined): void {
  // 1. Assert: P is undefined or IsPropertyKey(P) is true.

  // 2. Let metadataMap be ? GetOrCreateMetadataMap(O, P, true).
  const metadataMap = GetOrCreateMetadataMap(O, P, /* Create */ true);

  // 3. Return ? Invoke(metadataMap, "set", MetadataKey, MetadataValue).
  metadataMap.set(MetadataKey, MetadataValue);
}

// 3.1.7.1 OrdinaryOwnMetadataKeys(O, P)
// https://rbuckton.github.io/reflect-metadata/#ordinaryownmetadatakeys
function OrdinaryOwnMetadataKeys(O: any, P: string | symbol | undefined): any[] {
  // 1. Assert: P is undefined or IsPropertyKey(P) is true.

  // 2. Let keys be ? ArrayCreate(0).
  const keys: any[] = [];

  // 3. Let metadataMap be ? GetOrCreateMetadataMap(O, P, false).
  const metadataMap = GetOrCreateMetadataMap(O, P, /* Create */ false);

  // 4. If metadataMap is undefined, return keys.
  if (metadataMap === void 0) {
    return keys;
  }

  // 5. Let keysObj be ? Invoke(metadataMap, "keys").
  const keysObj = metadataMap.keys();

  // 6. Let iterator be ? GetIterator(keysObj).

  // 7. Let k be 0.
  let k = 0;

  // 8. Repeat
  for (const key of keysObj) {
    // 8. a. Let Pk be ! ToString(k).
    // 8. b. Let next be ? IteratorStep(iterator).
    // 8. c. If next is false, then
    // 8. c. i. Let setStatus be ? Set(keys, "length", k, true).
    // 8. c. ii. Assert: setStatus is true.
    // 8. c. iii. Return keys.
    // 8. d. Let nextValue be ? IteratorValue(next).

    // 8. e. Let defineStatus be CreateDataPropertyOrThrow(keys, Pk, nextValue).
    keys[k] = key;

    // 8. f. If defineStatus is an abrupt completion, return ? IteratorClose(iterator, defineStatus).

    // 8. g. Increase k by 1.
    ++k;
  }

  return keys;
}

// 3.1.6.1 OrdinaryMetadataKeys(O, P)
// https://rbuckton.github.io/reflect-metadata/#ordinarymetadatakeys
function OrdinaryMetadataKeys(O: any, P: string | symbol | undefined): any[] {
  // 1. Assert: P is undefined or IsPropertyKey(P) is true.

  // 2. Let ownKeys be ? OrdinaryOwnMetadataKeys(O, P).
  const ownKeys = OrdinaryOwnMetadataKeys(O, P);

  // 3. Let parent be ? O.[[GetPrototypeOf]]().
  const parent = Object.getPrototypeOf(O);

  // 4. If parent is null, then return ownKeys.
  if (parent === null) {
    return ownKeys;
  }

  // 5. Let parentKeys be ? O.[[OrdinaryMetadataKeys]](P).
  const parentKeys = OrdinaryMetadataKeys(parent, P);

  // 6. Let ownKeysLen = ? Get(ownKeys, "length").
  const ownKeysLen = ownKeys.length;

  // 7. If ownKeysLen is 0, return parentKeys.
  if (ownKeysLen === 0) {
    return parentKeys;
  }

  // 8. Let parentKeysLen = ? Get(parentKeys, "length").
  const parentKeysLen = parentKeys.length;

  // 9. If parentKeysLen is 0, return ownKeys.
  if (parentKeysLen === 0) {
    return ownKeys;
  }

  // 10. Let set be a newly created Set object.
  const set = new Set<any>();

  // 11. Let keys be ? ArrayCreate(0).
  const keys: any[] = [];

  // 12. Let k be 0.
  let k = 0;

  // 13. For each element key of ownKeys
  let key: any;
  for (let i = 0; i < ownKeysLen; ++i) {
    key = ownKeys[i];

    // 13. a. Let hasKey be ? Invoke(set, "has", key).
    // 13. b. If hasKey is false, then
    if (!set.has(key)) {
      // 13. b. i. Let Pk be ! ToString(k).
      // 13. b. ii. Perform ? Invoke(set, "add", key).
      set.add(key);

      // 13. b. iii. Let defineStatus be CreateDataProperty(keys, Pk, key).
      // 13. b. iv. Assert: defineStatus is true.
      keys[k] = key;

      // 13. b. v. Increase k by 1.
      ++k;
    }
  }

  // 14. For each element key of parentKeys
  for (let i = 0; i < parentKeysLen; ++i) {
    key = parentKeys[i];

    // 14. a. Let hasKey be ? Invoke(set, "has", key).
    // 14. b. If hasKey is false, then
    if (!set.has(key)) {
      // 14. b. i. Let Pk be ! ToString(k).
      // 14. b. ii. Perform ? Invoke(set, "add", key).
      set.add(key);

      // 14. b. iii. Let defineStatus be CreateDataProperty(keys, Pk, key).
      // 14. b. iv. Assert: defineStatus is true.
      keys[k] = key;

      // 14. b. v. Increase k by 1.
      ++k;
    }
  }

  // 15. Perform ? Set(keys, "length", k).

  // 16. return keys.
  return keys;
}

// 3.1.8 DeleteMetadata(MetadataKey, P)
// https://rbuckton.github.io/reflect-metadata/#ordinary-object-internal-methods-and-internal-slots-deletemetadata
function OrdinaryDeleteMetadata(O: any, MetadataKey: any, P: string | symbol | undefined): boolean {
  // 1. Assert: P is undefined or IsPropertyKey(P) is true.

  // 2. Let metadataMap be ? GetOrCreateMetadataMap(O, P, false).
  const metadataMap = GetOrCreateMetadataMap(O, P, false);

  // 3. If metadataMap is undefined, return false.
  if (metadataMap === void 0) {
    return false;
  }

  // 4. Return ? Invoke(metadataMap, "delete", MetadataKey).
  return metadataMap.delete(MetadataKey);
}

// 4.1.2 Reflect.metadata(metadataKey, metadataValue)
// https://rbuckton.github.io/reflect-metadata/#reflect.metadata

/**
 * A default metadata decorator factory that can be used on a class, class member, or parameter.
 *
 * @param metadataKey - The key for the metadata entry.
 * If `metadataKey` is already defined for the target and target key, the
 * metadataValue for that key will be overwritten.
 * @param metadataValue - The value for the metadata entry.
 * @returns A decorator function.
 */
function metadata(metadataKey: any, metadataValue: any) {
  function decorator(target: Function): void;
  function decorator(target: any, propertyKey: string | symbol): void;
  function decorator(target: any, propertyKey?: string | symbol): void {
    // 1. Assert: F has a [[MetadataKey]] internal slot whose value is an ECMAScript language value, or undefined.
    // 2. Assert: F has a [[MetadataValue]] internal slot whose value is an ECMAScript language value, or undefined.
    // 3. If Type(target) is not Object, throw a TypeError exception.
    // 4. If key is not undefined and IsPropertyKey(key) is false, throw a TypeError exception.
    // 5. Let metadataKey be the value of F's [[MetadataKey]] internal slot.
    // 6. Let metadataValue be the value of F's [[MetadataValue]] internal slot.
    // 7. Perform ? target.[[DefineMetadata]](metadataKey, metadataValue, target, key).
    OrdinaryDefineOwnMetadata(metadataKey, metadataValue, ensureObject(target), ensurePropertyKeyOrUndefined(propertyKey));

    // 8. Return undefined.
  }

  return decorator;
}

function decorate(
  decorators: (ClassDecorator | PropertyDecorator | MethodDecorator)[],
  target: any,
  propertyKey?: string | symbol,
  attributes?: PropertyDescriptor | null,
): PropertyDescriptor | Function | undefined {
  if (propertyKey !== void 0) {
    if (!Array.isArray(decorators)) {
      throw new TypeError();
    }
    if (typeof target !== 'object' || target === null) {
      throw new TypeError();
    }
    if ((typeof attributes !== 'object' || attributes === null) && typeof attributes !== 'function' && attributes !== null && attributes !== void 0) {
      throw new TypeError();
    }
    if (attributes === null) {
      attributes = void 0;
    }
    propertyKey = toPropertyKey(propertyKey);
    return DecorateProperty(decorators as (MethodDecorator | PropertyDecorator)[], target, propertyKey, attributes);
  } else {
    if (!Array.isArray(decorators)) {
      throw new TypeError();
    }
    if (typeof target !== 'function') {
      throw new TypeError();
    }
    return DecorateConstructor(decorators as ClassDecorator[], target);
  }
}

function DecorateConstructor(
  decorators: ClassDecorator[],
  target: Function,
): Function {
  for (let i = decorators.length - 1; i >= 0; --i) {
    const decorator = decorators[i];
    const decorated = decorator(target);
    if (decorated !== void 0 && decorated !== null) {
      if (typeof decorated !== 'function') {
        throw new TypeError();
      }
      target = decorated;
    }
  }
  return target;
}

function DecorateProperty(
  decorators: (MethodDecorator | PropertyDecorator)[],
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor | undefined,
): PropertyDescriptor | undefined {
  for (let i = decorators.length - 1; i >= 0; --i) {
    const decorator = decorators[i];
    const decorated = decorator(target, propertyKey, descriptor!);
    if (decorated !== void 0 && decorated !== null) {
      if ((typeof decorated !== 'object' || decorated === null) && typeof decorated !== 'function') {
        throw new TypeError();
      }
      descriptor = decorated;
    }
  }
  return descriptor;
}

// 4.1.3 Reflect.defineMetadata(metadataKey, metadataValue, target [, propertyKey])
// https://rbuckton.github.io/reflect-metadata/#reflect.definemetadata
/**
 * Define a unique metadata entry on the target.
 *
 * @param metadataKey - A key used to store and retrieve metadata.
 * @param metadataValue - A value that contains attached metadata.
 * @param target - The target object on which to define metadata.
 * @example
 *
 *     class Example {
 *     }
 *
 *     // constructor
 *     Metadata.define("custom:annotation", options, Example);
 *
 *     // decorator factory as metadata-producing annotation.
 *     function MyAnnotation(options): ClassDecorator {
 *         return target => Metadata.define("custom:annotation", options, target);
 *     }
 *
 */
function $define(metadataKey: any, metadataValue: any, target: any): void;
/**
 * Define a unique metadata entry on the target.
 *
 * @param metadataKey - A key used to store and retrieve metadata.
 * @param metadataValue - A value that contains attached metadata.
 * @param target - The target object on which to define metadata.
 * @param propertyKey - The property key for the target.
 * @example
 *
 *     class Example {
 *         // property declarations are not part of ES6, though they are valid in TypeScript:
 *         // static staticProperty;
 *         // property;
 *
 *         static staticMethod(p) { }
 *         method(p) { }
 *     }
 *
 *     // property (on constructor)
 *     Metadata.define("custom:annotation", Number, Example, "staticProperty");
 *
 *     // property (on prototype)
 *     Metadata.define("custom:annotation", Number, Example.prototype, "property");
 *
 *     // method (on constructor)
 *     Metadata.define("custom:annotation", Number, Example, "staticMethod");
 *
 *     // method (on prototype)
 *     Metadata.define("custom:annotation", Number, Example.prototype, "method");
 *
 *     // decorator factory as metadata-producing annotation.
 *     function MyAnnotation(options): PropertyDecorator {
 *         return (target, key) => Metadata.define("custom:annotation", options, target, key);
 *     }
 *
 */
function $define(metadataKey: any, metadataValue: any, target: any, propertyKey: string | symbol): void;
function $define(metadataKey: any, metadataValue: any, target: any, propertyKey?: string | symbol): void {
  // 1. If Type(target) is not Object, throw a TypeError exception.
  // 2. Return ? target.[[DefineMetadata]](metadataKey, metadataValue, propertyKey).
  return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, ensureObject(target), toPropertyKeyOrUndefined(propertyKey));
}

// 4.1.4 Reflect.hasMetadata(metadataKey, target [, propertyKey])
// https://rbuckton.github.io/reflect-metadata/#reflect.hasmetadata

/**
 * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
 *
 * @param metadataKey - A key used to store and retrieve metadata.
 * @param target - The target object on which the metadata is defined.
 * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
 * @example
 *
 *     class Example {
 *     }
 *
 *     // constructor
 *     result = Metadata.has("custom:annotation", Example);
 *
 */
function $has(metadataKey: any, target: any): boolean;
/**
 * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
 *
 * @param metadataKey - A key used to store and retrieve metadata.
 * @param target - The target object on which the metadata is defined.
 * @param propertyKey - The property key for the target.
 * @returns `true` - if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
 * @example
 *
 *     class Example {
 *         // property declarations are not part of ES6, though they are valid in TypeScript:
 *         // static staticProperty;
 *         // property;
 *
 *         static staticMethod(p) { }
 *         method(p) { }
 *     }
 *
 *     // property (on constructor)
 *     result = Metadata.has("custom:annotation", Example, "staticProperty");
 *
 *     // property (on prototype)
 *     result = Metadata.has("custom:annotation", Example.prototype, "property");
 *
 *     // method (on constructor)
 *     result = Metadata.has("custom:annotation", Example, "staticMethod");
 *
 *     // method (on prototype)
 *     result = Metadata.has("custom:annotation", Example.prototype, "method");
 *
 */
function $has(metadataKey: any, target: any, propertyKey: string | symbol): boolean;
function $has(metadataKey: any, target: any, propertyKey?: string | symbol): boolean {
  // 1. If Type(target) is not Object, throw a TypeError exception.
  // 2. Return ? target.[[HasMetadata]](metadataKey, propertyKey).
  return OrdinaryHasMetadata(metadataKey, ensureObject(target), toPropertyKeyOrUndefined(propertyKey));
}

// 4.1.5 Reflect.hasOwnMetadata(metadataKey, target [, propertyKey])
// https://rbuckton.github.io/reflect-metadata/#reflect-hasownmetadata

/**
 * Gets a value indicating whether the target object has the provided metadata key defined.
 *
 * @param metadataKey - A key used to store and retrieve metadata.
 * @param target - The target object on which the metadata is defined.
 * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
 * @example
 *
 *     class Example {
 *     }
 *
 *     // constructor
 *     result = Metadata.hasOwn("custom:annotation", Example);
 *
 */
function $hasOwn(metadataKey: any, target: any): boolean;
/**
 * Gets a value indicating whether the target object has the provided metadata key defined.
 *
 * @param metadataKey - A key used to store and retrieve metadata.
 * @param target - The target object on which the metadata is defined.
 * @param propertyKey - The property key for the target.
 * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
 * @example
 *
 *     class Example {
 *         // property declarations are not part of ES6, though they are valid in TypeScript:
 *         // static staticProperty;
 *         // property;
 *
 *         static staticMethod(p) { }
 *         method(p) { }
 *     }
 *
 *     // property (on constructor)
 *     result = Metadata.hasOwn("custom:annotation", Example, "staticProperty");
 *
 *     // property (on prototype)
 *     result = Metadata.hasOwn("custom:annotation", Example.prototype, "property");
 *
 *     // method (on constructor)
 *     result = Metadata.hasOwn("custom:annotation", Example, "staticMethod");
 *
 *     // method (on prototype)
 *     result = Metadata.hasOwn("custom:annotation", Example.prototype, "method");
 *
 */
function $hasOwn(metadataKey: any, target: any, propertyKey: string | symbol): boolean;
function $hasOwn(metadataKey: any, target: any, propertyKey?: string | symbol): boolean {
  // 1. If Type(target) is not Object, throw a TypeError exception.
  // 2. Return ? target.[[HasOwn]](metadataKey, propertyKey).
  return OrdinaryHasOwnMetadata(metadataKey, ensureObject(target), toPropertyKeyOrUndefined(propertyKey));
}

// 4.1.6 Reflect.getMetadata(metadataKey, target [, propertyKey])
// https://rbuckton.github.io/reflect-metadata/#reflect-getmetadata

/**
 * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
 *
 * @param metadataKey - A key used to store and retrieve metadata.
 * @param target - The target object on which the metadata is defined.
 * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
 * @example
 *
 *     class Example {
 *     }
 *
 *     // constructor
 *     result = Metadata.get("custom:annotation", Example);
 *
 */
function $get(metadataKey: any, target: any): any;
/**
 * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
 *
 * @param metadataKey - A key used to store and retrieve metadata.
 * @param target - The target object on which the metadata is defined.
 * @param propertyKey - The property key for the target.
 * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
 * @example
 *
 *     class Example {
 *         // property declarations are not part of ES6, though they are valid in TypeScript:
 *         // static staticProperty;
 *         // property;
 *
 *         static staticMethod(p) { }
 *         method(p) { }
 *     }
 *
 *     // property (on constructor)
 *     result = Metadata.get("custom:annotation", Example, "staticProperty");
 *
 *     // property (on prototype)
 *     result = Metadata.get("custom:annotation", Example.prototype, "property");
 *
 *     // method (on constructor)
 *     result = Metadata.get("custom:annotation", Example, "staticMethod");
 *
 *     // method (on prototype)
 *     result = Metadata.get("custom:annotation", Example.prototype, "method");
 *
 */
function $get(metadataKey: any, target: any, propertyKey: string | symbol): any;
function $get(metadataKey: any, target: any, propertyKey?: string | symbol): any {
  // 1. If Type(target) is not Object, throw a TypeError exception.
  // 2. Return ? target.[[GetMetadata]](metadataKey, propertyKey).
  return OrdinaryGetMetadata(metadataKey, ensureObject(target), toPropertyKeyOrUndefined(propertyKey));
}

// 4.1.7 Reflect.getOwnMetadata(metadataKey, target [, propertyKey])
// https://rbuckton.github.io/reflect-metadata/#reflect-getownmetadata

/**
 * Gets the metadata value for the provided metadata key on the target object.
 *
 * @param metadataKey - A key used to store and retrieve metadata.
 * @param target - The target object on which the metadata is defined.
 * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
 * @example
 *
 *     class Example {
 *     }
 *
 *     // constructor
 *     result = Metadata.getOwn("custom:annotation", Example);
 *
 */
function $getOwn(metadataKey: any, target: any): any;
/**
 * Gets the metadata value for the provided metadata key on the target object.
 *
 * @param metadataKey - A key used to store and retrieve metadata.
 * @param target - The target object on which the metadata is defined.
 * @param propertyKey - The property key for the target.
 * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
 * @example
 *
 *     class Example {
 *         // property declarations are not part of ES6, though they are valid in TypeScript:
 *         // static staticProperty;
 *         // property;
 *
 *         static staticMethod(p) { }
 *         method(p) { }
 *     }
 *
 *     // property (on constructor)
 *     result = Metadata.getOwn("custom:annotation", Example, "staticProperty");
 *
 *     // property (on prototype)
 *     result = Metadata.getOwn("custom:annotation", Example.prototype, "property");
 *
 *     // method (on constructor)
 *     result = Metadata.getOwn("custom:annotation", Example, "staticMethod");
 *
 *     // method (on prototype)
 *     result = Metadata.getOwn("custom:annotation", Example.prototype, "method");
 *
 */
function $getOwn(metadataKey: any, target: any, propertyKey: string | symbol): any;
function $getOwn(metadataKey: any, target: any, propertyKey?: string | symbol): any {
  // 1. If Type(target) is not Object, throw a TypeError exception.
  // 2. Return ? target.[[GetOwnMetadata]](metadataKey, propertyKey).
  return OrdinaryGetOwnMetadata(metadataKey, ensureObject(target), toPropertyKeyOrUndefined(propertyKey));
}

// 4.1.8 Reflect.getMetadataKeys(target [, propertyKey])
// https://rbuckton.github.io/reflect-metadata/#reflect-getmetadatakeys

/**
 * Gets the metadata keys defined on the target object or its prototype chain.
 *
 * @param target - The target object on which the metadata is defined.
 * @returns An array of unique metadata keys.
 * @example
 *
 *     class Example {
 *     }
 *
 *     // constructor
 *     result = Metadata.getKeys(Example);
 *
 */
function $getKeys(target: any): any[];
/**
 * Gets the metadata keys defined on the target object or its prototype chain.
 *
 * @param target - The target object on which the metadata is defined.
 * @param propertyKey - The property key for the target.
 * @returns An array of unique metadata keys.
 * @example
 *
 *     class Example {
 *         // property declarations are not part of ES6, though they are valid in TypeScript:
 *         // static staticProperty;
 *         // property;
 *
 *         static staticMethod(p) { }
 *         method(p) { }
 *     }
 *
 *     // property (on constructor)
 *     result = Metadata.getKeys(Example, "staticProperty");
 *
 *     // property (on prototype)
 *     result = Metadata.getKeys(Example.prototype, "property");
 *
 *     // method (on constructor)
 *     result = Metadata.getKeys(Example, "staticMethod");
 *
 *     // method (on prototype)
 *     result = Metadata.getKeys(Example.prototype, "method");
 *
 */
function $getKeys(target: any, propertyKey: string | symbol): any[];
function $getKeys(target: any, propertyKey?: string | symbol): any[] {
  // 1. If Type(target) is not Object, throw a TypeError exception.
  // 2. Return ? target.[[GetMetadataKeys]](propertyKey).
  return OrdinaryMetadataKeys(ensureObject(target), toPropertyKeyOrUndefined(propertyKey));
}

// 4.1.9 Reflect.getOwnMetadataKeys(target [, propertyKey])
// https://rbuckton.github.io/reflect-metadata/#reflect-getownmetadata

/**
 * Gets the unique metadata keys defined on the target object.
 *
 * @param target - The target object on which the metadata is defined.
 * @returns An array of unique metadata keys.
 * @example
 *
 *     class Example {
 *     }
 *
 *     // constructor
 *     result = Metadata.getOwnKeys(Example);
 *
 */
function $getOwnKeys(target: any): any[];
/**
 * Gets the unique metadata keys defined on the target object.
 *
 * @param target - The target object on which the metadata is defined.
 * @param propertyKey - The property key for the target.
 * @returns An array of unique metadata keys.
 * @example
 *
 *     class Example {
 *         // property declarations are not part of ES6, though they are valid in TypeScript:
 *         // static staticProperty;
 *         // property;
 *
 *         static staticMethod(p) { }
 *         method(p) { }
 *     }
 *
 *     // property (on constructor)
 *     result = Metadata.getOwnKeys(Example, "staticProperty");
 *
 *     // property (on prototype)
 *     result = Metadata.getOwnKeys(Example.prototype, "property");
 *
 *     // method (on constructor)
 *     result = Metadata.getOwnKeys(Example, "staticMethod");
 *
 *     // method (on prototype)
 *     result = Metadata.getOwnKeys(Example.prototype, "method");
 *
 */
function $getOwnKeys(target: any, propertyKey: string | symbol): any[];
function $getOwnKeys(target: any, propertyKey?: string | symbol): any[] {
  // 1. If Type(target) is not Object, throw a TypeError exception.
  // 2. Return ? target.[[GetOwnMetadataKeys]](propertyKey).
  return OrdinaryOwnMetadataKeys(ensureObject(target), toPropertyKeyOrUndefined(propertyKey));
}

// 4.1.10 Reflect.deleteMetadata(metadataKey, target [, propertyKey])
// https://rbuckton.github.io/reflect-metadata/#reflect-deletemetadata

/**
 * Deletes the metadata entry from the target object with the provided key.
 *
 * @param metadataKey - A key used to store and retrieve metadata.
 * @param target - The target object on which the metadata is defined.
 * @returns `true` if the metadata entry was found and deleted; otherwise, false.
 * @example
 *
 *     class Example {
 *     }
 *
 *     // constructor
 *     result = Metadata.delete("custom:annotation", Example);
 *
 */
function $delete(metadataKey: any, target: any): boolean;
/**
 * Deletes the metadata entry from the target object with the provided key.
 *
 * @param metadataKey - A key used to store and retrieve metadata.
 * @param target - The target object on which the metadata is defined.
 * @param propertyKey - The property key for the target.
 * @returns `true` if the metadata entry was found and deleted; otherwise, false.
 * @example
 *
 *     class Example {
 *         // property declarations are not part of ES6, though they are valid in TypeScript:
 *         // static staticProperty;
 *         // property;
 *
 *         static staticMethod(p) { }
 *         method(p) { }
 *     }
 *
 *     // property (on constructor)
 *     result = Metadata.delete("custom:annotation", Example, "staticProperty");
 *
 *     // property (on prototype)
 *     result = Metadata.delete("custom:annotation", Example.prototype, "property");
 *
 *     // method (on constructor)
 *     result = Metadata.delete("custom:annotation", Example, "staticMethod");
 *
 *     // method (on prototype)
 *     result = Metadata.delete("custom:annotation", Example.prototype, "method");
 *
 */
function $delete(metadataKey: any, target: any, propertyKey: string | symbol): boolean;
function $delete(metadataKey: any, target: any, propertyKey?: string | symbol): boolean {
  // 1. If Type(target) is not Object, throw a TypeError exception.
  // 2. Return ? target.[[DeleteMetadata]](metadataKey, propertyKey).
  return OrdinaryDeleteMetadata(ensureObject(target), metadataKey, toPropertyKeyOrUndefined(propertyKey));
}

const Metadata = {
  define: $define,
  has: $has,
  hasOwn: $hasOwn,
  get: $get,
  getOwn: $getOwn,
  getKeys: $getKeys,
  getOwnKeys: $getOwnKeys,
  delete: $delete,
};

function def(obj: object, key: string, value: unknown): void {
  Reflect.defineProperty(obj, key, {
    writable: true,
    enumerable: false,
    configurable: true,
    value,
  });
}

def(Metadata, '$Internal', metadataInternalSlot);

const hasMetadata = 'metadata' in Reflect;
const hasDecorate = 'decorate' in Reflect;
const hasDefineMetadata = 'defineMetadata' in Reflect;
const hasHasMetadata = 'hasMetadata' in Reflect;
const hasHasOwnMetadata = 'hasOwnMetadata' in Reflect;
const hasGetMetadata = 'getMetadata' in Reflect;
const hasGetOwnMetadata = 'getOwnMetadata' in Reflect;
const hasGetMetadataKeys = 'getMetadataKeys' in Reflect;
const hasGetOwnMetadataKeys = 'getOwnMetadataKeys' in Reflect;
const hasDeleteMetadata = 'deleteMetadata' in Reflect;
const hasSome = (
  hasMetadata ||
  hasDecorate ||
  hasDefineMetadata ||
  hasHasMetadata ||
  hasHasOwnMetadata ||
  hasGetMetadata ||
  hasGetOwnMetadata ||
  hasGetMetadataKeys ||
  hasGetOwnMetadataKeys ||
  hasDeleteMetadata
);
const hasAll = (
  hasMetadata &&
  hasDecorate &&
  hasDefineMetadata &&
  hasHasMetadata &&
  hasHasOwnMetadata &&
  hasGetMetadata &&
  hasGetOwnMetadata &&
  hasGetMetadataKeys &&
  hasGetOwnMetadataKeys &&
  hasDeleteMetadata
);

if (hasSome && !hasAll) {
  // This is temporary until we have the reporter / logging component working properly.
  // We should kind of throw here, but it's a bit harsh to completely stop Aurelia from loading for something that's not guaranteed to fail,
  // so just log a warning instead.
  /* eslint-disable no-console, no-undef, @typescript-eslint/ban-ts-ignore */
  // @ts-ignore
  console.warn('Partial existing Reflect.metadata polyfill found. Working environment cannot be guaranteed. Please file an issue at https://github.com/aurelia/aurelia/issues so that we can look into compatibility options for this scenario.');
}

if (!hasMetadata) {
  def(Reflect, 'metadata', metadata);
}
if (!hasDecorate) {
  def(Reflect, 'decorate', decorate);
}
if (!hasDefineMetadata) {
  def(Reflect, 'defineMetadata', $define);
}
if (!hasHasMetadata) {
  def(Reflect, 'hasMetadata', $has);
}
if (!hasHasOwnMetadata) {
  def(Reflect, 'hasOwnMetadata', $hasOwn);
}
if (!hasGetMetadata) {
  def(Reflect, 'getMetadata', $get);
}
if (!hasGetOwnMetadata) {
  def(Reflect, 'getOwnMetadata', $getOwn);
}
if (!hasGetMetadataKeys) {
  def(Reflect, 'getMetadataKeys', $getKeys);
}
if (!hasGetOwnMetadataKeys) {
  def(Reflect, 'getOwnMetadataKeys', $getOwnKeys);
}
if (!hasDeleteMetadata) {
  def(Reflect, 'deleteMetadata', $delete);
}

export { Metadata, metadata };
