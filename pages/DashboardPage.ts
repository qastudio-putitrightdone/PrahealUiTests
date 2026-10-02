import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Button, TextElement } from '../decorator';

export class DashboardPage extends BasePage {
    readonly admin_dashboard_page_url = '/admin/dashboard';

    protected readonly queueButton: Button;
    protected readonly patientsSection: TextElement;

    constructor(page: Page) {
        super(page);
        this.queueButton = this.button('button[title="Queue"]');
        this.patientsSection = this.text('Patients', { selector: 'h6.title' });
    }
}
