import { test } from '../../fixtures';
import { Allure } from '../../reporting/allure';
import { ApplicationMessages } from '../../constants/ApplicationMessages';
import { SUPER_ADMIN } from '../../user/Users';

const INVALID_PASSWORD = 'Wrong@1234';

test.describe('Login screen verifications', Allure({ epic: 'Authentication', story: 'Login screen verifications' }), () => {

    test.beforeEach(async ({ loginActions }) => {
        await loginActions.open();
    });

    test('login screen displays mobile number field', Allure({
        description: 'Verifies the mobile number field is visible on the staff login page',
        tags: ['smoke'],
        requirement: 'AUTH-01',
        tmsLink: 'HAT-T4',
    }), async ({ loginActions }) => {
        await loginActions.checkMobileNoTextFieldDisplayed();
    })

    test('login screen displays password field', Allure({
        description: 'Verifies the password field is visible on the staff login page',
        tags: ['smoke'],
        requirement: 'AUTH-01',
        tmsLink: 'HAT-T5',
    }), async ({ loginActions }) => {
        await loginActions.checkPasswordTextFieldDisplayed();
    })

    test('login screen displays login button', Allure({
        description: 'Verifies the login button is visible on the staff login page',
        tags: ['smoke'],
        requirement: 'AUTH-01',
        tmsLink: 'HAT-T6',
    }), async ({ loginActions }) => {
        await loginActions.checkLoginButtonDisplayed();
    })

})

test.describe('Login functionality', Allure({ epic: 'Authentication', story: 'Login functionality verifications' }), () => {
    
    test.beforeEach(async ({ loginActions }) => {
        await loginActions.open();
    });

    test('login as Super Admin', Allure({
        description: 'Verifies the login functionality for Super Admin role',
        tags: ['smoke'],
        requirement: 'AUTH-02',
        tmsLink: 'HAT-T7',
    }), async ({ loginActions, dashboardActions }) => {
        await loginActions.loginToApplication(SUPER_ADMIN);
        await dashboardActions.checkAdminLoginSuccess();
    })

    test('shows error for invalid password of super admin', Allure({
        description: 'Verifies that logging in with the Super Admin registered mobile number and a wrong password shows the error message "Invalid Mobile No. Or Password."',
        tags: ['smoke'],
        requirement: 'AUTH-03',
        tmsLink: 'HAT-T2',
    }), async ({ loginActions }) => {
        await loginActions.loginWithInvalidPassword(SUPER_ADMIN, INVALID_PASSWORD);
        await loginActions.checkErrorMessageDisplayed(ApplicationMessages.INVALID_CREDENTIALS);
    })

    test('keeps super admin on login page after invalid password', Allure({
        description: 'Verifies that after logging in with the Super Admin registered mobile number and a wrong password the user stays on the staff login page and is not logged in',
        requirement: 'AUTH-03',
        tmsLink: 'HAT-T3',
    }), async ({ loginActions }) => {
        await loginActions.loginWithInvalidPassword(SUPER_ADMIN, INVALID_PASSWORD);
        await loginActions.checkUserStaysOnLoginPage();
    })
})
