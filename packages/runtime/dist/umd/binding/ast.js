(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "@aurelia/kernel", "../observation/binding-context", "../observation/proxy-observer", "../observation/signaler", "../resources/binding-behavior", "../resources/value-converter"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const kernel_1 = require("@aurelia/kernel");
    const binding_context_1 = require("../observation/binding-context");
    const proxy_observer_1 = require("../observation/proxy-observer");
    const signaler_1 = require("../observation/signaler");
    const binding_behavior_1 = require("../resources/binding-behavior");
    const value_converter_1 = require("../resources/value-converter");
    function connects(expr) {
        return (expr.$kind & 32 /* Connects */) === 32 /* Connects */;
    }
    exports.connects = connects;
    function observes(expr) {
        return (expr.$kind & 64 /* Observes */) === 64 /* Observes */;
    }
    exports.observes = observes;
    function callsFunction(expr) {
        return (expr.$kind & 128 /* CallsFunction */) === 128 /* CallsFunction */;
    }
    exports.callsFunction = callsFunction;
    function hasAncestor(expr) {
        return (expr.$kind & 256 /* HasAncestor */) === 256 /* HasAncestor */;
    }
    exports.hasAncestor = hasAncestor;
    function isAssignable(expr) {
        return (expr.$kind & 8192 /* IsAssignable */) === 8192 /* IsAssignable */;
    }
    exports.isAssignable = isAssignable;
    function isLeftHandSide(expr) {
        return (expr.$kind & 1024 /* IsLeftHandSide */) === 1024 /* IsLeftHandSide */;
    }
    exports.isLeftHandSide = isLeftHandSide;
    function isPrimary(expr) {
        return (expr.$kind & 512 /* IsPrimary */) === 512 /* IsPrimary */;
    }
    exports.isPrimary = isPrimary;
    function isResource(expr) {
        return (expr.$kind & 32768 /* IsResource */) === 32768 /* IsResource */;
    }
    exports.isResource = isResource;
    function hasBind(expr) {
        return (expr.$kind & 2048 /* HasBind */) === 2048 /* HasBind */;
    }
    exports.hasBind = hasBind;
    function hasUnbind(expr) {
        return (expr.$kind & 4096 /* HasUnbind */) === 4096 /* HasUnbind */;
    }
    exports.hasUnbind = hasUnbind;
    function isLiteral(expr) {
        return (expr.$kind & 16384 /* IsLiteral */) === 16384 /* IsLiteral */;
    }
    exports.isLiteral = isLiteral;
    function arePureLiterals(expressions) {
        if (expressions === void 0 || expressions.length === 0) {
            return true;
        }
        for (let i = 0; i < expressions.length; ++i) {
            if (!isPureLiteral(expressions[i])) {
                return false;
            }
        }
        return true;
    }
    exports.arePureLiterals = arePureLiterals;
    function isPureLiteral(expr) {
        if (isLiteral(expr)) {
            switch (expr.$kind) {
                case 17955 /* ArrayLiteral */:
                    return arePureLiterals(expr.elements);
                case 17956 /* ObjectLiteral */:
                    return arePureLiterals(expr.values);
                case 17958 /* Template */:
                    return arePureLiterals(expr.expressions);
                case 17925 /* PrimitiveLiteral */:
                    return true;
            }
        }
        return false;
    }
    exports.isPureLiteral = isPureLiteral;
    var RuntimeError;
    (function (RuntimeError) {
        RuntimeError[RuntimeError["NoLocator"] = 202] = "NoLocator";
        RuntimeError[RuntimeError["NoBehaviorFound"] = 203] = "NoBehaviorFound";
        RuntimeError[RuntimeError["BehaviorAlreadyApplied"] = 204] = "BehaviorAlreadyApplied";
        RuntimeError[RuntimeError["NoConverterFound"] = 205] = "NoConverterFound";
        RuntimeError[RuntimeError["NoBinding"] = 206] = "NoBinding";
        RuntimeError[RuntimeError["NotAFunction"] = 207] = "NotAFunction";
        RuntimeError[RuntimeError["UnknownOperator"] = 208] = "UnknownOperator";
        RuntimeError[RuntimeError["NilScope"] = 250] = "NilScope";
    })(RuntimeError || (RuntimeError = {}));
    class CustomExpression {
        constructor(value) {
            this.value = value;
        }
        evaluate(flags, scope, locator, part) {
            return this.value;
        }
    }
    exports.CustomExpression = CustomExpression;
    class BindingBehaviorExpression {
        constructor(expression, name, args) {
            this.$kind = 38962 /* BindingBehavior */;
            this.expression = expression;
            this.name = name;
            this.args = args;
            this.behaviorKey = binding_behavior_1.BindingBehavior.keyFrom(this.name);
        }
        evaluate(flags, scope, locator, part) {
            return this.expression.evaluate(flags, scope, locator, part);
        }
        assign(flags, scope, locator, value, part) {
            return this.expression.assign(flags, scope, locator, value, part);
        }
        connect(flags, scope, binding, part) {
            this.expression.connect(flags, scope, binding, part);
        }
        bind(flags, scope, binding) {
            if (scope == null) {
                throw kernel_1.Reporter.error(250 /* NilScope */, this);
            }
            if (!binding) {
                throw kernel_1.Reporter.error(206 /* NoBinding */, this);
            }
            const locator = binding.locator;
            if (!locator) {
                throw kernel_1.Reporter.error(202 /* NoLocator */, this);
            }
            if (hasBind(this.expression)) {
                this.expression.bind(flags, scope, binding);
            }
            const behaviorKey = this.behaviorKey;
            const behavior = locator.get(behaviorKey);
            if (!behavior) {
                throw kernel_1.Reporter.error(203 /* NoBehaviorFound */, this);
            }
            if (binding[behaviorKey] === void 0) {
                binding[behaviorKey] = behavior;
                behavior.bind.call(behavior, flags, scope, binding, ...evalList(flags, scope, locator, this.args));
            }
            else {
                kernel_1.Reporter.write(204 /* BehaviorAlreadyApplied */, this);
            }
        }
        unbind(flags, scope, binding) {
            const behaviorKey = this.behaviorKey;
            if (binding[behaviorKey] !== void 0) {
                binding[behaviorKey].unbind(flags, scope, binding);
                binding[behaviorKey] = void 0;
            }
            else {
                // TODO: this is a temporary hack to make testing repeater keyed mode easier,
                // we should remove this idempotency again when track-by attribute is implemented
                kernel_1.Reporter.write(204 /* BehaviorAlreadyApplied */, this);
            }
            if (hasUnbind(this.expression)) {
                this.expression.unbind(flags, scope, binding);
            }
        }
        accept(visitor) {
            return visitor.visitBindingBehavior(this);
        }
    }
    exports.BindingBehaviorExpression = BindingBehaviorExpression;
    class ValueConverterExpression {
        constructor(expression, name, args) {
            this.$kind = 36913 /* ValueConverter */;
            this.expression = expression;
            this.name = name;
            this.args = args;
            this.converterKey = value_converter_1.ValueConverter.keyFrom(this.name);
        }
        evaluate(flags, scope, locator, part) {
            if (!locator) {
                throw kernel_1.Reporter.error(202 /* NoLocator */, this);
            }
            const converter = locator.get(this.converterKey);
            if (!converter) {
                throw kernel_1.Reporter.error(205 /* NoConverterFound */, this);
            }
            if ('toView' in converter) {
                const args = this.args;
                const len = args.length;
                const result = Array(len + 1);
                result[0] = this.expression.evaluate(flags, scope, locator, part);
                for (let i = 0; i < len; ++i) {
                    result[i + 1] = args[i].evaluate(flags, scope, locator, part);
                }
                return converter.toView.call(converter, ...result);
            }
            return this.expression.evaluate(flags, scope, locator, part);
        }
        assign(flags, scope, locator, value, part) {
            if (!locator) {
                throw kernel_1.Reporter.error(202 /* NoLocator */, this);
            }
            const converter = locator.get(this.converterKey);
            if (!converter) {
                throw kernel_1.Reporter.error(205 /* NoConverterFound */, this);
            }
            if ('fromView' in converter) {
                value = converter.fromView.call(converter, value, ...(evalList(flags, scope, locator, this.args)));
            }
            return this.expression.assign(flags, scope, locator, value, part);
        }
        connect(flags, scope, binding, part) {
            if (scope == null) {
                throw kernel_1.Reporter.error(250 /* NilScope */, this);
            }
            if (!binding) {
                throw kernel_1.Reporter.error(206 /* NoBinding */, this);
            }
            const locator = binding.locator;
            if (!locator) {
                throw kernel_1.Reporter.error(202 /* NoLocator */, this);
            }
            this.expression.connect(flags, scope, binding, part);
            const args = this.args;
            for (let i = 0, ii = args.length; i < ii; ++i) {
                args[i].connect(flags, scope, binding, part);
            }
            const converter = locator.get(this.converterKey);
            if (!converter) {
                throw kernel_1.Reporter.error(205 /* NoConverterFound */, this);
            }
            const signals = converter.signals;
            if (signals === void 0) {
                return;
            }
            const signaler = locator.get(signaler_1.ISignaler);
            for (let i = 0, ii = signals.length; i < ii; ++i) {
                signaler.addSignalListener(signals[i], binding);
            }
        }
        unbind(flags, scope, binding) {
            const locator = binding.locator;
            const converter = locator.get(this.converterKey);
            const signals = converter.signals;
            if (signals === void 0) {
                return;
            }
            const signaler = locator.get(signaler_1.ISignaler);
            for (let i = 0, ii = signals.length; i < ii; ++i) {
                signaler.removeSignalListener(signals[i], binding);
            }
        }
        accept(visitor) {
            return visitor.visitValueConverter(this);
        }
    }
    exports.ValueConverterExpression = ValueConverterExpression;
    class AssignExpression {
        constructor(target, value) {
            this.$kind = 8208 /* Assign */;
            this.target = target;
            this.value = value;
        }
        evaluate(flags, scope, locator, part) {
            return this.target.assign(flags, scope, locator, this.value.evaluate(flags, scope, locator), part);
        }
        connect(flags, scope, binding, part) {
            return;
        }
        assign(flags, scope, locator, value, part) {
            this.value.assign(flags, scope, locator, value, part);
            return this.target.assign(flags, scope, locator, value, part);
        }
        accept(visitor) {
            return visitor.visitAssign(this);
        }
    }
    exports.AssignExpression = AssignExpression;
    class ConditionalExpression {
        constructor(condition, yes, no) {
            this.$kind = 63 /* Conditional */;
            this.assign = kernel_1.PLATFORM.noop;
            this.condition = condition;
            this.yes = yes;
            this.no = no;
        }
        evaluate(flags, scope, locator, part) {
            return (!!this.condition.evaluate(flags, scope, locator, part))
                ? this.yes.evaluate(flags, scope, locator, part)
                : this.no.evaluate(flags, scope, locator, part);
        }
        connect(flags, scope, binding, part) {
            const condition = this.condition;
            if (condition.evaluate(flags, scope, null, part)) {
                this.condition.connect(flags, scope, binding, part);
                this.yes.connect(flags, scope, binding, part);
            }
            else {
                this.condition.connect(flags, scope, binding, part);
                this.no.connect(flags, scope, binding, part);
            }
        }
        accept(visitor) {
            return visitor.visitConditional(this);
        }
    }
    exports.ConditionalExpression = ConditionalExpression;
    class AccessThisExpression {
        constructor(ancestor = 0) {
            this.$kind = 1793 /* AccessThis */;
            this.assign = kernel_1.PLATFORM.noop;
            this.connect = kernel_1.PLATFORM.noop;
            this.ancestor = ancestor;
        }
        evaluate(flags, scope, locator, part) {
            if (scope == null) {
                throw kernel_1.Reporter.error(250 /* NilScope */, this);
            }
            if ((flags & 134217728 /* allowParentScopeTraversal */) > 0) {
                let parent = scope.parentScope;
                while (parent !== null) {
                    if (!parent.scopeParts.includes(part)) {
                        parent = parent.parentScope;
                    }
                }
                if (parent === null) {
                    throw new Error(`No target scope cold be found for part "${part}"`);
                }
            }
            let oc = scope.overrideContext;
            let i = this.ancestor;
            while (i-- && oc) {
                oc = oc.parentOverrideContext;
            }
            return i < 1 && oc ? oc.bindingContext : void 0;
        }
        accept(visitor) {
            return visitor.visitAccessThis(this);
        }
    }
    AccessThisExpression.$this = new AccessThisExpression(0);
    AccessThisExpression.$parent = new AccessThisExpression(1);
    exports.AccessThisExpression = AccessThisExpression;
    class AccessScopeExpression {
        constructor(name, ancestor = 0) {
            this.$kind = 10082 /* AccessScope */;
            this.name = name;
            this.ancestor = ancestor;
        }
        evaluate(flags, scope, locator, part) {
            return binding_context_1.BindingContext.get(scope, this.name, this.ancestor, flags, part)[this.name];
        }
        assign(flags, scope, locator, value, part) {
            const obj = binding_context_1.BindingContext.get(scope, this.name, this.ancestor, flags, part);
            if (obj instanceof Object) {
                if (obj.$observers !== void 0 && obj.$observers[this.name] !== void 0) {
                    obj.$observers[this.name].setValue(value, flags);
                    return value;
                }
                else {
                    return obj[this.name] = value;
                }
            }
            return void 0;
        }
        connect(flags, scope, binding, part) {
            const context = binding_context_1.BindingContext.get(scope, this.name, this.ancestor, flags, part);
            binding.observeProperty(flags, context, this.name);
        }
        accept(visitor) {
            return visitor.visitAccessScope(this);
        }
    }
    exports.AccessScopeExpression = AccessScopeExpression;
    class AccessMemberExpression {
        constructor(object, name) {
            this.$kind = 9323 /* AccessMember */;
            this.object = object;
            this.name = name;
        }
        evaluate(flags, scope, locator, part) {
            const instance = this.object.evaluate(flags, scope, locator, part);
            return instance == null ? instance : instance[this.name];
        }
        assign(flags, scope, locator, value, part) {
            const obj = this.object.evaluate(flags, scope, locator, part);
            if (obj instanceof Object) {
                if (obj.$observers !== void 0 && obj.$observers[this.name] !== void 0) {
                    obj.$observers[this.name].setValue(value, flags);
                }
                else {
                    obj[this.name] = value;
                }
            }
            else {
                this.object.assign(flags, scope, locator, { [this.name]: value });
            }
            return value;
        }
        connect(flags, scope, binding, part) {
            const obj = this.object.evaluate(flags, scope, null, part);
            if ((flags & 268435456 /* observeLeafPropertiesOnly */) === 0) {
                this.object.connect(flags, scope, binding, part);
            }
            if (obj instanceof Object) {
                binding.observeProperty(flags, obj, this.name);
            }
        }
        accept(visitor) {
            return visitor.visitAccessMember(this);
        }
    }
    exports.AccessMemberExpression = AccessMemberExpression;
    class AccessKeyedExpression {
        constructor(object, key) {
            this.$kind = 9324 /* AccessKeyed */;
            this.object = object;
            this.key = key;
        }
        evaluate(flags, scope, locator, part) {
            const instance = this.object.evaluate(flags, scope, locator, part);
            if (instance instanceof Object) {
                const key = this.key.evaluate(flags, scope, locator, part);
                return instance[key];
            }
            return void 0;
        }
        assign(flags, scope, locator, value, part) {
            const instance = this.object.evaluate(flags, scope, locator, part);
            const key = this.key.evaluate(flags, scope, locator, part);
            return instance[key] = value;
        }
        connect(flags, scope, binding, part) {
            const obj = this.object.evaluate(flags, scope, null, part);
            if ((flags & 268435456 /* observeLeafPropertiesOnly */) === 0) {
                this.object.connect(flags, scope, binding, part);
            }
            if (obj instanceof Object) {
                this.key.connect(flags, scope, binding, part);
                const key = this.key.evaluate(flags, scope, null, part);
                if (Array.isArray(obj) && kernel_1.isNumeric(key)) {
                    // Only observe array indexers in proxy mode
                    if (flags & 2 /* proxyStrategy */) {
                        binding.observeProperty(flags, obj, key);
                    }
                }
                else {
                    // observe the property represented by the key as long as it's not an array indexer
                    // (note: string indexers behave the same way as numeric indexers as long as they represent numbers)
                    binding.observeProperty(flags, obj, key);
                }
            }
        }
        accept(visitor) {
            return visitor.visitAccessKeyed(this);
        }
    }
    exports.AccessKeyedExpression = AccessKeyedExpression;
    class CallScopeExpression {
        constructor(name, args, ancestor = 0) {
            this.$kind = 1448 /* CallScope */;
            this.assign = kernel_1.PLATFORM.noop;
            this.name = name;
            this.args = args;
            this.ancestor = ancestor;
        }
        evaluate(flags, scope, locator, part) {
            const args = evalList(flags, scope, locator, this.args, part);
            const context = binding_context_1.BindingContext.get(scope, this.name, this.ancestor, flags, part);
            const func = getFunction(flags, context, this.name);
            if (func) {
                return func.apply(context, args);
            }
            return void 0;
        }
        connect(flags, scope, binding, part) {
            const args = this.args;
            for (let i = 0, ii = args.length; i < ii; ++i) {
                args[i].connect(flags, scope, binding, part);
            }
        }
        accept(visitor) {
            return visitor.visitCallScope(this);
        }
    }
    exports.CallScopeExpression = CallScopeExpression;
    class CallMemberExpression {
        constructor(object, name, args) {
            this.$kind = 1161 /* CallMember */;
            this.assign = kernel_1.PLATFORM.noop;
            this.object = object;
            this.name = name;
            this.args = args;
        }
        evaluate(flags, scope, locator, part) {
            const instance = this.object.evaluate(flags, scope, locator, part);
            const args = evalList(flags, scope, locator, this.args, part);
            const func = getFunction(flags, instance, this.name);
            if (func) {
                return func.apply(instance, args);
            }
            return void 0;
        }
        connect(flags, scope, binding, part) {
            const obj = this.object.evaluate(flags, scope, null, part);
            if ((flags & 268435456 /* observeLeafPropertiesOnly */) === 0) {
                this.object.connect(flags, scope, binding, part);
            }
            if (getFunction(flags & ~2097152 /* mustEvaluate */, obj, this.name)) {
                const args = this.args;
                for (let i = 0, ii = args.length; i < ii; ++i) {
                    args[i].connect(flags, scope, binding, part);
                }
            }
        }
        accept(visitor) {
            return visitor.visitCallMember(this);
        }
    }
    exports.CallMemberExpression = CallMemberExpression;
    class CallFunctionExpression {
        constructor(func, args) {
            this.$kind = 1162 /* CallFunction */;
            this.assign = kernel_1.PLATFORM.noop;
            this.func = func;
            this.args = args;
        }
        evaluate(flags, scope, locator, part) {
            const func = this.func.evaluate(flags, scope, locator, part);
            if (typeof func === 'function') {
                return func.apply(null, evalList(flags, scope, locator, this.args, part));
            }
            if (!(flags & 2097152 /* mustEvaluate */) && (func == null)) {
                return void 0;
            }
            throw kernel_1.Reporter.error(207 /* NotAFunction */, this);
        }
        connect(flags, scope, binding, part) {
            const func = this.func.evaluate(flags, scope, null, part);
            this.func.connect(flags, scope, binding, part);
            if (typeof func === 'function') {
                const args = this.args;
                for (let i = 0, ii = args.length; i < ii; ++i) {
                    args[i].connect(flags, scope, binding, part);
                }
            }
        }
        accept(visitor) {
            return visitor.visitCallFunction(this);
        }
    }
    exports.CallFunctionExpression = CallFunctionExpression;
    class BinaryExpression {
        constructor(operation, left, right) {
            this.$kind = 46 /* Binary */;
            this.assign = kernel_1.PLATFORM.noop;
            this.operation = operation;
            this.left = left;
            this.right = right;
            // what we're doing here is effectively moving the large switch statement from evaluate to the constructor
            // so that the check only needs to be done once, and evaluate (which is called many times) will have a lot less
            // work to do; we can do this because the operation can't change after it's parsed
            this.evaluate = this[operation];
        }
        evaluate(flags, scope, locator, part) {
            throw kernel_1.Reporter.error(208 /* UnknownOperator */, this);
        }
        connect(flags, scope, binding, part) {
            const left = this.left.evaluate(flags, scope, null, part);
            this.left.connect(flags, scope, binding, part);
            if (this.operation === '&&' && !left || this.operation === '||' && left) {
                return;
            }
            this.right.connect(flags, scope, binding, part);
        }
        ['&&'](f, s, l, p) {
            return this.left.evaluate(f, s, l, p) && this.right.evaluate(f, s, l, p);
        }
        ['||'](f, s, l, p) {
            return this.left.evaluate(f, s, l, p) || this.right.evaluate(f, s, l, p);
        }
        ['=='](f, s, l, p) {
            // eslint-disable-next-line eqeqeq
            return this.left.evaluate(f, s, l, p) == this.right.evaluate(f, s, l, p);
        }
        ['==='](f, s, l, p) {
            return this.left.evaluate(f, s, l, p) === this.right.evaluate(f, s, l, p);
        }
        ['!='](f, s, l, p) {
            // eslint-disable-next-line eqeqeq
            return this.left.evaluate(f, s, l, p) != this.right.evaluate(f, s, l, p);
        }
        ['!=='](f, s, l, p) {
            return this.left.evaluate(f, s, l, p) !== this.right.evaluate(f, s, l, p);
        }
        ['instanceof'](f, s, l, p) {
            const right = this.right.evaluate(f, s, l, p);
            if (typeof right === 'function') {
                return this.left.evaluate(f, s, l, p) instanceof right;
            }
            return false;
        }
        ['in'](f, s, l, p) {
            const right = this.right.evaluate(f, s, l, p);
            if (right instanceof Object) {
                return this.left.evaluate(f, s, l, p) in right;
            }
            return false;
        }
        // note: autoConvertAdd (and the null check) is removed because the default spec behavior is already largely similar
        // and where it isn't, you kind of want it to behave like the spec anyway (e.g. return NaN when adding a number to undefined)
        // this makes bugs in user code easier to track down for end users
        // also, skipping these checks and leaving it to the runtime is a nice little perf boost and simplifies our code
        ['+'](f, s, l, p) {
            return this.left.evaluate(f, s, l, p) + this.right.evaluate(f, s, l, p);
        }
        ['-'](f, s, l, p) {
            return this.left.evaluate(f, s, l, p) - this.right.evaluate(f, s, l, p);
        }
        ['*'](f, s, l, p) {
            return this.left.evaluate(f, s, l, p) * this.right.evaluate(f, s, l, p);
        }
        ['/'](f, s, l, p) {
            return this.left.evaluate(f, s, l, p) / this.right.evaluate(f, s, l, p);
        }
        ['%'](f, s, l, p) {
            return this.left.evaluate(f, s, l, p) % this.right.evaluate(f, s, l, p);
        }
        ['<'](f, s, l, p) {
            return this.left.evaluate(f, s, l, p) < this.right.evaluate(f, s, l, p);
        }
        ['>'](f, s, l, p) {
            return this.left.evaluate(f, s, l, p) > this.right.evaluate(f, s, l, p);
        }
        ['<='](f, s, l, p) {
            return this.left.evaluate(f, s, l, p) <= this.right.evaluate(f, s, l, p);
        }
        ['>='](f, s, l, p) {
            return this.left.evaluate(f, s, l, p) >= this.right.evaluate(f, s, l, p);
        }
        accept(visitor) {
            return visitor.visitBinary(this);
        }
    }
    exports.BinaryExpression = BinaryExpression;
    class UnaryExpression {
        constructor(operation, expression) {
            this.$kind = 39 /* Unary */;
            this.assign = kernel_1.PLATFORM.noop;
            this.operation = operation;
            this.expression = expression;
            // see Binary (we're doing the same thing here)
            this.evaluate = this[operation];
        }
        evaluate(flags, scope, locator, part) {
            throw kernel_1.Reporter.error(208 /* UnknownOperator */, this);
        }
        connect(flags, scope, binding, part) {
            this.expression.connect(flags, scope, binding, part);
        }
        ['void'](f, s, l, p) {
            return void this.expression.evaluate(f, s, l, p);
        }
        ['typeof'](f, s, l, p) {
            return typeof this.expression.evaluate(f, s, l, p);
        }
        ['!'](f, s, l, p) {
            return !this.expression.evaluate(f, s, l, p);
        }
        ['-'](f, s, l, p) {
            return -this.expression.evaluate(f, s, l, p);
        }
        ['+'](f, s, l, p) {
            return +this.expression.evaluate(f, s, l, p);
        }
        accept(visitor) {
            return visitor.visitUnary(this);
        }
    }
    exports.UnaryExpression = UnaryExpression;
    class PrimitiveLiteralExpression {
        constructor(value) {
            this.$kind = 17925 /* PrimitiveLiteral */;
            this.assign = kernel_1.PLATFORM.noop;
            this.connect = kernel_1.PLATFORM.noop;
            this.value = value;
        }
        evaluate(flags, scope, locator, part) {
            return this.value;
        }
        accept(visitor) {
            return visitor.visitPrimitiveLiteral(this);
        }
    }
    PrimitiveLiteralExpression.$undefined = new PrimitiveLiteralExpression(void 0);
    PrimitiveLiteralExpression.$null = new PrimitiveLiteralExpression(null);
    PrimitiveLiteralExpression.$true = new PrimitiveLiteralExpression(true);
    PrimitiveLiteralExpression.$false = new PrimitiveLiteralExpression(false);
    PrimitiveLiteralExpression.$empty = new PrimitiveLiteralExpression('');
    exports.PrimitiveLiteralExpression = PrimitiveLiteralExpression;
    class HtmlLiteralExpression {
        constructor(parts) {
            this.$kind = 51 /* HtmlLiteral */;
            this.assign = kernel_1.PLATFORM.noop;
            this.parts = parts;
        }
        evaluate(flags, scope, locator, part) {
            const elements = this.parts;
            let result = '';
            let value;
            for (let i = 0, ii = elements.length; i < ii; ++i) {
                value = elements[i].evaluate(flags, scope, locator, part);
                if (value == null) {
                    continue;
                }
                result += value;
            }
            return result;
        }
        connect(flags, scope, binding, part) {
            for (let i = 0, ii = this.parts.length; i < ii; ++i) {
                this.parts[i].connect(flags, scope, binding, part);
            }
        }
        accept(visitor) {
            return visitor.visitHtmlLiteral(this);
        }
    }
    exports.HtmlLiteralExpression = HtmlLiteralExpression;
    class ArrayLiteralExpression {
        constructor(elements) {
            this.$kind = 17955 /* ArrayLiteral */;
            this.assign = kernel_1.PLATFORM.noop;
            this.elements = elements;
        }
        evaluate(flags, scope, locator, part) {
            const elements = this.elements;
            const length = elements.length;
            const result = Array(length);
            for (let i = 0; i < length; ++i) {
                result[i] = elements[i].evaluate(flags, scope, locator, part);
            }
            return result;
        }
        connect(flags, scope, binding, part) {
            const elements = this.elements;
            for (let i = 0, ii = elements.length; i < ii; ++i) {
                elements[i].connect(flags, scope, binding, part);
            }
        }
        accept(visitor) {
            return visitor.visitArrayLiteral(this);
        }
    }
    ArrayLiteralExpression.$empty = new ArrayLiteralExpression(kernel_1.PLATFORM.emptyArray);
    exports.ArrayLiteralExpression = ArrayLiteralExpression;
    class ObjectLiteralExpression {
        constructor(keys, values) {
            this.$kind = 17956 /* ObjectLiteral */;
            this.assign = kernel_1.PLATFORM.noop;
            this.keys = keys;
            this.values = values;
        }
        evaluate(flags, scope, locator, part) {
            const instance = {};
            const keys = this.keys;
            const values = this.values;
            for (let i = 0, ii = keys.length; i < ii; ++i) {
                instance[keys[i]] = values[i].evaluate(flags, scope, locator, part);
            }
            return instance;
        }
        connect(flags, scope, binding, part) {
            const keys = this.keys;
            const values = this.values;
            for (let i = 0, ii = keys.length; i < ii; ++i) {
                values[i].connect(flags, scope, binding, part);
            }
        }
        accept(visitor) {
            return visitor.visitObjectLiteral(this);
        }
    }
    ObjectLiteralExpression.$empty = new ObjectLiteralExpression(kernel_1.PLATFORM.emptyArray, kernel_1.PLATFORM.emptyArray);
    exports.ObjectLiteralExpression = ObjectLiteralExpression;
    class TemplateExpression {
        constructor(cooked, expressions) {
            this.$kind = 17958 /* Template */;
            this.assign = kernel_1.PLATFORM.noop;
            this.cooked = cooked;
            this.expressions = expressions === void 0 ? kernel_1.PLATFORM.emptyArray : expressions;
        }
        evaluate(flags, scope, locator, part) {
            const expressions = this.expressions;
            const cooked = this.cooked;
            let result = cooked[0];
            for (let i = 0, ii = expressions.length; i < ii; ++i) {
                result += expressions[i].evaluate(flags, scope, locator, part);
                result += cooked[i + 1];
            }
            return result;
        }
        connect(flags, scope, binding, part) {
            const expressions = this.expressions;
            for (let i = 0, ii = expressions.length; i < ii; ++i) {
                expressions[i].connect(flags, scope, binding, part);
                i++;
            }
        }
        accept(visitor) {
            return visitor.visitTemplate(this);
        }
    }
    TemplateExpression.$empty = new TemplateExpression(['']);
    exports.TemplateExpression = TemplateExpression;
    class TaggedTemplateExpression {
        constructor(cooked, raw, func, expressions) {
            this.$kind = 1197 /* TaggedTemplate */;
            this.assign = kernel_1.PLATFORM.noop;
            this.cooked = cooked;
            this.cooked.raw = raw;
            this.func = func;
            this.expressions = expressions === void 0 ? kernel_1.PLATFORM.emptyArray : expressions;
        }
        evaluate(flags, scope, locator, part) {
            const expressions = this.expressions;
            const len = expressions.length;
            const results = Array(len);
            for (let i = 0, ii = len; i < ii; ++i) {
                results[i] = expressions[i].evaluate(flags, scope, locator, part);
            }
            const func = this.func.evaluate(flags, scope, locator, part);
            if (typeof func !== 'function') {
                throw kernel_1.Reporter.error(207 /* NotAFunction */, this);
            }
            return func.apply(null, [this.cooked].concat(results));
        }
        connect(flags, scope, binding, part) {
            const expressions = this.expressions;
            for (let i = 0, ii = expressions.length; i < ii; ++i) {
                expressions[i].connect(flags, scope, binding);
            }
            this.func.connect(flags, scope, binding);
        }
        accept(visitor) {
            return visitor.visitTaggedTemplate(this);
        }
    }
    exports.TaggedTemplateExpression = TaggedTemplateExpression;
    class ArrayBindingPattern {
        // We'll either have elements, or keys+values, but never all 3
        constructor(elements) {
            this.$kind = 65556 /* ArrayBindingPattern */;
            this.elements = elements;
        }
        evaluate(flags, scope, locator, part) {
            // TODO
            return void 0;
        }
        assign(flags, scope, locator, obj, part) {
            // TODO
            return void 0;
        }
        connect(flags, scope, binding, part) {
            return;
        }
        accept(visitor) {
            return visitor.visitArrayBindingPattern(this);
        }
    }
    exports.ArrayBindingPattern = ArrayBindingPattern;
    class ObjectBindingPattern {
        // We'll either have elements, or keys+values, but never all 3
        constructor(keys, values) {
            this.$kind = 65557 /* ObjectBindingPattern */;
            this.keys = keys;
            this.values = values;
        }
        evaluate(flags, scope, locator, part) {
            // TODO
            return void 0;
        }
        assign(flags, scope, locator, obj, part) {
            // TODO
            return void 0;
        }
        connect(flags, scope, binding, part) {
            return;
        }
        accept(visitor) {
            return visitor.visitObjectBindingPattern(this);
        }
    }
    exports.ObjectBindingPattern = ObjectBindingPattern;
    class BindingIdentifier {
        constructor(name) {
            this.$kind = 65558 /* BindingIdentifier */;
            this.name = name;
        }
        evaluate(flags, scope, locator, part) {
            return this.name;
        }
        connect(flags, scope, binding, part) {
            return;
        }
        accept(visitor) {
            return visitor.visitBindingIdentifier(this);
        }
    }
    exports.BindingIdentifier = BindingIdentifier;
    const toStringTag = Object.prototype.toString;
    // https://tc39.github.io/ecma262/#sec-iteration-statements
    // https://tc39.github.io/ecma262/#sec-for-in-and-for-of-statements
    class ForOfStatement {
        constructor(declaration, iterable) {
            this.$kind = 6199 /* ForOfStatement */;
            this.assign = kernel_1.PLATFORM.noop;
            this.declaration = declaration;
            this.iterable = iterable;
        }
        evaluate(flags, scope, locator, part) {
            return this.iterable.evaluate(flags, scope, locator, part);
        }
        count(flags, result) {
            return exports.CountForOfStatement[toStringTag.call(result)](result);
        }
        iterate(flags, result, func) {
            exports.IterateForOfStatement[toStringTag.call(result)](flags | 16777216 /* isOriginalArray */, result, func);
        }
        connect(flags, scope, binding, part) {
            this.declaration.connect(flags, scope, binding, part);
            this.iterable.connect(flags, scope, binding, part);
        }
        bind(flags, scope, binding) {
            if (hasBind(this.iterable)) {
                this.iterable.bind(flags, scope, binding);
            }
        }
        unbind(flags, scope, binding) {
            if (hasUnbind(this.iterable)) {
                this.iterable.unbind(flags, scope, binding);
            }
        }
        accept(visitor) {
            return visitor.visitForOfStatement(this);
        }
    }
    exports.ForOfStatement = ForOfStatement;
    /*
    * Note: this implementation is far simpler than the one in vCurrent and might be missing important stuff (not sure yet)
    * so while this implementation is identical to Template and we could reuse that one, we don't want to lock outselves in to potentially the wrong abstraction
    * but this class might be a candidate for removal if it turns out it does provide all we need
    */
    class Interpolation {
        constructor(parts, expressions) {
            this.$kind = 24 /* Interpolation */;
            this.assign = kernel_1.PLATFORM.noop;
            this.parts = parts;
            this.expressions = expressions === void 0 ? kernel_1.PLATFORM.emptyArray : expressions;
            this.isMulti = this.expressions.length > 1;
            this.firstExpression = this.expressions[0];
        }
        evaluate(flags, scope, locator, part) {
            if (this.isMulti) {
                const expressions = this.expressions;
                const parts = this.parts;
                let result = parts[0];
                for (let i = 0, ii = expressions.length; i < ii; ++i) {
                    result += expressions[i].evaluate(flags, scope, locator, part);
                    result += parts[i + 1];
                }
                return result;
            }
            else {
                const parts = this.parts;
                return parts[0] + this.firstExpression.evaluate(flags, scope, locator, part) + parts[1];
            }
        }
        connect(flags, scope, binding, part) {
            return;
        }
        accept(visitor) {
            return visitor.visitInterpolation(this);
        }
    }
    exports.Interpolation = Interpolation;
    /// Evaluate the [list] in context of the [scope].
    function evalList(flags, scope, locator, list, part) {
        const len = list.length;
        const result = Array(len);
        for (let i = 0; i < len; ++i) {
            result[i] = list[i].evaluate(flags, scope, locator, part);
        }
        return result;
    }
    function getFunction(flags, obj, name) {
        const func = obj == null ? null : obj[name];
        if (typeof func === 'function') {
            return func;
        }
        if (!(flags & 2097152 /* mustEvaluate */) && func == null) {
            return null;
        }
        throw kernel_1.Reporter.error(207 /* NotAFunction */, obj, name, func);
    }
    const proxyAndOriginalArray = 2 /* proxyStrategy */ | 16777216 /* isOriginalArray */;
    /** @internal */
    exports.IterateForOfStatement = {
        ['[object Array]'](flags, result, func) {
            if ((flags & proxyAndOriginalArray) === proxyAndOriginalArray) {
                // If we're in proxy mode, and the array is the original "items" (and not an array we created here to iterate over e.g. a set)
                // then replace all items (which are Objects) with proxies so their properties are observed in the source view model even if no
                // observers are explicitly created
                const rawArray = proxy_observer_1.ProxyObserver.getRawIfProxy(result);
                const len = rawArray.length;
                let item;
                let i = 0;
                for (; i < len; ++i) {
                    item = rawArray[i];
                    if (item instanceof Object) {
                        item = rawArray[i] = proxy_observer_1.ProxyObserver.getOrCreate(item).proxy;
                    }
                    func(rawArray, i, item);
                }
            }
            else {
                for (let i = 0, ii = result.length; i < ii; ++i) {
                    func(result, i, result[i]);
                }
            }
        },
        ['[object Map]'](flags, result, func) {
            const arr = Array(result.size);
            let i = -1;
            for (const entry of result.entries()) {
                arr[++i] = entry;
            }
            exports.IterateForOfStatement['[object Array]'](flags & ~16777216 /* isOriginalArray */, arr, func);
        },
        ['[object Set]'](flags, result, func) {
            const arr = Array(result.size);
            let i = -1;
            for (const key of result.keys()) {
                arr[++i] = key;
            }
            exports.IterateForOfStatement['[object Array]'](flags & ~16777216 /* isOriginalArray */, arr, func);
        },
        ['[object Number]'](flags, result, func) {
            const arr = Array(result);
            for (let i = 0; i < result; ++i) {
                arr[i] = i;
            }
            exports.IterateForOfStatement['[object Array]'](flags & ~16777216 /* isOriginalArray */, arr, func);
        },
        ['[object Null]'](flags, result, func) {
            return;
        },
        ['[object Undefined]'](flags, result, func) {
            return;
        }
    };
    /** @internal */
    exports.CountForOfStatement = {
        ['[object Array]'](result) { return result.length; },
        ['[object Map]'](result) { return result.size; },
        ['[object Set]'](result) { return result.size; },
        ['[object Number]'](result) { return result; },
        ['[object Null]'](result) { return 0; },
        ['[object Undefined]'](result) { return 0; }
    };
});
//# sourceMappingURL=ast.js.map