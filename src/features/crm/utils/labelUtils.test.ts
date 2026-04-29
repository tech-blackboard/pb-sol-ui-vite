import { getLabelColorClasses, LABEL_STYLE_MAP } from './labelUtils';

describe('labelUtils', () => {
    describe('getLabelColorClasses', () => {
        it('returns correct classes for predefined CRM labels', () => {
            const registered = LABEL_STYLE_MAP['registered'];
            expect(getLabelColorClasses('Registered')).toEqual(registered);
        });

        it('is case-insensitive for predefined labels', () => {
            const registered = LABEL_STYLE_MAP['registered'];
            expect(getLabelColorClasses('registered')).toEqual(registered);
        });

        it('returns correct classes for system labels', () => {
            expect(getLabelColorClasses('unsubscribed')).toEqual(LABEL_STYLE_MAP['unsubscribed']);
        });

        it('returns default color for unknown labels', () => {
            const defaultColor = { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-transparent' };
            expect(getLabelColorClasses('Unknown Label')).toEqual(defaultColor);
        });
    });
});
