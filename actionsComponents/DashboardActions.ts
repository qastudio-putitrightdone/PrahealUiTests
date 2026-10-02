import { DashboardPage } from "../pages/DashboardPage";
import { Step } from "../reporting/allure";


export class DashboardActions extends DashboardPage {

    @Step('Open the admin dashboard page')
    async openAdminPage() {
        await this.page.goto(this.admin_dashboard_page_url);
    }

    @Step('Verify admin login is successful')
    async checkAdminLoginSuccess() {
        await this.queueButton.checkIsVisible()
    }

    @Step('Verify Patients section is displayed')
    async checkPatientsSectionDisplayed() {
        await this.patientsSection.checkIsVisible()
    }
}
