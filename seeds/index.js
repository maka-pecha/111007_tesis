const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Place = require('../models/place');

mongoose.connect('mongodb://localhost:27017/tesis', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];


const seedDB = async () => {
    await Place.deleteMany({});
    for (let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const place = new Place({
            //YOUR USER ID
            author: '64595d98a757b50ed132e8eb',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam dolores vero perferendis laudantium, consequuntur voluptatibus nulla architecto, sit soluta esse iure sed labore ipsam a cum nihil atque molestiae deserunt!',
            price,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/ddsxauxqi/image/upload/v1683583556/DonateOnNetwork/3448561_ktdkmd.png',
                    filename: 'DonateOnNetwork/3448561_ktdkmd'
                },
                {
                    url: 'https://res.cloudinary.com/ddsxauxqi/image/upload/v1683582432/DonateOnNetwork/empathy_love_lzjl5j.jpg',
                    filename: 'DonateOnNetwork/empathy_love_lzjl5j'
                }
            ]
        })
        await place.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})
