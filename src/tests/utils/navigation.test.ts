import { reloadPage, navigation } from '../../utils/navigation';

describe('navigation utility', () => {
    it('reloadPage should call navigation.reload', () => {
        const reloadSpy = jest.spyOn(navigation, 'reload').mockImplementation(() => { });
        reloadPage();
        expect(reloadSpy).toHaveBeenCalled();
        reloadSpy.mockRestore();
    });

    it('navigation.reload should use window.location.reload by default', () => {
        const reloadMock = jest.fn();
        const getLocationSpy = jest.spyOn(navigation, 'getLocation').mockReturnValue({
            reload: reloadMock,
        } as unknown as Location);

        navigation.reload();
        expect(reloadMock).toHaveBeenCalled();

        getLocationSpy.mockRestore();
    });
});
