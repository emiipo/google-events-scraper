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
        //Load all the content
        const eventsContainter = await page.locator('div[jsname="CaV2mb"]');
        const containerBox = await eventsContainter.boundingBox();

        await page.mouse.move(containerBox.x + containerBox.width / 2, containerBox.y + containerBox.height / 2)
        await playwrightUtils.infiniteScroll(page);

        //Scrape the content
        const events = await page.locator('div[jsname="qlMead"]').all();
        for(const evnt of events){
            const name = await evnt.locator('div[jsname="r4nke"]').textContent();
            log.info(`${name}`);
        }
    },
    headless: false,
});

await crawler.run(['https://www.google.com/search?q=google+events&ibp=htl;events']);
