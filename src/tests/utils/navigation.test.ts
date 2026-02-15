import { reloadPage, navigation } from '../../utils/navigation';

describe('navigation utility', () => {
    it('should call navigation.reload', () => {
        const reloadSpy = jest.spyOn(navigation, 'reload').mockImplementation(() => { });

        reloadPage();

        expect(reloadSpy).toHaveBeenCalled();
        reloadSpy.mockRestore();
    });
});
