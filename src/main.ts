import { PlaywrightCrawler } from 'crawlee';

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
        const title = await page.title();
        log.info(`The title of the page is: ${ title }`)
    },
    headless: false,
});

await crawler.run(['https://www.google.com/search?q=events&ibp=htl;events']);
