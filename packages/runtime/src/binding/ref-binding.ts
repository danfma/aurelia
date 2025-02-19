import {
  IIndexable,
  IServiceLocator,
} from '@aurelia/kernel';
import { IsBindingBehavior } from '../ast';
import {
  LifecycleFlags,
  State,
} from '../flags';
import { IBinding } from '../lifecycle';
import {
  IScope,
} from '../observation';
import {
  hasBind,
  hasUnbind,
} from './ast';
import { IConnectableBinding } from './connectable';

export interface RefBinding extends IConnectableBinding {}
export class RefBinding implements IBinding {
  public $state: State = State.none;
  public $scope?: IScope = void 0;
  public part?: string;

  public constructor(
    public sourceExpression: IsBindingBehavior,
    public target: object,
    public locator: IServiceLocator,
  ) {}

  public $bind(flags: LifecycleFlags, scope: IScope, part?: string): void {
    if (this.$state & State.isBound) {
      if (this.$scope === scope) {
        return;
      }

      this.$unbind(flags | LifecycleFlags.fromBind);
    }
    // add isBinding flag
    this.$state |= State.isBinding;

    this.$scope = scope;
    this.part = part;

    if (hasBind(this.sourceExpression)) {
      this.sourceExpression.bind(flags, scope, this);
    }

    this.sourceExpression.assign!(flags | LifecycleFlags.updateSourceExpression, this.$scope, this.locator, this.target, part);

    // add isBound flag and remove isBinding flag
    this.$state |= State.isBound;
    this.$state &= ~State.isBinding;
  }

  public $unbind(flags: LifecycleFlags): void {
    if (!(this.$state & State.isBound)) {
      return;
    }
    // add isUnbinding flag
    this.$state |= State.isUnbinding;

    let sourceExpression = this.sourceExpression;
    if (sourceExpression.evaluate(flags, this.$scope!, this.locator, this.part) === this.target) {
      sourceExpression.assign!(flags, this.$scope!, this.locator, null, this.part);
    }

    // source expression might have been modified durring assign, via a BB
    sourceExpression = this.sourceExpression;
    if (hasUnbind(sourceExpression)) {
      sourceExpression.unbind(flags, this.$scope!, this);
    }

    this.$scope = void 0;

    // remove isBound and isUnbinding flags
    this.$state &= ~(State.isBound | State.isUnbinding);
  }

  public observeProperty(flags: LifecycleFlags, obj: IIndexable, propertyName: string): void {
    return;
  }

  public handleChange(newValue: unknown, previousValue: unknown, flags: LifecycleFlags): void {
    return;
  }
}
