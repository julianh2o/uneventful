import request from 'supertest';
import app from './index';

interface FormField {
	id: string;
	type: string;
	options?: { value: string; label: string }[];
	condition?: {
		field: string;
		operator: string;
		values?: string[];
	};
}

interface FormPage {
	title: string;
	description?: string;
	fields: FormField[];
}

// Helper to get all fields from all pages
const getAllFields = (pages: FormPage[]): FormField[] => {
	return pages.flatMap((page) => page.fields);
};

describe('GET /api/forms/:formName', () => {
	it('should return the eventForm configuration as JSON', async () => {
		const response = await request(app).get('/api/forms/eventForm');

		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty('title', 'Event Registration');
		expect(response.body).toHaveProperty('pages');
		expect(Array.isArray(response.body.pages)).toBe(true);
		expect(response.body.pages.length).toBe(5);
	});

	it('should have pages with titles and fields', async () => {
		const response = await request(app).get('/api/forms/eventForm');

		const pages = response.body.pages;
		expect(pages[0]).toHaveProperty('title', 'Event Basics');
		expect(pages[0]).toHaveProperty('fields');
		expect(Array.isArray(pages[0].fields)).toBe(true);

		expect(pages[1]).toHaveProperty('title', 'Event Details');
		expect(pages[1]).toHaveProperty('fields');
		expect(Array.isArray(pages[1].fields)).toBe(true);
	});

	it('should return all expected fields across pages', async () => {
		const response = await request(app).get('/api/forms/eventForm');

		const allFields = getAllFields(response.body.pages);
		const fieldIds = allFields.map((field) => field.id);

		expect(fieldIds).toContain('eventName');
		expect(fieldIds).toContain('hostName');
		expect(fieldIds).toContain('hostContact');
		expect(fieldIds).toContain('eventDate');
		expect(fieldIds).toContain('eventTime');
		expect(fieldIds).toContain('eventType');
		expect(fieldIds).toContain('partySize');
		expect(fieldIds).toContain('spaceUse');
		expect(fieldIds).toContain('largePartyAgreement');
	});

	it('should have correct field types', async () => {
		const response = await request(app).get('/api/forms/eventForm');

		const allFields = getAllFields(response.body.pages);
		const eventName = allFields.find((f) => f.id === 'eventName');
		const partySize = allFields.find((f) => f.id === 'partySize');
		const largePartyAgreement = allFields.find((f) => f.id === 'largePartyAgreement');

		expect(eventName?.type).toBe('text');
		expect(partySize?.type).toBe('select');
		expect(largePartyAgreement?.type).toBe('checkbox');
	});

	it('should have party size options', async () => {
		const response = await request(app).get('/api/forms/eventForm');

		const allFields = getAllFields(response.body.pages);
		const partySize = allFields.find((f) => f.id === 'partySize');

		expect(partySize?.options).toHaveLength(5);
		expect(partySize?.options?.[0]).toHaveProperty('value');
		expect(partySize?.options?.[0]).toHaveProperty('label');
	});

	it('should have conditional visibility on largePartyAgreement', async () => {
		const response = await request(app).get('/api/forms/eventForm');

		const allFields = getAllFields(response.body.pages);
		const largePartyAgreement = allFields.find((f) => f.id === 'largePartyAgreement');

		expect(largePartyAgreement?.condition).toBeDefined();
		expect(largePartyAgreement?.condition?.field).toBe('partySize');
		expect(largePartyAgreement?.condition?.operator).toBe('in');
		expect(largePartyAgreement?.condition?.values).toContain('21-50');
		expect(largePartyAgreement?.condition?.values).toContain('51-100');
		expect(largePartyAgreement?.condition?.values).toContain('100+');
	});

	it('should return 404 for non-existent form', async () => {
		const response = await request(app).get('/api/forms/nonExistentForm');

		expect(response.status).toBe(404);
		expect(response.body).toHaveProperty('error');
	});
});
