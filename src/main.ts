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
            //Description handling just in case it doesn't have one
            let desc = '';
            const descLocator = await evnt.locator('.PVlUWc');
            if(await descLocator.count() > 0){
                desc = await descLocator.textContent();
            }

            const mapUrl = await evnt.locator('.ozQmAd').getAttribute('data-url');

            //Links handling
            let links = [];
            const linkLocators = await evnt.locator('div[jsname="CzizI"]').locator('.SKIyM').all();
            for (const lnk of linkLocators) {
                const link = {
                    name: await lnk.locator('.NLMF7b span').textContent(),
                    url: await lnk.getAttribute('href'),
                }
                links.push(link);
            }

            const results = {
                name: await evnt.locator('div[jsname="r4nke"]').textContent(),
                description: desc,
                date: await evnt.locator('.Gkoz3').textContent(),
                location: {
                    addressMain: await evnt.locator('.n3VjZe').textContent(),
                    addressSecondary: await evnt.locator('.U6txu').textContent(),
                    mapUrl: 'https://google.com' + mapUrl,
                },
                links: links,
            }

            console.log(results);
        }
    },
    headless: false,
});

await crawler.run(['https://www.google.com/search?q=google+events&ibp=htl;events']);
