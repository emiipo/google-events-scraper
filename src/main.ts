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

        await page.mouse.move(containerBox!.x + containerBox!.width / 2, containerBox!.y + containerBox!.height / 2)
        await playwrightUtils.infiniteScroll(page);

        //Scrape the content
        const events = await page.locator('.voohof li').all();
        for(const event of events){
            //Click on the event and load the data(this is mainly needed to get image URL's)
            await event.click();
            const id = await event.getAttribute('data-encoded-docid');
            const evnt = page.locator('div[data-encoded-docid="' + id + '"]');

            //Description handling just in case it doesn't have one
            let desc:string|null = '';
            const descLocator = await evnt.locator('.PVlUWc');
            if(await descLocator.count() > 0){
                desc = await descLocator.textContent();
            }

            //Location handling
            const lineOne = await evnt.locator('.n3VjZe').textContent();
            const lineTwo = await evnt.locator('.U6txu').textContent();
            const mapUrl = 'https://google.com' + await evnt.locator('.ozQmAd').getAttribute('data-url');
            const location = {
                name: lineTwo === ''? '' : lineOne,
                address: lineTwo === ''? lineOne : lineTwo,
                mapUrl: mapUrl,
            }

            //Link handling
            let links = [];
            const linkLocators = await evnt.locator('div[jsname="CzizI"]').locator('.SKIyM').all();
            for (const lnk of linkLocators) {
                const link = {
                    name: await lnk.locator('.NLMF7b span').textContent(),
                    url: await lnk.getAttribute('href'),
                }
                links.push(link);
            }

            //Results
            const results = {
                name: await evnt.locator('div[jsname="r4nke"]').textContent(),
                description: desc,
                imageUrl: await evnt.locator('div[jsname="s2gQvd"] img[src]').first().getAttribute('src'),
                date: await evnt.locator('.Gkoz3').textContent(),
                location: {
                    addressMain: await evnt.locator('.n3VjZe').textContent(),
                    addressSecondary: await evnt.locator('.U6txu').textContent(),
                    mapUrl: location,
                },
                links: links,
            }

            console.log(results);
        }
    },
    headless: false,
});

await crawler.run(['https://www.google.com/search?q=google+events&ibp=htl;events']);
