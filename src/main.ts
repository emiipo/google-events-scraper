import { PlaywrightCrawler, playwrightUtils } from 'crawlee';

const crawler = new PlaywrightCrawler({
    preNavigationHooks: [
        async (crawlingContext) => {
            //This cookie is required incase google asks for cookie consent and obstructs you from viewing the rest of the info
            await crawlingContext.page.context().addCookies([{
                name: 'CONSENT',
                value: 'YES+',
                domain: 'www.google.com',
                path: '/',
            }])
        },
    ],
    async requestHandler({ page, log }){
        const eventsContainter = await page.locator('div[jsname="CaV2mb"]');
        const containerBox = await eventsContainter.boundingBox();

        await page.mouse.move(containerBox.x + containerBox.width / 2, containerBox.y + containerBox.height / 2)
        await playwrightUtils.infiniteScroll(page);
        await playwrightUtils.saveSnapshot(page);
    },
    headless: false,
});

await crawler.run(['https://www.google.com/search?q=events&ibp=htl;events']);
