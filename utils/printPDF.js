const puppeteer = require('puppeteer');

module.exports =  async function (req) {
    let { path } = req.params;
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    // Parse the cookie string into an array of {name, value} objects
    const cookies = req.headers.cookie.split(';').map(cookie => {
        const [name, value] = cookie.split('=');
        return { name: name.trim(), value: value.trim(), url:'http://localhost' };
    });
    // Set the cookies on the page
    await page.setCookie(...cookies);
    path = path.replace(/-/g,'/');
    await page.goto(`http://localhost:3000/${path}`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
        const buttonGeneratePDF = document.getElementById('generate-pdf');
        buttonGeneratePDF.remove();
        const TyCandFAQ = document.getElementById('TyCandFAQ');
        TyCandFAQ.remove();

        const imagesUsers = Array.from(document.getElementsByClassName('images-users'));
        imagesUsers.forEach(image => {
            image.remove();
        });
        const anchors = Array.from(document.querySelectorAll('a'));
        anchors.forEach(anchor => {
            anchor.style.pointerEvents = 'none';
            anchor.style.color = 'inherit';
            anchor.removeAttribute('href');
        });
    });

    const pdf = await page.pdf({
        format: 'A4',
        margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
        }
    });
    await browser.close();
    return pdf;
}
