const Place = require("../models/place");
const User = require("../models/user");
const mercadopago = require("../mercadoPago");
const Donation = require("../models/donation");

module.exports.index = async (req, res) => {
    let donations = await Donation.find({}).populate('donor').populate('place');
    donations.totalPrice = donations.reduce((accumulator, donation) => accumulator + donation.price, 0);
    res.render('donations/index', { donations, user: false, place: false })
}

module.exports.donationsByUser = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    let donations = await Donation.find({'donor': id}).populate('donor').populate('place');
    user.totalPrice = donations.reduce((accumulator, donation) => accumulator + donation.price, 0);
    res.render('donations/index', { donations, user: user, place: false })
}

module.exports.donationsToPlace = async (req, res) => {
    const { id } = req.params;
    const place = await Place.findById(id);
    let donations = await Donation.find({'place': id}).populate('donor').populate('place');
    place.totalPrice = donations.reduce((accumulator, donation) => accumulator + donation.price, 0);
    res.render('donations/index', { donations, place: place, user: false })
}

module.exports.donate = async (req, res) => {
    const { id } = req.params;
    try {
        const place = await Place.findById(id);
        req.body.place = place;
        await mercadopago.configure(place.mpAccessToken);
        const preferenceId = await mercadopago.createPreference(req, res);
        res.redirect(`https://www.mercadopago.com/mla/checkout/start?pref_id=${preferenceId}`);
    } catch (e) {
        req.flash('error', 'Temporally, cannot donate to this place');
        res.redirect(`/places/${id}`)
    }
}

module.exports.renderResult = async (req, res) => {
    const { id } = req.params;
    const place = await Place.findById(id);
    try {
        let result = false;
        const { donationAmount } = req.params;
        if (donationAmount) {
            const donation = new Donation({
                price: donationAmount,
                date: new Date().toLocaleString(),
                place: id,
            });
            donation.donor = req.user._id;
            place.donations.push(donation);
            await donation.save();
            await place.save();
            result = true;
            res.render(`donations/result`, { result, place_id: place._id });
        } else {
            res.render(`donations/result`, { result, place_id: place._id });
        }
    } catch (e) {
        req.flash('error', 'There was an error in your donation');
        res.redirect(`/places/${place._id}`)
    }
}

module.exports.getGraphics = async (req, res) => {
    const places = await Place.find().populate('donations');
    const result = { places: [], donations: [] };

    for (let place of places) {
        let totalDonations = 0;

        totalDonations = place.donations.reduce((accumulator, donation) => accumulator + donation.price, 0);

        if(totalDonations !== 0) {
            result.places.push(place.title);
            result.donations.push(totalDonations);
        }
    }
    res.render('donations/graphics', { result })
}

module.exports.getGraphicsPerDate = async (req, res) => {
    const { startDate, endDate } = req.body;
    if(!startDate || !endDate) {
        req.flash('error', 'Temporally, cannot donate to this place');
    }

    // Convertir las fechas a objetos Date de JavaScript
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Incrementar en un día la fecha final para incluir el día completo.
    end.setDate(end.getDate() + 1);

    // Buscar lugares con las donaciones entre las fechas proporcionadas
    let places = await Place.find().populate({
        path: 'donations',
        match: { date: { $gte: start, $lt: end } },
    });
    places = places.filter(place => place.donations.length > 0);
    const result = { places: [], donations: [], date: { startDate, endDate } };

    for (let place of places) {
        let totalDonations = 0;

        totalDonations = place.donations.reduce((accumulator, donation) => accumulator + donation.price, 0);

        if(totalDonations !== 0) {
            result.places.push(place.title);
            result.donations.push(totalDonations);
        }
    }

    res.render(`donations/graphics`, { result });
};

// [
//     {
//         email: 'macupecha@gmail.com',
//         username: 'makapecha',
//         image: [
//             {
//                 _id: ObjectId("645967088c0bd51332f50308"),
//                 url: 'https://res.cloudinary.com/ddsxauxqi/image/upload/v1683580680/DonateOnNetwork/sobvfspceklhs2ev00nu.jpg',
//                 filename: 'DonateOnNetwork/sobvfspceklhs2ev00nu'
//             }
//         ],
//         verificationToken: 'n4e877jhavj',
//         isValidToken: true,
//         isAdmin: true,
//         salt: 'ddf9ef8f70298c92de572aa00e3c49dd3e456b9f3e40a45ac00a1069be2f0c85',
//         hash: '51af817c586516601fb9458c84ee050b2f4db40fd0e50adc55ee61bf9c1721d877fdd6da0508ee9de61da42c265b0a55f6861252702411deaa34a0d6da8808978306cea0345cac43725dc2cf00df74cc0d3b0e055d4799a82ec37c618a7dd51cd4d82121f72b069d60c06e9d265271b524a882a31234dbb486440524cc6b79b706c412b4470deb73cfcf80866349b1e024b8895b1ad9c15057fd6f70ff61ed575d6ba770cf86255bd70664ac7bedb11f6ec15d1fcd3949a221abd3306bc9adb145cd3fb6ec26327032c642c16979b253f1c59c237dd0fc65611701393d0adbccde2460547aa4e8d00788243468a5d35e046330a20aee99f02c3e543243546571e0fe6ba1e7f4fbdcf80d50b6a771788701b761b0bdfb22a382de9051cf937db7cc79cc1b58ee86732d41f198a169d29e551d851a74b6f94515f9702912b77ecf110febee47e6134ea8cbb7543b8d0e650e29595fb4291e8b28d643350af582ac4163b52d31e9a432760e703ee82e86895fa46c653f70bc7301fe3b4b81d97c8257bc14eeb6a4397e18e59f97ee9dc8a3afa218a58d87e7fd731bf2f2be57c46e1ffe1a86e1102881e6646bf6f4eabfc64471ce3033782fd38f0d233053fb86fb10cd2e6e6b2b1cb7b411415ef000bb59e44549c3ed0ee5416f41816e0195e10d75919584ad93eaf68db3927c1297faac5c32e9e0a3b6a2ba3a530ce8d4844ef9',
//         __v: 9
//     },
//     {
//         email: 'macupecha@hotmail.com',
//         username: 'zeus',
//         image: [
//             {
//                 _id: ObjectId("646d2e2cf72bdf6e1b22708f"),
//                 url: 'https://res.cloudinary.com/ddsxauxqi/image/upload/v1684876844/DonateOnNetwork/hmcvwpabqlkeah42khzu.jpg',
//                 filename: 'DonateOnNetwork/hmcvwpabqlkeah42khzu'
//             }
//         ],
//         verificationToken: 'qbhuajygcn',
//         isValidToken: true,
//         salt: '76b40900a543a0c08a6834b085ddf9835cb96467b1d17db856c513974d95e58a',
//         hash: 'bb66f7d5e4de0192b344e84aeedd11a5aef51b596d828abcda0401536eb71cdd28a880cca52652c8ef155c9389374eec5c2e24e0ebdd7a095a7b6fba9b0c6618b52200d3d7d0c659cb465b7cc3cf52b39c9e81e169b24dbb294f2ece02c932585058b954a5e2ad88f09a483a3b500a212cf38dbd1a60456ee19c89a0916a6d573b5fe535027651f26e1095cdc76bd663c7ba1c479212efd4e72de9c609ab8aea4e60a120670b9f90a05b0c88a117679563ac2e59f1d13f2802905232805dbcf72af50f2fb295ab86725c251765b3592e9aa08798e3ccaf6c5aee9cafe6e897ae15a2ccedf6ea2b7574f16f881ee8300f3cf9b1d2c2a9e099ff0fe6c6c4e8771672a1e2a3f3181827b95599fe50765fa4ca09926adafbf117ed0aab7187fc755bc62c04c86a60c870fe9d718df89d7775c53121d1504206c4785e7e1bdef2e9fc351a16e80ba752cc21dc1f0689ef90090b774305ee805fb09cdd72c2e43e9defd42cf6303ec69e8bd915509ca259008fb271297ca8bee07f6025c6f4a26ff0e9177bcb16133bbe40f720eb83bee7306411ec95a3ff9a8b225c030b726669d0c30e73f669fc905bc396164653283511c8af02a65a0536255b005af83906f87f91169fd5fd5c3148b32572c8c46cf21c345627f4de999032805c0c4083dcb79e3a6b888681d0ccd2ab0689b587c7032a775fd808a19d1f60eefbded11d3b6f9589',
//         __v: 0
//     },
//     {
//         email: 'makapecha1@maildrop.cc',
//         username: 'test1',
//         image: [
//             {
//                 _id: ObjectId("648a6cb3f4e21e521bb7fee3"),
//                 url: 'https://res.cloudinary.com/ddsxauxqi/image/upload/v1686793395/DonateOnNetwork/lkshhe4ucspbf5sijx4n.png',
//                 filename: 'DonateOnNetwork/lkshhe4ucspbf5sijx4n'
//             }
//         ],
//         verificationToken: 'sh2755hqpi',
//         isValidToken: true,
//         isAdmin: false,
//         salt: '2ee996f94416749cd5812725781ab251496b159d58b30594dbb5903e00efa1d7',
//         hash: 'f2ede8956d2d5058f216c6f7783fcfeee70719d322bb2bb10c0df6ad4ac9825a5d1f2bb7ae14b0c82ec58a1a3e6e6bddebcabf588041d7936f340908714427634a868ac78a24a974404eb7a1126da4e8b002c1ec9f904524f479c1a7a3bf835241ba1e56a12e1df52d4719c7a4b3203094cc2257bc2a7784eade844d32333a0331ede0750de728c150907a20d906965ed257b0e550595bc6dc5735ac01f13a441eccff8a93cdda9fb645999b16f4bf43ca62000a94b24150f03256f8e64b8b86ef1627ad4bec3f17311c2c54a830ea5f9c74db9b45967b4d97a8448006a5799c13d1f8f6be9e121829af2ae8907b515049f33b972f9239aca0d27c013fee7dabd7765b6c48a7fc28079affc54d13f9a7f56c74ab44ad0e1e1410c797f4661423773e75be92216e7a9d28de2083db9ffb7920a45a58b99e2e814a7c9e93e1461f10c05932720a98a46e56e3f5f4809edff3539c4259d0de77e51fdce29772e87078f5dc7996f86640da29d7588c2ec7df572108d4ae6cd6c02cf391cce135cbf3e43911f1924d4cc8a5c4465a89ce9c742680144459a8576e3933c94bd9eb385e8d01e0a6af80e4b484c95d6b9ea8e17a40103529247c8ac8d60460138f129f04e3907a682209ef37043c5b743d155ea1a72b594aa0a2d0be544118b4eb643a77a3eb8244c317d7eab0cf580194c7735dfb62a826180b097e15b1570a987c6735',
//         __v: 1
//     },
//     {
//         email: 'makapecha2@maildrop.cc',
//         username: 'test2',
//         image: [
//             {
//                 _id: ObjectId("648a6f0bf4e21e521bb7fee8"),
//                 url: 'https://res.cloudinary.com/ddsxauxqi/image/upload/v1686793995/DonateOnNetwork/tpt9tfxplkhtiiwzathk.jpg',
//                 filename: 'DonateOnNetwork/tpt9tfxplkhtiiwzathk'
//             }
//         ],
//         verificationToken: 'mxhby8qcib',
//         isValidToken: true,
//         isAdmin: false,
//         salt: '324db9fe7baf16b54fc9e44cca03f1fa3723ed6c66cc92fd8f908e319e18d9a2',
//         hash: 'c8840e73c4df25e9455ea2f3a8c8695f143579a50cadf4900c954b5980bd6eab01180fc2ed3a51194a55ef26b56241d19cfbee544edfd95f29b296a76b99fa7515ff1b6ac1a8c8e44e0dbc35a4ac1b7282a83f21a55c61dad32a28172ced7c4cf60c10fb0f79712db46c58d52feed023edc073d3c8b610ef34c432b741881906138d5aeb8635d1991d1684c9d25f69f09ea8f8139f45fa66b22c69d0eeab8fb29f9650c0ba18ee6b5cd48f7b8afb1320ab03a6a082c850fcd775fe05d130e4d54ad24a46c26e98c7c7f923a7134527eb130fedf88848638f4634cf8688a8ca20c832aeae9c19b4e353516e372a6ff274dddc533c6b2f9e7d4af8ff4906e5b87766f917ca10d96a83458dcbca7e409b43ba872194974510c812843a98970ca0bb924d6f31f94785365464dd098702483ca80af9c9f66a1604c30b093457bafd1327933375544ad0e8386a5541fd462b1209d4c33fc56e5c39ddf11772374817b485ca4610699f4d7383ea16b191012c44d2323c00d49ab69b09982eef1bb515c71daaa0a01df695d8ca4f73fe0b09a2a4f419b52bda474ec504fa6c68408969cc883117944534218516fcfde26bbe15e66fcc545be8b20adedc38de42ad69a18997d311d9058a432117cd14d04b9ba407b088a960d0a3d7ef1157c6210d8e6a9f05997f3d61a49d11bfabc3d7a99893c4f9274d29ee041fbb1af1e92571d99f53',
//         __v: 0
//     },
//     {
//         email: 'makapecha3@maildrop.cc',
//         username: 'test3',
//         image: [
//             {
//                 _id: ObjectId("648a7e845387c364759f699a"),
//                 url: 'https://res.cloudinary.com/ddsxauxqi/image/upload/v1686797956/DonateOnNetwork/qkvbtfbwr6emseylhyqi.png',
//                 filename: 'DonateOnNetwork/qkvbtfbwr6emseylhyqi'
//             }
//         ],
//         verificationToken: 'gu527a9r6df',
//         isValidToken: true,
//         salt: '474f2108626d1c48449ee0d9278433dc2d123a1d498a4a1743c064253dd18212',
//         hash: '909181737f2885be2f8d5f83fb9082e4563f5f7b9c68844b5a7cc3bf8676e514408a23058ffda5cb9133f65c6afe1a50949931aa290532ca9e8e7d848f72896dfe9494e0c1c80c5d9d700a4dc1c23550b4aea9eda0f3d2484250b81353afa528df012dcef90816d47af905c2f6efd960cecb5c26525bd54be66ab4801fb53ff955a26ce51809c4874eeae557c60aad9df0248a1a904499b2d2b616171758d541b8b0ad603dcbc16eaa74f1569f4fbb9610ee66e28ebc3a4e1b4a2ea45eb7afb181e376b3c07f70f239d6e7b3397cd1ae33f93f4f3bcf07ae7099287a5a61a34a3fc38c17a970a29b0fae9cac69912e9d6fd1ccb94a1bf415df7b7bcc891402eb0117f34c2c593a9645532f2714e50d91e538ff09e21880d0affd3a561a4620aa3c9e908512b1ad7d0c65b2083aad88e3091a02917ad4df90c06d36de27ac04d121036f871580a8a97cfa30737255eb5011690ff6c0d98a43b6a344c8776f093267525dbc602b2ada6e42fec2acc82b54cc672d1a6bc31367e15eeb73a30260d9346ab87bf624771c7e7fc070a7e0f4106041108e5496b4cd626f62e27bef33cea9970cc2726955f0e8037b79e5be62a51ddb1dee5ad222df5ef8a1885dcef1aed947a55341b9714b29d1c00dfda5ff5e4a00edc4d68475c3ab0edc40108f56f2affc34a0c4ce60bb400d20e33ef70fbc80c76ddfb5e89b64036efebe949c1351',
//     },
// ]
