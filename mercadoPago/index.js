const mercadopago = require("mercadopago");

module.exports.configure = async (accessToken) => {
// REPLACE WITH USER ACCESS TOKEN AVAILABLE IN: https://developers.mercadopago.com/panel
    await mercadopago.configure({
        access_token: accessToken.toString(),
    });
}

module.exports.createPreference = async (req) => {
    const { donationAmount, place } = req.body; // recoger el monto de la donación del cuerpo de la solicitud
    const host = req.get('host');
    const preference = {
        items: [
            {
                "title": "Donation",
                "quantity": 1,
                "currency_id": "ARS",
                "unit_price": Number(donationAmount),
            }
        ],
        back_urls: {
            "success": `http://${host}/places/${place._id}`,
            "failure": `http://${host}/places/${place._id}`,
            "pending": `http://${host}/places/${place._id}`
        },
        auto_return: "approved",
    };

    let preferenceId = null;
    try {
        const response = await mercadopago.preferences.create(preference);
        preferenceId = response.body.id;
    } catch (error) {
        console.error(error);
    }

    return preferenceId;
}

//
// app.get('/feedback', function (req, res) {
//     res.json({
//         Payment: req.query.payment_id,
//         Status: req.query.status,
//         MerchantOrder: req.query.merchant_order_id
//     });
// });
//
// app.listen(8080, () => {
//     console.log("The server is now running on Port 8080");
// });
