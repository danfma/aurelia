import { expect } from 'chai';
import { AppPage } from './app.page';

describe(`Todos App - `, () => {
  beforeEach(() => {
    browser.url('index.todos.html');
  });

  describe(`Loads with correct initial values`, () => {
    const descriptionText = 'Hello World';
    const countValue = 1;

    it(`description interpolation text: "${descriptionText}"`, function() {
      const actual = AppPage.getDescriptionInterpolationText();
      expect(actual).to.equal(descriptionText);
    });

    it(`count input value: ${countValue}`, function() {
      const actual = AppPage.getCountInputValue();
      expect(actual).to.equal(countValue);
    });

    it(`description input value: "${descriptionText}"`, function() {
      const actual = AppPage.getDescriptionInputValue();
      expect(actual).to.equal(descriptionText);
    });
  });

  function verifyTodos(count: number, appDescr: string, todoDescr: string, done: boolean) {
    const todos = AppPage.getTodos();
    expect(todos.length).to.equal(count);
    for (let i = 0; i < count; ++i) {
      const todo = todos[i];
      // the replace + trim is a workaround for safari which renders lots of spaces and newlines
      const actual = (todo.getText()).replace(/\n/g, '').replace(/ +/g, ' ').trim();
      expect(actual).to.equal(`#${i} - ${appDescr} - ${todoDescr}${done ? ' Done' : ''}`);
    }
  }

  describe(`Add/remove todos`, () => {
    it(`adds 1 todo`, function() {
      AppPage.addTodo();
      verifyTodos(1, 'Hello World', 'Hello World', false);
    });

    it(`adds 1 todo and removes it`, function() {
      AppPage.addTodo();
      AppPage.clearTodos();
      verifyTodos(0, null, null, false);
    });

    it(`adds 10 todos one by one`, function() {
      for (let i = 0; i < 10; ++i) {
        AppPage.addTodo();
      }
      verifyTodos(10, 'Hello World', 'Hello World', false);
    });

    it(`adds 10 todos at once`, function() {
      AppPage.setCountInputValue(10);
      AppPage.addTodo();
      verifyTodos(10, 'Hello World', 'Hello World', false);
    });

    it(`adds 10 todos at once and removes them`, function() {
      AppPage.setCountInputValue(10);
      AppPage.addTodo();
      AppPage.clearTodos();
      verifyTodos(0, null, null, false);
    });
  });

  describe(`Change todo text`, () => {

    it(`adds 1 todo with different text beforehand`, function() {
      AppPage.setDescriptionInputValue('foo');
      AppPage.addTodo();
      verifyTodos(1, 'foo', 'foo', false);
    });

    it(`adds 10 todos with different text beforehand one by one`, function() {
      AppPage.setDescriptionInputValue('foo');
      for (let i = 0; i < 10; ++i) {
        AppPage.addTodo();
      }
      verifyTodos(10, 'foo', 'foo', false);
    });

    it(`adds 10 todos with different text beforehand at once`, function() {
      AppPage.setDescriptionInputValue('foo');
      AppPage.setCountInputValue(10);
      AppPage.addTodo();
      verifyTodos(10, 'foo', 'foo', false);
    });

    it(`adds 1 todo with different text afterwards`, function() {
      AppPage.addTodo();
      AppPage.setDescriptionInputValue('foo');
      verifyTodos(1, 'foo', 'Hello World', false);
    });

    it(`adds 10 todos with different text afterwards one by one`, function() {
      for (let i = 0; i < 10; ++i) {
        AppPage.addTodo();
      }
      AppPage.setDescriptionInputValue('foo');
      verifyTodos(10, 'foo', 'Hello World', false);
    });

    it(`adds 10 todos with different text afterwards at once`, function() {
      AppPage.setCountInputValue(10);
      AppPage.addTodo();
      AppPage.setDescriptionInputValue('foo');
      verifyTodos(10, 'foo', 'Hello World', false);
    });
  });

  describe(`Toggle todos`, () => {
    it(`adds 10 todos and toggles them one by one`, function() {
      AppPage.setCountInputValue(10);
      AppPage.addTodo();
      for (let i = 0; i < 10; ++i) {
        AppPage.clickTodoDoneCheckbox(i);
      }
      verifyTodos(10, 'Hello World', 'Hello World', true);
    });

    it(`adds 10 todos and toggles them one by one and back off again`, function() {
      AppPage.setCountInputValue(10);
      AppPage.addTodo();
      for (let i = 0; i < 10; ++i) {
        AppPage.clickTodoDoneCheckbox(i);
        AppPage.clickTodoDoneCheckbox(i);
      }
      verifyTodos(10, 'Hello World', 'Hello World', false);
    });

    it(`adds 10 todos and toggles them all at once`, function() {
      AppPage.setCountInputValue(10);
      AppPage.addTodo();
      AppPage.toggleTodos();
      verifyTodos(10, 'Hello World', 'Hello World', true);
    });

    it(`adds 10 todos and toggles them on all at once and back off again`, function() {
      AppPage.setCountInputValue(10);
      AppPage.addTodo();
      AppPage.toggleTodos();
      AppPage.toggleTodos();
      verifyTodos(10, 'Hello World', 'Hello World', false);
    });
  });

});
