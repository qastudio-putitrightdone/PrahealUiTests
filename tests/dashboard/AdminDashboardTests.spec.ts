import { test } from '../../fixtures';
import { Allure } from '../../reporting/allure';
import { SUPER_ADMIN } from '../../user/Users';

test.describe('Admin dashboard sections', Allure({ epic: 'Dashboard', story: 'Super Admin dashboard' }), () => {

    test.beforeEach(async ({ browserSession, dashboardActions }) => {
        await browserSession.loginAs(SUPER_ADMIN);
        await dashboardActions.openAdminPage();
    });

    test('displays Patients section to super admin', Allure({
        description: 'Verifies that a Super Admin user, authenticated through the API with local storage prepared, sees the Patients section on the admin dashboard',
        tags: ['smoke'],
        requirement: 'DSH-01',
        tmsLink: 'HAT-T8',
    }), async ({ dashboardActions }) => {
        await dashboardActions.checkPatientsSectionDisplayed();
    })

})
