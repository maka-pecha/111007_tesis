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
            "success": `http://${host}/donations/${place._id}/result/${donationAmount}`,
            "failure": `http://${host}/donations/${place._id}/result/fail`,
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
