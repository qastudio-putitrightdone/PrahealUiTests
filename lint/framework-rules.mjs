import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const LOCATOR_METHODS = new Set([
  'locator',
  'getByRole',
  'getByText',
  'getByLabel',
  'getByPlaceholder',
  'getByTestId',
  'getByTitle',
  'getByAltText',
  '$',
  '$$',
]);

const propertyName = (node) =>
  node && node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier'
    ? node.property.name
    : null;

const isTestCall = (node) => node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'test';

const isHookOrTestCallback = (node) => {
  const call = node.parent;
  if (!call || call.type !== 'CallExpression' || !call.arguments.includes(node)) return false;
  if (isTestCall(call)) return true;
  const name = propertyName(call.callee);
  return call.callee.type === 'MemberExpression' && call.callee.object.name === 'test' && ['beforeEach', 'beforeAll', 'afterEach', 'afterAll'].includes(name);
};

const walk = (node, visit) => {
  if (!node || typeof node.type !== 'string') return;
  visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') continue;
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
    else if (value && typeof value.type === 'string') walk(value, visit);
  }
};

const checkCalls = (body) => {
  const calls = [];
  walk(body, (node) => {
    if (node.type === 'CallExpression' && /^check[A-Z]/.test(propertyName(node.callee) ?? '')) calls.push(node);
  });
  return calls;
};

const objectKeys = (objectExpression) =>
  new Map(
    objectExpression.properties
      .filter((property) => property.type === 'Property' && property.key.type === 'Identifier')
      .map((property) => [property.key.name, property.value]),
  );

const isEmptyValue = (value) =>
  !value ||
  (value.type === 'Literal' && (value.value === '' || value.value === null)) ||
  (value.type === 'ArrayExpression' && value.elements.length === 0);

const rule = (description, messages, create) => ({
  meta: { type: 'problem', docs: { description }, messages, schema: [] },
  create,
});

const specImportsFixtures = rule(
  'Specs import test / expect from fixtures, never from @playwright/test',
  { wrongImport: 'Import `{{name}}` from the fixtures module (`fixtures/index.ts`), not from @playwright/test - otherwise action fixtures and the fullscreen page are missing.' },
  (context) => ({
    ImportDeclaration(node) {
      if (node.source.value !== '@playwright/test') return;
      for (const specifier of node.specifiers) {
        const name = specifier.imported?.name ?? specifier.local.name;
        if (name === 'test' || name === 'expect') context.report({ node: specifier, messageId: 'wrongImport', data: { name } });
      }
    },
  }),
);

const specTestMetadata = rule(
  'Every test declares Allure metadata: description, tmsLink (Zephyr test case id) and requirement id',
  {
    missingDetails: 'Test "{{title}}" must pass Allure({ description, tmsLink, requirement }) as its second argument.',
    missingKey: 'Test "{{title}}" is missing `{{key}}` in Allure({...}) ({{why}}).',
  },
  (context) => ({
    CallExpression(node) {
      if (!isTestCall(node) || node.arguments.length < 2) return;
      const title = node.arguments[0].type === 'Literal' ? String(node.arguments[0].value) : '<dynamic title>';
      const details = node.arguments[1];
      const isAllure =
        details.type === 'CallExpression' &&
        details.callee.type === 'Identifier' &&
        details.callee.name === 'Allure' &&
        details.arguments[0]?.type === 'ObjectExpression';
      if (!isAllure) {
        context.report({ node, messageId: 'missingDetails', data: { title } });
        return;
      }
      const keys = objectKeys(details.arguments[0]);
      const required = {
        description: 'a full sentence describing the single verification',
        tmsLink: 'the Zephyr test case id, e.g. HAT-T12',
        requirement: 'the requirement / scenario id, e.g. AUTH-03',
      };
      for (const [key, why] of Object.entries(required)) {
        if (isEmptyValue(keys.get(key))) context.report({ node: details, messageId: 'missingKey', data: { title, key, why } });
      }
    },
  }),
);

const specSingleVerification = rule(
  'One test = one verification point: exactly one check...() call, as the last statement',
  {
    none: 'Test "{{title}}" has no verification - end it with exactly one check...() actions call.',
    several: 'Test "{{title}}" has {{count}} verifications - one test may verify only one thing. Split it into separate tests.',
    notLast: 'Test "{{title}}": the check...() call must be the last statement of the test.',
  },
  (context) => ({
    CallExpression(node) {
      if (!isTestCall(node)) return;
      const callback = node.arguments.at(-1);
      if (!callback || !['ArrowFunctionExpression', 'FunctionExpression'].includes(callback.type) || callback.body.type !== 'BlockStatement') return;
      const title = node.arguments[0].type === 'Literal' ? String(node.arguments[0].value) : '<dynamic title>';
      const calls = checkCalls(callback.body);
      if (calls.length === 0) {
        context.report({ node, messageId: 'none', data: { title } });
      } else if (calls.length > 1) {
        context.report({ node: calls[1], messageId: 'several', data: { title, count: String(calls.length) } });
      } else {
        const last = callback.body.body.at(-1);
        if (!last || last.range[0] > calls[0].range[0] || last.range[1] < calls[0].range[1]) {
          context.report({ node: calls[0], messageId: 'notLast', data: { title } });
        }
      }
    },
  }),
);

const specActionsOnly = rule(
  'Specs only call actions methods: no expect, no locators, no direct page access',
  {
    expect: 'Do not use expect() in specs - verifications live in actions `check...` methods backed by decorator assertions.',
    locator: 'Do not locate elements in specs (`{{name}}`) - locators belong in page classes.',
    page: 'Do not use the `page` fixture in tests or hooks - go through actions classes (and browserSession / router for setup).',
  },
  (context) => ({
    CallExpression(node) {
      if (node.callee.type === 'Identifier' && node.callee.name === 'expect') context.report({ node, messageId: 'expect' });
      const name = propertyName(node.callee);
      if (name && LOCATOR_METHODS.has(name)) context.report({ node, messageId: 'locator', data: { name } });
    },
    'ArrowFunctionExpression, FunctionExpression'(node) {
      if (!isHookOrTestCallback(node)) return;
      const pattern = node.params[0];
      if (pattern?.type !== 'ObjectPattern') return;
      for (const property of pattern.properties) {
        if (property.type === 'Property' && property.key.type === 'Identifier' && property.key.name === 'page') {
          context.report({ node: property, messageId: 'page' });
        }
      }
    },
  }),
);

const specLoginPolicy = rule(
  'Tests that are not about login must not log in through the UI',
  {
    uiLogin: 'This spec is not under tests/login/ - do not log in through the login screen (`{{what}}`). Use browserSession.loginAs(<USER>) in beforeEach and open the start page by URL.',
  },
  (context) => {
    const filename = context.filename.replaceAll('\\', '/');
    if (filename.includes('/tests/login/')) return {};
    return {
      MemberExpression(node) {
        if (node.object.type === 'Identifier' && node.object.name === 'loginActions') {
          context.report({ node, messageId: 'uiLogin', data: { what: `loginActions.${propertyName(node) ?? '...'}` } });
        }
      },
      Literal(node) {
        if (typeof node.value === 'string' && node.value.includes('/staff-login')) {
          context.report({ node, messageId: 'uiLogin', data: { what: node.value } });
        }
      },
    };
  },
);

const noHardWait = rule(
  'No fixed waits',
  { wait: 'Do not use waitForTimeout - wait for a state (web-first assertions, waitFor, waitForResponse) instead.' },
  (context) => ({
    CallExpression(node) {
      if (propertyName(node.callee) === 'waitForTimeout') context.report({ node, messageId: 'wait' });
    },
  }),
);

const pageLocatorsOnly = rule(
  'Page classes hold locators only, as protected readonly decorator fields',
  {
    method: 'Page classes hold locators only - move `{{name}}` to the actions class.',
    expect: 'No assertions in page classes - use decorator check... methods from the actions class.',
    rawLocator: 'Do not call `{{name}}` in page classes - create elements with the BasePage factories (this.input(), this.button(), ...).',
    field: 'Element field `{{name}}` must be declared `protected readonly`.',
  },
  (context) => {
    if (context.filename.replaceAll('\\', '/').endsWith('/pages/BasePage.ts')) return {};
    return {
      MethodDefinition(node) {
        if (node.kind !== 'constructor') {
          context.report({ node, messageId: 'method', data: { name: node.key.name ?? 'method' } });
        }
      },
      PropertyDefinition(node) {
        if (node.typeAnnotation?.typeAnnotation.type === 'TSTypeReference' && (node.accessibility !== 'protected' || !node.readonly)) {
          context.report({ node, messageId: 'field', data: { name: node.key.name } });
        }
      },
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'expect') context.report({ node, messageId: 'expect' });
        const name = propertyName(node.callee);
        if (name && LOCATOR_METHODS.has(name)) {
          context.report({ node, messageId: 'rawLocator', data: { name } });
        }
      },
    };
  },
);

const actionsStepRequired = rule(
  'Every actions method has @Step and uses decorators only',
  {
    step: 'Actions method `{{name}}` needs an @Step(\'...\') decorator so it appears in the Allure report.',
    expect: 'No expect() in actions classes - assert through decorator check... methods.',
    locator: 'Do not locate elements in actions classes (`{{name}}`) - declare them in the page class.',
  },
  (context) => ({
    MethodDefinition(node) {
      if (node.kind !== 'method') return;
      const hasStep = (node.decorators ?? []).some(
        (decorator) => decorator.expression.type === 'CallExpression' && decorator.expression.callee.name === 'Step',
      );
      if (!hasStep) context.report({ node, messageId: 'step', data: { name: node.key.name ?? 'method' } });
    },
    CallExpression(node) {
      if (node.callee.type === 'Identifier' && node.callee.name === 'expect') context.report({ node, messageId: 'expect' });
      const name = propertyName(node.callee);
      if (name && LOCATOR_METHODS.has(name)) context.report({ node, messageId: 'locator', data: { name } });
    },
  }),
);

const decoratorAssertions = rule(
  'Decorator assertions are named check... and use expect; one action or one assertion per method',
  {
    unnamed: 'Method `{{name}}` asserts with expect() - assertion methods must be named check...',
    noExpect: 'Assertion method `{{name}}` must assert with expect() or delegate to another check... method.',
    mixed: 'Method `{{name}}` combines an assertion with an action - one action or one assertion per method.',
  },
  (context) => ({
    MethodDefinition(node) {
      if (node.kind !== 'method' || node.static || node.key.type !== 'Identifier') return;
      const name = node.key.name;
      let usesExpect = false;
      let delegatesCheck = false;
      let actsOnElement = false;
      walk(node.value.body, (inner) => {
        if (inner.type !== 'CallExpression') return;
        if (inner.callee.type === 'Identifier' && inner.callee.name === 'expect') usesExpect = true;
        const called = propertyName(inner.callee) ?? '';
        if (/^check[A-Z]/.test(called)) delegatesCheck = true;
        if (['click', 'fill', 'check', 'uncheck', 'selectOption', 'press', 'hover', 'dblclick', 'setChecked', 'pressSequentially', 'clear'].includes(called)) {
          actsOnElement = true;
        }
      });
      const isCheck = /^check[A-Z]/.test(name);
      if (usesExpect && !isCheck) context.report({ node, messageId: 'unnamed', data: { name } });
      if (isCheck && !usesExpect && !delegatesCheck) context.report({ node, messageId: 'noExpect', data: { name } });
      if (isCheck && usesExpect && actsOnElement) context.report({ node, messageId: 'mixed', data: { name } });
    },
  }),
);

const noComments = rule(
  'Framework code contains no comments',
  { comment: 'Do not add code comments (framework rule) - make the code self-explanatory.' },
  (context) => ({
    Program() {
      for (const comment of context.sourceCode.getAllComments()) {
        if (/^\s*eslint(-disable|-enable)?\b/.test(comment.value)) continue;
        context.report({ loc: comment.loc, messageId: 'comment' });
      }
    },
  }),
);

const noHardcodedCredentials = rule(
  'Credentials live only in user/Users.ts',
  { mobile: 'Hard-coded mobile number "{{value}}" - use a user constant from user/Users.ts.' },
  (context) => {
    if (context.filename.replaceAll('\\', '/').endsWith('/user/Users.ts')) return {};
    return {
      Literal(node) {
        if (typeof node.value === 'string' && /^(\+?91)?[6-9]\d{9}$/.test(node.value)) {
          context.report({ node, messageId: 'mobile', data: { value: node.value } });
        }
      },
    };
  },
);

const apiEndpointEnum = rule(
  'API services take endpoint paths from the module Endpoint enum',
  { literal: 'Endpoint path must come from the module `<Module>Endpoint` enum, not a string literal.' },
  (context) => ({
    Property(node) {
      if (node.key.type === 'Identifier' && node.key.name === 'endpoint' && ['Literal', 'TemplateLiteral'].includes(node.value.type)) {
        context.report({ node: node.value, messageId: 'literal' });
      }
    },
  }),
);

const loadApplicationMessages = (cwd) => {
  try {
    const source = readFileSync(join(cwd, 'constants', 'ApplicationMessages.ts'), 'utf8');
    return new Map([...source.matchAll(/^\s*([A-Z0-9_]+):\s*'([^']+)'/gm)].map(([, key, value]) => [value, key]));
  } catch {
    return new Map();
  }
};

const noHardcodedMessages = rule(
  'Application messages come from constants/ApplicationMessages.ts',
  { message: 'Hard-coded application message "{{value}}" - use ApplicationMessages.{{key}}.' },
  (context) => {
    const messages = loadApplicationMessages(context.cwd);
    return {
      Literal(node) {
        if (typeof node.value !== 'string' || !messages.has(node.value)) return;
        if (node.parent?.type === 'Property' && node.parent.value === node && context.filename.replaceAll('\\', '/').endsWith('/constants/ApplicationMessages.ts')) return;
        context.report({ node, messageId: 'message', data: { value: node.value, key: messages.get(node.value) } });
      },
    };
  },
);

export default {
  meta: { name: 'praheal-framework' },
  rules: {
    'spec-imports-fixtures': specImportsFixtures,
    'spec-test-metadata': specTestMetadata,
    'spec-single-verification': specSingleVerification,
    'spec-actions-only': specActionsOnly,
    'spec-login-policy': specLoginPolicy,
    'no-hard-wait': noHardWait,
    'page-locators-only': pageLocatorsOnly,
    'actions-step-required': actionsStepRequired,
    'decorator-assertions': decoratorAssertions,
    'no-comments': noComments,
    'no-hardcoded-credentials': noHardcodedCredentials,
    'api-endpoint-enum': apiEndpointEnum,
    'no-hardcoded-messages': noHardcodedMessages,
  },
};
